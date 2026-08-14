import React from "react";
import _ from "lodash";
import { LinearProgress } from "@material-ui/core";

// We can copy the whole component to this repo
// and remove @dhis2/d2-ui-core as dependency?
// https://github.com/dhis2/d2-ui/blob/v7.4.3/packages/core/src/tree-view/TreeView.component.js
// eslint-disable-next-line @typescript-eslint/no-var-requires
const TreeView: React.ComponentType<any> = require("@dhis2/d2-ui-core/tree-view/TreeView.component")
    .default;

export interface OrgUnit {
    readonly id: string;
    readonly level: number;
    readonly displayName: string;
    readonly shortName: string;
    readonly children: ReadonlyArray<{ readonly id: string }> | false;
    readonly path: string;
    readonly parent?: { readonly id: string };
    readonly memberCount?: number;
    readonly [key: string]: unknown;
}

export interface OnChildrenLoaded {
    readonly fields?: ReadonlyArray<string>;
    readonly fn: (children: ReadonlyArray<OrgUnit>) => void;
}

interface OrgUnitApi {
    readonly models: {
        readonly organisationUnits: {
            get(
                params: Record<string, unknown>
            ): {
                getData(): Promise<{ objects: OrgUnit[] }>;
            };
        };
    };
}

export interface OrgUnitTreeProps {
    /** The API connection (d2-api) */
    readonly api: OrgUnitApi;
    /**
     * The root OrganisationUnit of the tree.
     * If the root OU is known to have no children, the `children` property should be either
     * `false` or an empty array. If undefined, children will be fetched from the server on expand.
     */
    readonly root: OrgUnit;
    /** An array of paths of selected OUs */
    readonly selected?: ReadonlyArray<string>;
    /** An array of OU paths that will be expanded automatically as soon as they are encountered */
    readonly initiallyExpanded?: ReadonlyArray<string>;
    /** Triggered when a click triggers the selection of an organisation unit */
    readonly onSelectClick?: (event: React.MouseEvent, orgUnit: OrgUnit) => void;
    readonly typeInput?: string;
    readonly selectableLevels?: ReadonlyArray<number>;
    readonly selectOnClick?: boolean;
    /** Triggered when the change-current-root label is clicked */
    readonly onChangeCurrentRoot?: (orgUnit: OrgUnit) => void;
    /** Organisation unit representing the current root */
    readonly currentRoot?: OrgUnit;
    /** Callback with fields, triggered when children of this root have been loaded */
    readonly onChildrenLoaded?: OnChildrenLoaded;
    /** Custom styling for OU labels */
    readonly labelStyle?: React.CSSProperties;
    /** Custom component to render on labels */
    readonly labelChildren?: (props: { currentOu: OrgUnit }) => React.ReactNode;
    /** Custom styling for the labels of selected OUs */
    readonly selectedLabelStyle?: React.CSSProperties;
    /** An array of organisation unit IDs that should be reloaded from the API */
    readonly idsThatShouldBeReloaded?: ReadonlyArray<string>;
    /** Custom arrow symbol */
    readonly arrowSymbol?: string;
    /** If true, don't display checkboxes next to org unit labels */
    readonly hideCheckboxes?: boolean;
    /** If true, don't display the selected member count next to org unit labels */
    readonly hideMemberCount?: boolean;
    /** Array of paths of Organisation Units to include on tree */
    readonly orgUnitsPathsToInclude?: ReadonlyArray<string> | null;
    /** Array of org unit ids to filter checkbox selection */
    readonly selectableIds?: ReadonlyArray<string>;
    /** If true, use shortName instead of displayName */
    readonly useShortNames?: boolean;
    /** If true, all orgunits will not be clickable */
    readonly disabled?: boolean;
}

interface OrgUnitTreeState {
    children: ReadonlyArray<OrgUnit> | undefined;
    loading: boolean;
}

const styles: Readonly<Record<string, React.CSSProperties>> = {
    progress: {
        position: "absolute",
        display: "inline-block",
        width: "100%",
        left: -8,
    },
    progressBar: {
        height: 2,
        backgroundColor: "transparent",
    },
    spacer: {
        position: "relative",
        display: "inline-block",
        width: "1.2rem",
        height: "1rem",
    },
    label: {
        display: "inline-block",
        outline: "none",
    },
    ouContainer: {
        borderColor: "transparent",
        borderStyle: "solid",
        borderWidth: "1px",
        borderRightWidth: 0,
        borderRadius: "3px 0 0 3px",
        background: "transparent",
        paddingLeft: 2,
        outline: "none",
    },
    currentOuContainer: {
        background: "rgba(0,0,0,0.05)",
        borderColor: "rgba(0,0,0,0.1)",
    },
    memberCount: {
        fontSize: "0.75rem",
        marginLeft: 4,
    },
};

