import { ItemSheetOptions } from "@item/base/sheet/sheet.ts";
import type { ClassAvant } from "@item/class/document.ts";
import { createSheetTags, SheetOptions } from "@module/sheet/helpers.ts";
import { ABCSheetData, ABCSheetAvant } from "../abc/sheet.ts";

export class ClassSheetAvant extends ABCSheetAvant<ClassAvant> {
    override async getData(options?: Partial<ItemSheetOptions>): Promise<ClassSheetData> {
        const sheetData = await super.getData(options);
        const itemData = sheetData.item;

        return {
            ...sheetData,
            proficiencyChoices: CONFIG.AVANT.proficiencyLevels,
            selectedKeyAbility: this.getLocalizedAbilities(itemData.system.keyAbility),
            trainedSkills: createSheetTags(CONFIG.AVANT.skills, itemData.system.trainedSkills),
            ancestryFeatLevels: createSheetTags(CONFIG.AVANT.levels, itemData.system.ancestryFeatLevels),
            classFeatLevels: createSheetTags(CONFIG.AVANT.levels, itemData.system.classFeatLevels),
            generalFeatLevels: createSheetTags(CONFIG.AVANT.levels, itemData.system.generalFeatLevels),
            skillFeatLevels: createSheetTags(CONFIG.AVANT.levels, itemData.system.skillFeatLevels),
            skillIncreaseLevels: createSheetTags(CONFIG.AVANT.levels, itemData.system.skillIncreaseLevels),
        };
    }
}

interface ClassSheetData extends ABCSheetData<ClassAvant> {
    proficiencyChoices: typeof CONFIG.AVANT.proficiencyLevels;
    selectedKeyAbility: Record<string, string>;
    trainedSkills: SheetOptions;
    ancestryFeatLevels: SheetOptions;
    classFeatLevels: SheetOptions;
    generalFeatLevels: SheetOptions;
    skillFeatLevels: SheetOptions;
    skillIncreaseLevels: SheetOptions;
}
