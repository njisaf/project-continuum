import type { ActorAvant, ActorType } from "@actor";
import { ConditionAvant, ItemAvant, ItemProxyAvant } from "@item";
import type { ItemSourceAvant } from "@item/base/data/index.ts";
import { ItemGrantDeleteAction, ItemGranterSource, ItemSourceFlagsAvant } from "@item/base/data/system.ts";
import { PHYSICAL_ITEM_TYPES } from "@item/physical/values.ts";
import { SlugField, StrictArrayField } from "@system/schema-data-fields.ts";
import { ErrorAvant, isObject, setHasElement, sluggify, tupleHasValue } from "@util";
import { UUIDUtils } from "@util/uuid.ts";
import * as R from "remeda";
import { RuleElementOptions, RuleElementAvant } from "../base.ts";
import { ChoiceSetSource } from "../choice-set/data.ts";
import { ChoiceSetRuleElement } from "../choice-set/rule-element.ts";
import { ModelPropsFromRESchema, RuleElementSource } from "../data.ts";
import { ItemAlteration } from "../item-alteration/alteration.ts";
import { GrantItemSchema } from "./schema.ts";

class GrantItemRuleElement extends RuleElementAvant<GrantItemSchema> {
    static override validActorTypes: ActorType[] = ["army", "character", "npc", "familiar"];

    /** The id of the granted item */
    grantedId: string | null = null;

    /**
     * If the granted item has a `ChoiceSet`, its selection may be predetermined. The key of the record must be the
     * `ChoiceSet`'s designated `flag` property.
     */
    preselectChoices: Record<string, string | number> = {};

    /** Actions taken when either the parent or child item are deleted */
    onDeleteActions: Partial<OnDeleteActions> | null = null;

    constructor(data: GrantItemSource, options: RuleElementOptions) {
        // Run slightly earlier if granting an in-memory condition
        if (data.inMemoryOnly) data.priority ??= 99;
        super(data, options);
        if (this.invalid) return;

        // In-memory-only conditions are always reevaluated on update
        if (this.inMemoryOnly) {
            this.reevaluateOnUpdate = true;
            this.allowDuplicate = true;
        } else {
            if (this.reevaluateOnUpdate) this.allowDuplicate = false;
            if (this.parent.isOfType("physical")) {
                this.failValidation("parent item must not be physical");
            }
        }

        this.onDeleteActions = this.#getOnDeleteActions(data);

        const isValidPreselect = (p: Record<string, unknown>): p is Record<string, string | number> =>
            Object.values(p).every((v) => ["string", "number"].includes(typeof v));
        this.preselectChoices =
            R.isPlainObject(data.preselectChoices) && isValidPreselect(data.preselectChoices)
                ? fu.deepClone(data.preselectChoices)
                : {};

        this.grantedId = this.parent.flags.avant.itemGrants[this.flag ?? ""]?.id ?? null;

        if (this.track) {
            const grantedItem =
                this.actor.inventory.get(this.grantedId ?? "") ??
                this.actor.inventory.flatMap((i) => i.subitems.contents).find((i) => i.id === this.grantedId) ??
                null;

            this.#trackItem(grantedItem);
        }
    }

    static override defineSchema(): GrantItemSchema {
        const fields = foundry.data.fields;
        return {
            ...super.defineSchema(),
            uuid: new fields.StringField({
                required: true,
                nullable: false,
                blank: false,
                initial: undefined,
                label: "AVANT.UUID.Label",
            }),
            flag: new SlugField({ required: true, nullable: true, initial: null, camel: "dromedary" }),
            reevaluateOnUpdate: new fields.BooleanField({ label: "AVANT.RuleEditor.GrantItem.ReevaluateOnUpdate" }),
            inMemoryOnly: new fields.BooleanField(),
            allowDuplicate: new fields.BooleanField({
                initial: true,
                label: "AVANT.RuleEditor.GrantItem.AllowDuplicate",
            }),
            nestUnderGranter: new fields.BooleanField({ required: false, nullable: false, initial: undefined }),
            alterations: new StrictArrayField(new fields.EmbeddedDataField(ItemAlteration)),
            track: new fields.BooleanField(),
        };
    }

    static ON_DELETE_ACTIONS = ["cascade", "detach", "restrict"] as const;

    static override validateJoint(data: SourceFromSchema<GrantItemSchema>): void {
        super.validateJoint(data);

        if (data.track && !data.flag) {
            throw Error("must have explicit flag set if granted item is tracked");
        }

        if (data.reevaluateOnUpdate && data.predicate.length === 0) {
            throw Error("reevaluateOnUpdate: must have non-empty predicate");
        }
    }

