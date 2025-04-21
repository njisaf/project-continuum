import { ActorSourceAvant } from "@actor/data/index.ts";
import { ItemSourceAvant } from "@item/base/data/index.ts";
import { MigrationBase } from "../base.ts";

/**
 * Migration to add the new character attributes (Might, Grace, Intellect, Focus) to existing actor data
 * and ensure ability modifiers are properly synchronized with these new attributes.
 * @category Migration
 */
export class Migration790AddCharacterAttributes extends MigrationBase {
    static override version = 0.790;

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        if (source.type !== "character") return;

        // Add the new attributes with default value of 0
        console.log(`Migration: Adding custom attributes to character "${source.name}"`);
        
        if (!source.system.attributes) {
            console.log("Character is missing attributes completely, skipping migration");
            return;
        }
        
        // Add default values for missing attributes
        source.system.attributes.might = source.system.attributes.might ?? { value: 0 };
        source.system.attributes.grace = source.system.attributes.grace ?? { value: 0 };
        source.system.attributes.intellect = source.system.attributes.intellect ?? { value: 0 };
        source.system.attributes.focus = source.system.attributes.focus ?? { value: 0 };
        
        // Ensure ability modifiers are synchronized with the new attributes
        if (source.system.abilities?.mgt) {
            source.system.abilities.mgt.mod = source.system.attributes.might.value;
        }
        
        if (source.system.abilities?.gra) {
            source.system.abilities.gra.mod = source.system.attributes.grace.value;
        }
        
        if (source.system.abilities?.intl) {
            source.system.abilities.intl.mod = source.system.attributes.intellect.value;
        }
        
        if (source.system.abilities?.foc) {
            source.system.abilities.foc.mod = source.system.attributes.focus.value;
        }
        
        console.log("Migration complete for character:", source.name);
    }

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        console.log("Migration: Updating item:", source.name);
        // No item updates required
    }
} 