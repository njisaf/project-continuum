import type { ActorAvant, CharacterAvant } from "@actor";
import { ABCItemAvant, type FeatAvant } from "@item";
import { OneToFour } from "@module/data.ts";
import { BackgroundSource, BackgroundSystemData } from "./data.ts";
import { BackgroundTrait } from "./types.ts";

class BackgroundAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ABCItemAvant<TParent> {
    get traits(): Set<BackgroundTrait> {
        return new Set(this.system.traits.value);
    }

    /** Set a skill feat granted by a GrantItem RE as one of this background's configured items */
    override prepareSiblingData(this: BackgroundAvant<ActorAvant>): void {
        if (Object.keys(this.system.items).length > 0) return;
        const grantedSkillFeat = Object.values(this.flags.avant.itemGrants)
            .flatMap((g) => this.actor.items.get(g.id) ?? [])
            .find((i): i is FeatAvant<ActorAvant> => i.isOfType("feat") && i.category === "skill");

        if (grantedSkillFeat) {
            this.system.items["GRANT"] = {
                uuid: grantedSkillFeat.sourceId ?? grantedSkillFeat.uuid,
                img: grantedSkillFeat.img,
                name: grantedSkillFeat.name,
                level: 1,
            };
            grantedSkillFeat.system.level.taken = 1;
            grantedSkillFeat.system.location = this.id;
        }
    }

    override prepareActorData(this: BackgroundAvant<CharacterAvant>): void {
        if (!this.actor.isOfType("character")) {
            console.error("Only a character can have a background");
            return;
        }

        this.actor.background = this;
        const { build } = this.actor.system;

        // Add ability boosts
        const boosts = Object.values(this.system.boosts);
        for (const boost of boosts) {
            if (boost.selected) {
                build.attributes.boosts.background.push(boost.selected);
            }
        }

        const { trainedSkills } = this.system;
        for (const key of trainedSkills.value) {
            const skill = this.actor.system.skills[key];
            if (skill) {
                skill.rank = Math.max(skill.rank, 1) as OneToFour;
            }
        }
    }
}

interface BackgroundAvant<TParent extends ActorAvant | null = ActorAvant | null> extends ABCItemAvant<TParent> {
    readonly _source: BackgroundSource;
    system: BackgroundSystemData;
}

export { BackgroundAvant };
