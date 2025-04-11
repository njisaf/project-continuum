import { ArmySheetAvant } from "@actor/army/sheet.ts";
import { CharacterSheetAvant } from "@actor/character/sheet.ts";
import { FamiliarSheetAvant } from "@actor/familiar/sheet.ts";
import { HazardSheetAvant } from "@actor/hazard/sheet.ts";
import { LootSheetAvant } from "@actor/loot/sheet.ts";
import { NPCSheetAvant, SimpleNPCSheet } from "@actor/npc/sheet.ts";
import { PartySheetAvant } from "@actor/party/sheet.ts";
import { VehicleSheetAvant } from "@actor/vehicle/sheet.ts";
import { AbilitySheetAvant } from "@item/ability/sheet.ts";
import { AfflictionSheetAvant } from "@item/affliction/sheet.ts";
import { AncestrySheetAvant } from "@item/ancestry/sheet.ts";
import { ArmorSheetAvant } from "@item/armor/sheet.ts";
import { BackgroundSheetAvant } from "@item/background/sheet.ts";
import { ItemSheetAvant } from "@item/base/sheet/sheet.ts";
import { BookSheetAvant } from "@item/book/sheet.ts";
import { CampaignFeatureSheetAvant } from "@item/campaign-feature/sheet.ts";
import { ClassSheetAvant } from "@item/class/sheet.ts";
import { ConditionSheetAvant } from "@item/condition/sheet.ts";
import { ConsumableSheetAvant } from "@item/consumable/sheet.ts";
import { ContainerSheetAvant } from "@item/container/sheet.ts";
import { DeitySheetAvant } from "@item/deity/sheet.ts";
import { EffectSheetAvant } from "@item/effect/sheet.ts";
import { EquipmentSheetAvant } from "@item/equipment/sheet.ts";
import { FeatSheetAvant } from "@item/feat/sheet.ts";
import { HeritageSheetAvant } from "@item/heritage/sheet.ts";
import { KitSheetAvant } from "@item/kit/sheet.ts";
import { LoreSheetAvant } from "@item/lore.ts";
import { MeleeSheetAvant } from "@item/melee/sheet.ts";
import { PhysicalItemSheetAvant } from "@item/physical/sheet.ts";
import { PHYSICAL_ITEM_TYPES } from "@item/physical/values.ts";
import { ShieldSheetAvant } from "@item/shield/sheet.ts";
import { SpellSheetAvant } from "@item/spell/sheet.ts";
import { TreasureSheetAvant } from "@item/treasure/sheet.ts";
import { WeaponSheetAvant } from "@item/weapon/sheet.ts";
import { JournalSheetAvant } from "@module/journal-entry/sheet.ts";
import { UserConfigAvant } from "@module/user/sheet.ts";
import { SceneConfigAvant } from "@scene/sheet.ts";
import { TokenDocumentAvant } from "@scene/token-document/document.ts";
import { TokenConfigAvant } from "@scene/token-document/sheet.ts";

