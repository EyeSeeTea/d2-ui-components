import { Card, CardContent, FormControlLabel, Switch } from "@material-ui/core";
import _ from "lodash";
import React from "react";
import {
    OrgUnitSelectAll,
    OrgUnitSelectByGroup,
    OrgUnitSelectByLevel,
    OrgUnitSelectByProgram,
} from "../org-unit-select";
import { decrementMemberCount, incrementMemberCount, OrgUnitTree } from "../org-unit-tree";
import type { OrgUnitNode } from "../org-unit-tree/utils";
import SearchBox from "../search-box/SearchBox";
import { ensure } from "../utils/assert";
import i18n from "../utils/i18n";
import { promiseMap } from "../utils/promiseMap";

// Base code taken from d2-ui/examples/create-react-app/src/components/org-unit-selector.js

interface Controls {
    readonly filterByLevel?: boolean;
    readonly filterByGroup?: boolean;
    readonly filterByProgram?: boolean;
    readonly selectAll?: boolean;
}

const defaultControls: Controls = {
    filterByLevel: true,
    filterByGroup: true,
    filterByProgram: false,
    selectAll: true,
};

interface ChildrenLoadedConfig {
    readonly fields: ReadonlyArray<string>;
    readonly fn: (children: any[]) => void;
}

interface OrgUnitsSelectorProps {
    readonly api: any;
    readonly onChange: (selection: string[]) => void;
    readonly selected: ReadonlyArray<string>;
    readonly initiallyExpanded?: ReadonlyArray<string>;
    readonly levels?: ReadonlyArray<number> | null;
    readonly rootIds?: ReadonlyArray<string>;
    readonly listParams?: Record<string, any>;
    readonly labelChildren?: ((orgUnit: any) => React.ReactNode) | null;
    readonly controls?: Controls;
    readonly withElevation?: boolean;
    readonly height?: number;
    readonly hideCheckboxes?: boolean;
    readonly fullWidth?: boolean;
    readonly square?: boolean;
    readonly singleSelection?: boolean;
    readonly selectableIds?: ReadonlyArray<string>;
    readonly showShortName?: boolean;
    readonly showNameSetting?: boolean;
    readonly onUseShortNamesChange?: (value: boolean) => void;
    readonly onChildrenLoaded?: ChildrenLoadedConfig;
    readonly disabled?: boolean;
    readonly withinUserHierarchyInFilters?: boolean;
    readonly selectableLevels?: ReadonlyArray<number>;
    readonly selectOnClick?: boolean;
    readonly typeInput?: string;
    readonly hideMemberCount?: boolean;
}

interface OrgUnitRoot {
    id: string;
    level: number;
    displayName: string;
    shortName: string;
    path: string;
    children: any[];
    geometry?: any;
    memberCount?: number;
    [key: string]: unknown;
}

interface SelectedFilters {
    level: number | null;
    orgUnitGroupId: string | null;
    programId: string | null;
}

interface OrgUnitsSelectorState {
    cancel: (() => void) | null;
    levels: any[] | null;
    roots: OrgUnitRoot[] | null;
    groups: any[] | null;
    programs: any[] | null;
    currentRoot: OrgUnitRoot | null;
    selectedFilters: SelectedFilters;
    useShortNames: boolean | undefined;
}

export default class OrgUnitsSelector extends React.Component<
    OrgUnitsSelectorProps,
    OrgUnitsSelectorState
