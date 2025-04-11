import { SimpleAction } from "@actor/actions/index.ts";

const dismiss = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Dismiss.Description",
    name: "AVANT.Actions.Dismiss.Title",
    section: "specialty-basic",
    slug: "dismiss",
    traits: ["concentrate"],
});

export { dismiss };
