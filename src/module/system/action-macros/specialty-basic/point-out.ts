import { SimpleAction } from "@actor/actions/index.ts";

const pointOut = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.PointOut.Description",
    name: "AVANT.Actions.PointOut.Title",
    section: "specialty-basic",
    slug: "point-out",
    traits: ["auditory", "manipulate", "visual"],
});

export { pointOut };
