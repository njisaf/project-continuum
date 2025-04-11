import type { ConditionSource } from "@item/base/data/index.ts";
import { svelte as sveltePlugin } from "@sveltejs/vite-plugin-svelte";
import { execSync } from "child_process";
import esbuild from "esbuild";
import fs from "fs-extra";
import Glob from "glob";
import path from "path";
import Peggy from "peggy";
import * as Vite from "vite";
import checker from "vite-plugin-checker";
import { viteStaticCopy } from "vite-plugin-static-copy";
import tsconfigPaths from "vite-tsconfig-paths";
import packageJSON from "./package.json" with { type: "json" };
import { sluggify } from "./src/util/misc.ts";
import systemJSON from "./static/system.json" with { type: "json" };

const CONDITION_SOURCES = ((): ConditionSource[] => {
    const output = execSync("npm run build:conditions", { encoding: "utf-8" });
    return JSON.parse(output.slice(output.indexOf("[")));
})();
const EN_JSON = JSON.parse(fs.readFileSync("./static/lang/en.json", { encoding: "utf-8" }));

// Load foundry config if available to potentially use a different port
const FOUNDRY_CONFIG = fs.existsSync("./foundryconfig.json")
    ? JSON.parse(fs.readFileSync("./foundryconfig.json", { encoding: "utf-8" }))
    : null;
const port = Number(FOUNDRY_CONFIG?.port) || 30001;
const foundryPort = Number(FOUNDRY_CONFIG?.foundryPort) || 30000;
console.log(`Connecting to foundry hosted at http://localhost:${foundryPort}/`);

/** Get UUID redirects from JSON file, converting names to IDs. */
function getUuidRedirects(): Record<CompendiumUUID, CompendiumUUID> {
    try {
        const redirectJSON = JSON.parse(fs.readFileSync(path.resolve(__dirname, "build/uuid-redirects.json"), "utf-8"));
        for (const [from, to] of Object.entries<string>(redirectJSON)) {
            try {
                const [, , pack, documentType, name] = to.split(".", 5);
                const packInfo = systemJSON.packs.find((p) => p.type === documentType && p.name === pack);
                
                // Skip if pack doesn't exist (removed in Avant)
                if (!packInfo) {
                    console.warn(`Pack ${pack} not found, skipping UUID redirect for ${to}`);
                    delete redirectJSON[from];
                    continue;
                }
                
                const packDir = packInfo.path;
                const dirPath = path.resolve(__dirname, packDir ?? "");
                
                // Skip if directory doesn't exist
                if (!fs.existsSync(dirPath)) {
                    console.warn(`Directory for pack ${pack} not found at ${dirPath}, skipping UUID redirect for ${to}`);
                    delete redirectJSON[from];
                    continue;
                }
                
                const filename = `${sluggify(name)}.json`;
                const jsonPath = fs.existsSync(path.resolve(dirPath, filename))
                    ? path.resolve(dirPath, filename)
                    : Glob.sync(path.resolve(dirPath, "**", filename)).at(0);
                
                if (!jsonPath) {
                    console.warn(`Failure looking up pack JSON for ${to}, skipping this redirect`);
                    delete redirectJSON[from];
                    continue;
                }
                
                const docJSON = JSON.parse(fs.readFileSync(jsonPath, "utf-8"));
                const id = docJSON._id;
                if (!id) {
                    console.warn(`No UUID redirect match found for ${documentType} ${name} in ${pack}, skipping`);
                    delete redirectJSON[from];
                    continue;
                }
                
                redirectJSON[from] = `Compendium.avant.${pack}.${documentType}.${id}`;
            } catch (error: unknown) {
                const errorMessage = error instanceof Error ? error.message : String(error);
                console.warn(`Error processing UUID redirect ${from} -> ${to}: ${errorMessage}`);
                delete redirectJSON[from];
            }
        }

        return redirectJSON;
    } catch (error: unknown) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        console.error(`Failed to load UUID redirects: ${errorMessage}`);
        return {};
    }
}

