import type { PhysicalItemAvant } from "@item";
import type { UserAvant } from "@module/user/document.ts";
import { SocketMessage } from "@scripts/socket.ts";
import { ErrorAvant, getActionGlyph, localizer } from "@util";
import type { ActorAvant } from "./base.ts";
import { TraitViewData } from "./data/base.ts";

export interface ItemTransferData {
    source: {
        tokenId?: string;
        actorId: string;
        itemId: string;
    };
    target: {
        tokenId?: string;
        actorId: string;
    };
    quantity: number;
    containerId?: string;

    /** Whether this is a merchant transaction. If null, presume yes if merchant */
    isPurchase?: boolean | null;
}

export class ItemTransfer implements ItemTransferData {
    #templatePaths = {
        flavor: "./systems/avant/templates/chat/action/flavor.hbs",
        content: "./systems/avant/templates/chat/action/content.hbs",
    };

    source: ItemTransferData["source"];
    target: ItemTransferData["target"];
    quantity: number;
    containerId?: string;
    isPurchase: boolean | null;

    constructor(data: ItemTransferData) {
        this.source = data.source;
        this.target = data.target;
        this.quantity = data.quantity;
        this.containerId = data.containerId;
        this.isPurchase = data.isPurchase ?? null;
    }

    async request(): Promise<void> {
        const gamemaster = game.users.find((u) => u.isGM && u.active);
        if (!gamemaster) {
            const source = this.#getSource();
            const target = this.#getTarget();
            const loot = [source, target].find((a) => a?.isLootableBy(game.user) && !a.isOwner);

            if (!loot) throw ErrorAvant("Unexpected missing actor");
            ui.notifications.error(
                game.i18n.format("AVANT.loot.GMSupervisionError", { loot: ItemTransfer.#tokenName(loot) }),
            );
            return;
        }

        console.debug(`Avant System | Requesting item transfer from GM ${gamemaster.name}`);
        game.socket.emit("system.avant", { request: "itemTransfer", data: this } satisfies SocketMessage);
    }

    // Only a GM can call this method, or else Foundry will block it (or would if we didn't first)
    async enact(requester: UserAvant): Promise<void> {
        if (!game.user.isGM) {
            throw ErrorAvant("Unauthorized item transfer");
        }

        console.debug("Avant System | Enacting item transfer");
        const sourceActor = this.#getSource();
        const sourceItem = sourceActor?.inventory.find((i) => i.id === this.source.itemId);
        const targetActor = this.#getTarget();

        // Sanity checks
        if (!(sourceActor?.isLootableBy(game.user) && sourceItem && targetActor?.isLootableBy(game.user))) {
            throw ErrorAvant("Failed sanity check during item transfer");
        }

        this.isPurchase ??= sourceActor.isOfType("loot") && sourceActor.isMerchant;
        const targetItem = await sourceActor.transferItemToActor(
            targetActor,
            sourceItem,
            this.quantity,
            this.containerId,
            false,
            this.isPurchase,
        );

        const sourceIsLoot = sourceActor.isOfType("loot") && sourceActor.system.lootSheetType === "Loot";

        // A merchant transaction can fail if funds are insufficient, but a loot transfer failing is an error.
        if (!sourceItem && sourceIsLoot) {
            return;
        }

        this.#sendMessage(requester, sourceActor, targetActor, targetItem);
    }

    /** Retrieve the full actor from the source or target ID */
    #getActor(tokenId: string | undefined, actorId: string): ActorAvant | null {
        if (typeof tokenId === "string") {
            const token = canvas.tokens.placeables.find((t) => t.id === tokenId);
            return token?.actor ?? null;
        }
        return game.actors.get(actorId) ?? null;
    }

    #getSource(): ActorAvant | null {
        return this.#getActor(this.source.tokenId, this.source.actorId);
    }

    #getTarget(): ActorAvant | null {
        return this.#getActor(this.target.tokenId, this.target.actorId);
    }

    // Prefer token names over actor names
    static #tokenName(document: ActorAvant | User): string {
        if ("items" in document) {
            // Use a special moniker for party actors
            if (document.isOfType("party")) return game.i18n.localize("AVANT.loot.PartyStash");
            // Synthetic actor: use its token name or, failing that, actor name
            if (document.token) return document.token.name;

            // Linked actor: use its token prototype name
            return document.prototypeToken?.name ?? document.name;
        }
        // User with an assigned character
        if (document.character) {
            const token = canvas.tokens.placeables.find((t) => t.actor?.id === document.id);
            return token?.name ?? document.character?.name;
        }

        // User with no assigned character (should never happen)
        return document.name;
    }

    /** Send a chat message that varies on the types of transaction and parties involved
     * @param requester   The player who requested an item transfer to be performed by the GM
     * @param sourceActor The actor from which the item was dragged
     * @param targetActor The actor on which the item was dropped
     * @param item        The item created on the target actor as a result of the drag & drop
     */
    async #sendMessage(
        requester: UserAvant,
        sourceActor: ActorAvant,
        targetActor: ActorAvant,
        item: PhysicalItemAvant | null,
    ): Promise<void> {
        const localize = localizer("AVANT.loot");

        if (!item) {
            if (this.isPurchase) {
                const message = localize("InsufficientFundsMessage");
                // The buyer didn't have enough funds! No transaction.

                const content = await renderTemplate(this.#templatePaths.content, {
                    imgPath: targetActor.img,
                    message: game.i18n.format(message, { buyer: targetActor.name }),
                });

                const flavor = await this.#messageFlavor(sourceActor, targetActor, localize("BuySubtitle"));

                await ChatMessage.create({
                    author: requester.id,
                    speaker: { alias: ItemTransfer.#tokenName(targetActor) },
                    style: CONST.CHAT_MESSAGE_STYLES.EMOTE,
                    flavor,
                    content,
                });
                return;
            } else {
                throw ErrorAvant("Unexpected item-transfer failure");
            }
        }

        // Exhaustive pattern match to determine speaker and item-transfer parties
        type PatternMatch = [speaker: string, subtitle: string, formatArgs: Parameters<Localization["format"]>];

        const [speaker, subtitle, formatArgs] = ((): PatternMatch => {
            const isMerchant = (actor: ActorAvant) => actor.isOfType("loot") && actor.isMerchant;
            const isWhat = (actor: ActorAvant) => ({
                isCharacter: actor.testUserPermission(requester, "OWNER") && actor.isOfType("character"),
                isMerchant: isMerchant(actor),
                isNPC:
                    actor.isOfType("npc") &&
                    actor.isLootableBy(requester) &&
                    !actor.testUserPermission(requester, "OWNER"),
                isLoot:
                    (actor.isOfType("party") || actor.isOfType("loot")) &&
                    actor.isLootableBy(requester) &&
                    !actor.testUserPermission(requester, "OWNER") &&
                    !isMerchant(actor),
            });
            const source = isWhat(sourceActor);
            const target = isWhat(targetActor);

            if (source.isCharacter && target.isLoot) {
                // Character deposits item in loot container
                return [
                    ItemTransfer.#tokenName(sourceActor),
                    localize("DepositSubtitle"),
                    [
                        localize("DepositMessage"),
                        {
                            depositor: ItemTransfer.#tokenName(sourceActor),
                            container: ItemTransfer.#tokenName(targetActor),
                        },
                    ],
                ];
            } else if (source.isCharacter && target.isMerchant) {
                // Character gives item to merchant
                return [
                    ItemTransfer.#tokenName(sourceActor),
                    localize("GiveSubtitle"),
                    [
                        localize("GiveMessage"),
                        {
                            giver: ItemTransfer.#tokenName(sourceActor),
                            recipient: ItemTransfer.#tokenName(targetActor),
                        },
                    ],
                ];
            } else if (source.isCharacter && target.isNPC) {
                // Character drops item on dead NPC
                return [
                    ItemTransfer.#tokenName(sourceActor),
                    localize("PlantSubtitle"),
                    [
                        localize("PlantMessage"),
                        { planter: ItemTransfer.#tokenName(sourceActor), corpse: ItemTransfer.#tokenName(targetActor) },
                    ],
                ];
            } else if (source.isLoot && target.isCharacter) {
                // Character takes item from loot container
                return [
                    ItemTransfer.#tokenName(targetActor),
                    localize("TakeSubtitle"),
                    [
                        localize("TakeMessage"),
                        {
                            taker: ItemTransfer.#tokenName(targetActor),
                            container: ItemTransfer.#tokenName(sourceActor),
                        },
                    ],
                ];
            } else if (source.isNPC && target.isCharacter) {
                // Character takes item from loot container
                return [
                    ItemTransfer.#tokenName(targetActor),
                    localize("LootSubtitle"),
                    [
                        localize("LootMessage"),
                        { looter: ItemTransfer.#tokenName(targetActor), corpse: ItemTransfer.#tokenName(sourceActor) },
                    ],
                ];
            } else if ([source, target].every((actor) => actor.isLoot || actor.isNPC)) {
                return [
                    // Character transfers item between two loot containers
                    requester.character?.name ?? requester.name,
                    localize("TransferSubtitle"),
                    [
                        localize("TransferMessage"),
                        {
                            transferrer: requester.character?.name ?? requester.name,
                            fromContainer: ItemTransfer.#tokenName(sourceActor),
                            toContainer: ItemTransfer.#tokenName(targetActor),
                        },
                    ],
                ];
            } else if (source.isLoot && target.isMerchant) {
                // Character gives item to merchant directly from loot container
                return [
                    requester.character?.name ?? requester.name,
                    localize("GiveSubtitle"),
                    [
                        localize("GiveMessage"),
                        {
                            seller: requester.character?.name ?? requester.name,
                            buyer: ItemTransfer.#tokenName(targetActor),
                        },
                    ],
                ];
            } else if (source.isMerchant && target.isCharacter) {
                // Merchant sells item to character
                return [
                    ItemTransfer.#tokenName(sourceActor),
                    localize("SellSubtitle"),
                    [
                        localize("SellMessage"),
                        { seller: ItemTransfer.#tokenName(sourceActor), buyer: ItemTransfer.#tokenName(targetActor) },
                    ],
                ];
            } else if (source.isMerchant && target.isLoot) {
                // Merchant sells item to character, who stows it directly in loot container
                return [
                    requester.character?.name ?? requester.name,
                    localize("SellSubtitle"),
                    [
                        localize("SellMessage"),
                        {
                            seller: ItemTransfer.#tokenName(sourceActor),
                            buyer: requester.character?.name ?? requester.name,
                        },
                    ],
                ];
            } else {
                // Possibly to fill out later: Merchant sells item to character directly from loot container
                throw ErrorAvant("Unexpected item-transfer failure");
            }
        })();
        const formatProperties = formatArgs[1];
        if (!formatProperties) throw ErrorAvant("Unexpected item-transfer failure");
        formatProperties.quantity = this.quantity;
        formatProperties.item = await TextEditor.enrichHTML(item.link);

        // Don't bother showing quantity if it's only 1:
        const content = await renderTemplate(this.#templatePaths.content, {
            imgPath: item.img,
            message: game.i18n.format(...formatArgs).replace(/\b1 × /, ""),
        });

        const flavor = await this.#messageFlavor(sourceActor, targetActor, subtitle);

        await ChatMessage.create({
            author: requester.id,
            speaker: { alias: speaker },
            style: CONST.CHAT_MESSAGE_STYLES.EMOTE,
            flavor,
            content,
        });
    }

    async #messageFlavor(sourceActor: ActorAvant, targetActor: ActorAvant, subtitle: string): Promise<string> {
        const glyph = getActionGlyph(sourceActor.isOfType("loot") && targetActor.isOfType("loot") ? 2 : 1);
        const action = { title: "AVANT.Actions.Interact.Title", subtitle: subtitle, glyph };
        const traits: TraitViewData[] = [
            {
                name: "manipulate",
                label: CONFIG.AVANT.featTraits.manipulate,
                description: CONFIG.AVANT.traitsDescriptions.manipulate,
            },
        ];

        return await renderTemplate(this.#templatePaths.flavor, { action, traits });
    }
}
