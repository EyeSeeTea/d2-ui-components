/** d2 ModelCollection-like interface used by the org unit tree */
interface D2Collection<T> {
    size: number;
    includes(item: unknown): boolean;
    get(key: string): T;
    toArray(): T[];
}

export interface OrgUnitNode {
    path: string;
    memberCount: number;
    children: D2Collection<OrgUnitNode> | OrgUnitNode[];
}

/**
 * Execute an operation for each org unit within a tree along a path
 */
export function forEachOnPath(
    root: OrgUnitNode,
    path: ReadonlyArray<string>,
    op: (ou: OrgUnitNode) => void
): void {
    op(root);
    if (
        path.length > 0 &&
        (Array.isArray(root.children) || (root.children as D2Collection<OrgUnitNode>).size > 0)
    ) {
        const children = root.children as D2Collection<OrgUnitNode>;
        if (children.includes(path[0])) {
            forEachOnPath(children.get(path[0]), path.slice(1), op);
        } else {
            forEachOnPath(root, path.slice(1), op);
        }
    }
}

/**
 * Decrement the selected member count of the specified org unit and all its ascendants
 */
export function decrementMemberCount(root: OrgUnitNode, orgUnit: { readonly path: string }): void {
    forEachOnPath(root, orgUnit.path.substr(1).split("/").slice(1), ou => ou.memberCount--);
}

/**
 * Increment the selected member count of the specified org unit and all its ascendants
 */
export function incrementMemberCount(root: OrgUnitNode, orgUnit: { readonly path: string }): void {
    forEachOnPath(root, orgUnit.path.substr(1).split("/").slice(1), ou => ou.memberCount++);
}

/**
 * Merge the specified children into the org unit tree with the specified root
 */
export function mergeChildren(root: OrgUnitNode, children: D2Collection<OrgUnitNode>): OrgUnitNode {
    function assignChildren(
        node: OrgUnitNode,
        path: ReadonlyArray<string>,
        newChildren: D2Collection<OrgUnitNode>
    ): OrgUnitNode {
        if (path.length === 0) {
            node.children = newChildren;
        } else {
            assignChildren(
                (node.children as D2Collection<OrgUnitNode>).get(path[0]),
                path.slice(1),
                newChildren
            );
        }
        return node;
    }

    const childPath = children.toArray()[0].path.substr(1).split("/");
    childPath.splice(-1, 1);
    return assignChildren(root, childPath.slice(1), children);
}