const config = Vite.defineConfig(({ command, mode }): Vite.UserConfig => {
    const buildMode = mode === "production" ? "production" : "development";
    const outDir = "dist";

    const rollGrammar = fs.readFileSync("roll-grammar.peggy", { encoding: "utf-8" });
    const ROLL_PARSER = Peggy.generate(rollGrammar, { output: "source" }).replace(
        'return {\n    StartRules: ["Expression"],\n    SyntaxError: peg$SyntaxError,\n    parse: peg$parse\n  };',
        'AbstractDamageRoll.parser = { StartRules: ["Expression"], SyntaxError: peg$SyntaxError, parse: peg$parse };',
    );

    const plugins = [checker({ typescript: true }), tsconfigPaths({ loose: true }), sveltePlugin()];
    // Handle minification after build to allow for tree-shaking and whitespace minification
    // "Note the build.minify option does not minify whitespaces when using the 'es' format in lib mode, as it removes
    // pure annotations and breaks tree-shaking."
    if (buildMode === "production") {
        plugins.push(
            {
                name: "minify",
                renderChunk: {
                    order: "post",
                    async handler(code, chunk) {
                        return chunk.fileName.endsWith(".mjs")
                            ? esbuild.transform(code, {
                                  keepNames: true,
                                  minifyIdentifiers: false,
                                  minifySyntax: true,
                                  minifyWhitespace: true,
                              })
                            : code;
                    },
                },
            },
            ...viteStaticCopy({
                targets: [
                    { src: "CHANGELOG.md", dest: "." },
                    { src: "README.md", dest: "." },
                    { src: "CONTRIBUTING.md", dest: "." },
                ],
            }),
        );
    } else {
        plugins.push(
            // Foundry expects all esm files listed in system.json to exist: create empty vendor module when in dev mode
            {
                name: "touch-vendor-mjs",
                apply: "build",
                writeBundle: {
                    async handler() {
                        fs.closeSync(fs.openSync(path.resolve(outDir, "vendor.mjs"), "w"));
                    },
                },
            },
            // Vite HMR is only preconfigured for css files: add handler for HBS templates and localization JSON
            {
                name: "hmr-handler",
                apply: "serve",
                handleHotUpdate(context) {
                    if (context.file.startsWith(outDir)) return;

                    if (context.file.endsWith("en.json")) {
                        const basePath = context.file.slice(context.file.indexOf("lang/"));
                        console.log(`Updating lang file at ${basePath}`);
                        fs.promises.copyFile(context.file, `${outDir}/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "lang-update",
                                data: { path: `systems/avant/${basePath}` },
                            });
                        });
                    } else if (context.file.endsWith(".hbs")) {
                        const basePath = context.file.slice(context.file.indexOf("templates/"));
                        console.log(`Updating template file at ${basePath}`);
                        fs.promises.copyFile(context.file, `${outDir}/${basePath}`).then(() => {
                            context.server.ws.send({
                                type: "custom",
                                event: "template-update",
                                data: { path: `systems/avant/${basePath}` },
                            });
                        });
                    }
                },
            },
        );
    }

    // Create dummy files for vite dev server
    if (command === "serve") {
        const message = "This file is for a running vite dev server and is not copied to a build";
        fs.writeFileSync("./index.html", `<h1>${message}</h1>\n`);
        if (!fs.existsSync("./styles")) fs.mkdirSync("./styles");
        fs.writeFileSync("./styles/avant.css", `/** ${message} */\n`);
        fs.writeFileSync("./avant.mjs", `/** ${message} */\n\nimport "./src/avant.ts";\n`);
        fs.writeFileSync("./vendor.mjs", `/** ${message} */\n`);
    }

    const reEscape = (s: string) => s.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&");

    return {
        base: command === "build" ? "./" : "/systems/avant/",
        publicDir: "static",
        define: {
            BUILD_MODE: JSON.stringify(buildMode),
            CONDITION_SOURCES: JSON.stringify(CONDITION_SOURCES),
            EN_JSON: JSON.stringify(EN_JSON),
            ROLL_PARSER: JSON.stringify(ROLL_PARSER),
            UUID_REDIRECTS: JSON.stringify(getUuidRedirects()),
            fu: "foundry.utils",
        },
        esbuild: { keepNames: true },
        build: {
            outDir,
            emptyOutDir: false, // Fails if world is running due to compendium locks: handled with `npm run clean`
            minify: false,
            sourcemap: buildMode === "development",
            lib: {
                name: "avant",
                entry: "src/avant.ts",
                formats: ["es"],
                fileName: "avant",
            },
            rollupOptions: {
                external: new RegExp(
                    [
                        "(?:",
                        reEscape("../../icons/weapons/"),
                        "[-a-z/]+",
                        reEscape(".webp"),
                        "|",
                        reEscape("../ui/parchment.jpg"),
                        ")$",
                    ].join(""),
                ),
                output: {
                    assetFileNames: "styles/avant.css",
                    chunkFileNames: "[name].mjs",
                    entryFileNames: "avant.mjs",
                    manualChunks: {
                        vendor: buildMode === "production" ? Object.keys(packageJSON.dependencies) : [],
                    },
                },
                watch: { buildDelay: 100 },
            },
            target: "es2022",
        },
        server: {
            port,
            open: "/game",
            proxy: {
                "^(?!/systems/avant/)": `http://localhost:${foundryPort}/`,
                "/socket.io": {
                    target: `ws://localhost:${foundryPort}`,
                    ws: true,
                },
            },
        },
        plugins,
        css: { devSourcemap: buildMode === "development" },
    };
});

export default config;
