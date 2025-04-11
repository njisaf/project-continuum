import type { ActorAvant } from "@actor";
import type { MigrationDataField } from "@module/data.ts";
import { PublicationField } from "@module/model.ts";
import type { RuleElementSource } from "@module/rules/index.ts";
import { SlugField } from "@system/schema-data-fields.ts";
import type { ItemAvant } from "../document.ts";
import type { ItemDescriptionData } from "./system.ts";
import fields = foundry.data.fields;

abstract class ItemSystemModel<TParent extends ItemAvant, TSchema extends ItemSystemSchema> extends foundry.abstract
    .TypeDataModel<TParent, TSchema> {
    static override LOCALIZATION_PREFIXES = ["AVANT.Item"];

    static override defineSchema(): ItemSystemSchema {
        const anyStringField = (): fields.StringField<string, string, true, false, true> =>
            new fields.StringField({ required: true, nullable: false, initial: "" });

        return {
            description: new fields.SchemaField({
                value: anyStringField(),
                gm: anyStringField(),
            }),
            publication: new PublicationField(),
            rules: new fields.ArrayField(new fields.ObjectField({ required: true, nullable: false })),
            slug: new SlugField({ required: true, nullable: true, initial: null }),
            traits: new fields.SchemaField({
                otherTags: new fields.ArrayField(
                    new SlugField({ required: true, nullable: false, initial: undefined }),
                ),
            }),
            _migration: new fields.SchemaField({
                version: new fields.NumberField({
                    required: true,
                    nullable: true,
                    positive: true,
                    initial: null,
                }),
                previous: new fields.SchemaField(
                    {
                        foundry: new fields.StringField({ required: true, nullable: true, initial: null }),
                        system: new fields.StringField({ required: true, nullable: true, initial: null }),
                        schema: new fields.NumberField({
                            required: true,
                            nullable: true,
                            positive: true,
                            initial: null,
                        }),
                    },
                    { required: true, nullable: true, initial: null },
                ),
            }),
        };
    }

    get actor(): ActorAvant | null {
        return this.parent.actor;
    }
}

interface ItemSystemModel<TParent extends ItemAvant, TSchema extends ItemSystemSchema>
    extends foundry.abstract.TypeDataModel<TParent, TSchema> {
    description: ItemDescriptionData;
}

type ItemSystemSchema = {
    description: fields.SchemaField<{
        value: fields.StringField<string, string, true, false, true>;
        gm: fields.StringField<string, string, true, false, true>;
    }>;
    publication: fields.SchemaField<{
        title: fields.StringField<string, string, true, false, true>;
        authors: fields.StringField<string, string, true, false, true>;
        license: fields.StringField<"OGL" | "ORC", "OGL" | "ORC", true, false, true>;
        remaster: fields.BooleanField;
    }>;
    rules: fields.ArrayField<fields.ObjectField<RuleElementSource, RuleElementSource, true, false, false>>;
    slug: SlugField<true, true, true>;
    traits: fields.SchemaField<{
        otherTags: fields.ArrayField<SlugField<true, false, false>>;
    }>;
    _migration: MigrationDataField;
};

export { ItemSystemModel, type ItemSystemSchema };
