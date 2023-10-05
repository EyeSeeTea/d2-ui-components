import React from "react";
import PropTypes from "prop-types";
import { LinearProgress } from "@material-ui/core";

import { TreeView } from "@dhis2/d2-ui-core";

const styles = {
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

class OrgUnitTree extends React.Component {
    constructor(props) {
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

    componentDidMount() {
        if (this.props.initiallyExpanded.some(ou => ou.includes(`/${this.props.root.id}`))) {
            this.loadChildren();
        }
    }

    setChildState(children) {
        if (this.props.onChildrenLoaded) this.props.onChildrenLoaded(children);

        const keyToOrder = this.props.useShortNames ? "shortName" : "displayName";

        this.setState({
            children: children.sort((a, b) => a[keyToOrder].localeCompare(b[keyToOrder])),
            loading: false,
        });
    }

    loadChildren() {
        const { root, api, idsThatShouldBeReloaded } = this.props;

        if (
            (this.state.children === undefined && !this.state.loading) ||
            idsThatShouldBeReloaded.indexOf(root.id) >= 0
        ) {
            this.setState({ loading: true });

            const childrenIds = root.children.map(({ id }) => id);
            api.models.organisationUnits
                .get({
                    paging: false,
                    fields: {
                        id: true,
                        level: true,
                        displayName: true,
                        shortName: true,
                        children: true,
                        path: true,
                        parent: true,
                    },
                    filter: {
                        id: {
                            in: childrenIds,
                        },
                    },
                })
                .getData()
                .then(({ objects }) => {
                    this.setChildState(objects);
                });
        }
    }

    handleSelectClick(e) {
        if (this.props.onSelectClick) {
            this.props.onSelectClick(e, this.props.root);
        }
        e.stopPropagation();
    }

    handleSelectableLevel = (selectableLevels, currentOu) => {
        if (selectableLevels.length === 0) {
            return !!this.props.onSelectClick;
        } else {
            return (
                !!this.props.onSelectClick && selectableLevels.includes(currentOu.level) === true
            );
        }
    };

    shouldIncludeOrgUnit(orgUnit) {
        if (!this.props.orgUnitsPathsToInclude || this.props.orgUnitsPathsToInclude.length === 0) {
            return true;
        }
        return !!this.props.orgUnitsPathsToInclude.some(ou => ou.includes(`/${orgUnit.id}`));
    }

    renderChild(orgUnit, expandedProp) {
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
                    selectedLabelStyle={this.props.selectedLabelStyle}
                    arrowSymbol={this.props.arrowSymbol}
                    idsThatShouldBeReloaded={this.props.idsThatShouldBeReloaded}
                    hideCheckboxes={this.props.hideCheckboxes}
                    onChildrenLoaded={this.props.onChildrenLoaded}
                    hideMemberCount={this.props.hideMemberCount}
                    orgUnitsPathsToInclude={this.props.orgUnitsPathsToInclude}
                    selectableIds={this.props.selectableIds}
                    useShortNames={this.props.useShortNames}
                />
            );
        }
        return null;
    }

    renderChildren() {
        // If initiallyExpanded is an array, remove the current root id and pass the rest on
        // If it's a string, pass it on unless it's the current root id
        const expandedProp = Array.isArray(this.props.initiallyExpanded)
            ? this.props.initiallyExpanded.filter(id => id !== this.props.root.id)
            : (this.props.initiallyExpanded !== this.props.root.id &&
                  this.props.initiallyExpanded) ||
              [];
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

    render() {
        const {
            root: currentOu,
            selectableLevels,
            typeInput,
            selectableIds,
            selected = [],
            hideCheckboxes,
        } = this.props;

        const maxSelectableLevel = Math.max(...selectableLevels);
        const isExcluded = selectableIds && !selectableIds.includes(currentOu.id);
        const isSelectable = !isExcluded && this.handleSelectableLevel(selectableLevels, currentOu);
        const pathRegEx = new RegExp(`/${currentOu.id}$`);
        const memberRegEx = new RegExp(`/${currentOu.id}`);
        const isSelected = selected.some(ou => pathRegEx.test(ou));

        // True if this OU has children = is not a leaf node
        const hasChildren =
            this.state.children === undefined ||
            !selectableLevels ||
            (Array.isArray(this.state.children) && this.state.children.length > 0);

        // True if this OU is the current root
        const isCurrentRoot = this.props.currentRoot && this.props.currentRoot.id === currentOu.id;
        // True if this OU should be expanded by default
        const isInitiallyExpanded = this.props.initiallyExpanded.some(ou =>
            ou.includes(`/${currentOu.id}`)
        );
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
        const labelStyle = Object.assign(
            {},
            styles.label,
            {
                fontWeight: isSelected ? 500 : 300,
                color: isSelected ? "orange" : "inherit",
                cursor: canBecomeCurrentRoot ? "pointer" : "default",
            },
            isSelected ? this.props.selectedLabelStyle : this.props.labelStyle
        );

        // Styles for this OU and OUs contained within it
        const ouContainerStyle = Object.assign(
            {},
            styles.ouContainer,
            isCurrentRoot ? styles.currentOuContainer : {}
        );

        // Wrap the change root click handler in order to stop event propagation
        const setCurrentRoot = e => {
            e.stopPropagation();
            this.props.onChangeCurrentRoot(currentOu);
        };
        const handletypeInput = typeInput !== undefined ? typeInput : "checkbox";

        const onClick = this.props.selectOnClick
            ? this.handleSelectClick
            : (canBecomeCurrentRoot && setCurrentRoot) || (isSelectable && this.handleSelectClick);

        const label = (
            <div style={labelStyle} onClick={onClick || undefined} role="button" tabIndex={0}>
                {isSelectable && !hideCheckboxes && (
                    <input
                        type={handletypeInput}
                        readOnly
                        disabled={!isSelectable}
                        checked={isSelected}
                        onClick={this.handleSelectClick}
                    />
                )}
                {this.props.useShortNames ? currentOu.shortName : currentOu.displayName}
                {hasChildren && !this.props.hideMemberCount && !!memberCount && (
                    <span style={styles.memberCount}>({memberCount})</span>
                )}
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

function orgUnitPathPropValidator(propValue, key, compName, location, propFullName) {
    if (!/(\/[a-zA-Z][a-zA-Z0-9]{10})+/.test(propValue[key])) {
        return new Error(
            `Invalid org unit path \`${propValue[key]}\` supplied to \`${compName}.${propFullName}\``
        );
    }
    return undefined;
}

OrgUnitTree.propTypes = {
    /**
     * The API connection (d2-api)
     */
    api: PropTypes.object.isRequired,

    /**
     * The root OrganisationUnit of the tree
     *
     * If the root OU is known to have no children, the `children` property of the root OU should be either
     * `false` or an empty array. If the children property is undefined, the children will be fetched from
     * the server when the tree is expanded.
     */
    root: PropTypes.object.isRequired,

    /**
     * An array of paths of selected OUs
     *
     * The path of an OU is the UIDs of the OU and all its parent OUs separated by slashes (/)
     */
    selected: PropTypes.arrayOf(orgUnitPathPropValidator),

    /**
     * An array of OU paths that will be expanded automatically as soon as they are encountered
     *
     * The path of an OU is the UIDs of the OU and all its parent OUs separated by slashes (/)
     */
    initiallyExpanded: PropTypes.arrayOf(orgUnitPathPropValidator),

    /**
     * onSelectClick callback, which is triggered when a click triggers the selection of an organisation unit
     *
     * The onSelectClick callback will receive two arguments: The original click event, and the OU that was clicked
     */
    onSelectClick: PropTypes.func,
    typeInput: PropTypes.string,
    selectableLevels: PropTypes.arrayOf(PropTypes.number),
    selectOnClick: PropTypes.bool,

    /**
     * onChangeCurrentRoot callback, which is triggered when the change current root label is clicked. Setting this also
     * enables the display of the change current root label
     *
     * the onChangeCurrentRoot callback will receive two arguments: The original click event, and the organisation unit
     * model object that was selected as the new root
     */
    onChangeCurrentRoot: PropTypes.func,

    /**
     * Organisation unit model representing the current root
     */
    currentRoot: PropTypes.object,

    /**
     * onChildrenLoaded callback, which is triggered when the children of this root org unit have been loaded
     *
     * The callback receives one argument: An array that contains all the newly loaded org units
     */
    onChildrenLoaded: PropTypes.func,

    /**
     * Custom styling for OU labels
     */
    labelStyle: PropTypes.object,

    /**
     * Custom styling for the labels of selected OUs
     */
    selectedLabelStyle: PropTypes.object,

    /**
     * An array of organisation unit IDs that should be reloaded from the API
     */
    idsThatShouldBeReloaded: PropTypes.arrayOf(PropTypes.string),

    /**
     * Custom arrow symbol
     */
    arrowSymbol: PropTypes.string,

    /**
     * If true, don't display checkboxes next to org unit labels
     */
    hideCheckboxes: PropTypes.bool,

    /**
     * if true, don't display the selected member count next to org unit labels
     */
    hideMemberCount: PropTypes.bool,

    /**
     * Array of paths of Organisation Units to include on tree. If not defined or empty, all children from root to leafs will be shown
     */
    orgUnitsPathsToInclude: PropTypes.array,

    /**
     * Array of org unit ids to filter checkbox selection
     */
    selectableIds: PropTypes.arrayOf(PropTypes.string),
};

OrgUnitTree.defaultProps = {
    selected: [],
    initiallyExpanded: [],
    onSelectClick: undefined,
    selectableLevels: [],
    onChangeCurrentRoot: undefined,
    currentRoot: undefined,
    onChildrenLoaded: undefined,
    labelStyle: {},
    selectedLabelStyle: {},
    typeInput: undefined,
    selectOnClick: false,
    idsThatShouldBeReloaded: [],
    arrowSymbol: undefined,
    hideCheckboxes: false,
    hideMemberCount: false,
    orgUnitsPathsToInclude: null,
};

export default OrgUnitTree;
