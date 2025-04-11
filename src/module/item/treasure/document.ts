import type { ActorAvant } from "@actor";
import type { RawItemChatData } from "@item/base/data/index.ts";
import { PhysicalItemAvant } from "@item/physical/index.ts";
import type { CoinDenomination } from "@item/physical/types.ts";
import { DENOMINATIONS } from "@item/physical/values.ts";
import type { TreasureSource, TreasureSystemData } from "./data.ts";

class TreasureAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    get isCoinage(): boolean {
        return this.system.stackGroup === "coins";
    }

    get denomination(): CoinDenomination | null {
        if (!this.isCoinage) return null;
        const options = DENOMINATIONS.filter((denomination) => !!this.price.value[denomination]);
        return options.length === 1 ? options[0] : null;
    }

    /** Set non-coinage treasure price from its numeric value and denomination */
    override prepareBaseData(): void {
        super.prepareBaseData();
        this.system.price.sizeSensitive = false;
        if (this.isCoinage) this.system.size = "med";
    }

    override async getChatData(
        this: TreasureAvant<ActorAvant>,
        htmlOptions: EnrichmentOptions = {},
    ): Promise<RawItemChatData> {
        const systemData = this.system;
        const traits = this.traitChatData({});

        return this.processChatData(htmlOptions, { ...systemData, traits });
    }
}

interface TreasureAvant<TParent extends ActorAvant | null = ActorAvant | null> extends PhysicalItemAvant<TParent> {
    readonly _source: TreasureSource;
    system: TreasureSystemData;
}

export { TreasureAvant };
