import type { ActorAvant, CharacterAvant } from "@actor";

function loreSkillsFromActors(actors: ActorAvant | ActorAvant[]): Record<string, string> {
    const actorsArray = Array.isArray(actors) ? actors : [actors];
    const characters = actorsArray.filter((a): a is CharacterAvant => a?.type === "character");
    return Object.fromEntries(
        characters
            .flatMap((m) => Object.values(m.skills))
            .filter((s) => s.lore)
            .map((s) => [s.slug, s.label]),
    );
}

async function getActions(): Promise<Record<string, string>> {
    const indexFields = ["system.slug"];
    const pack = game.packs.get("avant.actionsavant");
    if (pack) {
        const index = await pack.getIndex({ fields: indexFields });
        const actions = index.map((a) => [a.system.slug, a.name]);
        return Object.fromEntries(actions);
    } else {
        return {};
    }
}

export { getActions, loreSkillsFromActors };
