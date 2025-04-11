import type { TokenAvant } from "@module/canvas/index.ts";
import type { SceneAvant, TokenDocumentAvant } from "@scene";
import { PartyClownCar } from "@scene/token-document/clown-car.ts";
import { createHTMLElement, htmlQuery } from "@util";

export class RenderTokenHUD {
    static listen(): void {
        Hooks.on("renderTokenHUD", (_app, $html, data) => {
            const html = $html[0];
            game.avant.StatusEffects.onRenderTokenHUD(html, data);

            const token = canvas.scene?.tokens.get(data._id ?? "")?.object;
            this.addClownCarButton(html, token);

            // Remove conditions hud from army. Once Foundry supports replacing these by actor type we'll add them back in
            if (token?.actor?.isOfType("army")) {
                htmlQuery(html, ".control-icon[data-action=effects]")?.remove();
            }
        });
    }

    /** Replace the token HUD's status effects button with one for depositing/retrieving party-member tokens.  */
    static addClownCarButton(
        html: HTMLElement,
        token: TokenAvant<TokenDocumentAvant<SceneAvant>> | null | undefined,
    ): void {
        if (!token?.actor?.isOfType("party")) return;

        const { actor } = token;
        const actionIcon = ((): HTMLImageElement => {
            const imgElement = document.createElement("img");
            imgElement.src = "systems/avant/icons/other/enter-exit.svg";
            const willRetrieve = actor.members.some((m) => m.getActiveTokens(true, true).length > 0);
            imgElement.className = willRetrieve ? "retrieve" : "deposit";
            imgElement.title = game.i18n.localize(
                willRetrieve ? "AVANT.Actor.Party.ClownCar.Retrieve" : "AVANT.Actor.Party.ClownCar.Deposit",
            );

            return imgElement;
        })();

        const controlButton = createHTMLElement("div", {
            classes: ["control-icon"],
            dataset: { action: "clown-car" },
            children: [actionIcon],
        });

        controlButton.addEventListener("click", async () => {
            if (controlButton.dataset.disabled) return;
            controlButton.dataset.disabled = "true";
            try {
                await new PartyClownCar(token.document).toggleState();
                const switchToDeposit = actionIcon.className === "retrieve";
                actionIcon.className = switchToDeposit ? "deposit" : "retrieve";
                actionIcon.title = game.i18n.localize(
                    switchToDeposit ? "AVANT.Actor.Party.ClownCar.Deposit" : "AVANT.Actor.Party.ClownCar.Retrieve",
                );
            } finally {
                delete controlButton.dataset.disabled;
            }
        });

        htmlQuery(html, "[data-action=effects]")?.replaceWith(controlButton);
    }
}
