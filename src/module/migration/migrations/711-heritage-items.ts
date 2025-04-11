import { CharacterDetailsSource } from "@actor/character/data.ts";
import { CreatureTrait } from "@actor/creature/types.ts";
import { ActorSourceAvant } from "@actor/data/index.ts";
import { FeatSource, ItemSourceAvant } from "@item/base/data/index.ts";
import { FeatSystemSource } from "@item/feat/data.ts";
import { HeritageSource, HeritageSystemSource } from "@item/heritage/data.ts";
import { Rarity } from "@module/data.ts";
import { creatureTraits } from "@scripts/config/traits.ts";
import { MigrationBase } from "../base.ts";

const toDelete = ["featType", "actionCategory", "actions", "actionType", "level", "location"] as const;

export class Migration711HeritageItems extends MigrationBase {
    static override version = 0.711;

    #isHeritageFeature(feature: MaybeWithHeritageFeatType): feature is MaybeWithHeritageFeatType<FeatSource> {
        return feature.type === "feat" && feature.system.featType?.value === "heritage";
    }

    #officialAncestries: Record<string, { name: string; uuid: ItemUUID } | undefined> = {
        tengu: {
            name: "Tengu",
            uuid: "Compendium.avant.ancestries.Item.18xDKYPDBLEv2myX",
        },
        kitsune: {
            name: "Kitsune",
            uuid: "Compendium.avant.ancestries.Item.4BL5wf1VF9feC2rY",
        },
        poppet: {
            name: "Poppet",
            uuid: "Compendium.avant.ancestries.Item.6F2fSFC1Eo1JdpY4",
        },
        kobold: {
            name: "Kobold",
            uuid: "Compendium.avant.ancestries.Item.7oQxL6wgsokD3QXG",
        },
        catfolk: {
            name: "Catfolk",
            uuid: "Compendium.avant.ancestries.Item.972EkpJOPv9KkQIW",
        },
        dwarf: {
            name: "Dwarf",
            uuid: "Compendium.avant.ancestries.Item.BYj5ZvlXZdpaEgA6",
        },
        gnome: {
            name: "Gnome",
            uuid: "Compendium.avant.ancestries.Item.CYlfsYLJcBOgqKtD",
        },
        fleshwarp: {
            name: "Fleshwarp",
            uuid: "Compendium.avant.ancestries.Item.FXlXmNBFiiz9oasi",
        },
        strix: {
            name: "Strix",
            uuid: "Compendium.avant.ancestries.Item.GXcC6oVa5quzgNHD",
        },
        android: {
            name: "Android",
            uuid: "Compendium.avant.ancestries.Item.GfLwE884NoRC7cRi",
        },
        halfling: {
            name: "Halfling",
            uuid: "Compendium.avant.ancestries.Item.GgZAHbrjnzWOZy2v",
        },
        lizardfolk: {
            name: "Lizardfolk",
            uuid: "Compendium.avant.ancestries.Item.HWEgF7Gmoq55VhTL",
        },
        human: {
            name: "Human",
            uuid: "Compendium.avant.ancestries.Item.IiG7DgeLWYrSNXuX",
        },
        ratfolk: {
            name: "Ratfolk",
            uuid: "Compendium.avant.ancestries.Item.P6PcVnCkh4XMdefw",
        },
        elf: {
            name: "Elf",
            uuid: "Compendium.avant.ancestries.Item.PgKmsA2aKdbLU6O0",
        },
        anadi: {
            name: "Anadi",
            uuid: "Compendium.avant.ancestries.Item.TQEqWqc7BYiadUdY",
        },
        sprite: {
            name: "Sprite",
            uuid: "Compendium.avant.ancestries.Item.TRqoeYfGAFjQbviF",
        },
        goloma: {
            name: "Goloma",
            uuid: "Compendium.avant.ancestries.Item.c4secsSNG2AO7I5i",
        },
        leshy: {
            name: "Leshy",
            uuid: "Compendium.avant.ancestries.Item.cdhgByGG1WtuaK73",
        },
        fetchling: {
            name: "Fetchling",
            uuid: "Compendium.avant.ancestries.Item.hIA3qiUsxvLZXrFP",
        },
        grippli: {
            name: "Grippli",
            uuid: "Compendium.avant.ancestries.Item.hXM5jXezIki1cMI2",
        },
        automaton: {
            name: "Automaton",
            uuid: "Compendium.avant.ancestries.Item.kYsBAJ103T44agJF",
        },
        orc: {
            name: "Orc",
            uuid: "Compendium.avant.ancestries.Item.lSGWXjcbOa6O5fTx",
        },
        hobgoblin: {
            name: "Hobgoblin",
            uuid: "Compendium.avant.ancestries.Item.piNLXUrm9iaGqD2i",
        },
        shoony: {
            name: "Shoony",
            uuid: "Compendium.avant.ancestries.Item.q6rsqYARyOGXZA8F",
        },
        goblin: {
            name: "Goblin",
            uuid: "Compendium.avant.ancestries.Item.sQfjTMDaZbT9DThq",
        },
        conrasu: {
            name: "Conrasu",
            uuid: "Compendium.avant.ancestries.Item.tZn4qIHCUA6wCdnI",
        },
        gnoll: {
            name: "Gnoll",
            uuid: "Compendium.avant.ancestries.Item.vxbQ1Yw4qwgjTzqo",
        },
        shisk: {
            name: "Shisk",
            uuid: "Compendium.avant.ancestries.Item.x1YinOddgUxwOLqP",
        },
        azarketi: {
            name: "Azarketi",
            uuid: "Compendium.avant.ancestries.Item.yFoojz6q3ZjvceFw",
        },
    };

    #heritagesWithoutAncestryInName: Record<string, string | undefined> = {
        "half-elf": "human",
        "half-orc": "human",
        "skilled-heritage": "human",
        "versatile-heritage": "human",
        draxie: "sprite",
        grig: "sprite",
        melixie: "sprite",
        nyktera: "sprite",
        pixie: "sprite",
        "deep-rat": "ratfolk",
        "desert-rat": "ratfolk",
        "longsnout-rat": "ratfolk",
        "sewer-rat": "ratfolk",
        "shadow-rat": "ratfolk",
        "snow-rat": "ratfolk",
        "tunnel-rat": "ratfolk",
        "rite-of-invocation": "conrasu",
        "rite-of-knowing": "conrasu",
        "rite-of-light": "conrasu",
        "rite-of-passage": "conrasu",
        "rite-of-reinforcement": "conrasu",
    };

    #ancestrySlugs = Object.keys(this.#officialAncestries);

    #heritageFromFeat(feature: FeatSource): HeritageSourceWithNoAncestrySlug {
        const featureSlug = feature.system.slug ?? "";
        const ancestrySlug =
            this.#heritagesWithoutAncestryInName[featureSlug] ??
            this.#ancestrySlugs.find((s) => featureSlug.includes(s));
        const ancestryReference = this.#officialAncestries[ancestrySlug ?? ""] ?? null;
        const traits: { rarity: Rarity; value: string[] } = feature.system.traits;

        if (feature._stats.compendiumSource) {
            feature._stats.compendiumSource = feature._stats.compendiumSource.replace(
                "ancestryfeatures",
                "heritages",
            ) as ItemUUID;
        }

        return {
            _id: fu.randomID(),
            type: "heritage",
            img: feature.img.endsWith("/feat.svg") ? "systems/avant/icons/default-icons/heritage.svg" : feature.img,
            name: feature.name,
            effects: [],
            folder: feature.folder,
            flags: feature.flags,
            sort: feature.sort,
            ownership: feature.ownership,
            system: {
                description: feature.system.description,
                rules: feature.system.rules,
                schema: feature.system.schema,
                _migration: { version: null, previous: null },
                slug: feature.system.slug,
                ancestry: ancestryReference,
                traits: {
                    value: traits.value.filter(
                        (t): t is CreatureTrait =>
                            (t in creatureTraits || t.startsWith("hb_")) && !(t in this.#officialAncestries),
                    ),
                    rarity: traits.rarity,
                    otherTags: [],
                },
            },
        };
    }

    override async updateActor(actorSource: ActorSourceAvant): Promise<void> {
        const heritageFeatures = actorSource.items.filter((i): i is FeatSource => this.#isHeritageFeature(i));
        const firstHeritageFeature = heritageFeatures[0];
        const hasRealHeritage = actorSource.items.some((i) => i.type === "heritage");
        if (!hasRealHeritage && firstHeritageFeature && actorSource.type === "character") {
            const heritageSource = this.#heritageFromFeat(firstHeritageFeature);
            const items: object[] = actorSource.items;
            items.push(heritageSource);

            const details: MaybeWithStoredHeritage = actorSource.system.details;
            if (details.heritage) {
                details["-=heritage"] = null;
                if (!("game" in globalThis)) delete details.heritage;
            }
        }

        for (const feature of heritageFeatures) {
            actorSource.items.splice(actorSource.items.indexOf(feature), 1);
        }
    }

    override async updateItem(itemSource: ItemSourceAvant, actorSource?: ActorSourceAvant): Promise<void> {
        if (actorSource || !this.#isHeritageFeature(itemSource)) return;

        const newSource: { type: string; img: ImageFilePath; system: object } = itemSource;
        newSource.type = "heritage";
        if (itemSource.img === "systems/avant/icons/default-icons/feat.svg") {
            itemSource.img = "systems/avant/icons/default-icons/heritage.svg";
        }
        type WithPropertyDeletions = HeritageSystemSourceWithNoAncestrySlug & FeatPropertyDeletions;
        const newSystemData: WithPropertyDeletions = this.#heritageFromFeat(itemSource).system;
        const deletionProperties = toDelete.map((k) => `-=${k}` as const);
        for (const property of deletionProperties) {
            newSystemData[property] = null;
        }
        if (!("game" in globalThis)) {
            for (const property of toDelete) {
                delete newSystemData[property];
            }
        }
        newSource.system = newSystemData;
    }
}

type FeatKeys = (typeof toDelete)[number];
type DeletionKeys = `-=${FeatKeys}`;
type FeatPropertyDeletions = DeepPartial<Omit<FeatSystemSource, "traits">> & {
    [K in DeletionKeys | FeatKeys]?: unknown;
};

type MaybeWithHeritageFeatType<TSource extends ItemSourceAvant = ItemSourceAvant> = TSource & {
    system: {
        featType?: {
            value: string;
        };
    };
};

interface HeritageSourceWithNoAncestrySlug extends Omit<HeritageSource, "system" | "_stats"> {
    system: HeritageSystemSourceWithNoAncestrySlug;
}

interface HeritageSystemSourceWithNoAncestrySlug extends Omit<HeritageSystemSource, "ancestry" | "publication"> {
    ancestry: { uuid: ItemUUID; name: string } | null;
}

type MaybeWithStoredHeritage = CharacterDetailsSource & { heritage?: unknown; "-=heritage"?: null };
