import { ZeroToTwo } from "@module/data.ts";
import { RegionBehaviorAvant } from "./document.ts";
import fields = foundry.data.fields;

class EnvironmentFeatureBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType<
    EnvironmentFeatureTypeSchema,
    RegionBehaviorAvant | null
> {
    static override defineSchema(): EnvironmentFeatureTypeSchema {
        const fields = foundry.data.fields;
        const locPathPrefix = "AVANT.Region.EnvironmentFeature";
        return {
            terrain: new fields.SchemaField(
                {
                    difficult: new fields.NumberField({
                        required: true,
                        nullable: false,
                        choices: {
                            0: `${locPathPrefix}.Terrain.Difficult.None`,
                            1: `${locPathPrefix}.Terrain.Difficult.Difficult`,
                            2: `${locPathPrefix}.Terrain.Difficult.Greater`,
                        },
                        initial: 0,
                        label: `${locPathPrefix}.Terrain.Difficult.Label`,
                    }),
                },
                { label: `${locPathPrefix}.Terrain.Label` },
            ),
        };
    }
}

interface EnvironmentFeatureBehaviorType
    extends foundry.data.regionBehaviors.RegionBehaviorType<EnvironmentFeatureTypeSchema, RegionBehaviorAvant | null>,
        ModelPropsFromSchema<EnvironmentFeatureTypeSchema> {}

type EnvironmentFeatureTypeSchema = {
    terrain: fields.SchemaField<{
        difficult: fields.NumberField<ZeroToTwo, ZeroToTwo, true, false, true>;
    }>;
};

export { EnvironmentFeatureBehaviorType };
