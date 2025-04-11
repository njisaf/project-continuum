import type { ActorAvant } from "@actor";
import { RawItemChatData } from "@item/base/data/index.ts";
import { PhysicalItemAvant } from "@item/physical/index.ts";
import { objectHasKey } from "@util";
import { EquipmentSource, EquipmentSystemData, EquipmentTrait } from "./data.ts";

class EquipmentAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    static override get validTraits(): Record<EquipmentTrait, string> {
        return CONFIG.AVANT.equipmentTraits;
    }

    override async getChatData(
        this: EquipmentAvant<ActorAvant>,
        htmlOptions: EnrichmentOptions = {},
    ): Promise<RawItemChatData> {
        return this.processChatData(htmlOptions, {
            ...(await super.getChatData()),
            traits: this.traitChatData(CONFIG.AVANT.equipmentTraits),
        });
    }

    override generateUnidentifiedName({ typeOnly = false }: { typeOnly?: boolean } = { typeOnly: false }): string {
        const identificationConfig = CONFIG.AVANT.identification;
        const slotType = /book\b/.test(this.slug ?? "")
            ? "Book"
            : /\bring\b/.test(this.slug ?? "")
              ? "Ring"
              : (this.system.usage.value?.replace(/^worn/, "").capitalize() ?? "");

        const itemType = objectHasKey(identificationConfig.UnidentifiedType, slotType)
            ? game.i18n.localize(identificationConfig.UnidentifiedType[slotType])
            : game.i18n.localize(identificationConfig.UnidentifiedType.Object);

        if (typeOnly) return itemType;

        return game.i18n.format(identificationConfig.UnidentifiedItem, { item: itemType });
    }
}

interface EquipmentAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    readonly _source: EquipmentSource;
    system: EquipmentSystemData;

    get traits(): Set<EquipmentTrait>;
}

export { EquipmentAvant };
