import { SingleCheckAction } from "@actor/actions/index.ts";

const arrestAFall = new SingleCheckAction({
    cost: "reaction",
    description: "AVANT.Actions.ArrestAFall.Description",
    difficultyClass: { value: 15 },
    name: "AVANT.Actions.ArrestAFall.Title",
    notes: [{ outcome: ["success", "criticalSuccess"], text: "AVANT.Actions.ArrestAFall.Notes.success" }],
    rollOptions: ["action:arrest-a-fall"],
    section: "specialty-basic",
    slug: "arrest-a-fall",
    statistic: ["reflex", "acrobatics"],
});

export { arrestAFall };
