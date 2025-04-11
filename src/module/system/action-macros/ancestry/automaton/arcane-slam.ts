import { CreatureAvant } from "@actor";
import { ModifierAvant } from "@actor/modifiers.ts";
import { RollNoteAvant } from "@module/notes.ts";
import { Predicate } from "@system/predication.ts";
import { ActionMacroHelpers, SkillActionOptions } from "../../index.ts";

export function arcaneSlam(options: SkillActionOptions): void {
    const { actor: target, token } = ActionMacroHelpers.target();
    const slug = options?.skill ?? "acrobatics";
    const rollOptions = ["action:arcane-slam"];
    ActionMacroHelpers.simpleRollActionCheck({
        actors: options.actors,
        actionGlyph: options.glyph ?? "D",
        title: "AVANT.Actions.ArcaneSlam.Title",
        checkContext: (opts) => {
            const modifiers = options.modifiers?.length ? [...options.modifiers] : [];
            if (opts.actor instanceof CreatureAvant && opts.target instanceof CreatureAvant) {
                const attackerSize = opts.actor.system.traits.size;
                const targetSize = opts.target.system.traits.size;
                const sizeDifference = attackerSize.difference(targetSize);
                const sizeModifier = new ModifierAvant(
                    "AVANT.Actions.ArcaneSlam.Modifier.SizeDifference",
                    Math.clamp(2 * sizeDifference, -4, 4),
                    "circumstance",
                );
                if (sizeModifier.modifier) {
                    modifiers.push(sizeModifier);
                }
            }
            return ActionMacroHelpers.defaultCheckContext(opts, { modifiers, rollOptions, slug });
        },
        traits: ["automaton"],
        event: options.event,
        callback: options.callback,
        difficultyClass: options.difficultyClass ?? "fortitude",
        extraNotes: (selector: string) => {
            const notes = [
                ActionMacroHelpers.note(selector, "AVANT.Actions.ArcaneSlam", "criticalSuccess"),
                ActionMacroHelpers.note(selector, "AVANT.Actions.ArcaneSlam", "success"),
                ActionMacroHelpers.note(selector, "AVANT.Actions.ArcaneSlam", "failure"),
                ActionMacroHelpers.note(selector, "AVANT.Actions.ArcaneSlam", "criticalFailure"),
            ];
            if (!target) {
                const translated = game.i18n.localize("AVANT.Actions.ArcaneSlam.Notes.NoTarget");
                notes.unshift(
                    new RollNoteAvant({
                        selector,
                        text: `<p class="compact-text">${translated}</p>`,
                        predicate: new Predicate(),
                        outcome: [],
                    }),
                );
            }
            return notes;
        },
        target: () => (target && token ? { actor: target, token } : null),
    }).catch((error: Error) => {
        ui.notifications.error(error.message);
        throw error;
    });
}
