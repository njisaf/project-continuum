import { CompendiumPack } from "./lib/compendium-pack.ts";

CompendiumPack.loadJSON("packs/actions");
// Removed deleted packs
// CompendiumPack.loadJSON("packs/adventure-specific-actions");
// CompendiumPack.loadJSON("packs/bestiary-ability-glossary-srd");
// CompendiumPack.loadJSON("packs/spells");
const conditions = [
    CompendiumPack.loadJSON("packs/conditions").finalizeAll(),
    // Removed deleted packs
    // CompendiumPack.loadJSON("packs/campaign-effects")
    //     .finalizeAll()
    //     .filter((e) => "type" in e && e.type === "condition"),
].flat();
console.log(JSON.stringify(conditions));