    override async preCreate(args: RuleElementAvant.PreCreateParams): Promise<void> {
        if (this.inMemoryOnly || this.invalid) return;

        const { itemSource, pendingItems, itemUpdates, operation } = args;
        const ruleSource: GrantItemSource = args.ruleSource;

        const uuid = this.resolveInjectedProperties(this.uuid);
        if (!UUIDUtils.isItemUUID(uuid, { embedded: false })) return;
        const grantedItem: ClientDocument | null = await (async () => {
            try {
                return (await fromUuid(uuid))?.clone() ?? null;
            } catch (error) {
                console.error(error);
                return null;
            }
        })();
        if (!(grantedItem instanceof ItemAvant)) return;

        ruleSource.flag =
            typeof ruleSource.flag === "string" && ruleSource.flag.length > 0
                ? sluggify(ruleSource.flag, { camel: "dromedary" })
                : ((): string => {
                      const defaultFlag = sluggify(grantedItem.slug ?? grantedItem.name, { camel: "dromedary" });
                      const flagPattern = new RegExp(`^${defaultFlag}\\d*$`);
                      const itemGrants = itemSource.flags?.avant?.itemGrants ?? {};
                      const nthGrant = Object.keys(itemGrants).filter((g) => flagPattern.test(g)).length;

                      return nthGrant > 0 ? `${defaultFlag}${nthGrant + 1}` : defaultFlag;
                  })();
        this.flag = String(ruleSource.flag);

        if (!this.test()) return;

        // If we shouldn't allow duplicates, check for an existing item with this source ID
        const existingItem = this.actor.items.find((i) => i.sourceId === uuid);
        if (!this.allowDuplicate && existingItem) {
            this.#setGrantFlags(itemSource, existingItem, itemUpdates);

            ui.notifications.info(
                game.i18n.format("AVANT.UI.RuleElements.GrantItem.AlreadyHasItem", {
                    actor: this.actor.name,
                    item: grantedItem.name,
                }),
            );
            return;
        }

        // Set ids and flags on the granting and granted items
        itemSource._id ??= fu.randomID();
        const grantedSource = grantedItem.toObject();
        grantedSource._id = fu.randomID();

        // An item may grant another copy of itself, but at least strip the copy of its grant REs
        if (this.item.sourceId === (grantedSource._stats.compendiumSource ?? "")) {
            grantedSource.system.rules = grantedSource.system.rules.filter((r) => r.key !== "GrantItem");
        }

        // Special case until configurable item alterations are supported:
        if (itemSource.type === "effect" && grantedSource.type === "effect") {
            grantedSource.system.level.value = itemSource.system?.level?.value ?? grantedSource.system.level.value;
        }

        // Guarantee future already-granted checks pass in all cases by re-assigning sourceId
        grantedSource._stats.compendiumSource = uuid;

        // Apply alterations
        try {
            for (const alteration of this.alterations) {
                alteration.applyTo(grantedSource);
            }
        } catch (error) {
            if (error instanceof Error) this.failValidation(error.message);
        }

        // Create a temporary owned item and run its actor-data preparation and early-stage rule-element callbacks
        const tempGranted = new ItemProxyAvant(fu.deepClone(grantedSource), { parent: this.actor });
        tempGranted.grantedBy = this.item;

        // Check for immunity and bail if a match
        if (tempGranted.isOfType("affliction", "condition", "effect") && this.actor.isImmuneTo(tempGranted)) {
            ruleSource.ignored = true;
            return;
        }

        tempGranted.prepareActorData?.();
        for (const rule of tempGranted.prepareRuleElements({ suppressWarnings: true })) {
            rule.onApplyActiveEffects?.();
        }

        this.#applyChoicePreselections(tempGranted);

        if (this.ignored) return;

        args.tempItems.push(tempGranted);

        // Set the self:class and self:feat(ure) roll option for predication from subsequent pending items
        for (const item of [this.item, tempGranted]) {
            if (item.isOfType("class", "feat")) {
                const prefix = item.isOfType("class") || !item.isFeature ? item.type : "feature";
                const slug = item.slug ?? sluggify(item.name);
                this.actor.rollOptions.all[`self:${prefix}:${slug}`] = true;
            }
        }

        this.grantedId = grantedSource._id;
        operation.keepId = true;

        this.#setGrantFlags(itemSource, grantedSource, itemUpdates);
        this.#trackItem(tempGranted);

        // Add to pending items before running pre-creates to preserve creation order
        pendingItems.push(grantedSource);

        // Run the granted item's preCreate callbacks unless this is a pre-actor-update reevaluation
        if (!args.reevaluation) {
            await this.#runGrantedItemPreCreates(args, tempGranted, grantedSource, operation);
        }
    }

