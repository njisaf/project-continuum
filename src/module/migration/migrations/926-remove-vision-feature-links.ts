import { ItemSourceAvant } from "@item/base/data/index.ts";
import { recursiveReplaceString } from "@util";
import { MigrationBase } from "../base.ts";

/** Remove links to removed vision features to prevent broken links **/
export class Migration926RemoveVisionFeatureLinks extends MigrationBase {
    static override version = 0.926;

    override async updateItem(source: ItemSourceAvant): Promise<void> {
        source.system.description = recursiveReplaceString(source.system.description, (s) =>
            s
                .replaceAll("@UUID[Compendium.avant.ancestryfeatures.Item.HHVQDp61ehcpdiU8]{Darkvison}", "Darkvision")
                .replaceAll(
                    "@UUID[Compendium.avant.ancestryfeatures.Item.DRtaqOHXTRtGRIUT]{Low-Light Vision}",
                    "Low-Light Vision",
                )
                .replaceAll("@UUID[Compendium.avant.ancestryfeatures.HHVQDp61ehcpdiU8]{Darkvison}", "Darkvision")
                .replaceAll(
                    "@UUID[Compendium.avant.ancestryfeatures.DRtaqOHXTRtGRIUT]{Low-Light Vision}",
                    "Low-Light Vision",
                )
                .replaceAll("@Compendium[avant.ancestryfeatures.HHVQDp61ehcpdiU8]{Darkvison}", "Darkvision")
                .replaceAll(
                    "@Compendium[avant.ancestryfeatures.DRtaqOHXTRtGRIUT]{Low-Light Vision}",
                    "Low-Light Vision",
                ),
        );
    }
}
