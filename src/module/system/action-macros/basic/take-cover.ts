import { SimpleAction } from "@actor/actions/index.ts";

const takeCover = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.TakeCover.Description",
    effect: "Compendium.avant.other-effects.I9lfZUiCwMiGogVi", // Effect: Cover
    img: "systems/avant/icons/conditions-2/status_acup.webp",
    name: "AVANT.Actions.TakeCover.Title",
    section: "basic",
    slug: "take-cover",
});

export { takeCover };
