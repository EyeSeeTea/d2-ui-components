import React from "react";
import log from "loglevel";
import Button from "@material-ui/core/Button";
import { ensure } from "../utils/assert";
import i18n from "../utils/i18n";

import {
    OrgUnit,
    OrgUnitSelectBaseComponent,
    OrgUnitSelectProps,
    addToSelection,
    removeFromSelection,
} from "./common";
import { isSelectableLevelsDefined } from "./OrgUnitSelectByGroup.component";

const style: Record<string, React.CSSProperties> = {
    button: {
        position: "relative",
        top: 3,
        marginLeft: 16,
    },
    progress: {
        height: 2,
        backgroundColor: "rgba(0,0,0,0)",
        top: 46,
    },
    button1: {
        position: "relative",
        top: 3,
        marginLeft: 0,
    },
};

interface SelectedFilters {
    readonly level?: number | null;
    readonly orgUnitGroupId?: string | null;
    readonly programId?: string | null;
}

interface OrgUnitSelectAllProps extends Omit<OrgUnitSelectProps, "onItemSelection"> {
    readonly currentRoot?: {
        readonly id: string;
        readonly displayName: string;
        readonly path: string;
        readonly level?: number;
    };
    readonly selectedFilters?: SelectedFilters;
    readonly selectableLevels?: ReadonlyArray<number>;
}

type CurrentRoot = NonNullable<OrgUnitSelectAllProps["currentRoot"]>;

interface OrgUnitSelectAllState {
    loading: boolean;
    cache: string[] | null;
}

class OrgUnitSelectAll extends React.Component<OrgUnitSelectAllProps, OrgUnitSelectAllState> {
    declare context: { api: any };
    static contextTypes = { api: () => null };

    cacheByFilters: Record<string, OrgUnit[]> = {};

    addToSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    removeFromSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;

    constructor(props: OrgUnitSelectAllProps, context: { api: any }) {
        super(props, context);

        this.state = {
            loading: false,
            cache: null,
        };

        this.addToSelection = addToSelection.bind((this as unknown) as OrgUnitSelectBaseComponent);
        this.removeFromSelection = removeFromSelection.bind(
            (this as unknown) as OrgUnitSelectBaseComponent
        );

        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleDeselectAll = this.handleDeselectAll.bind(this);
        this.getRelativeLevelFilter = this.getRelativeLevelFilter.bind(this);
        this.getOrgUnitsByFilters = this.getOrgUnitsByFilters.bind(this);
    }

    handleSelectAll(): void {
        if (this.props.currentRoot) {
            this.setState({ loading: true });
            this.getDescendantOrgUnits(this.props.currentRoot).then(orgUnits => {
                this.setState({ loading: false });
                this.addToSelection(orgUnits);
            });
        } else if (Array.isArray(this.state.cache)) {
            this.props.onUpdateSelection(this.state.cache.slice());
        } else {
            this.setState({ loading: true });

            const filters = isSelectableLevelsDefined(this.props.selectableLevels)
                ? { level: { in: this.props.selectableLevels } }
                : undefined;

            this.context.api.models.organisationUnits
                .get({ fields: { id: true, path: true }, paging: false, filter: filters })
                .getData()
                .then(({ objects }: { objects: OrgUnit[] }) => {
                    this.addToSelection(objects);
                    this.setState({
                        cache: objects.map(ou => ou.path),
                        loading: false,
                    });
                })
                .catch((err: Error) => {
                    this.setState({ loading: false });
                    log.error("Failed to load all org units:", err);
                });
        }
    }

