import { SimpleAction } from "@actor/actions/index.ts";

const stride = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Stride.Description",
    name: "AVANT.Actions.Stride.Title",
    section: "basic",
    slug: "stride",
    traits: ["move"],
});

export { stride };
