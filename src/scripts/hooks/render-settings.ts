import { MigrationSummary } from "@module/apps/migration-summary.ts";
import { ErrorAvant, createHTMLElement, fontAwesomeIcon } from "@util";

/** Attach system buttons and other knickknacks to the settings sidebar */
export const RenderSettings = {
    listen: (): void => {
        Hooks.on("renderSettings", async (_app, $html) => {
            const html = $html[0];
            // Additional system information resources
            const systemRow = html.querySelector<HTMLLIElement>(".settings-sidebar li.system");
            const systemInfo = systemRow?.cloneNode(false);
            if (!(systemInfo instanceof HTMLLIElement)) {
                throw ErrorAvant("Unexpected error attaching system information to settings sidebar");
            }

            systemInfo.classList.remove("system");
            systemInfo.classList.add("system-links");
            const links = [
                {
                    url: "https://github.com/foundryvtt/avant/blob/release/CHANGELOG.md",
                    label: "AVANT.SETTINGS.Sidebar.Changelog",
                },
                {
                    url: "https://github.com/foundryvtt/avant/wiki",
                    label: "AVANT.SETTINGS.Sidebar.Wiki",
                },
                {
                    url: "https://discord.gg/SajryVzCyf",
                    label: "AVANT.SETTINGS.Sidebar.Discord",
                },
            ].map((data): HTMLAnchorElement => {
                const anchor = document.createElement("a");
                anchor.href = data.url;
                anchor.innerText = game.i18n.localize(data.label);
                anchor.target = "_blank";
                return anchor;
            });
            systemInfo.append(...links);
            systemRow?.after(systemInfo);

            // Add Avant section (which has license and troubleshooting)
            const header = createHTMLElement("h2", { children: [game.system.title] });
            const avantSettings = createHTMLElement("div");
            html.querySelector("#settings-documentation")?.after(header, avantSettings);

            // Paizo License and remaster information
            const licenseButton = document.createElement("button");
            licenseButton.type = "button";
            licenseButton.append(fontAwesomeIcon("balance-scale"), game.i18n.localize("AVANT.LicenseViewer.Label"));
            licenseButton.addEventListener("click", () => {
                game.avant.licenseViewer.render(true);
            });

            const remasterButton = document.createElement("button");
            remasterButton.type = "button";
            remasterButton.append(fontAwesomeIcon("rocket"), game.i18n.localize("AVANT.SETTINGS.Sidebar.Remaster"));
            remasterButton.addEventListener("click", () => {
                fromUuid("Compendium.avant.journals.JournalEntry.6L2eweJuM8W7OCf2").then((entry) => {
                    entry?.sheet.render(true);
                });
            });

            avantSettings.append(licenseButton, remasterButton);

            // Migration Troubleshooting (if GM)
            if (game.user.isGM) {
                const shootButton = document.createElement("button");
                shootButton.type = "button";
                shootButton.append(fontAwesomeIcon("wrench"), game.i18n.localize("AVANT.Migrations.Troubleshooting"));
                shootButton.addEventListener("click", () => {
                    new MigrationSummary({ troubleshoot: true }).render(true);
                });

                avantSettings.append(shootButton);
            }
        });
    },
};