    getRelativeLevelFilter(
        _api: any,
        level: number,
        currentRoot: OrgUnitSelectAllProps["currentRoot"]
    ): number | undefined {
        if (!currentRoot) return undefined;

        const rootLevel =
            currentRoot.level || currentRoot.path
                ? ensure(currentRoot.path.match(/\//g), "path must contain slashes").length
                : NaN;
        return level - rootLevel;
    }

    getOrgUnitsByFilters(): void {
        const { api } = this.context;
        const { selectedFilters, currentRoot } = this.props;

        if (!selectedFilters) return;

        const cacheKey = `${selectedFilters.level}-${selectedFilters.orgUnitGroupId}-${selectedFilters.programId}`;

        const level = selectedFilters.level || undefined;

        const filtersbyGroup = selectedFilters.orgUnitGroupId
            ? [`organisationUnitGroups.id:eq:${selectedFilters.orgUnitGroupId}`]
            : [];

        const filtersbyGroupAndProgram = selectedFilters.programId
            ? [...filtersbyGroup, `programs.id:eq:${selectedFilters.programId}`]
            : [...filtersbyGroup];

        if (currentRoot) {
            log.debug(
                `Loading org units by filters ${selectedFilters} within ${currentRoot.displayName}`
            );
            this.setState({ loading: true });

            const relativeLevel = level
                ? this.getRelativeLevelFilter(api, level, currentRoot)
                : level;

            if (relativeLevel !== undefined && (isNaN(relativeLevel) || relativeLevel < 0)) {
                log.info(
                    "Unable to select org unit levels higher up in the hierarchy than the current root"
                );
                this.addToSelection([]);
            }

            api.get("/organisationUnits/" + currentRoot.id, {
                paging: false,
                includeDescendants: filtersbyGroupAndProgram.length > 0 ? true : undefined,
                level: relativeLevel,
                fields: "id,path",
                filter: filtersbyGroupAndProgram.length > 0 ? filtersbyGroupAndProgram : undefined,
            })
                .getData()
                .then(
                    ({ organisationUnits }: { organisationUnits: OrgUnit[] }) => organisationUnits
                )
                .then((orgUnitArray: OrgUnit[]) => {
                    log.debug(
                        `Loaded ${orgUnitArray.length} org units by filters ${selectedFilters} within ${currentRoot.displayName}`
                    );
                    this.setState({ loading: false });
                    this.addToSelection(orgUnitArray);
                });
        } else if (this.cacheByFilters.hasOwnProperty(cacheKey)) {
            const cached = this.cacheByFilters[cacheKey];
            this.addToSelection(cached.slice());
            this.setState({ loading: false });
        } else {
            log.debug(`Loading org units for level ${level}`);
            this.setState({ loading: true });

            api.get("/organisationUnits/", {
                paging: false,
                includeDescendants: filtersbyGroupAndProgram.length > 0 ? true : undefined,
                level: level,
                fields: "id,path",
                filter: filtersbyGroupAndProgram.length > 0 ? filtersbyGroupAndProgram : undefined,
            })
                .getData()
                .then(
                    ({ organisationUnits }: { organisationUnits: OrgUnit[] }) => organisationUnits
                )
                .then((orgUnitArray: OrgUnit[]) => {
                    log.debug(
                        `Loaded ${orgUnitArray.length} org units by filters ${selectedFilters}`
                    );

                    this.setState({ loading: false });
                    this.cacheByFilters[cacheKey] = orgUnitArray;

                    // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                    this.addToSelection(orgUnitArray.slice());
                })
                .catch((err: Error) => {
                    this.setState({ loading: false });
                    log.error(`Failed to load org units by filters ${selectedFilters}:`, err);
                });
        }
    }

    getDescendantOrgUnits(currentRoot: CurrentRoot): Promise<OrgUnit[]> {
        return this.context.api
            .get("/organisationUnits/" + currentRoot.id, {
                paging: false,
                includeDescendants: true,
                fields: "id,path",
            })
            .getData()
            .then(({ organisationUnits }: { organisationUnits: OrgUnit[] }) => organisationUnits);
    }

    handleDeselectAll(): void {
        if (this.props.currentRoot) {
            this.setState({ loading: true });
            this.getDescendantOrgUnits(this.props.currentRoot).then(orgUnits => {
                this.setState({ loading: false });
                this.removeFromSelection(orgUnits);
            });
        } else {
            this.props.onUpdateSelection([]);
        }
    }

    selectedFiltersCount(): number {
        if (!this.props.selectedFilters) return 0;
        const filters = this.props.selectedFilters;
        return Object.keys(filters).filter(key => {
            return filters[key as keyof SelectedFilters];
        }).length;
    }

    render(): React.ReactNode {
        return (
            <div>
                <Button
                    variant="contained"
                    style={style.button1}
                    onClick={this.handleSelectAll}
                    disabled={this.state.loading}
                >
                    {i18n.t("Select all")}
                </Button>

                <Button
                    variant="contained"
                    style={style.button}
                    onClick={this.handleDeselectAll}
                    disabled={this.state.loading}
                >
                    {i18n.t("Deselect all")}
                </Button>

                {this.props.selectedFilters && this.selectedFiltersCount() > 1 && (
                    <Button
                        variant="contained"
                        style={style.button}
                        onClick={this.getOrgUnitsByFilters}
                        disabled={this.state.loading}
                    >
                        {i18n.t("Select intersection")}
                    </Button>
                )}
            </div>
        );
    }
}

export default OrgUnitSelectAll;
