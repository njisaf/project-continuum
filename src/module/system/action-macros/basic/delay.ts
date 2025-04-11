import { SimpleAction } from "@actor/actions/index.ts";

const delay = new SimpleAction({
    cost: "free",
    description: "AVANT.Actions.Delay.Description",
    name: "AVANT.Actions.Delay.Title",
    section: "basic",
    slug: "delay",
});

export { delay };
