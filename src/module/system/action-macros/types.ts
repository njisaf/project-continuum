import type { ActorAvant } from "@actor";
import { StrikeData } from "@actor/data/base.ts";
import type { ModifierAvant } from "@actor/modifiers.ts";
import type { DCSlug } from "@actor/types.ts";
import type { ItemAvant } from "@item";
import type { WeaponTrait } from "@item/weapon/types.ts";
import type { RollNoteAvant } from "@module/notes.ts";
import type { TokenDocumentAvant } from "@scene";
import type { CheckRoll, CheckType } from "@system/check/index.ts";
import type { CheckDC, DegreeOfSuccessString } from "@system/degree-of-success.ts";
import type { Statistic } from "@system/statistic/index.ts";

type ActionGlyph = "A" | "D" | "T" | "R" | "F" | "a" | "d" | "t" | "r" | "f" | 1 | 2 | 3 | "1" | "2" | "3";

interface BuildCheckContextOptions<TItem extends ItemAvant<ActorAvant>> {
    actor: ActorAvant;
    item?: TItem;
    rollOptions: string[];
    target?: ActorAvant | null;
}

interface BuildCheckContextResult<TItem extends ItemAvant<ActorAvant>> {
    item?: TItem;
    rollOptions: string[];
    target?: ActorAvant | null;
}

interface CheckContextOptions<TItem extends ItemAvant<ActorAvant>> {
    actor: ActorAvant;
    buildContext: (options: BuildCheckContextOptions<TItem>) => BuildCheckContextResult<TItem>;
    target?: ActorAvant | null;
}

interface CheckContextData<TItem extends ItemAvant<ActorAvant>> {
    item?: TItem;
    modifiers?: ModifierAvant[];
    rollOptions: string[];
    slug: string;
    target?: ActorAvant | null;
}

interface CheckMacroContext<TItem extends ItemAvant<ActorAvant>> {
    type: CheckType;
    item?: TItem;
    modifiers?: ModifierAvant[];
    rollOptions: string[];
    slug: string;
    statistic: Statistic | (StrikeData & { rank?: number });
    subtitle: string;
}

interface CheckResultCallback {
    actor: ActorAvant;
    message?: ChatMessage;
    outcome: DegreeOfSuccessString | null | undefined;
    roll: Rolled<CheckRoll>;
}

interface SimpleRollActionCheckOptions<TItem extends ItemAvant<ActorAvant>> {
    actors: ActorAvant | ActorAvant[] | undefined;
    actionGlyph: ActionGlyph | undefined;
    title: string;
    checkContext: (
        context: CheckContextOptions<TItem>,
    ) => Promise<CheckMacroContext<TItem>> | CheckMacroContext<TItem> | undefined;
    content?: (title: string) => Promise<string | null | undefined | void> | string | null | undefined | void;
    item?: (actor: ActorAvant) => TItem | undefined;
    traits: string[];
    event?: JQuery.TriggeredEvent | Event | null;
    /**
     * A DC can be represented as a preassembled `CheckDC` object, a slug referencing a `Statistic`, or a function that
     * returns a `CheckDC` or `null`.
     */
    difficultyClass?: UnresolvedCheckDC;
    extraNotes?: (selector: string) => RollNoteAvant[];
    callback?: (result: CheckResultCallback) => void;
    createMessage?: boolean;
    weaponTrait?: WeaponTrait;
    weaponTraitWithPenalty?: WeaponTrait;
    target?: () => { token: TokenDocumentAvant | null; actor: ActorAvant } | null;
}

type UnresolvedCheckDC = CheckDC | DCSlug | ((actor: ActorAvant | null) => CheckDC | null);

interface ActionDefaultOptions {
    event?: JQuery.TriggeredEvent | Event | null;
    actors?: ActorAvant | ActorAvant[];
    glyph?: ActionGlyph;
    modifiers?: ModifierAvant[];
    callback?: (result: CheckResultCallback) => void;
}

interface SkillActionOptions extends ActionDefaultOptions {
    skill?: string;
    difficultyClass?: CheckDC;
}

export type {
    ActionDefaultOptions,
    ActionGlyph,
    CheckContextData,
    CheckContextOptions,
    CheckMacroContext,
    CheckResultCallback,
    SimpleRollActionCheckOptions,
    SkillActionOptions,
    UnresolvedCheckDC,
};
