import type { ActorAvant } from "@actor";
import type { AbilityTrait } from "@item/ability/index.ts";
import type { ProficiencyRank } from "@item/base/data/index.ts";
import type { TokenAvant } from "@module/canvas/index.ts";
import type { ChatMessageAvant } from "@module/chat-message/document.ts";

type ActionCost = "free" | "reaction" | 0 | 1 | 2 | 3;
type ActionSection = "basic" | "skill" | "specialty-basic";

interface ActionMessageOptions {
    blind: boolean;
    variant: string;
    whisper: string[];
}

interface ActionVariantUseOptions extends Record<string, unknown> {
    actors: ActorAvant | ActorAvant[];
    event: Event;
    message: {
        create?: boolean;
    };
    traits: AbilityTrait[];
    target: ActorAvant | TokenAvant;
}

interface ActionVariant {
    cost?: ActionCost;
    description?: string;
    glyph?: string;
    name?: string;
    slug: string;
    traits: AbilityTrait[];
    toMessage(options?: Partial<ActionMessageOptions>): Promise<ChatMessageAvant | undefined>;
    use(options?: Partial<ActionVariantUseOptions>): Promise<unknown>;
}

interface ActionUseOptions extends ActionVariantUseOptions {
    variant: string;
}

interface Action {
    cost?: ActionCost;
    description?: string;
    glyph?: string;
    img?: string;
    name: string;
    sampleTasks?: Partial<Record<ProficiencyRank, string>>;
    section?: ActionSection;
    slug: string;
    traits: AbilityTrait[];
    variants: Collection<ActionVariant>;
    toMessage(options?: Partial<ActionMessageOptions>): Promise<ChatMessageAvant | undefined>;
    /** Uses the default variant for this action, which will usually be the first one in the collection. */
    use(options?: Partial<ActionUseOptions>): Promise<unknown>;
}

export type {
    Action,
    ActionCost,
    ActionMessageOptions,
    ActionSection,
    ActionUseOptions,
    ActionVariant,
    ActionVariantUseOptions,
};
