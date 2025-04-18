import type { ActorSourceAvant } from "@actor/data/index.ts";
import { MigrationBase } from "../base.ts";

/** Add ancestryText, cultureText, and vocationText fields to character actors */
export class Migration936AddCharacterTextFields extends MigrationBase {
    static override version = 0.936;

    override async updateActor(source: ActorSourceAvant): Promise<void> {
        if (source.type !== "character") return;

        // Initialize the text fields if they don't exist
        const details = source.system.details;
        
        if (!details.ancestryText) {
            details.ancestryText = { value: "" };
            console.log("Avant | Migration 936 | Added ancestryText field to character", source.name);
        }
        
        if (!details.cultureText) {
            details.cultureText = { value: "" };
            console.log("Avant | Migration 936 | Added cultureText field to character", source.name);
        }
        
        if (!details.vocationText) {
            details.vocationText = { value: "" };
            console.log("Avant | Migration 936 | Added vocationText field to character", source.name);
        }
    }
} 