class OrgUnitTree extends React.Component<OrgUnitTreeProps, OrgUnitTreeState> {
    static defaultProps: Partial<OrgUnitTreeProps> = {
        selected: [],
        initiallyExpanded: [],
        onSelectClick: undefined,
        selectableLevels: [],
        onChangeCurrentRoot: undefined,
        currentRoot: undefined,
        onChildrenLoaded: undefined,
        labelStyle: {},
        labelChildren: undefined,
        selectedLabelStyle: {},
        typeInput: undefined,
        selectOnClick: false,
        idsThatShouldBeReloaded: [],
        arrowSymbol: undefined,
        hideCheckboxes: false,
        hideMemberCount: false,
        orgUnitsPathsToInclude: null,
        disabled: false,
    };

    constructor(props: OrgUnitTreeProps) {
        super(props);

        this.state = {
            children:
                props.root.children === false ||
                (Array.isArray(props.root.children) && props.root.children.length === 0)
                    ? []
                    : undefined,
            loading: false,
        };

        this.loadChildren = this.loadChildren.bind(this);
        this.handleSelectClick = this.handleSelectClick.bind(this);
    }

    componentDidMount(): void {
        const { initiallyExpanded = [], root } = this.props;
        if (initiallyExpanded.some(ou => ou.includes(`/${root.id}`))) {
            this.loadChildren();
        }
    }

    setChildState(children: ReadonlyArray<OrgUnit>): void {
        if (this.props.onChildrenLoaded) this.props.onChildrenLoaded.fn(children);

        const keyToOrder: "shortName" | "displayName" = this.props.useShortNames
            ? "shortName"
            : "displayName";

        this.setState({
            children: [...children].sort((a, b) => a[keyToOrder].localeCompare(b[keyToOrder])),
            loading: false,
        });
    }

    loadChildren(): void {
        const { root, api, idsThatShouldBeReloaded = [], onChildrenLoaded } = this.props;

        if (
            (this.state.children === undefined && !this.state.loading) ||
            idsThatShouldBeReloaded.indexOf(root.id) >= 0
        ) {
            this.setState({ loading: true });

            const children = root.children;
            if (children === false) return;

            const childrenIds = children.map(({ id }) => id);

            const extraFields = onChildrenLoaded
                ? _(onChildrenLoaded.fields || [])
                      .map(field => [field, true] as const)
                      .fromPairs()
                      .value()
                : undefined;

            const fields = {
                id: true,
                level: true,
                displayName: true,
                shortName: true,
                children: true,
                path: true,
                parent: true,
                ...extraFields,
            };

            api.models.organisationUnits
                .get({
                    paging: false,
                    fields,
                    filter: {
                        id: {
                            in: childrenIds,
                        },
                    },
                })
                .getData()
                .then(({ objects }) => {
                    this.setChildState(objects);

                    if (onChildrenLoaded?.fn) {
                        onChildrenLoaded.fn(objects);
                    }
                });
        }
    }

    handleSelectClick(e: React.MouseEvent): void {
        if (!this.props.disabled && this.props.onSelectClick) {
            this.props.onSelectClick(e, this.props.root);
        }
        e.stopPropagation();
    }

    handleSelectableLevel = (
        selectableLevels: ReadonlyArray<number>,
        currentOu: OrgUnit
    ): boolean => {
        if (selectableLevels.length === 0) {
            return !!this.props.onSelectClick;
        } else {
            return !!this.props.onSelectClick && selectableLevels.includes(currentOu.level);
        }
    };

    shouldIncludeOrgUnit(orgUnit: OrgUnit): boolean {
        if (!this.props.orgUnitsPathsToInclude || this.props.orgUnitsPathsToInclude.length === 0) {
            return true;
        }
        return !!this.props.orgUnitsPathsToInclude.some(ou => ou.includes(`/${orgUnit.id}`));
    }

    renderChild(orgUnit: OrgUnit, expandedProp: ReadonlyArray<string>): React.ReactNode {
        if (this.shouldIncludeOrgUnit(orgUnit)) {
            return (
                <OrgUnitTree
                    api={this.props.api}
                    key={orgUnit.id}
                    root={orgUnit}
                    selected={this.props.selected}
                    initiallyExpanded={expandedProp}
                    onSelectClick={this.props.onSelectClick}
                    selectableLevels={this.props.selectableLevels}
                    typeInput={this.props.typeInput}
                    selectOnClick={this.props.selectOnClick}
                    currentRoot={this.props.currentRoot}
                    onChangeCurrentRoot={this.props.onChangeCurrentRoot}
                    labelStyle={this.props.labelStyle}
                    labelChildren={this.props.labelChildren}
                    selectedLabelStyle={this.props.selectedLabelStyle}
                    arrowSymbol={this.props.arrowSymbol}
                    idsThatShouldBeReloaded={this.props.idsThatShouldBeReloaded}
                    hideCheckboxes={this.props.hideCheckboxes}
                    onChildrenLoaded={this.props.onChildrenLoaded}
                    hideMemberCount={this.props.hideMemberCount}
                    orgUnitsPathsToInclude={this.props.orgUnitsPathsToInclude}
                    selectableIds={this.props.selectableIds}
                    useShortNames={this.props.useShortNames}
                    disabled={this.props.disabled}
                />
            );
        }
        return null;
    }

