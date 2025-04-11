import type { ActorAvant } from "@actor";
import type { CraftingAbility } from "@actor/character/crafting/ability.ts";
import { ItemAvant } from "@item";
import type { ActionCost, Frequency, RawItemChatData } from "@item/base/data/index.ts";
import type { RangeData } from "@item/types.ts";
import type { RuleElementOptions, RuleElementAvant } from "@module/rules/index.ts";
import type { UserAvant } from "@module/user/index.ts";
import { sluggify } from "@util";
import type { AbilitySource, AbilitySystemData } from "./data.ts";
import { getActionCostRollOptions, normalizeActionChangeData, processSanctification } from "./helpers.ts";
import type { AbilityTrait } from "./types.ts";

class AbilityItemAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    declare range?: RangeData | null;

    declare isMelee?: boolean;

    /** If this ability can craft, what is the crafting ability */
    declare crafting?: CraftingAbility | null;

    /** If suppressed, this ability should not be visible on character sheets nor have rule elements */
    declare suppressed: boolean;

    static override get validTraits(): Record<AbilityTrait, string> {
        return CONFIG.AVANT.actionTraits;
    }

    get traits(): Set<AbilityTrait> {
        return new Set(this.system.traits.value);
    }

    get actionCost(): ActionCost | null {
        const actionType = this.system.actionType.value || "passive";
        if (actionType === "passive") return null;

        return {
            type: actionType,
            value: this.system.actions.value,
        };
    }

    get frequency(): Frequency | null {
        return this.system.frequency;
    }

    override prepareBaseData(): void {
        super.prepareBaseData();
        this.crafting = null;
    }

    override prepareActorData(): void {
        // Exit early if the ability is being suppressed
        if (this.suppressed) return;

        const actor = this.actor;
        if (actor?.isOfType("familiar") && this.system.category === "familiar") {
            const slug = this.slug ?? sluggify(this.name);
            actor.rollOptions.all[`self:ability:${slug}`] = true;
        }
    }

    override onPrepareSynthetics(this: AbilityItemAvant<ActorAvant>): void {
        processSanctification(this);
    }

    override getRollOptions(prefix = this.type, options?: { includeGranter?: boolean }): string[] {
        const rollOptions = super.getRollOptions(prefix, options);
        if (this.frequency || this.system.deathNote) {
            rollOptions.push(`${prefix}:frequency:limited`);
        }

        rollOptions.push(...getActionCostRollOptions(prefix, this));
        return rollOptions;
    }

    /** Overriden to not create rule elements when suppressed */
    override prepareRuleElements(options?: Omit<RuleElementOptions, "parent">): RuleElementAvant[] {
        if (this.suppressed) return [];
        return super.prepareRuleElements(options);
    }

    override async getChatData(
        this: AbilityItemAvant<ActorAvant>,
        htmlOptions: EnrichmentOptions = {},
    ): Promise<RawItemChatData> {
        return this.processChatData(htmlOptions, {
            ...this.system,
            traits: this.traitChatData(),
        });
    }

    protected override async _preCreate(
        data: this["_source"],
        operation: DatabaseCreateOperation<TParent>,
        user: UserAvant,
    ): Promise<boolean | void> {
        // In case this was copied from an actor, clear any active frequency value
        if (!this.parent) {
            if (this._source.system.frequency) {
                this.updateSource({ "system.frequency.-=value": null });
            }
        }

        return super._preCreate(data, operation, user);
    }

    protected override async _preUpdate(
        changed: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<TParent>,
        user: UserAvant,
    ): Promise<boolean | void> {
        normalizeActionChangeData(this, changed);
        return super._preUpdate(changed, operation, user);
    }
}

interface AbilityItemAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    readonly _source: AbilitySource;
    system: AbilitySystemData;
}

export { AbilityItemAvant };
