import { SimpleAction } from "@actor/actions/index.ts";

const sustain = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Sustain.Description",
    name: "AVANT.Actions.Sustain.Title",
    section: "specialty-basic",
    slug: "sustain",
    traits: ["concentrate"],
});

export { sustain };
