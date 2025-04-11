import type { ActorAvant } from "@actor";
import { AutomaticBonusProgression as ABP } from "@actor/character/automatic-bonus-progression.ts";
import { RawItemChatData } from "@item/base/data/index.ts";
import { PhysicalItemAvant, getPropertyRuneSlots } from "@item/physical/index.ts";
import { MAGIC_TRADITIONS } from "@item/spell/values.ts";
import { UserAvant } from "@module/user/index.ts";
import { ErrorAvant, setHasElement, signedInteger, sluggify } from "@util";
import * as R from "remeda";
import { ArmorSource, ArmorSystemData } from "./data.ts";
import { ArmorCategory, ArmorGroup, ArmorTrait, BaseArmorType } from "./types.ts";

class ArmorAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    static override get validTraits(): Record<ArmorTrait, string> {
        return CONFIG.AVANT.armorTraits;
    }

    get isBarding(): boolean {
        return ["light-barding", "heavy-barding"].includes(this.category);
    }

    get baseType(): BaseArmorType | null {
        return this.system.baseItem ?? null;
    }

    get group(): ArmorGroup | null {
        return this.system.group || null;
    }

    get category(): ArmorCategory {
        return this.system.category;
    }

    get dexCap(): number {
        return this.system.dexCap;
    }

    get strength(): number | null {
        return this.system.strength;
    }

    get checkPenalty(): number {
        return this.system.checkPenalty || 0;
    }

    get speedPenalty(): number {
        return this.system.speedPenalty || 0;
    }

    get acBonus(): number {
        return this.system.acBonus;
    }

    override get isSpecific(): boolean {
        return !!this.system.specific;
    }

    /** Generate a list of strings for use in predication */
    override getRollOptions(prefix = this.type, options?: { includeGranter?: boolean }): string[] {
        const rollOptions = super.getRollOptions(prefix, options);
        rollOptions.push(
            ...Object.entries({
                [`category:${this.category}`]: true,
                [`group:${this.group ?? "none"}`]: true,
                [`base:${this.baseType}`]: !!this.baseType,
                [`strength:${this.system.strength}`]: typeof this.system.strength === "number",
                [`rune:potency`]: this.system.runes.potency > 0,
                [`rune:resilient`]: this.system.runes.resilient > 0,
            })
                .filter((e) => !!e[1])
                .map((e) => `${prefix}:${e[0]}`),
            ...this.system.runes.property.map((r) => `${prefix}:rune:property:${sluggify(r)}`),
        );

        return rollOptions;
    }

    override isStackableWith(item: PhysicalItemAvant<TParent>): boolean {
        if (this.isEquipped || item.isEquipped) return false;
        return super.isStackableWith(item);
    }

    override prepareBaseData(): void {
        // Set before parent class prepares usage and equipped status
        const systemUsage: { usage: { value: string } } = this.system;
        systemUsage.usage = { value: "wornarmor" };

        super.prepareBaseData();

        // Limit property rune slots
        ABP.cleanupRunes(this);
        const maxPropertySlots = getPropertyRuneSlots(this);
        this.system.runes.property.length = Math.min(this.system.runes.property.length, maxPropertySlots);

        // Add traits from fundamental runes
        const abpEnabled = ABP.isEnabled(this.actor);
        const baseTraits = this.system.traits.value;
        const investedTrait =
            this.system.runes.potency ||
            this.system.runes.resilient ||
            (abpEnabled && this.system.runes.property.length > 0)
                ? "invested"
                : null;
        const hasTraditionTraits = baseTraits.some((t) => setHasElement(MAGIC_TRADITIONS, t));
        const magicTrait = investedTrait && !hasTraditionTraits ? "magical" : null;
        this.system.traits.value = R.unique([...baseTraits, investedTrait, magicTrait] as const)
            .filter(R.isTruthy)
            .sort();
    }

    override prepareDerivedData(): void {
        super.prepareDerivedData();
        const potencyRune = this.isInvested && !ABP.isEnabled(this.actor) ? this.system.runes.potency : 0;
        const baseArmor = Number(this.system.acBonus) || 0;
        this.system.acBonus = baseArmor + potencyRune;
    }

    override prepareActorData(this: ArmorAvant<ActorAvant>): void {
        super.prepareActorData();
        const actor = this.actor;
        if (!actor) throw ErrorAvant("This method may only be called from embedded items");
        if (!this.isEquipped) return;

        for (const option of this.getRollOptions("armor")) {
            actor.rollOptions.all[option] = true;
        }
    }

    override onPrepareSynthetics(): void {
        super.onPrepareSynthetics();
        const actor = this.actor;
        if (!actor) throw ErrorAvant("This method may only be called from embedded items");
        if (!this.isEquipped) return;

        const rollOptionsAll = this.actor.flags.avant.rollOptions.all;
        for (const option of Object.keys(rollOptionsAll)) {
            if (option.startsWith("armor:")) delete rollOptionsAll[option];
        }
        for (const option of this.getRollOptions("armor")) {
            rollOptionsAll[option] = true;
        }
    }

    override async getChatData(
        this: ArmorAvant<ActorAvant>,
        htmlOptions: EnrichmentOptions = {},
    ): Promise<RawItemChatData> {
        const properties = [
            CONFIG.AVANT.armorCategories[this.category],
            `${signedInteger(this.acBonus)} ${game.i18n.localize("AVANT.ArmorArmorLabel")}`,
            `${this.system.dexCap || 0} ${game.i18n.localize("AVANT.ArmorDexLabel")}`,
            `${this.system.checkPenalty || 0} ${game.i18n.localize("AVANT.ArmorCheckLabel")}`,
            this.speedPenalty ? `${this.system.speedPenalty} ${game.i18n.localize("AVANT.ArmorSpeedLabel")}` : null,
        ].filter(R.isTruthy);

        return this.processChatData(htmlOptions, {
            ...(await super.getChatData()),
            traits: this.traitChatData(CONFIG.AVANT.armorTraits),
            properties,
        });
    }

    override generateUnidentifiedName({ typeOnly = false }: { typeOnly?: boolean } = { typeOnly: false }): string {
        const base = this.baseType ? CONFIG.AVANT.baseArmorTypes[this.baseType] : null;
        const group = this.group ? CONFIG.AVANT.armorGroups[this.group] : null;
        const fallback = "TYPES.Item.armor";
        const itemType = game.i18n.localize(base ?? group ?? fallback);

        return typeOnly ? itemType : game.i18n.format("AVANT.identification.UnidentifiedItem", { item: itemType });
    }

    /** Ensure correct shield/actual-armor usage */
    protected override async _preUpdate(
        changed: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<TParent>,
        user: UserAvant,
    ): Promise<boolean | void> {
        if (!changed.system) return super._preUpdate(changed, operation, user);

        if (changed.system.acBonus !== undefined) {
            const integerValue = Math.floor(Number(changed.system.acBonus)) || 0;
            changed.system.acBonus = Math.max(0, integerValue);
        }
        if (changed.system.group !== undefined) {
            changed.system.group ||= null;
        }
        if (changed.system.dexCap !== undefined) {
            const integerValue = Math.floor(Number(changed.system.dexCap)) || 0;
            changed.system.dexCap = Math.max(0, integerValue);
        }
        if (changed.system.checkPenalty !== undefined) {
            const integerValue = Math.floor(Number(changed.system.checkPenalty)) || 0;
            changed.system.checkPenalty = Math.min(0, integerValue);
        }
        if (changed.system.speedPenalty !== undefined) {
            const integerValue = Math.floor(Number(changed.system.speedPenalty)) || 0;
            changed.system.speedPenalty = Math.min(0, integerValue);
        }

        return super._preUpdate(changed, operation, user);
    }
}

interface ArmorAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    readonly _source: ArmorSource;
    system: ArmorSystemData;
}

export { ArmorAvant };
