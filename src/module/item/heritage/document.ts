import { ActorAvant, CharacterAvant } from "@actor";
import { CreatureTrait } from "@actor/creature/index.ts";
import { ItemAvant } from "@item";
import { Rarity } from "@module/data.ts";
import { ErrorAvant, sluggify } from "@util";
import { HeritageSource, HeritageSystemData } from "./data.ts";

class HeritageAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    static override get validTraits(): Record<CreatureTrait, string> {
        return CONFIG.AVANT.creatureTraits;
    }

    get traits(): Set<CreatureTrait> {
        return new Set(this.system.traits.value);
    }

    get rarity(): Rarity {
        return this.system.traits.rarity;
    }

    get isVersatile(): boolean {
        return !this.system.ancestry;
    }

    /** Prepare a character's data derived from their heritage */
    override prepareActorData(this: HeritageAvant<ActorAvant>): void {
        if (!this.actor.isOfType("character")) throw ErrorAvant("heritage embedded on non-character");
        const slug = this.slug ?? sluggify(this.name);
        // Some abilities allow for a second heritage. If the PC has more than one, set this heritage as the actor's
        // main one only if it wasn't granted by another item.
        if (this.actor.itemTypes.heritage.length === 1 || !this.grantedBy) {
            this.actor.heritage = this as HeritageAvant<CharacterAvant>;
            this.actor.system.details.heritage = {
                name: this.name,
                trait: slug in CONFIG.AVANT.ancestryTraits ? slug : null,
            };
        }

        // Add and remove traits as specified
        this.actor.system.traits.value.push(...this.traits);

        // If this heritage is versatile, add to the "countsAs" array
        // (serves as a list of traits of eligible ancestry feats)
        if (this.isVersatile) {
            this.actor.system.details.ancestry?.countsAs.push(slug);
        }

        // Add a roll option for this heritage
        this.actor.rollOptions.all[`heritage:${slug}`] = true;
        // Backward compatibility until migration
        this.actor.rollOptions.all[`self:heritage:${slug}`] = true;
    }

    override getRollOptions(prefix = this.type, options?: { includeGranter?: boolean }): string[] {
        const ancestryOrVersatile = this.system.ancestry ? `ancestry:${this.system.ancestry.slug}` : "versatile";
        return [...super.getRollOptions(prefix, options), `${prefix}:${ancestryOrVersatile}`];
    }
}

interface HeritageAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ItemAvant<TParent> {
    readonly _source: HeritageSource;
    system: HeritageSystemData;
}

export { HeritageAvant };
