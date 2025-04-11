import { SimpleAction } from "@actor/actions/index.ts";

const ready = new SimpleAction({
    cost: 2,
    description: "AVANT.Actions.Ready.Description",
    name: "AVANT.Actions.Ready.Title",
    section: "basic",
    slug: "ready",
    traits: ["concentrate"],
});

export { ready };
