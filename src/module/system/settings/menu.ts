import { htmlClosest, htmlQuery } from "@util";
import * as R from "remeda";

abstract class SettingsMenuAvant extends FormApplication {
    static readonly namespace: string;

    protected cache: Record<string, unknown> & { clear(): void } = (() => {
        const data: Record<string, unknown> & { clear(): void } = {
            clear(): void {
                for (const key of Object.keys(this)) {
                    delete this[key];
                }
            },
        };
        Object.defineProperty(data, "clear", { enumerable: false });
        return data;
    })();

    static override get defaultOptions(): FormApplicationOptions {
        const options = super.defaultOptions;
        options.classes.push("settings-menu", "sheet");

        return {
            ...options,
            title: `AVANT.SETTINGS.${this.namespace.titleCase()}.Name`,
            id: `${this.namespace}-settings`,
            template: `systems/avant/templates/system/settings/menu.hbs`,
            width: 550,
            height: "auto",
            tabs: [{ navSelector: ".sheet-tabs", contentSelector: "form" }],
            closeOnSubmit: false,
            submitOnChange: true,
        };
    }

    static readonly SETTINGS: readonly string[];

    /** Settings to be registered and also later referenced during user updates */
    protected static get settings(): Record<string, PartialSettingsData> {
        return {};
    }

    static registerSettings(): void {
        const settings = this.settings;
        for (const key of this.SETTINGS) {
            const setting = settings[key];
            game.settings.register("avant", `${setting.prefix ?? ""}${key}`, {
                ...R.omit(setting, ["prefix"]),
                scope: "world",
                config: false,
            });
        }
    }

    get namespace(): string {
        return this.constructor.namespace;
    }

    override async getData(): Promise<MenuTemplateData> {
        const settings = (this.constructor as typeof SettingsMenuAvant).settings;
        const templateData = settingsToSheetData(settings, this.cache);

        // Ensure cache values are initialized
        for (const [key, value] of Object.entries(settings)) {
            if (!(key in this.cache)) {
                this.cache[key] = game.settings.get("avant", `${value.prefix ?? ""}${key}`);
            }
        }

        return fu.mergeObject(await super.getData(), {
            settings: templateData,
            instructions: `AVANT.SETTINGS.${this.namespace.titleCase()}.Hint`,
        });
    }

    override close(options?: { force?: boolean }): Promise<void> {
        this.cache.clear();
        return super.close(options);
    }

    /* -------------------------------------------- */
    /*  Event Listeners and Handlers                */
    /* -------------------------------------------- */

    override activateListeners($html: JQuery): void {
        super.activateListeners($html);
        const html = $html[0];

        htmlQuery(html, "button[type=reset]")?.addEventListener("click", () => {
            this.cache.clear();
            this.render();
        });

        const { highlightSetting } = this.options;
        if (highlightSetting) {
            const formGroup = htmlClosest(htmlQuery(html, `label[for="${highlightSetting}"]`), ".form-group");
            if (formGroup) formGroup.style.animation = "glow 0.75s infinite alternate";
        }
    }

    protected override async _updateObject(event: Event, data: Record<string, unknown>): Promise<void> {
        for (const key of this.constructor.SETTINGS) {
            const setting = this.constructor.settings[key];
            const settingKey = `${setting.prefix ?? ""}${key}`;
            const value = data[key];
            this.cache[key] = value;
            if (event.type === "submit") {
                await game.settings.set("avant", settingKey, value);
            }
        }

        if (event.type === "submit") {
            this.close();
        } else {
            this.render();
        }
    }

    /** Overriden to add some additional first-render behavior */
    protected override _injectHTML($html: JQuery<HTMLElement>): void {
        super._injectHTML($html);

        // Initialize cache
        for (const key of this.constructor.SETTINGS) {
            const setting = this.constructor.settings[key];
            const settingKey = `${setting.prefix ?? ""}${key}`;
            const value = game.settings.get("avant", settingKey);
            this.cache[key] = value instanceof foundry.abstract.DataModel ? value.clone() : value;
        }
    }
}

interface SettingsMenuAvant extends FormApplication {
    constructor: typeof SettingsMenuAvant;
    options: SettingsMenuOptions;
}

interface PartialSettingsData extends Omit<SettingRegistration, "scope" | "config"> {
    prefix?: string;
    tab?: string;
}

interface SettingsTemplateData extends PartialSettingsData {
    key: string;
    value: unknown;
    isSelect: boolean;
    isCheckbox: boolean;
}

interface MenuTemplateData extends FormApplicationData {
    settings: Record<string, SettingsTemplateData>;
}

interface SettingsMenuOptions extends FormApplicationOptions {
    highlightSetting?: string;
}

function settingsToSheetData(
    settings: Record<string, PartialSettingsData>,
    cache: Record<string, unknown> = {},
): Record<string, SettingsTemplateData> {
    return Object.entries(settings).reduce((result: Record<string, SettingsTemplateData>, [key, setting]) => {
        const lookupKey = `${setting.prefix ?? ""}${key}`;
        const value = key in cache ? cache[key] : game.settings.get("avant", lookupKey);
        result[key] = {
            ...setting,
            key,
            value,
            isSelect: !!setting.choices,
            isCheckbox: setting.type === Boolean,
        };

        return result;
    }, {});
}

export { SettingsMenuAvant, settingsToSheetData };
export type { MenuTemplateData, PartialSettingsData, SettingsMenuOptions, SettingsTemplateData };
