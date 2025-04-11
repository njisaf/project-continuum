import { SimpleAction } from "@actor/actions/index.ts";

const interact = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Interact.Description",
    name: "AVANT.Actions.Interact.Title",
    section: "basic",
    slug: "interact",
    traits: ["manipulate"],
});

export { interact };
