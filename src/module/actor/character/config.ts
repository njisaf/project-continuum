import { CreatureConfig, CreatureConfigData } from "@actor/creature/config.ts";
import { CharacterAvant } from "./document.ts";

export class CharacterConfig extends CreatureConfig<CharacterAvant> {
    override async getData(options: Partial<DocumentSheetOptions> = {}): Promise<PCConfigData> {
        const { showBasicUnarmed } = this.actor.flags.avant;
        return {
            ...(await super.getData(options)),
            showBasicUnarmed,
        };
    }
}

interface PCConfigData extends CreatureConfigData<CharacterAvant> {
    showBasicUnarmed: boolean;
}
