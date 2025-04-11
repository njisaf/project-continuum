import { resetActors } from "@actor/helpers.ts";
import type { RegionDocumentAvant } from "@scene";
import type { EnvironmentBehaviorType } from "./environment.ts";

class RegionBehaviorAvant<
    TParent extends RegionDocumentAvant | null = RegionDocumentAvant | null,
> extends RegionBehavior<TParent> {
    protected override _onUpdate(
        data: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<TParent>,
        userId: string,
    ): void {
        // Reset actors inside the region of this behavior
        if (this.viewed && this.type === "environment") {
            const system: Partial<EnvironmentBehaviorType["_source"]> = data.system ?? {};
            if (system.environmentTypes || system.mode) {
                const tokens = [...(this.region?.tokens ?? [])];
                resetActors(
                    tokens.flatMap((t) => t.actor ?? []),
                    { tokens: true },
                );
            }
        }

        return super._onUpdate(data, operation, userId);
    }
}

export { RegionBehaviorAvant };
