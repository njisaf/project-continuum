import { CheckRoll } from "@system/check/index.ts";
import { createHTMLElement, fontAwesomeIcon } from "@util";
import type { ChatMessageAvant } from "../document.ts";

/** Add a button to set a check roll as the roller's initiative */
export const SetAsInitiative = {
    listen: (message: ChatMessageAvant, li: HTMLElement): void => {
        if ((message.blind || !message.isAuthor) && !game.user.isGM) return;

        const token = message.token;
        const hasCheckRoll = message.rolls.some(
            (r) => r instanceof CheckRoll && ["skill-check", "perception-check"].includes(r.options.type ?? ""),
        );
        if (!(hasCheckRoll && token?.actor)) {
            return;
        }

        const button = createHTMLElement("button", {
            classes: ["set-as-initiative"],
            dataset: {
                action: "set-as-initiative",
                tooltip: game.i18n.format("AVANT.Check.SetAsInitiative", { actor: token.name }),
            },
            children: [fontAwesomeIcon("swords")],
        });
        button.type = "button";
        const selector = message.isReroll ? ".reroll-second .dice-total" : ".dice-total";
        li.querySelector(selector)?.appendChild(button);
    },
};
