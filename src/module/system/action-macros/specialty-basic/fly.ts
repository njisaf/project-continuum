import { SimpleAction } from "@actor/actions/index.ts";

const fly = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Fly.Description",
    name: "AVANT.Actions.Fly.Title",
    section: "specialty-basic",
    slug: "fly",
    traits: ["move"],
});

export { fly };
