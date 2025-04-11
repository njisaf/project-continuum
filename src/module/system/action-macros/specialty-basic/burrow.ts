import { SimpleAction } from "@actor/actions/index.ts";

const burrow = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Burrow.Description",
    name: "AVANT.Actions.Burrow.Title",
    section: "specialty-basic",
    slug: "burrow",
    traits: ["move"],
});

export { burrow };
