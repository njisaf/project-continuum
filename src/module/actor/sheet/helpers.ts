import type { ActorAvant } from "@actor";
import { Sense } from "@actor/creature/sense.ts";
import { AbilityItemAvant, FeatAvant, PhysicalItemAvant } from "@item";
import { Bulk } from "@item/physical/bulk.ts";
import { SpellSource } from "@item/spell/index.ts";
import { coerceToSpellGroupId } from "@item/spellcasting-entry/helpers.ts";
import { ErrorAvant, getActionGlyph, ordinalString } from "@util";
import { traitSlugToObject } from "@util/tags.ts";
import * as R from "remeda";
import { AbilityViewData } from "./data-types.ts";

function onClickCreateSpell(actor: ActorAvant, data: Record<string, string | undefined>): void {
    if (!data.location) {
        throw ErrorAvant("Unexpected missing spellcasting-entry location");
    }

    const groupId = coerceToSpellGroupId(data.groupId);
    const rank = typeof groupId === "number" ? groupId : 1;
    const newLabel = game.i18n.localize("AVANT.NewLabel");
    const [rankLabel, spellLabel] =
        groupId === "cantrips"
            ? [null, game.i18n.localize("AVANT.TraitCantrip")]
            : [
                  game.i18n.format("AVANT.Item.Spell.Rank.Ordinal", { rank: ordinalString(rank) }),
                  game.i18n.localize(data.location === "rituals" ? "AVANT.Item.Spell.Ritual.Label" : "TYPES.Item.spell"),
              ];
    const source = {
        type: "spell",
        name: [newLabel, rankLabel, spellLabel].filter(R.isTruthy).join(" "),
        system: {
            level: { value: rank },
            location: { value: String(data.location) },
            traits: {
                value: groupId === "cantrips" ? ["cantrip"] : [],
            },
        },
    } satisfies DeepPartial<SpellSource>;

    if (data.location === "rituals") {
        source.system = fu.mergeObject(source.system, { category: { value: "ritual" } });
    }

    actor.createEmbeddedDocuments("Item", [source]);
}

/** Create a price label like "L / 10" when appropriate. */
function createBulkPerLabel(item: PhysicalItemAvant): string {
    return item.system.bulk.per === 1 || item.system.bulk.value === 0
        ? item.system.quantity === 1
            ? item.bulk.toString()
            : new Bulk(item.system.bulk.value).toString()
        : `${new Bulk(item.system.bulk.value)} / ${item.system.bulk.per}`;
}

/** Returns a sense list with all redundant senses removed (such as low light vision on actors with darkvision) */
function condenseSenses(senses: Sense[]): Sense[] {
    const senseTypes = new Set(senses.map((s) => s.type));
    if (senseTypes.has("darkvision") || senseTypes.has("greater-darkvision")) {
        senseTypes.delete("low-light-vision");
    }
    if (senseTypes.has("greater-darkvision")) {
        senseTypes.delete("darkvision");
    }

    return senses.filter((r) => senseTypes.has(r.type));
}

/** Creates ability or feat view data for actor sheet actions rendering */
function createAbilityViewData(item: AbilityItemAvant | FeatAvant): AbilityViewData {
    return {
        ...R.pick(item, ["id", "img", "name", "actionCost", "frequency"]),
        glyph: getActionGlyph(item.actionCost),
        usable: !!item.system.selfEffect || !!item.system?.frequency || !!item.crafting,
        traits: item.system.traits.value.map((t) => traitSlugToObject(t, CONFIG.AVANT.actionTraits)),
        has: {
            aura: item.traits.has("aura") || item.system.rules.some((r) => r.key === "Aura"),
            deathNote: item.isOfType("action") && item.system.deathNote,
            selfEffect: !!item.system.selfEffect,
        },
    };
}

export { condenseSenses, createAbilityViewData, createBulkPerLabel, onClickCreateSpell };
