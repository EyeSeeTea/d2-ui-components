import { Card, CardContent, FormControlLabel, Switch } from "@material-ui/core";
import _ from "lodash";
import PropTypes from "prop-types";
import React from "react";
import {
    OrgUnitSelectAll,
    OrgUnitSelectByGroup,
    OrgUnitSelectByLevel,
    OrgUnitSelectByProgram,
} from "../org-unit-select";
import { decrementMemberCount, incrementMemberCount, OrgUnitTree } from "../org-unit-tree";
import SearchBox from "../search-box/SearchBox";
import i18n from "../utils/i18n";
import { promiseMap } from "../utils/promiseMap";

// Base code taken from d2-ui/examples/create-react-app/src/components/org-unit-selector.js

export default class OrgUnitsSelector extends React.Component {
    static propTypes = {
        api: PropTypes.object.isRequired,
        onChange: PropTypes.func.isRequired,
        selected: PropTypes.arrayOf(PropTypes.string).isRequired,
        initiallyExpanded: PropTypes.arrayOf(PropTypes.string),
        levels: PropTypes.arrayOf(PropTypes.number),
        rootIds: PropTypes.arrayOf(PropTypes.string),
        listParams: PropTypes.object,
        labelChildren: PropTypes.func,
        controls: PropTypes.shape({
            filterByLevel: PropTypes.bool,
            filterByGroup: PropTypes.bool,
            filterByProgram: PropTypes.bool,
            selectAll: PropTypes.bool,
        }),
        withElevation: PropTypes.bool,
        height: PropTypes.number,
        hideCheckboxes: PropTypes.bool,
        fullWidth: PropTypes.bool,
        square: PropTypes.bool,
        singleSelection: PropTypes.bool,
        selectableIds: PropTypes.arrayOf(PropTypes.string),
        showShortName: PropTypes.bool,
        showNameSetting: PropTypes.bool,
        onUseShortNamesChange: PropTypes.func,
        onChildrenLoaded: PropTypes.shape({
            fields: PropTypes.arrayOf(PropTypes.string),
            fn: PropTypes.func,
        }),
    };

    static defaultProps = {
        levels: null,
        labelChildren: null,
        controls: {
            filterByLevel: true,
            filterByGroup: true,
            filterByProgram: false,
            selectAll: true,
        },
        withElevation: true,
        height: 350,
        hideCheckboxes: false,
        fullWidth: true,
        square: false,
        singleSelection: false,
        selectableIds: undefined,
        showShortName: false,
        showNameSetting: false,
    };

    static childContextTypes = {
        api: PropTypes.object.isRequired,
    };

    constructor(props) {
        super(props);

        this.state = {
            cancel: null,
            levels: null,
            roots: null,
            groups: null,
            programs: null,
            currentRoot: null,
            selectedFilters: {
                level: null,
                orgUnitGroupId: null,
                programId: null,
            },
            useShortNames: props.showShortName,
        };
        this.contentsStyle = { ...styles.contents, height: props.height };
    }

    componentDidMount() {
        const { props } = this;
        const { filterByLevel, filterByGroup, filterByProgram } = props.controls;

        Promise.all([
            !filterByLevel
                ? Promise.resolve([])
                : props.api.models.organisationUnitLevels
                      .get({
                          paging: false,
                          fields: { id: true, level: true, displayName: true },
                          order: "level:asc",
                          filter: { level: { in: props.levels } },
                      })
                      .getData()
                      .then(({ objects }) => objects),
            !filterByGroup
                ? Promise.resolve([])
                : props.api.models.organisationUnitGroups
                      .get({
                          pageSize: 1,
                          paging: false,
                          fields: { id: true, displayName: true },
                      })
                      .getData()
                      .then(({ objects }) => objects),
            !filterByProgram
                ? Promise.resolve([])
                : props.api.models.programs
                      .get({
                          pageSize: 1,
                          paging: false,
                          fields: { id: true, displayName: true },
                      })
                      .getData()
                      .then(({ objects }) => objects),
            this.getRoots(),
        ]).then(([levels, groups, programs, defaultRoots]) => {
            this.setState({
                roots: defaultRoots,
                levels,
                groups,
                programs,
            });
        });
    }

    queryRoots({ search }) {
        const { api, rootIds, listParams } = this.props;
        const baseOptions = {
            fields: {
                id: true,
                level: true,
                displayName: true,
                path: true,
                children: true,
                geometry: true,
            },
            ...listParams,
        };

        if (search) {
            return api.models.organisationUnits.get({
                ...baseOptions,
                paging: true,
                pageSize: 1000,
                filter: { displayName: { ilike: search } },
            });
        } else if (rootIds) {
            let cancel = false;
            return {
                getData: async () => {
                    const responses = await promiseMap(_.chunk(rootIds, 400), ids => {
                        if (cancel) return { objects: [] };
                        return api.models.organisationUnits
                            .get({ ...baseOptions, paging: false, filter: { id: { in: ids } } })
                            .getData();
                    });

                    return { objects: _.flatMap(responses, ({ objects }) => objects) };
                },
                cancel: () => {
                    cancel = true;
                },
            };
        } else {
            return api.models.organisationUnits.get({ ...baseOptions, level: 1, paging: false });
        }
    }

