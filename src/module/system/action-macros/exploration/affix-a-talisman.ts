import { SimpleAction } from "@actor/actions/index.ts";

const affixATalisman = new SimpleAction({
    description: "AVANT.Actions.AffixATalisman.Description",
    name: "AVANT.Actions.AffixATalisman.Title",
    slug: "affix-a-talisman",
    traits: ["exploration", "manipulate"],
});

export { affixATalisman };
