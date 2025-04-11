import type { CharacterAvant } from "@actor";
import { CreatureSheetData } from "@actor/creature/index.ts";
import { CreatureSheetAvant } from "@actor/creature/sheet.ts";
import { SheetClickActionHandlers } from "@actor/sheet/base.ts";
import { AbilityViewData } from "@actor/sheet/data-types.ts";
import { createAbilityViewData } from "@actor/sheet/helpers.ts";
import { eventToRollParams } from "@module/sheet/helpers.ts";
import { StatisticTraceData } from "@system/statistic/index.ts";
import * as R from "remeda";
import type { FamiliarAvant } from "./document.ts";

/**
 * @category Actor
 */
export class FamiliarSheetAvant<TActor extends FamiliarAvant> extends CreatureSheetAvant<TActor> {
    /** There is currently no actor config for familiars */
    protected readonly actorConfigClass = null;

    static override get defaultOptions(): ActorSheetOptions {
        const options = super.defaultOptions;
        return {
            ...options,
            classes: [...options.classes, "familiar"],
            width: 650,
            height: 680,
            tabs: [{ navSelector: ".sheet-navigation", contentSelector: ".sheet-content", initial: "attributes" }],
            template: "systems/avant/templates/actors/familiar/sheet.hbs",
        };
    }

    override async getData(options?: ActorSheetOptions): Promise<FamiliarSheetData<TActor>> {
        const sheetData = await super.getData(options);
        const familiar = this.actor;

        // Get all potential masters of the familiar (always include current master regardless of User permissions)
        const masters = game.actors.filter(
            (a): a is CharacterAvant<null> => a.type === "character" && (a.isOwner || a.id === familiar.master?.id),
        );

        // list of abilities that can be selected as spellcasting ability
        const size = CONFIG.AVANT.actorSizes[familiar.system.traits.size.value] ?? null;
        const familiarAbilities = this.actor.master?.attributes?.familiarAbilities;

        // Update save labels
        if (sheetData.data.saves) {
            for (const key of ["fortitude", "reflex", "will"] as const) {
                const save = sheetData.data.saves[key];
                save.label = CONFIG.AVANT.saves[key];
            }
        }

        const skills = Object.values(sheetData.data.skills).sort((a, b) =>
            a.label.localeCompare(b.label, game.i18n.lang),
        );

        return {
            ...sheetData,
            attributes: CONFIG.AVANT.abilities,
            familiarAbilities: {
                value: familiarAbilities?.value ?? 0,
                items: R.sortBy(
                    this.actor.itemTypes.action,
                    (a) => a.name,
                    (a) => a.sort,
                ).map((item) => createAbilityViewData(item)),
            },
            master: this.actor.master,
            masters,
            size,
            skills,
        };
    }

    protected override activateClickListener(html: HTMLElement): SheetClickActionHandlers {
        const handlers = super.activateClickListener(html);
        handlers["familiar-attack-roll"] = (event) => {
            this.actor.attackStatistic.roll(eventToRollParams(event, { type: "check" }));
        };

        return handlers;
    }
}

interface FamiliarSheetData<TActor extends FamiliarAvant> extends CreatureSheetData<TActor> {
    attributes: typeof CONFIG.AVANT.abilities;
    familiarAbilities: {
        value: number;
        items: AbilityViewData[];
    };
    master: CharacterAvant | null;
    masters: CharacterAvant[];
    size: string;
    skills: StatisticTraceData[];
}
