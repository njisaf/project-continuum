import { ZeroToThree } from "@module/data.ts";
import { UserAvant } from "@module/user/index.ts";
import { DegreeOfSuccessIndex } from "@system/degree-of-success.ts";
import { RollDataAvant } from "@system/rolls.ts";
import { CheckType } from "./types.ts";

/** A foundry `Roll` subclass representing a Pathfinder 2e check */
class CheckRoll extends Roll {
    static override CHAT_TEMPLATE = "systems/avant/templates/chat/check/roll.hbs";

    constructor(formula: string, data?: Record<string, unknown>, options?: CheckRollDataAvant) {
        super(formula, data, options);
        this.options.showBreakdown ??= true;
    }

    get roller(): UserAvant | null {
        return game.users.get(this.options.rollerId ?? "") ?? null;
    }

    get type(): CheckType {
        return this.options.type ?? "check";
    }

    get degreeOfSuccess(): DegreeOfSuccessIndex | null {
        return this.options.degreeOfSuccess ?? null;
    }

    get isReroll(): boolean {
        return this.options.isReroll ?? false;
    }

    get isRerollable(): boolean {
        return !this.isReroll && !this.dice.some((d) => d.modifiers.includes("kh") || d.modifiers.includes("kl"));
    }

    override async render(this: Rolled<CheckRoll>, options: RollRenderOptions = {}): Promise<string> {
        const { isPrivate, flavor, template } = options;
        if (!this._evaluated) await this.evaluate({ allowInteractive: !isPrivate });

        const { type, identifier, action, damaging } = this.options;
        const canRollDamage = !!(damaging && identifier && (this.roller === game.user || game.user.isGM));
        const showBreakdown = this.options.showBreakdown;
        const showDamageCue = canRollDamage && game.avant.settings.metagame.results;
        const tooltip = isPrivate || !(showBreakdown || game.user.isGM) ? "" : await this.getTooltip();

        const chatData: Record<string, unknown> = {
            formula: isPrivate ? "???" : this._formula,
            flavor: isPrivate ? null : flavor,
            user: game.user,
            tooltip,
            total: isPrivate ? "?" : Math.round(this.total * 100) / 100,
            type,
            identifier,
            action,
            degree: this.degreeOfSuccess,
            canRollDamage,
            showBreakdown,
            showDamageCue,
        };

        return renderTemplate(template ?? CheckRoll.CHAT_TEMPLATE, chatData);
    }

    override async getTooltip(): Promise<string> {
        const tooltip = await super.getTooltip();
        if (this.options.showBreakdown) return tooltip;
        return tooltip.replace('"dice-tooltip"', '"dice-tooltip" data-visibility="gm"');
    }
}

interface CheckRoll extends Roll {
    options: CheckRollDataAvant & { showBreakdown: boolean };
}

/** A legacy class kept to allow chat messages to reconstruct rolls */
class StrikeAttackRoll extends CheckRoll {}

interface CheckRollDataAvant extends RollDataAvant {
    type?: CheckType;
    /** A string of some kind to help system API identify the roll */
    identifier?: Maybe<string>;
    /** The slug of an action associated with this roll */
    action?: Maybe<string>;
    isReroll?: boolean;
    degreeOfSuccess?: ZeroToThree;
    /** Whether the check is part of a damaging action */
    damaging?: boolean;
    domains?: string[];
}

export { CheckRoll, StrikeAttackRoll, type CheckRollDataAvant };
