import type { ActorAvant } from "@actor";
import type { TokenAvant } from "@module/canvas/index.ts";
import type { SceneAvant, TokenDocumentAvant } from "@scene";
import * as R from "remeda";
import { UserFlagsAvant, UserSourceAvant } from "./data.ts";

class UserAvant extends User<ActorAvant<null>> {
    override prepareData(): void {
        super.prepareData();
        if (canvas.ready && canvas.tokens.controlled.length > 0) {
            game.avant.effectPanel.refresh();
        }
    }

    /** Set user settings defaults */
    override prepareBaseData(): void {
        super.prepareBaseData();
        this.flags = fu.mergeObject(
            {
                avant: {
                    settings: {
                        showEffectPanel: true,
                        showCheckDialogs: true,
                        showDamageDialogs: true,
                        searchPackContents: false,
                        monochromeDarkvision: true,
                    },
                },
            },
            this.flags,
        );
    }

    get settings(): Readonly<UserSettingsAvant> {
        return this.flags.avant.settings;
    }

    /** Get tokens controlled by this user or, failing that, a token of the assigned character. */
    getActiveTokens(): TokenDocumentAvant[] {
        if (!canvas.ready || canvas.tokens.controlled.length === 0) {
            return [game.user.character?.getActiveTokens(true, true).shift()].filter(R.isTruthy);
        }
        return canvas.tokens.controlled.filter((t) => t.isOwner).map((t) => t.document);
    }

    /** Alternative to calling `#updateTokenTargets()` with no argument or an empty array */
    clearTargets(): void {
        this.updateTokenTargets();
    }

    protected override _onUpdate(
        changed: DeepPartial<this["_source"]>,
        operation: DatabaseUpdateOperation<null>,
        userId: string,
    ): void {
        super._onUpdate(changed, operation, userId);
        if (game.user.id !== userId) return;

        const keys = Object.keys(fu.flattenObject(changed));
        if (keys.includes("flags.avant.settings.showEffectPanel")) {
            game.avant.effectPanel.refresh();
        }
        if (keys.includes("flags.avant.settings.monochromeDarkvision") && canvas.ready) {
            canvas.scene?.reset();
            canvas.perception.update({ initializeVision: true, refreshLighting: true }, true);
        }
    }
}

interface UserAvant extends User<ActorAvant<null>> {
    targets: UserTargets<TokenAvant<TokenDocumentAvant<SceneAvant>>>;
    flags: UserFlagsAvant;
    readonly _source: UserSourceAvant;
}

interface UserSettingsAvant {
    showEffectPanel: boolean;
    showCheckDialogs: boolean;
    showDamageDialogs: boolean;
    monochromeDarkvision: boolean;
    searchPackContents: boolean;
}

export { UserAvant, type UserSettingsAvant };
