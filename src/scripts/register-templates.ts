/** Register Handlebars template partials */
export function registerTemplates(): void {
    const templatePaths = [
        // Dice
        "systems/avant/templates/chat/check/roll.hbs",
        "systems/avant/templates/chat/check/target-dc-result.hbs",
        "systems/avant/templates/chat/damage/damage-taken.hbs",
        "systems/avant/templates/dice/damage-roll.hbs",
        "systems/avant/templates/dice/damage-tooltip.hbs",

        // PC Sheet Tooltips and Section Partials
        "systems/avant/templates/actors/character/partials/elemental-blast.hbs",
        "systems/avant/templates/actors/character/partials/feat-slot.hbs",
        "systems/avant/templates/actors/character/partials/header.hbs",
        "systems/avant/templates/actors/character/partials/sidebar.hbs",
        "systems/avant/templates/actors/character/partials/strike.hbs",

        // PC Sheet Tabs
        "systems/avant/templates/actors/character/tabs/actions.hbs",
        "systems/avant/templates/actors/character/tabs/biography.hbs",
        "systems/avant/templates/actors/character/tabs/character.hbs",
        "systems/avant/templates/actors/character/tabs/crafting.hbs",
        "systems/avant/templates/actors/character/tabs/effects.hbs",
        "systems/avant/templates/actors/character/tabs/feats.hbs",
        "systems/avant/templates/actors/character/tabs/inventory.hbs",
        "systems/avant/templates/actors/character/tabs/pfs.hbs",
        "systems/avant/templates/actors/character/tabs/proficiencies.hbs",
        "systems/avant/templates/actors/character/tabs/spellcasting.hbs",

        // Hazard Sheets Partials
        "systems/avant/templates/actors/hazard/partials/header.hbs",
        "systems/avant/templates/actors/hazard/partials/sidebar.hbs",

        // Kingdom Sheet Partials
        "systems/avant/templates/actors/party/kingdom/tabs/main.hbs",
        "systems/avant/templates/actors/party/kingdom/tabs/activities.hbs",
        "systems/avant/templates/actors/party/kingdom/tabs/world.hbs",
        "systems/avant/templates/actors/party/kingdom/tabs/features.hbs",
        "systems/avant/templates/actors/party/kingdom/tabs/ongoing.hbs",
        "systems/avant/templates/actors/party/kingdom/partials/build-entry-boosts.hbs",
        "systems/avant/templates/actors/party/kingdom/partials/settlement.hbs",

        // Shared Actor Sheet Partials
        "systems/avant/templates/actors/partials/action.hbs",
        "systems/avant/templates/actors/partials/carry-type.hbs",
        "systems/avant/templates/actors/partials/coinage.hbs",
        "systems/avant/templates/actors/partials/dying-pips.hbs",
        "systems/avant/templates/actors/partials/effects.hbs",
        "systems/avant/templates/actors/partials/encumbrance.hbs",
        "systems/avant/templates/actors/partials/inventory-header.hbs",
        "systems/avant/templates/actors/partials/inventory.hbs",
        "systems/avant/templates/actors/partials/item-line.hbs",
        "systems/avant/templates/actors/partials/modifiers-tooltip.hbs",
        "systems/avant/templates/actors/partials/spell-collection.hbs",
        "systems/avant/templates/actors/partials/toggles.hbs",
        "systems/avant/templates/actors/partials/total-bulk.hbs",
        "systems/avant/templates/actors/character/partials/proficiencylevels-dropdown.hbs",

        // SVG icons
        "systems/avant/templates/actors/character/icons/d20.hbs",
        "systems/avant/templates/actors/character/icons/pfs.hbs",
        "systems/avant/templates/actors/character/icons/plus.hbs",

        // NPC partials
        "systems/avant/templates/actors/npc/tabs/main.hbs",
        "systems/avant/templates/actors/npc/tabs/inventory.hbs",
        "systems/avant/templates/actors/npc/tabs/effects.hbs",
        "systems/avant/templates/actors/npc/tabs/spells.hbs",
        "systems/avant/templates/actors/npc/tabs/notes.hbs",
        "systems/avant/templates/actors/npc/partials/header.hbs",
        "systems/avant/templates/actors/npc/partials/sidebar.hbs",
        "systems/avant/templates/actors/npc/partials/action.hbs",
        "systems/avant/templates/actors/npc/partials/attack.hbs",

        // Item Sheet Partials
        "systems/avant/templates/items/action-details.hbs",
        "systems/avant/templates/items/action-sidebar.hbs",
        "systems/avant/templates/items/activation-panel.hbs",
        "systems/avant/templates/items/partials/addendum.hbs",
        "systems/avant/templates/items/affliction-details.hbs",
        "systems/avant/templates/items/affliction-sidebar.hbs",
        "systems/avant/templates/items/ancestry-details.hbs",
        "systems/avant/templates/items/ancestry-sidebar.hbs",
        "systems/avant/templates/items/armor-details.hbs",
        "systems/avant/templates/items/background-details.hbs",
        "systems/avant/templates/items/backpack-details.hbs",
        "systems/avant/templates/items/book-details.hbs",
        "systems/avant/templates/items/campaign-feature-details.hbs",
        "systems/avant/templates/items/campaign-feature-sidebar.hbs",
        "systems/avant/templates/items/class-details.hbs",
        "systems/avant/templates/items/condition-details.hbs",
        "systems/avant/templates/items/condition-sidebar.hbs",
        "systems/avant/templates/items/consumable-details.hbs",
        "systems/avant/templates/items/deity-details.hbs",
        "systems/avant/templates/items/effect-details.hbs",
        "systems/avant/templates/items/effect-sidebar.hbs",
        "systems/avant/templates/items/equipment-details.hbs",
        "systems/avant/templates/items/feat-details.hbs",
        "systems/avant/templates/items/feat-sidebar.hbs",
        "systems/avant/templates/items/heritage-details.hbs",
        "systems/avant/templates/items/heritage-sidebar.hbs",
        "systems/avant/templates/items/kit-details.hbs",
        "systems/avant/templates/items/lore-details.hbs",
        "systems/avant/templates/items/melee-details.hbs",
        "systems/avant/templates/items/mystify-panel.hbs",
        "systems/avant/templates/items/physical-sidebar.hbs",
        "systems/avant/templates/items/rules-panel.hbs",
        "systems/avant/templates/items/shield-details.hbs",
        "systems/avant/templates/items/spell-details.hbs",
        "systems/avant/templates/items/spell-overlay.hbs",
        "systems/avant/templates/items/treasure-details.hbs",
        "systems/avant/templates/items/weapon-details.hbs",

        // Item Sheet Partials (sub-partials)
        "systems/avant/templates/items/partials/ability-activation.hbs",
        "systems/avant/templates/items/partials/apex.hbs",
        "systems/avant/templates/items/partials/duration.hbs",
        "systems/avant/templates/items/partials/other-tags.hbs",
        "systems/avant/templates/items/partials/self-applied-effect.hbs",

        // Loot partials
        "systems/avant/templates/actors/loot/inventory.hbs",
        "systems/avant/templates/actors/loot/sidebar.hbs",

        // Vehicle partials
        "systems/avant/templates/actors/vehicle/vehicle-header.hbs",
        "systems/avant/templates/actors/vehicle/sidebar.hbs",
        "systems/avant/templates/actors/vehicle/tabs/details.hbs",
        "systems/avant/templates/actors/vehicle/tabs/actions.hbs",
        "systems/avant/templates/actors/vehicle/tabs/inventory.hbs",
        "systems/avant/templates/actors/vehicle/tabs/description.hbs",
        "systems/avant/templates/actors/vehicle/tabs/effects.hbs",

        // Compendium Browser Partials
        "systems/avant/templates/compendium-browser/settings/settings.hbs",
        "systems/avant/templates/compendium-browser/settings/pack-settings.hbs",
        "systems/avant/templates/compendium-browser/settings/source-settings.hbs",

        // Action Partial
        "systems/avant/templates/chat/action/header.hbs",
        "systems/avant/templates/system/actions/repair/chat-button-partial.hbs",
        "systems/avant/templates/system/actions/repair/repair-result-partial.hbs",
        "systems/avant/templates/system/actions/repair/item-heading-partial.hbs",

        // TokenConfig partials
        "systems/avant/templates/scene/token/partials/appearance.hbs",
        "systems/avant/templates/scene/token/partials/identity.hbs",
        "systems/avant/templates/scene/token/partials/lighting.hbs",

        // Partials for multiple document types
        "systems/avant/templates/partials/publication-data.hbs",

        // misc partials
        "systems/avant/templates/system/settings/basic-setting.hbs",
    ];

    loadTemplates(templatePaths);
}
