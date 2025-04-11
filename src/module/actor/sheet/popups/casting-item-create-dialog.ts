import { ActorAvant } from "@actor";
import { SpellAvant } from "@item";
import { SpellConsumableItemType } from "@item/consumable/spell-consumables.ts";
import { OneToTen } from "@module/data.ts";
import { ErrorAvant } from "@util";

interface FormInputData extends FormApplicationData<ActorAvant> {
    itemTypeOptions?: object;
    validLevels?: number[];
    itemType?: SpellConsumableItemType;
    level?: OneToTen;
}

type FormOutputData = {
    itemType: SpellConsumableItemType;
    level: OneToTen;
};

const itemTypeOptions = Object.fromEntries(
    new Map<SpellConsumableItemType, string>([
        ["scroll", "AVANT.CastingItemCreateDialog.scroll"],
        ["wand", "AVANT.CastingItemCreateDialog.wand"],
        ["cantripDeck5", "AVANT.CastingItemCreateDialog.cantripDeck5"],
    ]),
);

export class CastingItemCreateDialog extends FormApplication<ActorAvant> {
    onSubmitCallback: CastingItemCreateCallback;
    spell: SpellAvant;
    formDataCache: FormOutputData;

    constructor(
        object: ActorAvant,
        options: Partial<FormApplicationOptions>,
        callback: CastingItemCreateCallback,
        spell: SpellAvant,
    ) {
        super(object, options);

        this.spell = spell;
        this.formDataCache = {
            itemType: this.spell.isCantrip ? "cantripDeck5" : "scroll",
            level: spell.baseRank,
        };
        this.onSubmitCallback = callback;
    }

    static override get defaultOptions(): FormApplicationOptions {
        const options = super.defaultOptions;

        options.classes = [];
        options.title = game.i18n.localize("AVANT.CastingItemCreateDialog.title");
        options.template = "systems/avant/templates/popups/casting-item-create-dialog.hbs";
        options.width = "auto";
        options.submitOnChange = true;
        options.closeOnSubmit = false;

        return options;
    }

    override async getData(): Promise<FormInputData> {
        if (!this.spell) {
            throw ErrorAvant("CastingItemCreateDialog | Could not read spelldata");
        }

        const { cantripDeck5: cantripDeck5, ...nonCantripOptions } = itemTypeOptions;
        const minimumRank = this.spell.baseRank;
        const ranks = Array.from(Array(11 - minimumRank).keys()).map((index) => minimumRank + index);
        return {
            ...(await super.getData()),
            validLevels: ranks,
            itemTypeOptions: this.spell.isCantrip ? { cantripDeck5: cantripDeck5 } : nonCantripOptions,
            itemType: this.formDataCache.itemType,
            level: this.formDataCache.level,
        };
    }

    override async _updateObject(event: Event, formData: FormOutputData): Promise<void> {
        Object.assign(this.formDataCache, formData);

        if (event.type !== "submit") {
            this.render();
            return;
        }

        if (this.formDataCache.itemType === "wand" && this.formDataCache.level === 10) {
            ui.notifications.warn(game.i18n.localize("AVANT.CastingItemCreateDialog.10thLevelWand"));
        } else if (this.onSubmitCallback && this.spell) {
            this.onSubmitCallback(this.formDataCache.level, this.formDataCache.itemType, this.spell);
        }
        this.close();
    }
}

type CastingItemCreateCallback = (
    level: OneToTen,
    itemType: SpellConsumableItemType,
    spell: SpellAvant,
) => Promise<void>;
