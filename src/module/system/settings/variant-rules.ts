import { resetActors } from "@actor/helpers.ts";
import { htmlQuery, tupleHasValue } from "@util";
import * as R from "remeda";
import { SettingsTemplateData, settingsToSheetData } from "./menu.ts";

const SETTINGS: Record<string, SettingRegistration> = {
    gradualBoostsVariant: {
        name: "AVANT.SETTINGS.Variant.GradualBoosts.Name",
        hint: "AVANT.SETTINGS.Variant.GradualBoosts.Hint",
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.variants.gab = !!value;
            resetActors(game.actors.filter((a) => a.type === "character"));
        },
    },
    staminaVariant: {
        name: "AVANT.SETTINGS.Variant.Stamina.Name",
        hint: "AVANT.SETTINGS.Variant.Stamina.Hint",
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.variants.stamina = !!value;
            resetActors(game.actors.filter((a) => a.type === "character"));
        },
    },
    freeArchetypeVariant: {
        name: "AVANT.SETTINGS.Variant.FreeArchetype.Name",
        hint: "AVANT.SETTINGS.Variant.FreeArchetype.Hint",
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.variants.fa = !!value;
            resetActors(game.actors.filter((a) => a.type === "character"));
        },
    },
    automaticBonusVariant: {
        name: "AVANT.SETTINGS.Variant.AutomaticBonus.Name",
        hint: "AVANT.SETTINGS.Variant.AutomaticBonus.Hint",
        default: "noABP",
        type: String,
        choices: {
            noABP: "AVANT.SETTINGS.Variant.AutomaticBonus.Choices.noABP",
            ABPFundamentalPotency: "AVANT.SETTINGS.Variant.AutomaticBonus.Choices.ABPFundamentalPotency",
            ABPRulesAsWritten: "AVANT.SETTINGS.Variant.AutomaticBonus.Choices.ABPRulesAsWritten",
        },
        onChange: (value) => {
            const choices = ["noABP", "ABPFundamentalPotency", "ABPRulesAsWritten"] as const;
            game.avant.settings.variants.abp = tupleHasValue(choices, value) ? value : game.avant.settings.variants.abp;
            resetActors(game.actors.filter((a) => a.type === "character"));
        },
    },
    mythic: {
        name: "AVANT.SETTINGS.Variant.Mythic.Name",
        hint: "AVANT.SETTINGS.Variant.Mythic.Hint",
        type: String,
        default: "disabled",
        choices: R.mapToObj(["disabled", "enabled", "variant-tiers"], (key) => [
            key,
            `AVANT.SETTINGS.Variant.Mythic.Choices.${key}`,
        ]),
        onChange: (value) => {
            const choices = ["disabled", "enabled", "variant-tiers"] as const;
            game.avant.settings.campaign.mythic = tupleHasValue(choices, value) ? value : "disabled";
            resetActors(game.actors.filter((a) => a.isOfType("character")));
        },
    },
    proficiencyVariant: {
        name: "AVANT.SETTINGS.Variant.Proficiency.Name",
        hint: "AVANT.SETTINGS.Variant.Proficiency.Hint",
        default: false,
        type: Boolean,
        onChange: (value) => {
            game.avant.settings.variants.pwol.enabled = !!value;
            resetActors(game.actors.filter((a) => a.type === "character"));
        },
    },
    proficiencyUntrainedModifier: {
        name: "AVANT.SETTINGS.Variant.UntrainedModifier.Name",
        hint: "AVANT.SETTINGS.Variant.UntrainedModifier.Hint",
        default: -2,
        type: Number,
        onChange: (value) => {
            game.avant.settings.variants.pwol.modifiers[0] = Number(value) || 0;
        },
    },
    proficiencyTrainedModifier: {
        name: "AVANT.SETTINGS.Variant.TrainedModifier.Name",
        hint: "AVANT.SETTINGS.Variant.TrainedModifier.Hint",
        default: 2,
        type: Number,
        onChange: (value) => {
            game.avant.settings.variants.pwol.modifiers[1] = Number(value) || 0;
        },
    },
    proficiencyExpertModifier: {
        name: "AVANT.SETTINGS.Variant.ExpertModifier.Name",
        hint: "AVANT.SETTINGS.Variant.ExpertModifier.Hint",
        default: 4,
        type: Number,
        onChange: (value) => {
            game.avant.settings.variants.pwol.modifiers[2] = Number(value) || 0;
        },
    },
    proficiencyMasterModifier: {
        name: "AVANT.SETTINGS.Variant.MasterModifier.Name",
        hint: "AVANT.SETTINGS.Variant.MasterModifier.Hint",
        default: 6,
        type: Number,
        onChange: (value) => {
            game.avant.settings.variants.pwol.modifiers[3] = Number(value) || 0;
        },
    },
    proficiencyLegendaryModifier: {
        name: "AVANT.SETTINGS.Variant.LegendaryModifier.Name",
        hint: "AVANT.SETTINGS.Variant.LegendaryModifier.Hint",
        default: 8,
        type: Number,
        onChange: (value) => {
            game.avant.settings.variants.pwol.modifiers[4] = Number(value) || 0;
        },
    },
};

export class VariantRulesSettings extends FormApplication {
    static override get defaultOptions(): FormApplicationOptions {
        const options = super.defaultOptions;
        options.classes.push("sheet");

        return {
            ...options,
            title: "AVANT.SETTINGS.Variant.Title",
            id: "variant-rules-settings",
            template: "systems/avant/templates/system/settings/variant-rules.hbs",
            width: 550,
            height: "auto",
            closeOnSubmit: true,
        };
    }

    override async getData(): Promise<Record<string, SettingsTemplateData>> {
        return settingsToSheetData(SETTINGS);
    }

    static registerSettings(): void {
        for (const [key, value] of Object.entries(SETTINGS)) {
            value.config = false;
            value.scope = "world";
            game.settings.register("avant", key, value);
        }
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);

        htmlQuery($html[0], "button[name=reset]")?.addEventListener("click", async (event) => {
            event.preventDefault();
            for (const [key, value] of Object.entries(SETTINGS)) {
                await game.settings.set("avant", key, value?.default);
            }
            return this.render();
        });
    }

    protected override async _updateObject(_event: Event, data: Record<string, unknown>): Promise<void> {
        for (const key of Object.keys(SETTINGS)) {
            game.settings.set("avant", key, data[key]);
        }
    }
}
