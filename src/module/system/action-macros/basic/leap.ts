import { SimpleAction } from "@actor/actions/index.ts";

const leap = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Leap.Description",
    name: "AVANT.Actions.Leap.Title",
    section: "basic",
    slug: "leap",
    traits: ["move"],
});

export { leap };
