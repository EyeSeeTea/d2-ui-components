import React from "react";
import OrgUnitTree, { OrgUnitTreeProps, OrgUnit } from "./OrgUnitTree.component";

export interface OrgUnitTreeMultipleRootsProps extends OrgUnitTreeProps {
    /** Multiple root org units to render as separate trees */
    readonly roots?: ReadonlyArray<OrgUnit>;
}

export default function OrgUnitTreeMultipleRoots(
    props: OrgUnitTreeMultipleRootsProps
): React.ReactElement {
    if (props.roots) {
        // Destructure roots out so rest contains only OrgUnitTreeProps
        const { roots, ...treeProps } = props;
        return (
            <div>
                {roots.map((root, index) => (
                    <OrgUnitTree
                        key={index}
                        {...treeProps}
                        root={root}
                        onSelectClick={props.onSelectClick}
                    />
                ))}
            </div>
        );
    }

    const { roots: _roots, ...treeProps } = props;
    return <OrgUnitTree {...treeProps} />;
}
