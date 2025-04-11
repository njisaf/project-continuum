import type { ActorAvant } from "@actor";
import type { ConsumableAvant, SpellAvant } from "@item";
import { SpellcastingEntryAvant } from "@item";
import { SpellCollection } from "@item/spellcasting-entry/collection.ts";
import { RitualSpellcasting } from "@item/spellcasting-entry/rituals.ts";
import { TRICK_MAGIC_SKILLS, TrickMagicItemEntry } from "@item/spellcasting-entry/trick.ts";
import { BaseSpellcastingEntry } from "@item/spellcasting-entry/types.ts";
import { Statistic } from "@system/statistic/statistic.ts";
import { DelegatedCollection, ErrorAvant, tupleHasValue } from "@util";
import { CreatureSource } from "./data/index.ts";
import { ActorCommitData } from "./types.ts";

export class ActorSpellcasting<TActor extends ActorAvant> extends DelegatedCollection<BaseSpellcastingEntry<TActor>> {
    actor: TActor;

    /** The base casting proficiency, off of which spellcasting builds */
    declare base: Statistic;

    /** All available spell lists on this actor */
    collections = new Collection<SpellCollection<TActor>>();

    /** Cache of trick magic item entries */
    #trickEntries: Record<string, BaseSpellcastingEntry<TActor> | undefined> = {};

    constructor(actor: TActor) {
        super();
        this.actor = actor;
    }

    /** Initializes spellcasting data. Must be called every data preparation */
    initialize(entries: BaseSpellcastingEntry<TActor>[]): void {
        this.clear();
        for (const entry of entries) {
            this.set(entry.id, entry);
        }

        this.collections.clear();
        for (const entry of entries) {
            if (entry.spells) this.collections.set(entry.spells.id, entry.spells);
        }
    }

    /** Returns a list of entries pre-filtered to SpellcastingEntryAvant */
    get regular(): SpellcastingEntryAvant<TActor>[] {
        return this.filter((e): e is SpellcastingEntryAvant<TActor> => e instanceof SpellcastingEntryAvant);
    }

    /** Get this actor's ritual casting ability */
    get ritual(): RitualSpellcasting<TActor> | null {
        const ritualCasting = this.collections.get("rituals")?.entry;
        return ritualCasting instanceof RitualSpellcasting ? ritualCasting : null;
    }

    /** Spells not belonging to any collection */
    get orphanedSpells(): SpellAvant<TActor>[] {
        return this.actor.itemTypes.spell.filter((s) => !s.spellcasting);
    }

    /**
     * All spellcasting entries that count as prepared/spontaneous, which qualify as a
     * full fledged spellcasting feature for wands and scrolls.
     */
    get spellcastingFeatures(): SpellcastingEntryAvant<TActor>[] {
        return this.regular.filter((e) => e.isPrepared || e.isSpontaneous);
    }

    /** Returns an existing spellcasting entry or trick magic item if given "trick-{skillName}" */
    override get(id: string): BaseSpellcastingEntry<TActor> | undefined {
        const existing = this.#trickEntries[id] ?? super.get(id);
        if (!existing && id.startsWith("trick-")) {
            const skill = id.split("-")[1];
            if (tupleHasValue(TRICK_MAGIC_SKILLS, skill)) {
                this.#trickEntries[id] = new TrickMagicItemEntry(this.actor, skill);
                return this.#trickEntries[id];
            }
        }

        return existing;
    }

    canCastConsumable(item: ConsumableAvant): boolean {
        const spell = item.embeddedSpell;
        return !!spell && this.some((e) => e.canCast(spell, { origin: item }));
    }

    refocus(options: { all?: boolean } = {}): DeepPartial<CreatureSource> | null {
        if (!options.all) {
            throw ErrorAvant("Actors do not currently support regular refocusing");
        }

        if (this.actor.isOfType("character", "npc")) {
            const focus = this.actor.system.resources.focus;

            const rechargeFocus = focus?.max && focus.value < focus.max;
            if (focus && rechargeFocus) {
                focus.value = focus.max;
                return { system: { resources: { focus: { value: focus.value } } } };
            }
        }

        return null;
    }

    /**
     * Recharges all spellcasting entries based on the type of entry it is
     * @todo Support a timespan property of some sort and handle 1/hour innate spells
     */
    recharge(): ActorCommitData<TActor> {
        type SpellcastingUpdate = EmbeddedDocumentUpdateData | EmbeddedDocumentUpdateData[];

        const itemUpdates = this.contents.flatMap((entry): SpellcastingUpdate => {
            if (!(entry instanceof SpellcastingEntryAvant)) return [];
            if (entry.isFocusPool || !entry.spells) return [];

            // Innate spells should refresh uses instead
            if (entry.isInnate) {
                return entry.spells.map((spell) => {
                    const value = spell.system.location.uses?.max ?? 1;
                    return { _id: spell.id, system: { location: { uses: { value } } } };
                });
            }

            // Prepared spells
            const slots = entry.system.slots;
            let updated = false;
            for (const slot of Object.values(slots)) {
                if (entry.isPrepared && !entry.isFlexible) {
                    for (const preparedSpell of Object.values(slot.prepared)) {
                        if (preparedSpell.expended) {
                            preparedSpell.expended = false;
                            updated = true;
                        }
                    }
                } else if (slot.value < slot.max) {
                    slot.value = slot.max;
                    updated = true;
                }
            }

            if (updated) {
                return { _id: entry.id, system: { slots } };
            }

            return [];
        });

        const actorUpdates = this.refocus({ all: true });
        return { actorUpdates, itemCreates: [], itemUpdates };
    }
}
