import type { CreatureAvant } from "@actor";
import type { AttributeString } from "@actor/types.ts";
import { SpellcastingEntryAvant } from "@item";
import type { SpellcastingEntrySource, SpellcastingEntrySystemSource } from "@item/spellcasting-entry/data.ts";
import { ordinalString } from "@util";
import * as R from "remeda";

/** Dialog to create or edit spellcasting entries. It works on a clone of spellcasting entry, but will not persist unless the changes are accepted */
class SpellcastingCreateAndEditDialog extends FormApplication<SpellcastingEntryAvant<CreatureAvant>> {
    constructor(object: SpellcastingEntryAvant<CreatureAvant>, options?: Partial<FormApplicationOptions>) {
        super(object.clone({}, { keepId: true }), options);
    }

    static override get defaultOptions(): FormApplicationOptions {
        return {
            ...super.defaultOptions,
            id: "spellcasting-dialog",
            template: "systems/avant/templates/actors/spellcasting-dialog.hbs",
            title: "AVANT.SpellcastingSettings.Title",
            width: 350,
            height: "auto",
            closeOnSubmit: false,
            submitOnChange: true,
        };
    }

    override async getData(): Promise<SpellcastingCreateAndEditDialogSheetData> {
        const actor = this.object.actor;
        const extraStatistics = actor.synthetics.statistics.values();
        const classDCs = actor.isOfType("character")
            ? Object.values(actor.system.proficiencies.classDCs).filter((cdc) => cdc.rank > 0)
            : [];

        const selectedStatistic = actor.getStatistic(this.object.system.proficiency.slug);

        return {
            ...(await super.getData()),
            actor,
            system: this.object.toObject().system,
            statistics: [
                ...extraStatistics,
                ...classDCs.map((c) => ({
                    slug: c.slug,
                    label: game.i18n.format("AVANT.Actor.Character.ClassDC.LabelSpecific", { class: c.label }),
                })),
            ],
            magicTraditions: CONFIG.AVANT.magicTraditions,
            spellcastingTypes: R.omit(
                CONFIG.AVANT.preparationType,
                (["ritual", actor.type === "character" ? "items" : null] as const).filter(R.isTruthy),
            ),
            attributes: CONFIG.AVANT.abilities,
            isAttributeConfigurable: this.#canSetAttribute(),
            selectedAttribute: selectedStatistic?.attribute ?? this.object.attribute,
            autoHeightenLevels: Object.fromEntries(
                R.range(1, 11).map((level) => [
                    level.toString(),
                    game.i18n.format("AVANT.Item.Spell.Rank.Ordinal", { rank: ordinalString(level) }),
                ]),
            ),
            validItemTypes: { scroll: "AVANT.Actor.Creature.Spellcasting.ValidItemTypes.Scroll" },
        };
    }

    /** Returns whether or not the spellcasting data can include an ability */
    #canSetAttribute(): boolean {
        const slug = this.object._source.system.proficiency.slug;
        const actor = this.object.actor;
        const baseStat = actor.isOfType("character") ? actor.getStatistic(slug) : null;
        return !slug || (!!baseStat && !baseStat.attribute);
    }

    protected override async _updateObject(event: Event, formData: Record<string, unknown>): Promise<void> {
        const wasInnate = this.object.isInnate;

        // Unflatten the form data, so that we may make some modifications
        const inputData: DeepPartial<SpellcastingEntrySource> = fu.expandObject(formData);

        // We may disable certain form data, so reinject it
        const system = fu.mergeObject(
            inputData.system ?? {},
            {
                prepared: {
                    value: this.object.system.prepared.value,
                },
                ability: { value: "cha" },
            },
            { overwrite: false },
        );

        inputData.system = system;

        // When swapping to innate convert to cha, but allow changes after
        if (system.prepared.value === "innate" && !wasInnate) {
            system.ability.value = "cha";
        }

        // If the proficiency is being set to a value, remove the selected ability
        if (system.proficiency?.slug) {
            system.ability.value = "";
        }

        if (system?.autoHeightenLevel) {
            system.autoHeightenLevel.value ||= null;
        }

        this.object.updateSource(inputData);

        // If this wasn't a submit, only re-render and exit
        if (event.type !== "submit") {
            this.render();
            return;
        }

        return this.updateAndClose();
    }

    private async updateAndClose(): Promise<void> {
        const updateData = this.object.toObject();

        if (!this.object.isPrepared) {
            delete updateData.system.prepared.flexible;
        }

        const actor = this.object.actor;

        if (this.object.id === null) {
            updateData.name = (() => {
                const locKey = CONFIG.AVANT.preparationType[updateData.system.prepared.value];
                const preparationType = game.i18n.localize(locKey);
                const magicTraditions: Record<string, string> = CONFIG.AVANT.magicTraditions;
                const traditionSpells = game.i18n.localize(magicTraditions[this.object.tradition ?? ""]);
                if (!traditionSpells) {
                    return preparationType;
                } else {
                    return game.i18n.format("AVANT.SpellCastingFormat", { preparationType, traditionSpells });
                }
            })();

            await actor.createEmbeddedDocuments("Item", [updateData]);
        } else {
            const actualEntry = actor.spellcasting.get(this.object.id);
            if (!(actualEntry instanceof SpellcastingEntryAvant)) return;

            const system = R.pick(updateData.system, [
                "prepared",
                "tradition",
                "ability",
                "proficiency",
                "autoHeightenLevel",
            ]);
            await actualEntry.update({ system });
        }

        this.close();
    }
}

interface SpellcastingCreateAndEditDialogSheetData extends FormApplicationData<SpellcastingEntryAvant<CreatureAvant>> {
    actor: CreatureAvant;
    system: SpellcastingEntrySystemSource;
    magicTraditions: typeof CONFIG.AVANT.magicTraditions;
    statistics: { slug: string; label: string }[];
    spellcastingTypes: Partial<typeof CONFIG.AVANT.preparationType>;
    attributes: typeof CONFIG.AVANT.abilities;
    isAttributeConfigurable: boolean;
    selectedAttribute: AttributeString;
    autoHeightenLevels: Record<string, string>;
    validItemTypes: Record<string, string>;
}

async function createSpellcastingDialog(
    object: CreatureAvant | SpellcastingEntryAvant<CreatureAvant>,
): Promise<SpellcastingCreateAndEditDialog> {
    const item =
        "prototypeToken" in object
            ? new SpellcastingEntryAvant(
                  {
                      name: "Untitled",
                      type: "spellcastingEntry",
                      system: {
                          ability: { value: "cha" },
                          spelldc: { value: 0, dc: 0 },
                          tradition: { value: "arcane" },
                          prepared: { value: "innate" },
                      },
                  },
                  { parent: object },
              )
            : object;
    return new SpellcastingCreateAndEditDialog(item).render(true);
}

export { createSpellcastingDialog };