    getRoots({ search } = {}) {
        const { rootIds, selectableLevels } = this.props;
        const postFilter = search
            ? orgUnits =>
                  _(orgUnits)
                      .filter(orgUnit =>
                          selectableLevels
                              ? selectableLevels.includes(orgUnit.level)
                              : !rootIds || rootIds.some(ouId => orgUnit.path.includes(ouId))
                      )
                      .take(50)
                      .value()
            : _.identity;

        const response = this.queryRoots({ search });
        if (this.state.cancel) this.state.cancel();
        this.setState({ cancel: response.cancel });

        return response
            .getData()
            .then(({ objects }) => objects)
            .then(postFilter);
    }

    getChildContext() {
        return {
            api: this.props.api,
        };
    }

    handleSelectionUpdate = newSelection => {
        this.props.onChange(newSelection);
    };

    handleOrgUnitClick = (root, event, orgUnit) => {
        if (this.props.selected.includes(orgUnit.path)) {
            const newSelected = [...this.props.selected];
            newSelected.splice(this.props.selected.indexOf(orgUnit.path), 1);
            decrementMemberCount(root, orgUnit);
            this.props.onChange(newSelected);
        } else {
            incrementMemberCount(root, orgUnit);
            const newSelected = this.props.selected.concat(orgUnit.path);
            this.props.onChange(this.props.singleSelection ? [orgUnit.path] : newSelected);
        }
    };

    handleChildrenLoaded = (root, children) => {
        this.setState(state => ({
            roots: state.roots.map(r => (r.path === root.path ? mergeChildren(r, children) : r)),
        }));

        if (this.props.onChildrenLoaded?.fn) {
            this.props.onChildrenLoaded.fn(children);
        }
    };

    renderOrgUnitSelectTitle = () => {
        const { currentRoot } = this.state;

        return currentRoot ? (
            <div>
                {i18n.t("For organisation units within")}
                <span style={styles.ouLabel}>
                    {this.state.useShortNames ? currentRoot.shortName : currentRoot.displayName}
                </span>
                :{" "}
            </div>
        ) : (
            <div>{i18n.t("For all organisation units")}:</div>
        );
    };

    changeRoot = currentRoot => {
        this.setState({ currentRoot });
    };

    filterOrgUnits = async search => {
        const roots = await this.getRoots({ search });
        this.setState({ roots });
    };

