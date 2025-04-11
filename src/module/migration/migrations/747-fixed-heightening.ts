import type { SpellAvant } from "@item";
import { ItemSourceAvant, SpellSource } from "@item/base/data/index.ts";
import { sluggify } from "@util";
import { UUIDUtils } from "@util/uuid.ts";
import * as R from "remeda";
import { MigrationBase } from "../base.ts";

/** Handle spells gaining fixed level heightening */
export class Migration747FixedHeightening extends MigrationBase {
    static override version = 0.747;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        if (source.type !== "spell") return;

        const isAcidSplash = (source.system.slug ?? sluggify(source.name)) === "acid-splash";
        if (source.system.heightening?.type === "fixed" && !isAcidSplash) return;

        const sourceId = source._stats.compendiumSource;
        if (sourceId && this.fixedHeightenSpells.has(sourceId)) {
            const spells = await this.loadSpells();
            const spell = spells[sourceId];
            if (spell && spell.system.heightening?.type === "fixed") {
                source.system.heightening = spell.system.heightening;
                this.overwriteDamage(source, spell);
            }
        }
    }

    protected overwriteDamage(spell: SpellSource, newSpell: SpellAvant): void {
        const newDamage = newSpell.system.damage;
        const newKeys = new Set(Object.keys(newDamage.value));
        const diff = Object.keys(spell.system.damage.value).filter((key) => !newKeys.has(key));
        const damage: Record<string, unknown> | { value: Record<string, unknown> } = spell.system.damage;
        damage.value = newDamage.value;
        for (const deleteKey of diff) {
            if (R.isPlainObject(damage.value)) {
                damage.value[`-=${deleteKey}`] = null;
            }
        }
    }

    #loadedSpells?: Record<string, SpellAvant | undefined>;

    // Ensure compendium is only hit if the migration runs, and only once
    protected async loadSpells(): Promise<Record<string, SpellAvant | undefined>> {
        if (this.#loadedSpells) {
            return this.#loadedSpells;
        }

        const spells = await UUIDUtils.fromUUIDs([...this.fixedHeightenSpells]);
        this.#loadedSpells = spells.reduce((record, spell) => ({ ...record, [spell.uuid]: spell }), {});
        return this.#loadedSpells;
    }

    fixedHeightenSpells = new Set<DocumentUUID>([
        "Compendium.avant.spells-srd.Item.0fKHBh5goe2eiFYL",
        "Compendium.avant.spells-srd.Item.10VcmSYNBrvBphu1",
        "Compendium.avant.spells-srd.Item.2gQYrCPwBmwau26O",
        "Compendium.avant.spells-srd.Item.2iQKhCQBijhj5Rf3",
        "Compendium.avant.spells-srd.Item.4koZzrnMXhhosn0D",
        "Compendium.avant.spells-srd.Item.5WM3WjshXgrkVCg6",
        "Compendium.avant.spells-srd.Item.7CUgqHunmHfW2lC5",
        "Compendium.avant.spells-srd.Item.7OFKYR1VY6EXDuiR",
        "Compendium.avant.spells-srd.Item.9s5tqqXNzcoKamWx",
        "Compendium.avant.spells-srd.Item.BCuHKrDeJ4eq53M6",
        "Compendium.avant.spells-srd.Item.CxpFy4HJHf4ACbxF",
        "Compendium.avant.spells-srd.Item.D2nPKbIS67m9199U",
        "Compendium.avant.spells-srd.Item.DCQHaLrYXMI37dvW",
        "Compendium.avant.spells-srd.Item.DgcSiOCR1uDXGaEA",
        "Compendium.avant.spells-srd.Item.EfFMLVbmkBWmzoLF",
        "Compendium.avant.spells-srd.Item.Et8RSCLx8w7uOLvo",
        "Compendium.avant.spells-srd.Item.F23T5tHPo3WsFiHW",
        "Compendium.avant.spells-srd.Item.FhOaQDTSnsY7tiam",
        "Compendium.avant.spells-srd.Item.Fr58LDSrbndgld9n",
        "Compendium.avant.spells-srd.Item.GaRQlC9Yw1BGKHfN",
        "Compendium.avant.spells-srd.Item.HGmBY8KjgLV97nUp",
        "Compendium.avant.spells-srd.Item.HHGUBGle4OjoxvNR",
        "Compendium.avant.spells-srd.Item.HTou8cG05yuSkesj",
        "Compendium.avant.spells-srd.Item.HWrNMQENi9WSGbnF",
        "Compendium.avant.spells-srd.Item.HcIAQZjNXHemoXSU",
        "Compendium.avant.spells-srd.Item.Ifc2b6bNVdjKV7Si",
        "Compendium.avant.spells-srd.Item.JHntYF0SbaWKq7wR",
        "Compendium.avant.spells-srd.Item.LQzlKbYjZSMFQawP",
        "Compendium.avant.spells-srd.Item.LiGbewa9pO0yjbsY",
        "Compendium.avant.spells-srd.Item.Llx0xKvtu8S4z6TI",
        "Compendium.avant.spells-srd.Item.Mkbq9xlAUxHUHyR2",
        "Compendium.avant.spells-srd.Item.OAt2ZEns1gIOCgrn",
        "Compendium.avant.spells-srd.Item.OhD2Z6rIGGD5ocZA",
        "Compendium.avant.spells-srd.Item.PRrZ7anETWPm90YY",
        "Compendium.avant.spells-srd.Item.PjhUmyKnq6K5uDby",
        "Compendium.avant.spells-srd.Item.Popa5umI3H33levx",
        "Compendium.avant.spells-srd.Item.Pwq6T7xpfAJXV5aj",
        "Compendium.avant.spells-srd.Item.Q7QQ91vQtyi1Ux36",
        "Compendium.avant.spells-srd.Item.Seaah9amXg70RKw2",
        "Compendium.avant.spells-srd.Item.U58aQWJ47VrI36yP",
        "Compendium.avant.spells-srd.Item.UmXhuKrYZR3W16mQ",
        "Compendium.avant.spells-srd.Item.VTb0yI6P1bLkzuRr",
        "Compendium.avant.spells-srd.Item.VlNcjmYyu95vOUe8",
        "Compendium.avant.spells-srd.Item.W02bHXylIpoXbO4e",
        "Compendium.avant.spells-srd.Item.WsUwpfmhKrKwoIe3",
        "Compendium.avant.spells-srd.Item.Wt94cw03L77sbud7",
        "Compendium.avant.spells-srd.Item.XhgMx9WC6NfXd9RP",
        "Compendium.avant.spells-srd.Item.ZAX0OOcKtYMQlquR",
        "Compendium.avant.spells-srd.Item.ZqmP9gijBmK7y8Xy",
        "Compendium.avant.spells-srd.Item.aIHY2DArKFweIrpf",
        "Compendium.avant.spells-srd.Item.atlgGNI1E1Ox3O3a",
        "Compendium.avant.spells-srd.Item.bay4AfSu2iIozNNW",
        "Compendium.avant.spells-srd.Item.czO0wbT1i320gcu9",
        "Compendium.avant.spells-srd.Item.dINQzhqGmIsqGMUY",
        "Compendium.avant.spells-srd.Item.drmvQJETA3WZzXyw",
        "Compendium.avant.spells-srd.Item.e36Z2t6tLdW3RUzZ",
        "Compendium.avant.spells-srd.Item.fprqWKUc0jnMIyGU",
        "Compendium.avant.spells-srd.Item.gISYsBFby1TiXfBt",
        "Compendium.avant.spells-srd.Item.ivKnEtI1z4UqEKIA",
        "Compendium.avant.spells-srd.Item.kuoYff1csM5eAcAP",
        "Compendium.avant.spells-srd.Item.lbrWMnS2pecKaSVB",
        "Compendium.avant.spells-srd.Item.lsR3RLEdBG4rcSzd",
        "Compendium.avant.spells-srd.Item.nXmC2Xx9WmS5NsAo",
        "Compendium.avant.spells-srd.Item.o6YCGx4lycsYpww4",
        "Compendium.avant.spells-srd.Item.pZTqGY1MLRjgKasV",
        "Compendium.avant.spells-srd.Item.pt3gEnzA159uHcJC",
        "Compendium.avant.spells-srd.Item.pwzdSlJgYqN7bs2w",
        "Compendium.avant.spells-srd.Item.q5qmNn144ZJGxnvJ",
        "Compendium.avant.spells-srd.Item.qTr2oCgIXl703Whb",
        "Compendium.avant.spells-srd.Item.qwlh6aDgi86U3Q7H",
        "Compendium.avant.spells-srd.Item.r4HLQcYwB62bTayl",
        "Compendium.avant.spells-srd.Item.sFwoKj0TsacsmoWj",
        "Compendium.avant.spells-srd.Item.vLA0q0WOK2YPuJs6",
        "Compendium.avant.spells-srd.Item.vLzFcIaSXs7YTIqJ",
        "Compendium.avant.spells-srd.Item.vTQvfYu2llKQedmY",
        "Compendium.avant.spells-srd.Item.vctIUOOgSmxAF0KG",
        "Compendium.avant.spells-srd.Item.wzctak6BxOW8xvFV",
        "Compendium.avant.spells-srd.Item.x5rGOmhDRDVQPrnW",
        "Compendium.avant.spells-srd.Item.x7SPrsRxGb2Vy2nu",
        "Compendium.avant.spells-srd.Item.x9RIFhquazom4p02",
        "Compendium.avant.spells-srd.Item.xRgU9rrhmGAgG4Rc",
        "Compendium.avant.spells-srd.Item.yH13KXUK2x093NUv",
        "Compendium.avant.spells-srd.Item.yM3KTTSAIHhyuP14",
        "Compendium.avant.spells-srd.Item.zlnXpME1T2uvn8Lr",
        "Compendium.avant.spells-srd.Item.zul5cBTfr7NXHBZf",
    ]);
}
