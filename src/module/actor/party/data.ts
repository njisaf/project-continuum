import type { ActorAttributes, ActorDetails, BaseActorSourceAvant } from "@actor/data/base.ts";
import { ActorSystemModel, ActorSystemSchema } from "@actor/data/model.ts";
import type { ModelPropFromDataField, SourcePropFromDataField } from "types/foundry/common/data/fields.d.ts";
import type { PartyAvant } from "./document.ts";
import { Kingdom } from "./kingdom/model.ts";
import type { KingdomSchema } from "./kingdom/schema.ts";
import fields = foundry.data.fields;

type PartySource = BaseActorSourceAvant<"party", PartySystemSource>;

class PartySystemData extends ActorSystemModel<PartyAvant, PartySystemSchema> {
    static override defineSchema(): PartySystemSchema {
        return {
            ...super.defineSchema(),
            details: new fields.SchemaField({
                description: new fields.HTMLField({ required: true, nullable: false, blank: true, initial: "" }),
                members: new fields.ArrayField(
                    new fields.SchemaField({
                        uuid: new fields.DocumentUUIDField({ required: true, nullable: false, initial: undefined }),
                    }),
                ),
            }),
            campaign: new fields.SchemaField(Kingdom.defineSchema(), {
                required: false,
                nullable: true,
                initial: null,
            }),
        };
    }
}

interface PartySystemData
    extends ActorSystemModel<PartyAvant, PartySystemSchema>,
        ModelPropsFromSchema<PartySystemSchema> {
    attributes: PartyAttributes;
    details: PartyDetails;
}

type PartySystemSchema = ActorSystemSchema & {
    details: fields.SchemaField<{
        description: fields.HTMLField<string, string, true, false, true>;
        members: fields.ArrayField<
            fields.SchemaField<{
                uuid: fields.DocumentUUIDField<ActorUUID, true, false, false>;
            }>
        >;
    }>;
    campaign: fields.SchemaField<
        KingdomSchema,
        SourceFromSchema<KingdomSchema>,
        ModelPropsFromSchema<KingdomSchema>,
        false,
        true,
        true
    >;
};

interface PartySystemSource extends SourceFromSchema<PartySystemSchema> {
    details: PartyDetailsSource;
    attributes?: never;
    traits?: never;
    schema?: never;
}

interface PartyDetailsSource extends SourcePropFromDataField<PartySystemSchema["details"]> {
    readonly alliance?: never;
    readonly level?: never;
}

interface PartyAttributes extends Omit<ActorAttributes, "initiative" | "ac" | "hp"> {
    immunities: never[];
    weaknesses: never[];
    resistances: never[];
    speed: { total: number };
}

interface PartyDetails extends ModelPropFromDataField<PartySystemSchema["details"]>, ActorDetails {}

type PartyCampaignSource = { type: string } & Record<string, JSONValue>;

export { PartySystemData };
export type { PartyCampaignSource, PartySource };
