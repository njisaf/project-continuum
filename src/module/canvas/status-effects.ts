import type { ActorAvant } from "@actor";
import { resetActors } from "@actor/helpers.ts";
import { PersistentDialog } from "@item/condition/persistent-damage-dialog.ts";
import { ConditionSlug } from "@item/condition/types.ts";
import { CONDITION_SLUGS } from "@item/condition/values.ts";
import type { TokenAvant } from "@module/canvas/token/index.ts";
import { ChatMessageAvant } from "@module/chat-message/index.ts";
import type { EncounterAvant } from "@module/encounter/index.ts";
import type { TokenDocumentAvant } from "@scene";
import { StatusEffectIconTheme } from "@scripts/config/index.ts";
import { ErrorAvant, fontAwesomeIcon, htmlQueryAll, objectHasKey, setHasElement } from "@util";
import * as R from "remeda";

const debouncedRender = fu.debounce(() => {
    canvas.tokens.hud.render();
}, 20);

/** Handle interaction with the TokenHUD's status effects menu */
export class StatusEffects {
    /** The ID of the last token processed following an encounter update */
    static #lastCombatantToken: string | null = null;

    static readonly #ICON_THEME_DIRS: Record<StatusEffectIconTheme, string> = {
        default: "systems/avant/icons/conditions/",
        blackWhite: "systems/avant/icons/conditions-2/",
    };

    static #conditionSummaries: Record<ConditionSlug, { name: string; rules: string; summary: string }> | null = null;

    /** Set the theme for condition icons on tokens */
    static initialize(): void {
        const iconTheme = game.settings.get("avant", "statusEffectType");
        CONFIG.controlIcons.defeated = game.settings.get("avant", "deathIcon");
        CONFIG.AVANT.statusEffects.lastIconTheme = iconTheme;
        CONFIG.AVANT.statusEffects.iconDir = this.#ICON_THEME_DIRS[iconTheme];
        this.#updateStatusIcons();
    }

    /** Update status icons and tokens due to certain potential changes */
    static reset(): void {
        CONFIG.controlIcons.defeated = game.settings.get("avant", "deathIcon");
        this.#updateStatusIcons();
        this.refresh();
    }

    static get conditions(): Record<ConditionSlug, { name: string; rules: string; summary: string }> {
        return (this.#conditionSummaries ??= R.mapToObj(Array.from(CONDITION_SLUGS), (s) => [
            s,
            {
                name: game.i18n.localize(`AVANT.condition.${s}.name`),
                rules: game.i18n.localize(`AVANT.condition.${s}.rules`),
                summary: game.i18n.localize(`AVANT.condition.${s}.summary`),
            },
        ]));
    }

    /**
     * If the system setting statusEffectType is changed, we need to upgrade CONFIG
     * And migrate all statusEffect URLs of all Tokens
     */
    static async migrateStatusEffectUrls(chosenSetting: StatusEffectIconTheme): Promise<void> {
        console.debug("Avant System | Changing status effect icon types");
        const iconDir = this.#ICON_THEME_DIRS[chosenSetting];
        CONFIG.AVANT.statusEffects.iconDir = iconDir;
        CONFIG.AVANT.statusEffects.lastIconTheme = chosenSetting;
        this.#updateStatusIcons();
        await resetActors();
        if (canvas.ready) {
            for (const token of canvas.tokens.placeables) {
                token.drawEffects();
            }
        }
    }

    static #activateListeners(html: HTMLElement): void {
        // Mouse actions
        for (const control of htmlQueryAll(html, ".effect-control")) {
            control.addEventListener("click", (event) => {
                this.#setStatusValue(control, event);
            });
            control.addEventListener("contextmenu", (event) => {
                this.#setStatusValue(control, event);
            });

            control.addEventListener("mouseover", () => {
                this.#showStatusLabel(control);
            });
            control.addEventListener("mouseout", () => {
                this.#showStatusLabel(control);
            });
        }
    }

    /** Updates the core CONFIG.statusEffects with the new icons */
    static #updateStatusIcons(): void {
        const iconTheme = game.settings.get("avant", "statusEffectType");
        const directory = iconTheme === "default" ? "conditions" : "conditions-2";
        CONFIG.statusEffects = Object.entries(CONFIG.AVANT.statusEffects.conditions).map(([id, name]) => ({
            id,
            name,
            img: `systems/avant/icons/${directory}/${id}.webp` as const,
        }));
        CONFIG.statusEffects.push({
            id: "dead",
            name: "AVANT.Actor.Dead",
            img: CONFIG.controlIcons.defeated,
        });
    }

    static async onRenderTokenHUD(html: HTMLElement, tokenData: TokenHUDData): Promise<void> {
        const token = canvas.tokens.get(tokenData._id ?? "");
        if (!token) return;

        const iconGrid = html.querySelector<HTMLElement>(".status-effects");
        if (!iconGrid) throw ErrorAvant("Unexpected error retrieving status effects grid");

        const affectingConditions = token.actor?.conditions.active.filter((c) => c.isInHUD) ?? [];

        const titleBar = document.createElement("div");
        titleBar.className = "title-bar";
        iconGrid.append(titleBar);

        const statusIcons = iconGrid.querySelectorAll<HTMLImageElement>(".effect-control");
        const deathIcon = game.settings.get("avant", "deathIcon");

        for (const icon of statusIcons) {
            // Replace the img element with a picture element, which can display ::after content
            const picture = document.createElement("picture");
            picture.classList.add("effect-control");
            picture.dataset.statusId = icon.dataset.statusId;
            picture.title = icon.dataset.tooltip ?? "";
            const iconSrc = icon.getAttribute("src") as ImageFilePath;
            picture.setAttribute("src", iconSrc);
            const newIcon = document.createElement("img");
            newIcon.src = iconSrc;
            picture.append(newIcon);
            icon.replaceWith(picture);

            const slug = picture.dataset.statusId ?? "";

            // Show hidden for broken for loot/vehicles and hidden for all others
            const actorType = token.actor?.type ?? "";
            const hideIcon =
                (slug === "hidden" && ["loot", "vehicle"].includes(actorType)) ||
                (slug === "broken" && !["loot", "vehicle"].includes(actorType));
            if (hideIcon) picture.style.display = "none";

            const affecting = affectingConditions.filter((c) => c.slug === slug);
            if (affecting.length > 0 || (iconSrc === deathIcon && token.actor?.statuses.has("dead"))) {
                picture.classList.add("active");
            }

            if (affecting.length > 0) {
                // Show a badge icon if the condition has a value or is locked
                const isOverridden = affecting.every((c) => c.system.references.overriddenBy.length > 0);
                const isLocked = affecting.every((c) => c.isLocked);
                const hasValue = affecting.some((c) => c.value);

                if (isOverridden) {
                    picture.classList.add("overridden");
                    const badge = fontAwesomeIcon("angle-double-down");
                    badge.classList.add("badge");
                    picture.append(badge);
                } else if (isLocked) {
                    picture.classList.add("locked");
                    const badge = fontAwesomeIcon("lock");
                    badge.classList.add("badge");
                    picture.append(badge);
                } else if (hasValue) {
                    picture.classList.add("valued");
                    const badge = document.createElement("i");
                    badge.classList.add("badge");
                    const value = Math.max(...affecting.map((c) => c.value ?? 1));
                    badge.innerText = value.toString();
                    picture.append(badge);
                }
            }
        }

        this.#activateListeners(iconGrid);
    }

    /** Called by `EncounterAvant#_onUpdate` */
    static onUpdateEncounter(encounter: EncounterAvant): void {
        if (!(game.user.isGM && game.settings.get("avant", "statusEffectShowCombatMessage"))) return;

        if (!encounter.started) {
            this.#lastCombatantToken = null;
            return;
        }

        const { combatant } = encounter;
        const token = combatant?.token;
        if (!(combatant && token)) return;

        if (token.id !== this.#lastCombatantToken && typeof combatant.initiative === "number" && !combatant.defeated) {
            this.#lastCombatantToken = token.id;
            this.#createChatMessage(token, combatant.hidden);
        }
    }

    /** Show the Status Effect name and summary on mouseover of the token HUD */
    static #showStatusLabel(control: HTMLElement): void {
        const titleBar = control.closest(".status-effects")?.querySelector<HTMLElement>(".title-bar");
        if (titleBar && control.title) {
            titleBar.innerText = control.title;
            titleBar.classList.toggle("active");
        }
    }

    /**
     * A click event handler to increment or decrement valued conditions.
     * @param event The window click event
     */
    static async #setStatusValue(control: HTMLElement, event: MouseEvent): Promise<void> {
        event.preventDefault();
        event.stopPropagation();

        const slug = control.dataset.statusId;
        if (!setHasElement(CONDITION_SLUGS, slug) && slug !== "dead") {
            return;
        }

        const tokensAndActors = R.uniqueBy(
            canvas.tokens.controlled
                .map((t): [TokenAvant, ActorAvant] | null => (t.actor ? [t, t.actor] : null))
                .filter(R.isTruthy),
            ([, a]) => a,
        );
        for (const [token, actor] of tokensAndActors) {
            // Persistent damage goes through a dialog instead
            if (slug === "persistent-damage") {
                new PersistentDialog(actor).render(true);
                continue;
            }

            const condition = actor.conditions
                .bySlug(slug, { temporary: false })
                .sort((a, b) => Number(b.active) - Number(a.active))
                .find((c) => c.isInHUD && !c.system.references.parent);

            if (event.type === "click") {
                if (typeof condition?.value === "number") {
                    game.avant.ConditionManager.updateConditionValue(condition.id, token, condition.value + 1);
                } else if (objectHasKey(CONFIG.AVANT.conditionTypes, slug)) {
                    actor.increaseCondition(slug);
                } else {
                    this.#toggleStatus(token, control, event);
                }
            } else if (event.type === "contextmenu") {
                // Remove or decrement condition
                if (event.ctrlKey && slug !== "dead") {
                    // Remove all conditions
                    const conditionIds = actor.conditions.bySlug(slug, { temporary: false }).map((c) => c.id);
                    actor.deleteEmbeddedDocuments("Item", conditionIds);
                } else if (condition?.value) {
                    game.avant.ConditionManager.updateConditionValue(condition.id, token, condition.value - 1);
                } else {
                    this.#toggleStatus(token, control, event);
                }
            }
        }
    }

    static async #toggleStatus(token: TokenAvant, control: HTMLElement, event: MouseEvent): Promise<void> {
        const { actor } = token;
        if (!actor) return;

        const slug = control.dataset.statusId ?? "";
        if (!setHasElement(CONDITION_SLUGS, slug) && slug !== "dead") {
            return;
        }

        const affecting = actor?.conditions
            .bySlug(slug, { active: true, temporary: false })
            .find((c) => !c.system.references.parent);
        const conditionIds: string[] = [];

        if (event.type === "click" && !affecting) {
            if (objectHasKey(CONFIG.AVANT.conditionTypes, slug)) {
                const newCondition = game.avant.ConditionManager.getCondition(slug).toObject();
                await token.actor?.createEmbeddedDocuments("Item", [newCondition]);
            } else if (slug === "dead") {
                await token.actor?.toggleStatusEffect(slug, { overlay: true });
            }
        } else if (event.type === "contextmenu") {
            if (affecting) conditionIds.push(affecting.id);

            if (conditionIds.length > 0) {
                await token.actor?.deleteEmbeddedDocuments("Item", conditionIds);
            }
        }
    }

    /** Create a ChatMessage with the actor's current conditions. */
    static async #createChatMessage(token: TokenDocumentAvant | null, whisper = false): Promise<Maybe<ChatMessageAvant>> {
        if (!token?.actor) return null;

        const conditions = await Promise.all(
            token.actor.conditions.active.map(async (c) => ({
                ...R.pick(c, ["name", "img"]),
                description: await TextEditor.enrichHTML(c.description),
            })),
        );
        if (conditions.length === 0) return null;

        const content = await renderTemplate("systems/avant/templates/chat/participant-conditions.hbs", { conditions });
        const messageSource: Partial<foundry.documents.ChatMessageSource> = {
            author: game.user.id,
            speaker: ChatMessageAvant.getSpeaker({ token }),
            content,
            style: CONST.CHAT_MESSAGE_STYLES.OTHER,
        };
        const isNPCEvent = !token.actor?.hasPlayerOwner;
        const whisperMessage = whisper || (isNPCEvent && game.settings.get("avant", "metagame_secretCondition"));
        if (whisperMessage) {
            messageSource.whisper = ChatMessage.getWhisperRecipients("GM").map((u) => u.id);
        }

        return ChatMessageAvant.create(messageSource);
    }

    /** Re-render the token HUD */
    static refresh(): void {
        if (canvas.ready && canvas.tokens.hud.rendered) {
            debouncedRender();
        }
    }
}
