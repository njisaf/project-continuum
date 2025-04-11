import type { ActorAvant } from "@actor";
import type * as ItemInstance from "@item";

interface ItemInstances<TParent extends ActorAvant | null> {
    action: ItemInstance.AbilityItemAvant<TParent>;
    affliction: ItemInstance.AfflictionAvant<TParent>;
    ancestry: ItemInstance.AncestryAvant<TParent>;
    armor: ItemInstance.ArmorAvant<TParent>;
    background: ItemInstance.BackgroundAvant<TParent>;
    backpack: ItemInstance.ContainerAvant<TParent>;
    book: ItemInstance.BookAvant<TParent>;
    campaignFeature: ItemInstance.CampaignFeatureAvant<TParent>;
    class: ItemInstance.ClassAvant<TParent>;
    condition: ItemInstance.ConditionAvant<TParent>;
    consumable: ItemInstance.ConsumableAvant<TParent>;
    deity: ItemInstance.DeityAvant<TParent>;
    effect: ItemInstance.EffectAvant<TParent>;
    equipment: ItemInstance.EquipmentAvant<TParent>;
    feat: ItemInstance.FeatAvant<TParent>;
    heritage: ItemInstance.HeritageAvant<TParent>;
    kit: ItemInstance.KitAvant<TParent>;
    lore: ItemInstance.LoreAvant<TParent>;
    melee: ItemInstance.MeleeAvant<TParent>;
    shield: ItemInstance.ShieldAvant<TParent>;
    spell: ItemInstance.SpellAvant<TParent>;
    spellcastingEntry: ItemInstance.SpellcastingEntryAvant<TParent>;
    treasure: ItemInstance.TreasureAvant<TParent>;
    weapon: ItemInstance.WeaponAvant<TParent>;
}

/** Data describing the range restrictions of an action, weapon, spell, etc. */
type RangeData = {
    increment: number | null;
    max: number;
};

export type { ItemInstances, RangeData };