    /** Grant an item if this rule element permits it and the predicate passes */
    override async preUpdateActor(): Promise<{ create: ItemSourceAvant[]; delete: string[] }> {
        const noAction = { create: [], delete: [] };

        if (this.ignored || !this.reevaluateOnUpdate || this.inMemoryOnly) {
            return noAction;
        }

        if (this.grantedId && this.actor.items.has(this.grantedId)) {
            if (!this.test()) {
                return { create: [], delete: [this.grantedId] };
            }
            return noAction;
        }

        const itemSource = this.item.toObject();
        const ruleSource = itemSource.system.rules[this.sourceIndex ?? -1];
        if (!ruleSource) return noAction;

        const pendingItems: ItemSourceAvant[] = [];
        const operation = { parent: this.actor, render: false };
        const itemUpdates: EmbeddedDocumentUpdateData[] = [];
        await this.preCreate({
            itemSource,
            pendingItems,
            ruleSource,
            tempItems: [],
            itemUpdates,
            operation,
            reevaluation: true,
        });

        if (itemUpdates.length) {
            await this.actor.updateEmbeddedDocuments("Item", itemUpdates, { render: false });
        }

        if (pendingItems.length > 0) {
            const updatedGrants = itemSource.flags.avant?.itemGrants ?? {};
            await this.item.update({ "flags.avant.itemGrants": updatedGrants }, { render: false });
            return { create: pendingItems, delete: [] };
        }

        return noAction;
    }

    /** Add an in-memory-only condition to the actor */
    override onApplyActiveEffects(): void {
        if (!this.invalid) {
            this.#createInMemoryCondition();
        }
    }

    #getOnDeleteActions(data: GrantItemSource): Partial<OnDeleteActions> | null {
        const actions = data.onDeleteActions;
        if (isObject<OnDeleteActions>(actions)) {
            const ACTIONS = GrantItemRuleElement.ON_DELETE_ACTIONS;
            return tupleHasValue(ACTIONS, actions.granter) || tupleHasValue(ACTIONS, actions.grantee)
                ? R.pick(
                      actions,
                      ([actions.granter ? "granter" : [], actions.grantee ? "grantee" : []] as const).flat(),
                  )
                : null;
        }

