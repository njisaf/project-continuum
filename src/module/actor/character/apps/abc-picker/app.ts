import type { CharacterAvant } from "@actor";
import type { ABCItemAvant, DeityAvant, HeritageAvant, ItemAvant } from "@item";
import type { ItemType } from "@item/base/data/index.ts";
import { RARITIES, Rarity } from "@module/data.ts";
import { SvelteApplicationMixin, type SvelteApplicationRenderContext } from "@module/sheet/mixin.svelte.ts";
import { sluggify } from "@util";
import { UUIDUtils } from "@util/uuid.ts";
import * as R from "remeda";
import type { ApplicationConfiguration } from "types/foundry/client-esm/applications/_types.d.ts";
import type { ApplicationV2 } from "types/foundry/client-esm/applications/api/module.d.ts";
import Root from "./app.svelte";

type AhBCDType = Extract<ItemType, "ancestry" | "heritage" | "background" | "class" | "deity"> | "culture" | "vocation";

interface ABCPickerConfiguration extends ApplicationConfiguration {
    actor: CharacterAvant;
    itemType: AhBCDType;
}

interface ABCItemRef {
    name: string;
    originalName?: string;
    img: ImageFilePath;
    uuid: ItemUUID;
    rarity?: { slug: Rarity; label: string };
    source: {
        name: string;
        /** Whether the source comes from an item's publication data or is simply the providing module */
        publication: boolean;
    };
    hidden: boolean;
}

interface ABCPickerContext extends SvelteApplicationRenderContext {
    actor: CharacterAvant;
    foundryApp: ABCPicker;
    state: { prompt: string; itemType: AhBCDType; items: ABCItemRef[] };
}

/** A `Compendium`-like application for presenting A(H)BCD options for a character */
class ABCPicker extends SvelteApplicationMixin<
    AbstractConstructorOf<ApplicationV2> & { DEFAULT_OPTIONS: DeepPartial<ABCPickerConfiguration> }
>(foundry.applications.api.ApplicationV2) {
    static override DEFAULT_OPTIONS: DeepPartial<ABCPickerConfiguration> = {
        id: "{id}",
        classes: ["abc-picker"],
        position: { width: 350, height: 650 },
        window: { icon: "fa-solid fa-book-atlas", contentClasses: ["standard-form", "compact"] },
    };

    declare options: ABCPickerConfiguration;

    protected root = Root;

    override get title(): string {
        const type = game.i18n.localize(`TYPES.Item.${this.options.itemType}`);
        return game.i18n.format("AVANT.Actor.Character.ABCPicker.Title", { type });
    }

    protected override _initializeApplicationOptions(options: Partial<ABCPickerConfiguration>): ABCPickerConfiguration {
        const initialized = super._initializeApplicationOptions(options) as ABCPickerConfiguration;
        
        // Map culture to heritage and vocation to background for the icon
        const iconType = this.mapItemTypeForSystem(initialized.itemType);
        initialized.window.icon = `fa-solid ${CONFIG.Item.typeIcons[iconType]}`;
        initialized.uniqueId = `abc-picker-${initialized.itemType}-${initialized.actor.uuid}`;
        return initialized;
    }

    /** Map our custom UI types to the system item types */
    mapItemTypeForSystem(itemType: AhBCDType): Extract<ItemType, "ancestry" | "heritage" | "background" | "class" | "deity"> {
        if (itemType === "culture") return "heritage";
        if (itemType === "vocation") return "background";
        return itemType as Extract<ItemType, "ancestry" | "heritage" | "background" | "class" | "deity">;
    }

    /** Gather all items of the request type from the world and across all item compendiums. */
    async gatherItems(): Promise<ABCItemRef[]> {
        const { actor, itemType } = this.options;
        
        // Map our custom UI types to the system item types
        const systemItemType = this.mapItemTypeForSystem(itemType);
        
        const worldItems = game.items.filter((i) => i.type === systemItemType && i.testUserPermission(game.user, "LIMITED"));
        const packItems = await UUIDUtils.fromUUIDs(
            game.packs
                .filter((p) => p.documentName === "Item" && p.testUserPermission(game.user, "LIMITED"))
                .flatMap((p) => p.index.filter((e) => e.type === systemItemType).map((e) => e.uuid as CompendiumItemUUID)),
        );

        const items = [...worldItems, ...packItems]
            .filter((item): item is ABCItemAvant<null> | HeritageAvant<null> | DeityAvant<null> => {
                if (item.type !== systemItemType || item.parent) return false;
                if (item.pack?.startsWith("avant-animal-companions.")) return false;
                if (item.system.traits.value?.includes("eidolon")) return false;
                if (item.isOfType("heritage")) {
                    const ancestrySlug = actor.ancestry ? (actor.ancestry.slug ?? sluggify(actor.ancestry.name)) : null;
                    return item.system.ancestry?.slug === ancestrySlug || item.system.ancestry === null;
                }
                return true;
            })
            .sort((a, b) => a.name.localeCompare(b.name))
            .sort(
                (a: ItemAvant<null> & { rarity?: Rarity }, b: ItemAvant<null> & { rarity?: Rarity }) =>
                    RARITIES.indexOf(a.rarity ?? "common") - RARITIES.indexOf(b.rarity ?? "common"),
            );
        if (items.every((i): i is HeritageAvant<null> => i.isOfType("heritage"))) {
            items.sort((a, b) => (a.isVersatile === b.isVersatile ? 0 : a.isVersatile ? 1 : -1));
        }

        /** Resolve a "source", preferring publication title if set and resorting to fallbacks. */
        const resolveSource = (item: ItemAvant): { name: string; publication: boolean } => {
            const publication = item.system.publication.title.trim();
            if (publication) return { name: publication, publication: true };
            if (item.uuid.startsWith("Item.")) return { name: game.world.title, publication: false };
            const compendiumPack = game.packs.get(item.pack ?? "");
            const module = game.modules.get(compendiumPack?.metadata.packageName ?? "");
            const name = module?.title ?? compendiumPack?.title ?? "???";
            return { name, publication: false };
        };

        const rarities: Record<string, string> = {
            uncommon: game.i18n.localize(CONFIG.AVANT.rarityTraits.uncommon),
            rare: game.i18n.localize(CONFIG.AVANT.rarityTraits.rare),
            unique: game.i18n.localize(CONFIG.AVANT.rarityTraits.unique),
        };

        return items.map((item) => {
            const ref: ABCItemRef = {
                ...R.pick(item, ["name", "img", "uuid"]),
                source: resolveSource(item),
                hidden: false,
            };
            if ("rarity" in item && item.rarity !== "common") {
                ref.rarity = { slug: item.rarity, label: rarities[item.rarity] };
            }
            if (typeof item.flags.babele?.originalName === "string") {
                // The Babele module stores the pre-translated name in a flag: use for searching.
                ref.originalName = item.flags.babele.originalName;
            }
            return ref;
        });
    }

    protected override async _prepareContext(): Promise<ABCPickerContext> {
        const itemType = this.options.itemType;
        return {
            actor: this.options.actor,
            foundryApp: this,
            state: {
                prompt: game.i18n.localize(`AVANT.Actor.Character.ABCPicker.Prompt.${itemType}`),
                itemType,
                items: await this.gatherItems(),
            },
        };
    }
}

export { ABCPicker, type ABCPickerContext };
