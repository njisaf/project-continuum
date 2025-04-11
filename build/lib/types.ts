import type { ActorAvant } from "@actor";
import type { ItemAvant } from "@item";
import type { MacroAvant } from "@module/macro.ts";

type CompendiumDocumentAvant = ActorAvant | ItemAvant<ActorAvant | null> | JournalEntry | MacroAvant | RollTable;
type PackEntry = CompendiumDocumentAvant["_source"];

export type { PackEntry };
