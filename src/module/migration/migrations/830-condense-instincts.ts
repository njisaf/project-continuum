import { ItemSourceAvant } from "@item/base/data/index.ts";
import { MigrationBase } from "../base.ts";

/** Remove links to deleted compendium items */
export class Migration830BarbarianRework extends MigrationBase {
    static override version = 0.83;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        source.system.description.value = this.#removeLinks(source.system.description.value);

        for (const rule of source.system.rules) {
            if (
                rule.key === "ActiveEffectLike" &&
                "path" in rule &&
                (rule.path === "system.custom.modifiers.barbarian-dedication-count" ||
                    rule.path === "flags.avant.rollOptions.all.barbarian-dedication")
            ) {
                rule.path = "flags.avant.barbarian.archetypeFeatCount";
            }

            if (
                rule.key === "FlatModifier" &&
                "value" in rule &&
                rule.value === "3 * @actor.system.custom.modifiers.barbarian-dedication-count"
            ) {
                rule.value = "3 * @actor.flags.avant.barbarian.archetypeFeatCount";
            }
        }
    }

    #removeLinks(text: string): string {
        return text
            .replace("@UUID[Compendium.avant.classfeatures.vlRvOQS1HZZqSyh7]{Ape}", "Ape")
            .replace("@UUID[Compendium.avant.classfeatures.uGY2yddm8mZx8Yo2]{Bear}", "Bear")
            .replace("@UUID[Compendium.avant.classfeatures.31sPXwmEbbcvgsM9]{Bull}", "Bull")
            .replace("@UUID[Compendium.avant.classfeatures.vCNtX2LwlemhA3tu]{Cat}", "Cat")
            .replace("@UUID[Compendium.avant.classfeatures.RQUJgDjJODO775qb]{Deer}", "Deer")
            .replace("@UUID[Compendium.avant.classfeatures.CXZwt1e6ManeBaFV]{Frog}", "Frog")
            .replace("@UUID[Compendium.avant.classfeatures.OJmI1L4dhQfz8vze]{Shark}", "Shark")
            .replace("@UUID[Compendium.avant.classfeatures.pIYWMCNnYDQfSRQh]{Snake}", "Snake")
            .replace("@UUID[Compendium.avant.classfeatures.xX6KnYYgHlPGoTG6]{Wolf}", "Wolf")
            .replace("@UUID[Compendium.avant.classfeatures.VNbDNiWjARtGQQAs]{Black}", "Black")
            .replace("@UUID[Compendium.avant.classfeatures.RiOww9KMu06D7wtW]{Blue}", "Blue")
            .replace("@UUID[Compendium.avant.classfeatures.IezPDYlweTtwCqkT]{Green}", "Green")
            .replace("@UUID[Compendium.avant.classfeatures.hyHgLQCDMSrR4RfE]{Red}", "Red")
            .replace("@UUID[Compendium.avant.classfeatures.2esqOHCn4GcZ4zYD]{White}", "White")
            .replace("@UUID[Compendium.avant.classfeatures.b5rvKZQCfpgBenKJ]{Brass}", "Brass")
            .replace("@UUID[Compendium.avant.classfeatures.kdzIxHpzeRbdRqQA]{Bronze}", "Bronze")
            .replace("@UUID[Compendium.avant.classfeatures.1ZugTzJHsa94AZRW]{Copper}", "Copper")
            .replace("@UUID[Compendium.avant.classfeatures.3lxIGMbsPZLNEXQ7]{Gold}", "Gold")
            .replace("@UUID[Compendium.avant.classfeatures.Z2eWkfXblU0QxFx1]{Silver}", "Silver")
            .replace("@UUID[Compendium.avant.classfeatures.Ape Animal Instinct]{Ape}", "Ape")
            .replace("@UUID[Compendium.avant.classfeatures.Bear Animal Instinct]{Bear}", "Bear")
            .replace("@UUID[Compendium.avant.classfeatures.Bull Animal Instinct]{Bull}", "Bull")
            .replace("@UUID[Compendium.avant.classfeatures.Cat Animal Instinct]{Cat}", "Cat")
            .replace("@UUID[Compendium.avant.classfeatures.Deer Animal Instinct]{Deer}", "Deer")
            .replace("@UUID[Compendium.avant.classfeatures.Frog Animal Instinct]{Frog}", "Frog")
            .replace("@UUID[Compendium.avant.classfeatures.Shark Animal Instinct]{Shark}", "Shark")
            .replace("@UUID[Compendium.avant.classfeatures.Snake Animal Instinct]{Snake}", "Snake")
            .replace("@UUID[Compendium.avant.classfeatures.Wolf Animal Instinct]{Wolf}", "Wolf")
            .replace("@UUID[Compendium.avant.classfeatures.Black Dragon Instinct]{Black}", "Black")
            .replace("@UUID[Compendium.avant.classfeatures.Blue Dragon Instinct]{Blue}", "Blue")
            .replace("@UUID[Compendium.avant.classfeatures.Green Dragon Instinct]{Green}", "Green")
            .replace("@UUID[Compendium.avant.classfeatures.Red Dragon Instinct]{Red}", "Red")
            .replace("@UUID[Compendium.avant.classfeatures.White Dragon Instinct]{White}", "White")
            .replace("@UUID[Compendium.avant.classfeatures.Brass Dragon Instinct]{Brass}", "Brass")
            .replace("@UUID[Compendium.avant.classfeatures.Bronze Dragon Instinct]{Bronze}", "Bronze")
            .replace("@UUID[Compendium.avant.classfeatures.Copper Dragon Instinct]{Copper}", "Copper")
            .replace("@UUID[Compendium.avant.classfeatures.Gold Dragon Instinct]{Gold}", "Gold")
            .replace("@UUID[Compendium.avant.classfeatures.Silver Dragon Instinct]{Silver}", "Silver");
    }
}
