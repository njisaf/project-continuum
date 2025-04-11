import { resetActors } from "@actor/helpers.ts";
import type { RegionEventType } from "types/foundry/client-esm/data/region-behaviors/base.d.ts";
import type { SetField, StringField } from "types/foundry/common/data/fields.d.ts";
import { RegionBehaviorAvant } from "./document.ts";
import { RegionEventAvant } from "./types.ts";

class EnvironmentBehaviorType extends foundry.data.regionBehaviors.RegionBehaviorType<
    EnvironmentTypeSchema,
    RegionBehaviorAvant | null
> {
    override events = new Set<RegionEventType>(["tokenEnter", "tokenExit"]);

    static override defineSchema(): EnvironmentTypeSchema {
        const fields = foundry.data.fields;
        return {
            environmentTypes: new fields.SetField(
                new fields.StringField({
                    blank: true,
                    choices: () => CONFIG.AVANT.environmentTypes,
                }),
                { label: "AVANT.Region.Environment.Type.Label", hint: "AVANT.Region.Environment.Type.Hint" },
            ),
            mode: new fields.StringField({
                blank: false,
                choices: () => ({
                    add: "AVANT.Region.Environment.Mode.Add.Label",
                    override: "AVANT.Region.Environment.Mode.Override.Label",
                    remove: "AVANT.Region.Environment.Mode.Remove.Label",
                }),
                initial: "add",
                label: "AVANT.Region.Environment.Mode.Label",
                hint: "AVANT.Region.Environment.Mode.Hint",
            }),
        };
    }

    protected override async _handleRegionEvent(event: RegionEventAvant): Promise<void> {
        if (event.name === "tokenEnter" || event.name === "tokenExit") {
            if (event.data.token.actor) resetActors([event.data.token.actor], { tokens: true });
        }
    }
}

interface EnvironmentBehaviorType
    extends foundry.data.regionBehaviors.RegionBehaviorType<EnvironmentTypeSchema, RegionBehaviorAvant | null>,
        ModelPropsFromSchema<EnvironmentTypeSchema> {}

type EnvironmentTypeSchema = {
    environmentTypes: SetField<StringField>;
    mode: StringField<"add" | "remove" | "override">;
};

type EnvironmentTypeData = ModelPropsFromSchema<EnvironmentTypeSchema>;
type EnvironmentTypeSource = SourceFromSchema<EnvironmentTypeSchema>;

export { EnvironmentBehaviorType };
export type { EnvironmentTypeData, EnvironmentTypeSource };