        return null;
    }

    /** Apply preselected choices to the granted item's choices sets. */
    #applyChoicePreselections(grantedItem: ItemAvant<ActorAvant>): void {
        const source = grantedItem._source;
        for (const [flag, selection] of Object.entries(this.preselectChoices ?? {})) {
            const rule = grantedItem.rules.find(
                (rule): rule is ChoiceSetRuleElement => rule instanceof ChoiceSetRuleElement && rule.flag === flag,
            );
            if (rule) {
                const ruleSource = source.system.rules[grantedItem.rules.indexOf(rule)] as ChoiceSetSource;
                const resolvedSelection = this.resolveInjectedProperties(selection);
                rule.selection = ruleSource.selection = resolvedSelection;
            }
        }
    }

    /** Set flags on granting and grantee items to indicate relationship between the two */
    #setGrantFlags(
        granter: PreCreate<ItemSourceAvant>,
        grantee: ItemSourceAvant | ItemAvant<ActorAvant>,
        itemUpdates: EmbeddedDocumentUpdateData[],
    ): void {
        if (!this.flag) throw ErrorAvant("Unexpected failure looking up RE flag key");

        const newFlagData: ItemGranterSource = {
            // The granting item records the granted item's ID in an array at `flags.avant.itemGrants`
            id: grantee instanceof ItemAvant ? grantee.id : grantee._id!,
            // The on-delete action determines what will happen to the granter item when the granted item is deleted:
            // Default to "detach" (do nothing).
            onDelete: this.onDeleteActions?.grantee ?? "detach",
        };
        if (granter.type === "feat" && grantee.type === "feat" && this.nestUnderGranter === false) {
            newFlagData.nested = this.nestUnderGranter;
        }

        // Assign flag data to the granter source, but also to the prepared item data for later rule elements
        const flags: ItemSourceFlagsAvant & { avant: { itemGrants: Record<string, object> } } = fu.mergeObject(
            granter.flags ?? {},
            { avant: { itemGrants: {} } },
        );
        flags.avant.itemGrants[this.flag] = newFlagData;
        this.item.flags.avant.itemGrants[this.flag] = {
            ...newFlagData,
            onDelete: newFlagData.onDelete ?? "detach",
            nested: newFlagData.nested ?? null,
        };

        // The granted item records its granting item's ID at `flags.avant.grantedBy`
        const grantedBy = {
            id: granter._id,
            // The on-delete action determines what will happen to the granted item when the granter is deleted:
            // Default to "cascade" (delete the granted item) unless the granted item is physical.
            onDelete:
                this.onDeleteActions?.granter ??
                (setHasElement(PHYSICAL_ITEM_TYPES, grantee.type) ? "detach" : "cascade"),
        };

        grantee.flags = fu.mergeObject(grantee.flags ?? {}, { avant: { grantedBy } });
        if (grantee instanceof ItemAvant && grantee._id && this.actor.items.has(grantee._id)) {
            // This is a previously granted item: update its grantedBy flag
            itemUpdates.push({ _id: grantee._id, "flags.avant.grantedBy": grantedBy });
        }
    }

    /** Run the preCreate callbacks of REs from the granted item */
    async #runGrantedItemPreCreates(
        originalArgs: Omit<RuleElementAvant.PreCreateParams, "ruleSource">,
        grantedItem: ItemAvant<ActorAvant>,
        grantedSource: ItemSourceAvant,
        operation: Partial<DatabaseCreateOperation<ActorAvant | null>>,
    ): Promise<void> {
        // Create a temporary embedded version of the item to run its pre-create REs
        for (const rule of grantedItem.rules) {
            const ruleSource = grantedSource.system.rules[grantedItem.rules.indexOf(rule)] as RuleElementSource;
            await rule.preCreate?.({
                ...originalArgs,
                itemSource: grantedSource,
                ruleSource,
                operation,
            });
        }
    }

    #createInMemoryCondition(): void {
        if (!this.inMemoryOnly || !this.test()) return;

        const validationFailure = "an in-memory-only grant must be a condition";
        const uuid = this.resolveInjectedProperties(this.uuid);
        if (!UUIDUtils.isItemUUID(uuid)) {
            return this.failValidation(validationFailure);
        }

        const conditionSource = game.avant.ConditionManager.conditions.get(uuid)?.toObject();
        if (!conditionSource) return this.failValidation(validationFailure);
        const { actor } = this;
        if (actor.isImmuneTo(conditionSource.system.slug)) return;

        for (const alteration of this.alterations) {
            alteration.applyTo(conditionSource);
        }

        const flags = { avant: { grantedBy: { id: this.item.id, onDelete: "cascade" } } };
        const condition = new ConditionAvant(
            fu.mergeObject(conditionSource, {
                _id: fu.randomID(),
                flags,
                system: { references: { parent: { id: this.item.id } } },
            }),
            { parent: this.actor },
        );

        // Follow standard data preparation for embedded conditions
        actor.conditions.set(condition.id, condition);
        condition.prepareSiblingData();
        condition.prepareActorData();
        condition.rules = condition.prepareRuleElements();
        actor.rules.push(...condition.rules);
    }

    /** If this item is being tracked, set an actor flag and add its item roll options to the `all` domain */
    #trackItem(grantedItem: ItemAvant<ActorAvant> | null): void {
        if (!(this.track && this.flag && this.grantedId && grantedItem?.isOfType("physical"))) {
            return;
        }

        this.actor.flags.avant.trackedItems[this.flag] = this.grantedId;
        const slug = sluggify(this.flag);
        const rollOptionsAll = this.actor.rollOptions.all;
        for (const statement of grantedItem.getRollOptions(slug)) {
            rollOptionsAll[statement] = true;
        }
    }
}

interface GrantItemRuleElement extends RuleElementAvant<GrantItemSchema>, ModelPropsFromRESchema<GrantItemSchema> {}

interface GrantItemSource extends RuleElementSource {
    uuid?: unknown;
    preselectChoices?: unknown;
    reevaluateOnUpdate?: unknown;
    inMemoryOnly?: unknown;
    allowDuplicate?: unknown;
    onDeleteActions?: unknown;
    flag?: unknown;
    alterations?: unknown;
}

interface OnDeleteActions {
    granter: ItemGrantDeleteAction;
    grantee: ItemGrantDeleteAction;
}

export { GrantItemRuleElement, type GrantItemSource };