> {
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
        disabled: false,
        withinUserHierarchyInFilters: false,
    };

    static childContextTypes = {
        api: (): null => null,
    };

    contentsStyle: React.CSSProperties;

    constructor(props: OrgUnitsSelectorProps) {
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

    componentDidMount(): void {
        const { props } = this;
        const { controls = defaultControls } = props;
        const { filterByLevel, filterByGroup, filterByProgram } = controls;

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
                      .then(({ objects }: { objects: any[] }) => objects),
            !filterByGroup
                ? Promise.resolve([])
                : props.api.models.organisationUnitGroups
                      .get({
                          pageSize: 1,
                          paging: false,
                          fields: { id: true, displayName: true },
                      })
                      .getData()
                      .then(({ objects }: { objects: any[] }) => objects),
            !filterByProgram
                ? Promise.resolve([])
                : props.api.models.programs
                      .get({
                          pageSize: 1,
                          paging: false,
                          fields: { id: true, displayName: true },
                      })
                      .getData()
                      .then(({ objects }: { objects: any[] }) => objects),
            this.getRoots(),
        ]).then(([levels, groups, programs, defaultRoots]) => {
            this.setState({
                roots: defaultRoots as OrgUnitRoot[],
                levels,
                groups,
                programs,
            });
        });
    }

    queryRoots({
        search,
    }: {
        search?: string;
    }): { getData: () => Promise<{ objects: any[] }>; cancel?: () => void } {
        const { api, rootIds, listParams, withinUserHierarchyInFilters } = this.props;
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
                ...(withinUserHierarchyInFilters ? { withinUserHierarchy: true } : {}),
            });
        } else if (rootIds) {
            let cancel = false;
            return {
                getData: async () => {
                    const responses = await promiseMap(_.chunk(rootIds, 400), (ids: string[]) => {
                        if (cancel) return { objects: [] };
                        return api.models.organisationUnits
                            .get({ ...baseOptions, paging: false, filter: { id: { in: ids } } })
                            .getData();
                    });

                    return {
                        objects: _.flatMap(responses, ({ objects }: { objects: any[] }) => objects),
                    };
                },
                cancel: () => {
                    cancel = true;
                },
            };
        } else {
            return api.models.organisationUnits.get({ ...baseOptions, level: 1, paging: false });
        }
    }

    getRoots({ search }: { search?: string } = {}): Promise<OrgUnitRoot[]> {
        const { rootIds, selectableLevels } = this.props;
        const postFilter: (orgUnits: OrgUnitRoot[]) => OrgUnitRoot[] = search
            ? (orgUnits: OrgUnitRoot[]) =>
                  _(orgUnits)
                      .filter((orgUnit: OrgUnitRoot) =>
                          selectableLevels
                              ? selectableLevels.includes(orgUnit.level)
                              : !rootIds || rootIds.some(ouId => orgUnit.path.includes(ouId))
                      )
                      .take(50)
                      .value()
            : (orgUnits: OrgUnitRoot[]) => orgUnits;

        const response = this.queryRoots({ search });
        if (this.state.cancel) this.state.cancel();
        this.setState({ cancel: response.cancel || null });

        return response
            .getData()
            .then(({ objects }: { objects: OrgUnitRoot[] }) => objects)
            .then(postFilter);
    }

    getChildContext(): { api: any } {
        return {
            api: this.props.api,
        };
    }

    handleSelectionUpdate = (newSelection: ReadonlyArray<string>): void => {
        this.props.onChange(newSelection as string[]);
    };

    handleOrgUnitClick = (root: OrgUnitRoot, _event: any, orgUnit: { path: string }): void => {
        if (this.props.selected.includes(orgUnit.path)) {
            const newSelected = [...this.props.selected];
            newSelected.splice(this.props.selected.indexOf(orgUnit.path), 1);
            decrementMemberCount((root as unknown) as OrgUnitNode, orgUnit);
            this.props.onChange(newSelected);
        } else {
            incrementMemberCount((root as unknown) as OrgUnitNode, orgUnit);
            const newSelected = this.props.selected.concat(orgUnit.path);
            this.props.onChange(this.props.singleSelection ? [orgUnit.path] : newSelected);
        }
    };

    handleChildrenLoaded = (root: OrgUnitRoot, children: any[]): void => {
        this.setState(state => ({
            roots: ensure(state.roots, "roots must be loaded").map(r =>
                r.path === root.path ? mergeChildren(r, children) : r
            ),
        }));

        if (this.props.onChildrenLoaded?.fn) {
            this.props.onChildrenLoaded.fn(children);
        }
    };

    renderOrgUnitSelectTitle = (): React.ReactElement => {
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

    changeRoot = (currentRoot: any): void => {
        this.setState({ currentRoot });
    };

    filterOrgUnits = async (search: string): Promise<void> => {
        const roots = await this.getRoots({ search });
        this.setState({ roots });
    };

    changeLevel = (level: string | number): void => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                level: level as number,
            },
        }));
    };

    changeOrgUnitGroup = (orgUnitGroupId: string | number): void => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                orgUnitGroupId: orgUnitGroupId as string,
            },
        }));
    };

    changeProgram = (programId: string | number): void => {
        this.setState(oldState => ({
            selectedFilters: {
                ...oldState.selectedFilters,
                programId: programId as string,
            },
        }));
    };

    onUseShortNamesChange = (): void => {
        const newValue = !this.state.useShortNames;
        this.setState({ useShortNames: newValue });
        if (this.props.onUseShortNamesChange) {
            this.props.onUseShortNamesChange(newValue);
        }
    };

    render(): React.ReactNode {
        const {
            levels,
            roots,
            groups,
            programs,
            currentRoot,
            selectedFilters,
            useShortNames,
        } = this.state;

        if (!levels || !roots || !groups || !programs) return null;

        const { controls = defaultControls } = this.props;
        const {
            api,
            selected,
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
            disabled,
            withinUserHierarchyInFilters,
        } = this.props;
        const { filterByLevel, filterByGroup, filterByProgram, selectAll } = controls;

        const someControlsVisible = filterByLevel || filterByGroup || selectAll || filterByProgram;
        const { renderOrgUnitSelectTitle: OrgUnitSelectTitle } = this;
        const getClass = (root: OrgUnitRoot): string =>
            `ou-root-${root.path.split("/").length - 1}`;

        const cardWideStyle: React.CSSProperties = {
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
                                        key={String(useShortNames)}
                                        api={api}
                                        root={root}
                                        selected={selected}
                                        currentRoot={currentRoot || undefined}
                                        initiallyExpanded={initiallyExpanded}
                                        onSelectClick={this.handleOrgUnitClick.bind(this, root)}
                                        selectableLevels={selectableLevels}
                                        typeInput={typeInput}
                                        onChangeCurrentRoot={this.changeRoot}
                                        onChildrenLoaded={
                                            this.props.onChildrenLoaded
                                                ? {
                                                      fields: this.props.onChildrenLoaded
                                                          .fields as ReadonlyArray<string>,
                                                      fn: this.handleChildrenLoaded.bind(
                                                          this,
                                                          root
                                                      ) as (children: ReadonlyArray<any>) => void,
                                                  }
                                                : undefined
                                        }
                                        labelChildren={this.props.labelChildren || undefined}
                                        hideCheckboxes={hideCheckboxes}
                                        hideMemberCount={hideMemberCount}
                                        selectOnClick={selectOnClick}
                                        selectableIds={selectableIds}
                                        useShortNames={useShortNames}
                                        disabled={disabled}
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
                                                        currentRoot={currentRoot || undefined}
                                                        withinUserHierarchyInFilters={
                                                            withinUserHierarchyInFilters
                                                        }
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
                                                        currentRoot={currentRoot || undefined}
                                                        onUpdateSelection={
                                                            this.handleSelectionUpdate
                                                        }
                                                        onItemSelection={this.changeOrgUnitGroup}
                                                        selectableIds={selectableIds}
                                                        selectableLevels={selectableLevels}
                                                        withinUserHierarchyInFilters={
                                                            withinUserHierarchyInFilters
                                                        }
                                                    />
                                                </div>
                                            )}

                                            {filterByProgram && (
                                                <div>
                                                    <OrgUnitSelectByProgram
                                                        programs={programs}
                                                        selected={selected}
                                                        currentRoot={currentRoot || undefined}
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
                                                currentRoot={currentRoot || undefined}
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
function mergeChildren(root: OrgUnitRoot, children: any[]): OrgUnitRoot {
    function assignChildren(root: any, targetPath: string[], children: any[]): any {
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

const styles: Record<string, React.CSSProperties> = {
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
