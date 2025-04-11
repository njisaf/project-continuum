import { SimpleAction } from "@actor/actions/index.ts";

const mount = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Mount.Description",
    name: "AVANT.Actions.Mount.Title",
    section: "specialty-basic",
    slug: "mount",
    traits: ["move"],
});

export { mount };