export function registerSheets(): void {
    const sheetLabel = game.i18n.localize("AVANT.SheetLabel");

    Scenes.registerSheet("avant", SceneConfigAvant, { makeDefault: true });
    DocumentSheetConfig.registerSheet(TokenDocumentAvant, "avant", TokenConfigAvant, { makeDefault: true });

    // ACTOR
    Actors.unregisterSheet("core", ActorSheet);

    const localizeType = (type: string) => {
        const docType = type in CONFIG.AVANT.Actor.documentClasses ? "Actor" : "Item";
        return game.i18n.localize(`TYPES.${docType}.${type}`);
    };

    // PC
    Actors.registerSheet("avant", CharacterSheetAvant, {
        types: ["character"],
        label: game.i18n.format(sheetLabel, { type: localizeType("character") }),
        makeDefault: true,
    });

    // NPC
    Actors.registerSheet("avant", NPCSheetAvant, {
        types: ["npc"],
        label: game.i18n.format(sheetLabel, { type: localizeType("npc") }),
        makeDefault: true,
    });
    Actors.registerSheet("avant", SimpleNPCSheet, {
        types: ["npc"],
        label: "AVANT.Actor.NPC.SimpleSheet",
        canBeDefault: false,
    });

    // Hazard
    Actors.registerSheet("avant", HazardSheetAvant, {
        types: ["hazard"],
        label: game.i18n.format(sheetLabel, { type: localizeType("hazard") }),
    });

    // Loot
    Actors.registerSheet("avant", LootSheetAvant, {
        types: ["loot"],
        label: game.i18n.format(sheetLabel, { type: localizeType("loot") }),
        makeDefault: true,
    });

    // Familiar
    Actors.registerSheet("avant", FamiliarSheetAvant, {
        types: ["familiar"],
        label: game.i18n.format(sheetLabel, { type: localizeType("familiar") }),
        makeDefault: true,
    });

    // Vehicle
    Actors.registerSheet("avant", VehicleSheetAvant, {
        types: ["vehicle"],
        label: game.i18n.format(sheetLabel, { type: localizeType("vehicle") }),
        makeDefault: true,
    });

    // Party
    Actors.registerSheet("avant", PartySheetAvant, {
        types: ["party"],
        label: game.i18n.format(sheetLabel, { type: localizeType("party") }),
        makeDefault: true,
    });

    // Army
    Actors.registerSheet("avant", ArmySheetAvant, {
        types: ["army"],
        label: game.i18n.format(sheetLabel, { type: localizeType("army") }),
        makeDefault: true,
    });

    // ITEM
    Items.unregisterSheet("core", ItemSheet);

    const itemTypes = ["lore", "spellcastingEntry"];
    for (const itemType of itemTypes) {
        Items.registerSheet("avant", ItemSheetAvant, {
            types: [itemType],
            label: game.i18n.format(sheetLabel, { type: localizeType(itemType) }),
            makeDefault: true,
        });
    }

    const sheetEntries = [
        ["action", AbilitySheetAvant],
        ["affliction", AfflictionSheetAvant],
        ["ancestry", AncestrySheetAvant],
        ["armor", ArmorSheetAvant],
        ["background", BackgroundSheetAvant],
        ["backpack", ContainerSheetAvant],
        ["book", BookSheetAvant],
        ["campaignFeature", CampaignFeatureSheetAvant],
        ["class", ClassSheetAvant],
        ["condition", ConditionSheetAvant],
        ["consumable", ConsumableSheetAvant],
        ["deity", DeitySheetAvant],
        ["effect", EffectSheetAvant],
        ["equipment", EquipmentSheetAvant],
        ["feat", FeatSheetAvant],
        ["heritage", HeritageSheetAvant],
        ["kit", KitSheetAvant],
        ["lore", LoreSheetAvant],
        ["melee", MeleeSheetAvant],
        ["shield", ShieldSheetAvant],
        ["spell", SpellSheetAvant],
        ["treasure", TreasureSheetAvant],
        ["weapon", WeaponSheetAvant],
    ] as const;
    for (const [type, Sheet] of sheetEntries) {
        Items.registerSheet("avant", Sheet, {
            types: [type],
            label: game.i18n.format(sheetLabel, { type: localizeType(type) }),
            makeDefault: true,
        });
    }

    // Add any missing physical item sheets
    for (const itemType of PHYSICAL_ITEM_TYPES) {
        if (sheetEntries.some(([type, _sheet]) => itemType === type)) continue;
        Items.registerSheet("avant", PhysicalItemSheetAvant, {
            types: [itemType],
            label: game.i18n.format(sheetLabel, { type: localizeType(itemType) }),
            makeDefault: true,
        });
    }

    // JOURNAL ENTRY
    Journal.unregisterSheet("core", JournalSheet);
    Journal.registerSheet("avant", JournalSheetAvant, {
        label: () =>
            game.i18n.format("SHEETS.DefaultDocumentSheet", { document: game.i18n.localize("DOCUMENT.JournalEntry") }),
        makeDefault: true,
    });

    // USER
    Users.unregisterSheet("core", foundry.applications.sheets.UserConfig);
    Users.registerSheet("avant", UserConfigAvant, {
        makeDefault: true,
        label: () => game.i18n.format("SHEETS.DefaultDocumentSheet", { document: game.i18n.localize("DOCUMENT.User") }),
    });
}
