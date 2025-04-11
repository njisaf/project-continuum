import type { ActorAvant } from "@actor";
import { createHTMLElement, setHasElement } from "@util";
import { processSanctification } from "./ability/helpers.ts";
import type { ItemSourceAvant, ItemType } from "./base/data/index.ts";
import type { ItemAvant } from "./base/document.ts";
import type { PhysicalItemAvant } from "./physical/document.ts";
import { PHYSICAL_ITEM_TYPES } from "./physical/values.ts";
import type { ItemInstances } from "./types.ts";

type ItemOrSource = PreCreate<ItemSourceAvant> | ItemAvant;

/** Determine in a type-safe way whether an `ItemAvant` or `ItemSourceAvant` is among certain types */
function itemIsOfType<TParent extends ActorAvant | null, TType extends ItemType>(
    item: ItemOrSource,
    ...types: TType[]
): item is ItemInstances<TParent>[TType] | ItemInstances<TParent>[TType]["_source"];
function itemIsOfType<TParent extends ActorAvant | null, TType extends "physical" | ItemType>(
    item: ItemOrSource,
    ...types: TType[]
): item is TType extends "physical"
    ? PhysicalItemAvant<TParent> | PhysicalItemAvant<TParent>["_source"]
    : TType extends ItemType
      ? ItemInstances<TParent>[TType] | ItemInstances<TParent>[TType]["_source"]
      : never;
function itemIsOfType<TParent extends ActorAvant | null>(
    item: ItemOrSource,
    type: "physical",
): item is PhysicalItemAvant<TParent> | PhysicalItemAvant["_source"];
function itemIsOfType(item: ItemOrSource, ...types: string[]): boolean {
    return (
        typeof item.name === "string" &&
        types.some((t) => (t === "physical" ? setHasElement(PHYSICAL_ITEM_TYPES, item.type) : item.type === t))
    );
}

/** Create a "reduced" item name; that is, one without an "Effect:" or similar prefix */
function reduceItemName(label: string): string {
    return label.includes(":") ? label.replace(/^[^:]+:\s*|\s*\([^)]+\)$/g, "") : label;
}

/**
 * Performs late prep tasks on an item that doesn't exist in the actor, such as a cloned one.
 * If the item isn't embedded, nothing happens.
 */
function performLatePreparation(item: ItemAvant): void {
    const actor = item.actor;
    if (!actor) return;

    for (const alteration of actor.synthetics.itemAlterations.filter((a) => !a.isLazy)) {
        alteration.applyAlteration({ singleItem: item as ItemAvant<ActorAvant> });
    }

    if (item.isOfType("spell", "feat", "action")) {
        processSanctification(item);
    }
}

let mdConverter: showdown.Converter | null = null;

function markdownToHTML(markdown: string): string {
    const converter = (mdConverter ??= new showdown.Converter());
    const htmlStripped = createHTMLElement("div", { innerHTML: game.i18n.localize(markdown).trim() }).innerText;
    // Prevent markdown converter from treating Foundry content links as markdown links
    const withSubbedBrackets = htmlStripped.replaceAll("[", "⟦").replaceAll("]", "⟧");
    const stringyHTML = converter
        .makeHtml(withSubbedBrackets)
        .replace(/<\/?p[^>]*>/g, "")
        .replaceAll("⟦", "[")
        .replaceAll("⟧", "]");

    return TextEditor.truncateHTML(createHTMLElement("div", { innerHTML: stringyHTML })).innerHTML.trim();
}

export { itemIsOfType, markdownToHTML, performLatePreparation, reduceItemName };
