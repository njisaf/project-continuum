import type { TokenSchema } from "types/foundry/common/documents/token.d.ts";

type TokenFlagsAvant = DocumentFlags & {
    avant: {
        [key: string]: unknown;
        linkToActorSize: boolean;
        autoscale: boolean;
    };
    [key: string]: Record<string, unknown>;
};

type DetectionModeEntry = ModelPropsFromSchema<TokenSchema>["detectionModes"][number];

export type { DetectionModeEntry, TokenFlagsAvant };
