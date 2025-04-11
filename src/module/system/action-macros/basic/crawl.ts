import { SimpleAction } from "@actor/actions/index.ts";

const crawl = new SimpleAction({
    cost: 1,
    description: "AVANT.Actions.Crawl.Description",
    name: "AVANT.Actions.Crawl.Title",
    section: "basic",
    slug: "crawl",
    traits: ["move"],
});

export { crawl };