    renderChildren(): React.ReactNode {
        const { initiallyExpanded = [], root } = this.props;

        // If initiallyExpanded is an array, remove the current root id and pass the rest on
        const expandedProp = initiallyExpanded.filter(id => id !== root.id);

        if (Array.isArray(this.state.children) && this.state.children.length > 0) {
            return this.state.children.map(orgUnit => this.renderChild(orgUnit, expandedProp));
        }

        if (this.state.loading) {
            return (
                <div style={styles.progress}>
                    <LinearProgress style={styles.progressBar} />
                </div>
            );
        }

        return null;
    }

    render(): React.ReactNode {
        const {
            root: currentOu,
            selectableLevels = [],
            typeInput,
            selectableIds,
            selected = [],
            hideCheckboxes,
            disabled,
        } = this.props;

        const maxSelectableLevel = Math.max(...selectableLevels);
        const isExcluded = selectableIds && !selectableIds.includes(currentOu.id);
        const isSelectable = !isExcluded && this.handleSelectableLevel(selectableLevels, currentOu);
        const pathRegEx = new RegExp(`/${currentOu.id}$`);
        const memberRegEx = new RegExp(`/${currentOu.id}`);
        const isSelected = !disabled && selected.some(ou => pathRegEx.test(ou));

        // True if this OU has children = is not a leaf node
        const hasChildren =
            this.state.children === undefined ||
            !selectableLevels ||
            (Array.isArray(this.state.children) && this.state.children.length > 0);

        // True if this OU is the current root
        const isCurrentRoot = this.props.currentRoot && this.props.currentRoot.id === currentOu.id;
        // True if this OU should be expanded by default
        const initiallyExpanded = this.props.initiallyExpanded ?? [];
        const isInitiallyExpanded = initiallyExpanded.some(ou => ou.includes(`/${currentOu.id}`));
        // True if this OU can BECOME the current root, which means that:
        // 1) there is a change root handler
        // 2) this OU is not already the current root
        // 3) this OU has children (is not a leaf node)
        const canBecomeCurrentRoot =
            this.props.onChangeCurrentRoot && !isCurrentRoot && hasChildren;

        const memberCount =
            this.props.selected !== undefined
                ? this.props.selected.filter(ou => memberRegEx.test(ou)).length
                : currentOu.memberCount;

        // Hard coded styles for OU name labels - can be overridden with the selectedLabelStyle and labelStyle props
        const labelStyle: React.CSSProperties = {
            ...styles.label,
            fontWeight: isSelected ? 500 : 300,
            color: isSelected ? "orange" : disabled ? "#757575" : "inherit",
            cursor: canBecomeCurrentRoot && !disabled ? "pointer" : "default",
            ...(isSelected ? this.props.selectedLabelStyle : this.props.labelStyle),
        };

        // Styles for this OU and OUs contained within it
        const ouContainerStyle: React.CSSProperties = {
            ...styles.ouContainer,
            ...(isCurrentRoot ? styles.currentOuContainer : {}),
        };

        // Wrap the change root click handler in order to stop event propagation
        const setCurrentRoot = (e: React.MouseEvent): void => {
            e.stopPropagation();
            if (this.props.onChangeCurrentRoot) this.props.onChangeCurrentRoot(currentOu);
        };
        const handletypeInput = typeInput !== undefined ? typeInput : "checkbox";

        const onClick = disabled
            ? undefined
            : (this.props.selectOnClick
                  ? this.handleSelectClick
                  : (canBecomeCurrentRoot && setCurrentRoot) ||
                    (isSelectable && this.handleSelectClick)) || undefined;

        const inputClick = disabled ? undefined : this.handleSelectClick;

        const label = (
            <div style={labelStyle} onClick={onClick || undefined} role="button" tabIndex={0}>
                {isSelectable && !hideCheckboxes && (
                    <input
                        type={handletypeInput}
                        readOnly
                        disabled={disabled || !isSelectable}
                        checked={isSelected}
                        onClick={inputClick}
                    />
                )}
                {this.props.useShortNames ? currentOu.shortName : currentOu.displayName}
                {hasChildren && !this.props.hideMemberCount && !!memberCount && (
                    <span style={styles.memberCount}>({memberCount})</span>
                )}
                {this.props.labelChildren && this.props.labelChildren({ currentOu: currentOu })}
            </div>
        );

        if (hasChildren && currentOu.level !== maxSelectableLevel) {
            return (
                <TreeView
                    label={label}
                    onExpand={this.loadChildren}
                    persistent
                    initiallyExpanded={isInitiallyExpanded}
                    arrowSymbol={this.props.arrowSymbol}
                    className="orgunit with-children"
                    style={ouContainerStyle}
                >
                    {this.renderChildren()}
                </TreeView>
            );
        }

        return (
            <div
                onClick={(isSelectable && this.handleSelectClick) || undefined}
                className="orgunit without-children"
                style={ouContainerStyle}
                role="button"
                tabIndex={0}
            >
                <div style={styles.spacer} />
                {label}
            </div>
        );
    }
}

export default OrgUnitTree;
