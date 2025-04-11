import type { ActorAvant } from "@actor";
import type { ItemAvant } from "@item";

/** Check an item prior to its deletion for GrantItem on-delete actions */
async function processGrantDeletions(item: ItemAvant<ActorAvant>, pendingItems: ItemAvant<ActorAvant>[]): Promise<void> {
    const actor = item.actor;
    const granter = actor.items.get(item.flags.avant.grantedBy?.id ?? "");
    const parentGrant = Object.values(granter?.flags.avant.itemGrants ?? {}).find((g) => g.id === item.id);
    const grants = Object.values(item.flags.avant.itemGrants);

    // Handle deletion restrictions, aborting early if found in either this item's granter or any of its grants
    if (granter && parentGrant?.onDelete === "restrict" && !pendingItems.includes(granter)) {
        ui.notifications.warn(
            game.i18n.format("AVANT.Item.RemovalPrevented", { item: item.name, preventer: granter.name }),
        );
        pendingItems.splice(pendingItems.indexOf(item), 1);
        return;
    }

    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.avant.grantedBy?.id !== item.id) continue;

        if (grantee.flags.avant.grantedBy.onDelete === "restrict" && !pendingItems.includes(grantee)) {
            ui.notifications.warn(
                game.i18n.format("AVANT.Item.RemovalPrevented", { item: item.name, preventer: grantee.name }),
            );
            pendingItems.splice(pendingItems.indexOf(item), 1);
            return;
        }
    }

    // Handle deletion cascades, pushing additional items onto the `pendingItems` array
    if (granter && parentGrant?.onDelete === "cascade" && !pendingItems.includes(granter)) {
        pendingItems.push(granter);
        await processGrantDeletions(granter, pendingItems);
    }

    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.avant.grantedBy?.id !== item.id) continue;

        if (grantee.flags.avant.grantedBy.onDelete === "cascade" && !pendingItems.includes(grantee)) {
            pendingItems.push(grantee);
            await processGrantDeletions(grantee, pendingItems);
        }
    }

    // Finally, handle detachments, removing the grant data from grantees' `grantedBy` objects
    for (const grant of grants) {
        const grantee = actor.items.get(grant.id);
        if (grantee?.flags.avant.grantedBy?.id !== item.id) continue;

        // Unset the grant flag and leave the granted item on the actor
        if (grantee.flags.avant.grantedBy.onDelete === "detach" && !pendingItems.includes(grantee)) {
            await grantee.update({ "flags.avant.-=grantedBy": null }, { render: false });
        }
    }
}

export { processGrantDeletions };
