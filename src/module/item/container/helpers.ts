import { ActorAvant } from "@actor/base.ts";
import { ContainerAvant, PhysicalItemAvant } from "@item";

/**
 * Detect if adding an item to a container would produce a cycle
 * @param item The item being added to a container
 * @param container The container to which the item is being added
 */
function isContainerCycle(item: PhysicalItemAvant, container: ContainerAvant<ActorAvant>): boolean {
    if (item === container) return true;
    if (container.container) return isContainerCycle(item, container.container);
    return false;
}

/** Returns true if any of the item's container ancestry is extradimensional */
function hasExtraDimensionalParent(item: ContainerAvant, encountered = new Set<string>()): boolean {
    // Check for cyclical reference
    if (encountered.has(item.id)) return false;
    encountered.add(item.id);

    const parent = item.container;
    if (!parent) return false;
    if (parent.traits.has("extradimensional")) return true;
    encountered.add(parent.id);
    return hasExtraDimensionalParent(parent);
}

export { hasExtraDimensionalParent, isContainerCycle };
