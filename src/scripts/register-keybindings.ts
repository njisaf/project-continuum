import type { PartyAvant } from "@actor";
import { RulerAvant } from "@module/canvas/ruler.ts";

export function registerKeybindings(): void {
    game.keybindings.register("avant", "cycle-token-stack", {
        name: "AVANT.Keybinding.CycleTokenStack.Label",
        hint: "AVANT.Keybinding.CycleTokenStack.Hint",
        editable: [{ key: "KeyZ", modifiers: [] }],
        onUp: (): boolean => canvas.tokens.cycleStack(),
    });

    game.keybindings.register("avant", "toggle-party-sheet", {
        name: "AVANT.Keybinding.TogglePartySheet.Label",
        hint: "AVANT.Keybinding.TogglePartySheet.Hint",
        editable: [{ key: "KeyP", modifiers: [] }],
        onDown: (): boolean | null => {
            const party = ((): PartyAvant | null => {
                if (game.user.isGM) {
                    const token =
                        canvas.ready && canvas.tokens.controlled.length === 1 ? canvas.tokens.controlled[0] : null;
                    return token?.actor?.isOfType("party") ? token.actor : game.actors.party;
                } else if (game.user.character?.isOfType("character")) {
                    const pcParties = Array.from(game.user.character.parties);
                    return pcParties.find((p) => p.active) ?? pcParties.at(0) ?? null;
                }
                return null;
            })();
            if (!party) return false;

            const { sheet } = party;
            if (sheet.rendered) {
                if (sheet._minimized) {
                    sheet.maximize();
                } else {
                    sheet.close();
                }
            } else {
                sheet.render(true);
            }

            return true;
        },
    });

    if (!RulerAvant.hasModuleConflict) {
        game.keybindings.register("avant", "placeWaypoint", {
            name: "AVANT.Keybinding.PlaceWaypoint.Label",
            hint: "AVANT.Keybinding.PlaceWaypoint.Hint",
            editable: [{ key: "KeyX", modifiers: [] }],
            onUp: (): boolean | null => {
                if (canvas.ready && canvas.controls.ruler.isMeasuring && game.avant.settings.dragMeasurement) {
                    canvas.controls.ruler.saveWaypoint();
                    return true;
                } else {
                    return false;
                }
            },
        });
    }

    // Defer to the GM Vision module if enabled
    if (!game.modules.get("gm-vision")?.active) {
        game.keybindings.register("avant", "gm-vision", {
            name: "AVANT.Keybinding.GMVision.Label",
            hint: "AVANT.Keybinding.GMVision.Hint",
            editable: [{ key: "KeyG", modifiers: ["Control"] }],
            restricted: true,
            onDown: (): boolean => {
                if (ui.controls.control?.name === "lighting") {
                    // Ensure the toggle in lighting controls continues to reflect the current status
                    const toggle = ui.controls.control.tools.find((t) => t.name === "gm-vision");
                    toggle?.onClick?.(); // Does the same as below
                } else {
                    game.settings.set("avant", "gmVision", !game.settings.get("avant", "gmVision"));
                }
                return true;
            },
        });
    }
}
