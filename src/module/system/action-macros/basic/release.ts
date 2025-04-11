import { SimpleAction } from "@actor/actions/index.ts";

const release = new SimpleAction({
    cost: "free",
    description: "AVANT.Actions.Release.Description",
    name: "AVANT.Actions.Release.Title",
    section: "basic",
    slug: "release",
    traits: ["manipulate"],
});

export { release };
