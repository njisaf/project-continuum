import { SimpleAction } from "@actor/actions/index.ts";

const step = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Step.Description",
    name: "AVANT.Actions.Step.Title",
    section: "basic",
    slug: "step",
    traits: ["move"],
});

export { step };
