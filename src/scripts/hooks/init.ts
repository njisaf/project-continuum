import { MystifiedTraits } from "@item/base/data/values.ts";
import { HotbarAvant } from "@module/apps/hotbar.ts";
import {
    ActorDirectoryAvant,
    ChatLogAvant,
    CompendiumDirectoryAvant,
    EncounterTrackerAvant,
    ItemDirectoryAvant,
} from "@module/apps/sidebar/index.ts";
import { setPerceptionModes } from "@module/canvas/perception/modes.ts";
import { RulerAvant } from "@module/canvas/ruler.ts";
import { TokenConfigAvant } from "@scene/token-document/sheet.ts";
import { AVANTCONFIG } from "@scripts/config/index.ts";
import { registerHandlebarsHelpers } from "@scripts/handlebars.ts";
import { registerFonts } from "@scripts/register-fonts.ts";
import { registerKeybindings } from "@scripts/register-keybindings.ts";
import { registerTemplates } from "@scripts/register-templates.ts";
import { SetGameAvant } from "@scripts/set-game-avant.ts";
import { registerSettings } from "@system/settings/index.ts";
import { htmlQueryAll } from "@util";
import * as R from "remeda";

export const Init = {
    listen: (): void => {
        Hooks.once("init", () => {
            console.log("Avant System | Initializing Pathfinder 2nd Edition System");

            CONFIG.AVANT = AVANTCONFIG;
            CONFIG.debug.ruleElement ??= false;

            setPerceptionModes();

            // Automatically advance world time by 6 seconds each round
            CONFIG.time.roundTime = 6;
            // No use of decimals as tie breakers among initiative values
            CONFIG.Combat.initiative.decimals = 0;

            // Assign the Avant Sidebar subclasses
            CONFIG.ui.actors = ActorDirectoryAvant;
            CONFIG.ui.items = ItemDirectoryAvant;
            CONFIG.ui.combat = EncounterTrackerAvant;
            CONFIG.ui.compendium = CompendiumDirectoryAvant;
            CONFIG.ui.hotbar = HotbarAvant;

            if (game.release.generation === 12) {
                CONFIG.ui.chat = ChatLogAvant;
                CONFIG.Token.prototypeSheetClass = TokenConfigAvant;
            }

            // Set after load in case of module conflicts
            if (!RulerAvant.hasModuleConflict) CONFIG.Canvas.rulerClass = RulerAvant;

            // The condition in Pathfinder 2e is "blinded" rather than "blind"
            CONFIG.specialStatusEffects.BLIND = "blinded";

            // Insert templates into DOM tree so Applications can render into
            if (document.querySelector("#ui-top") !== null) {
                // Template element for effects-panel
                const uiTop = document.querySelector("#ui-top");
                const template = document.createElement("template");
                template.setAttribute("id", "avant-effects-panel");
                uiTop?.insertAdjacentElement("afterend", template);
            }

            // Populate UUID redirects
            for (const [from, to] of R.entries(UUID_REDIRECTS)) {
                CONFIG.compendium.uuidRedirects[from] = to;
            }

            // Configure the bundled TinyMCE editor with PF2-specific options
            CONFIG.TinyMCE.extended_valid_elements = "pf2-action[action|glyph]";
            CONFIG.TinyMCE.content_css.push("systems/avant/styles/avant.css");
            CONFIG.TinyMCE.style_formats = (CONFIG.TinyMCE.style_formats ?? []).concat({
                title: "AVANT",
                items: [
                    {
                        title: "Icons 1 2 3 F R",
                        inline: "span",
                        classes: ["action-glyph"],
                        wrapper: true,
                    },
                    {
                        title: "Inline Header",
                        block: "h4",
                        classes: "inline-header",
                    },
                    {
                        title: "Info Block",
                        block: "section",
                        classes: "info",
                        wrapper: true,
                        exact: true,
                        merge_siblings: false,
                    },
                    {
                        title: "Stat Block",
                        block: "section",
                        classes: "statblock",
                        wrapper: true,
                        exact: true,
                        merge_siblings: false,
                    },
                    {
                        title: "Trait",
                        block: "section",
                        classes: "traits",
                        wrapper: true,
                    },
                    {
                        title: "Written Note",
                        block: "p",
                        classes: "message",
                    },
                    {
                        title: "GM Text Block",
                        block: "div",
                        wrapper: true,
                        attributes: {
                            "data-visibility": "gm",
                        },
                    },
                    {
                        title: "GM Text Inline",
                        inline: "span",
                        attributes: {
                            "data-visibility": "gm",
                        },
                    },
                ],
            });

            // Register custom enricher
            CONFIG.TextEditor.enrichers.push({
                pattern: /@(Check|Localize|Template)\[([^\]]+)\](?:{([^}]+)})?/g,
                enricher: (match, options) => game.avant.TextEditor.enrichString(match, options),
            });

            // Register damage enricher, which is more complicated and needs an extra level of nesting
            // Derived from https://stackoverflow.com/questions/17759004/how-to-match-string-within-parentheses-nested-in-java/17759264#17759264
            CONFIG.TextEditor.enrichers.push({
                pattern: /@(Damage)\[((?:[^[\]]|\[[^[\]]*\])*)\](?:{([^}]+)})?/g,
                enricher: (match, options) => game.avant.TextEditor.enrichString(match, options),
            });

            CONFIG.TextEditor.enrichers.push({
                pattern: /\[\[\/(act)\s+(?<slug>[-a-z]+)(?:\s+(?<options>[^\]]+))?\]\](?:\{(?<label>[^}]+)\})?/g,
                enricher: (match, options) => game.avant.TextEditor.enrichString(match, options),
            });

            // Soft-set system-preferred core settings until they've been explicitly set by the GM
            // const schema = foundry.data.PrototypeToken.schema;
            // schema.displayName.default = schema.displayBars.default = CONST.TOKEN_DISPLAY_MODES.OWNER_HOVER;

            // Register stuff with the Foundry client
            registerFonts();
            registerHandlebarsHelpers();
            registerKeybindings();
            registerSettings();
            registerTemplates();

            MystifiedTraits.compile();

            // Create and populate initial game.avant interface
            SetGameAvant.onInit();

            // Disable tagify style sheets from modules
            for (const element of htmlQueryAll(document.head, "link[rel=stylesheet]")) {
                const href = element.getAttribute("href");
                if (href?.startsWith("modules/") && href.endsWith("tagify.css")) {
                    element.setAttribute("disabled", "");
                }
            }

            game.avant.StatusEffects.initialize();
        });
    },
};