    changeLevel = level => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                level,
            },
        }));
    };

    changeOrgUnitGroup = orgUnitGroupId => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                orgUnitGroupId,
            },
        }));
    };

    changeProgram = programId => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                programId,
            },
        }));
    };

    onUseShortNamesChange = () => {
        const newValue = !this.state.useShortNames;
        this.setState({ useShortNames: newValue });
        if (this.props.onUseShortNamesChange) {
            this.props.onUseShortNamesChange(newValue);
        }
    };

    render() {
        if (!this.state.levels) return null;

        const {
            levels,
            currentRoot,
            roots,
            groups,
            programs,
            selectedFilters,
            useShortNames,
        } = this.state;
        const {
            api,
            selected,
            controls,
            withElevation,
            selectableLevels,
            typeInput,
            hideCheckboxes,
            hideMemberCount,
            fullWidth,
            square,
            selectOnClick,
            selectableIds,
            initiallyExpanded = roots.length > 1 ? [] : roots.map(ou => ou.path),
        } = this.props;
        const { filterByLevel, filterByGroup, filterByProgram, selectAll } = controls;

        const someControlsVisible = filterByLevel || filterByGroup || selectAll || filterByProgram;
        const { renderOrgUnitSelectTitle: OrgUnitSelectTitle } = this;
        const getClass = root => `ou-root-${root.path.split("/").length - 1}`;

        const cardWideStyle = {
            ...styles.cardWide,
            boxShadow: !withElevation ? "none" : undefined,
            width: fullWidth ? 1052 : undefined,
        };

        return (
            <Card style={cardWideStyle} square={square}>
                <CardContent style={styles.cardText}>
                    <div style={styles.searchBox}>
                        <SearchBox onChange={this.filterOrgUnits} />
                    </div>

                    <div style={this.contentsStyle}>
                        <div style={styles.contentItem}>
                            {this.props.showNameSetting ? (
                                <FormControlLabel
                                    style={{ paddingLeft: "10px" }}
                                    control={
                                        <Switch
                                            size="small"
                                            checked={useShortNames}
                                            onChange={this.onUseShortNamesChange}
                                        />
                                    }
                                    label={i18n.t("Use short names")}
                                />
                            ) : null}
                            {roots.map(root => (
                                <div key={root.path} className={`ou-root ${getClass(root)}`}>
                                    <OrgUnitTree
                                        key={useShortNames}
                                        api={api}
                                        root={root}
                                        selected={selected}
                                        currentRoot={currentRoot}
                                        initiallyExpanded={initiallyExpanded}
                                        onSelectClick={this.handleOrgUnitClick.bind(this, root)}
                                        selectableLevels={selectableLevels}
                                        typeInput={typeInput}
                                        onChangeCurrentRoot={this.changeRoot}
                                        onChildrenLoaded={
                                            this.props.onChildrenLoaded
                                                ? {
                                                      fields: this.props.onChildrenLoaded.fields,
                                                      fn: this.handleChildrenLoaded.bind(
                                                          this,
                                                          root
                                                      ),
                                                  }
                                                : undefined
                                        }
                                        labelChildren={this.props.labelChildren}
                                        hideCheckboxes={hideCheckboxes}
                                        hideMemberCount={hideMemberCount}
                                        selectOnClick={selectOnClick}
                                        selectableIds={selectableIds}
                                        useShortNames={useShortNames}
                                    />
                                </div>
                            ))}
                        </div>

                        {someControlsVisible && (
                            <div style={styles.contentItem}>
                                <div style={styles.rightPanel}>
                                    {(filterByLevel || filterByGroup || filterByProgram) && (
                                        <React.Fragment>
                                            <OrgUnitSelectTitle />

                                            {filterByLevel && (
                                                <div style={styles.selectByLevel}>
                                                    <OrgUnitSelectByLevel
                                                        levels={levels}
                                                        selected={selected}
                                                        currentRoot={currentRoot}
                                                        onUpdateSelection={
                                                            this.handleSelectionUpdate
                                                        }
                                                        onItemSelection={this.changeLevel}
                                                        selectableIds={selectableIds}
                                                    />
                                                </div>
                                            )}

                                            {filterByGroup && (
                                                <div style={styles.selectByGroup}>
                                                    <OrgUnitSelectByGroup
                                                        groups={groups}
                                                        selected={selected}
                                                        currentRoot={currentRoot}
                                                        onUpdateSelection={
                                                            this.handleSelectionUpdate
                                                        }
                                                        onItemSelection={this.changeOrgUnitGroup}
                                                        selectableIds={selectableIds}
                                                        selectableLevels={selectableLevels}
                                                    />
                                                </div>
                                            )}

                                            {filterByProgram && (
                                                <div>
                                                    <OrgUnitSelectByProgram
                                                        programs={programs}
                                                        selected={selected}
                                                        currentRoot={currentRoot}
                                                        onUpdateSelection={
                                                            this.handleSelectionUpdate
                                                        }
                                                        onItemSelection={this.changeProgram}
                                                        selectableIds={selectableIds}
                                                    />
                                                </div>
                                            )}
                                        </React.Fragment>
                                    )}

                                    {selectAll && (
                                        <div style={styles.selectAll}>
                                            <OrgUnitSelectAll
                                                selected={selected}
                                                currentRoot={currentRoot}
                                                onUpdateSelection={this.handleSelectionUpdate}
                                                selectableIds={selectableIds}
                                                selectedFilters={selectedFilters}
                                                selectableLevels={selectableLevels}
                                            />
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </CardContent>
            </Card>
        );
    }
}

// This is a modified version of mergeChildren from @dhis2/d2-ui-org-unit-tree.
// The original function works when root is the absolute root of the tree (level 1), but
// here we will have any organisation unit as root when filtering.
function mergeChildren(root, children) {
    function assignChildren(root, targetPath, children) {
        if (root.path === "/" + targetPath.join("/")) {
            root.children = children;
        } else {
            const rootLevel = root.path.split("/").length - 1;
            const nextRoot = _.find(root.children, { id: targetPath.slice(rootLevel)[0] });
            if (nextRoot) {
                assignChildren(nextRoot, targetPath, children);
            } else {
                /* eslint-disable no-console */
                console.error("Cannot find root children", root, targetPath);
            }
        }
        return root;
    }

    if (children.length === 0) {
        return root;
    } else {
        const childPath = _.first(children).path.slice(1).split("/");
        const parentPath = childPath.slice(0, childPath.length - 1);
        return assignChildren(root, parentPath, children);
    }
}

const styles = {
    cardWide: {
        margin: 0,
        transition: "all 175ms ease-out",
    },
    cardText: {
        paddingTop: 10,
        height: "auto",
        position: "relative",
    },
    cardHeader: {
        padding: "16px",
        margin: "16px -16px",
        borderBottom: "1px solid #eeeeee",
    },
    searchBox: {
        width: 300,
        marginBottom: 10,
    },
    contents: {
        height: 350,
        display: "flex",
        overflowY: "auto",
    },
    contentItem: {
        flexBasis: "100%",
    },
    rightPanel: {
        position: "absolute",
        width: "65%",
    },
    ouLabel: {
        background: "rgba(0,0,0,0.05)",
        borderRadius: 5,
        border: "1px solid rgba(0,0,0,0.1)",
        padding: "1px 6px 1px 3px",
        fontStyle: "italic",
        margin: 4,
    },
    selectByLevel: {
        marginBottom: -24,
        marginTop: 0,
    },
    selectByGroup: {
        marginBottom: -24,
        marginTop: 0,
    },
    selectAll: {
        marginTop: 10,
    },
};
