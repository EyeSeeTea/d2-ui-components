import _ from "lodash";
import log from "loglevel";
import React from "react";
import i18n from "../utils/i18n";
import {
    OrgUnit,
    OrgUnitSelectProps,
    OrgUnitSelectState,
    addToSelection,
    handleChangeSelection,
    removeFromSelection,
    renderDropdown,
} from "./common";

export function isSelectableLevelsDefined(
    selectableLevels: ReadonlyArray<number> | undefined
): ReadonlyArray<number> | undefined {
    return !selectableLevels || selectableLevels.length === 0 ? undefined : selectableLevels;
}

interface OrgUnitWithLevel extends OrgUnit {
    readonly level: number;
}

interface OrgUnitSelectByGroupProps extends OrgUnitSelectProps {
    readonly groups: ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
    readonly currentRoot?: {
        readonly id: string;
        readonly displayName: string;
        readonly path: string;
        readonly level?: number;
    };
    readonly withinUserHierarchyInFilters?: boolean;
    readonly selectableLevels?: ReadonlyArray<number>;
}

interface OrgUnitSelectByGroupState extends OrgUnitSelectState {
    orgUnitsInHierarchy?: Set<string>;
}

class OrgUnitSelectByGroup extends React.Component<
    OrgUnitSelectByGroupProps,
    OrgUnitSelectByGroupState
> {
    declare context: { api: any };
    static contextTypes = { api: () => null };

    groupCache: Record<string, OrgUnitWithLevel[]> = {};

    addToSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    removeFromSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    handleChangeSelection: (event: React.ChangeEvent<{ value: unknown }>) => void;

    constructor(props: OrgUnitSelectByGroupProps, context: { api: any }) {
        super(props, context);

        this.state = {
            loading: false,
            selection: undefined,
        };

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);
        this.handleChangeSelection = handleChangeSelection.bind(this);

        this.getOrgUnitsForGroup = this.getOrgUnitsForGroup.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDeselect = this.handleDeselect.bind(this);
    }

    getOrgUnitsForGroup(groupId: string, ignoreCache = false): Promise<OrgUnitWithLevel[]> {
        const { api } = this.context;
        return new Promise(resolve => {
            if (this.props.currentRoot) {
                const currentRoot = this.props.currentRoot;
                log.debug(
                    `Loading org units for group ${groupId} within ${currentRoot.displayName}`
                );
                this.setState({ loading: true });

                api.get("/organisationUnits/" + currentRoot.id, {
                    paging: false,
                    includeDescendants: true,
                    fields: "id,path",
                    filter: `organisationUnitGroups.id:eq:${groupId}`,
                })
                    .getData()
                    .then(
                        ({ organisationUnits }: { organisationUnits: OrgUnitWithLevel[] }) =>
                            organisationUnits
                    )
                    .then((orgUnits: OrgUnitWithLevel[]) => {
                        log.debug(
                            `Loaded ${orgUnits.length} org units for group ${groupId} within ${currentRoot.displayName}`
                        );
                        this.setState({ loading: false });

                        resolve(orgUnits.slice());
                    });
            } else if (!ignoreCache && this.groupCache.hasOwnProperty(groupId)) {
                const cached = this.groupCache[groupId] as OrgUnitWithLevel[];
                resolve(cached.slice());
            } else {
                log.debug(`Loading org units for group ${groupId}`);
                this.setState({ loading: true });

                const { api } = this.context;
                api.models.organisationUnitGroups
                    .get({
                        fields: { organisationUnits: { id: true, path: true, level: true } },
                        filter: { id: { eq: groupId } },
                    })
                    .getData()
                    .then(
                        ({
                            objects,
                        }: {
                            objects: Array<{ organisationUnits?: OrgUnitWithLevel[] }>;
                        }) => _.first(objects) || {}
                    )
                    .then(
                        ({
                            organisationUnits = [],
                        }: {
                            organisationUnits?: OrgUnitWithLevel[];
                        }) => {
                            log.debug(
                                `Loaded ${organisationUnits.length} org units for group ${groupId}`
                            );
                            this.setState({ loading: false });
                            const levelsToFilter = isSelectableLevelsDefined(
                                this.props.selectableLevels
                            );
                            const filterOrgUnits = levelsToFilter
                                ? organisationUnits.filter(orgUnit =>
                                      levelsToFilter.includes(orgUnit.level)
                                  )
                                : organisationUnits;

                            // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                            const orgUnitsInHierarchy = this.state.orgUnitsInHierarchy;
                            const excludeOrgUnits = orgUnitsInHierarchy
                                ? filterOrgUnits.filter(orgUnit =>
                                      orgUnitsInHierarchy.has(orgUnit.id)
                                  )
                                : filterOrgUnits;

                            this.groupCache[groupId] = excludeOrgUnits;

                            resolve(excludeOrgUnits);
                        }
                    )
                    .catch((err: Error) => {
                        this.setState({ loading: false });
                        log.error(`Failed to load org units in group ${groupId}:`, err);
                    });
            }
        });
    }

    handleSelect(): void {
        this.getOrgUnitsForGroup(this.state.selection as string).then(this.addToSelection);
    }

    handleDeselect(): void {
        this.getOrgUnitsForGroup(this.state.selection as string).then(this.removeFromSelection);
    }

    render(): React.ReactNode {
        const menuItems = this.props.groups;
        const label = i18n.t("Organisation unit group");

        // The minHeight on the wrapping div below is there to compensate for the fact that a
        // Material-UI SelectField will change height depending on whether or not it has a value
        return renderDropdown.call(this, menuItems, label);
    }

    componentDidMount(): void {
        const { api } = this.context;
        if (this.props.withinUserHierarchyInFilters) {
            this.setState({ loading: true });
            api.models.organisationUnits
                .get({
                    paging: false,
                    fields: { id: true },
                    withinUserHierarchy: this.props.withinUserHierarchyInFilters,
                })
                .getData()
                .then((response: { objects: Array<{ id: string }> }) => {
                    if (response.objects.length > 0) {
                        const orgUnitIdsSet = new Set(
                            response.objects.map((ou: { id: string }) => ou.id)
                        );
                        this.setState({ orgUnitsInHierarchy: orgUnitIdsSet });
                    }
                    this.setState({ loading: false });
                })
                .catch((err: Error) => {
                    console.error(`OrgUnitSelectByGroup: ${err.message}`);
                    this.setState({ loading: false });
                });
        }
    }
}

export default OrgUnitSelectByGroup;
