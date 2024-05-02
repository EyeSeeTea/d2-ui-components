import React from "react";
import PropTypes from "prop-types";
import log from "loglevel";
import Button from "@material-ui/core/Button";
import i18n from "../utils/i18n";

import { addToSelection, removeFromSelection } from "./common";
import { isSelectableLevelsDefined } from "./OrgUnitSelectByGroup.component";

const style = {
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
};
style.button1 = Object.assign({}, style.button, { marginLeft: 0 });

class OrgUnitSelectAll extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loading: false,
            cache: null,
        };

        this.cacheByFilters = {};

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);

        this.handleSelectAll = this.handleSelectAll.bind(this);
        this.handleDeselectAll = this.handleDeselectAll.bind(this);
        this.getRelativeLevelFilter = this.getRelativeLevelFilter.bind(this);
        this.getOrgUnitsByFilters = this.getOrgUnitsByFilters.bind(this);
    }

    handleSelectAll() {
        if (this.props.currentRoot) {
            this.setState({ loading: true });
            this.getDescendantOrgUnits().then(orgUnits => {
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
                .then(({ objects }) => {
                    this.addToSelection(objects);
                    this.setState({
                        cache: objects.map(ou => ou.path),
                        loading: false,
                    });
                })
                .catch(err => {
                    this.setState({ loading: false });
                    log.error("Failed to load all org units:", err);
                });
        }
    }

    getRelativeLevelFilter(api, level, currentRoot) {
        if (!currentRoot) return undefined;

        const rootLevel =
            currentRoot.level || currentRoot.path
                ? this.props.currentRoot.path.match(/\//g).length
                : NaN;
        return level - rootLevel;
    }

    getOrgUnitsByFilters() {
        const { api } = this.context;
        const { selectedFilters, currentRoot } = this.props;

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

            if (isNaN(relativeLevel) || relativeLevel < 0) {
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
                .then(({ organisationUnits }) => organisationUnits)
                .then(orgUnitArray => {
                    log.debug(
                        `Loaded ${orgUnitArray.length} org units by filters ${selectedFilters} within ${currentRoot.displayName}`
                    );
                    this.setState({ loading: false });
                    this.addToSelection(orgUnitArray);
                });
        } else if (this.cacheByFilters.hasOwnProperty(cacheKey)) {
            this.addToSelection(this.cacheByFilters[cacheKey].slice());
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
                .then(({ organisationUnits }) => organisationUnits)
                .then(orgUnitArray => {
                    log.debug(
                        `Loaded ${orgUnitArray.length} org units by filters ${selectedFilters}`
                    );

                    this.setState({ loading: false });
                    this.cacheByFilters[cacheKey] = orgUnitArray;

                    // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                    this.addToSelection(orgUnitArray.slice());
                })
                .catch(err => {
                    this.setState({ loading: false });
                    log.error(`Failed to load org units by filters ${selectedFilters}:`, err);
                });
        }
    }

    getDescendantOrgUnits() {
        return this.context.api
            .get("/organisationUnits/" + this.props.currentRoot.id, {
                paging: false,
                includeDescendants: true,
                fields: "id,path",
            })
            .getData()
            .then(({ organisationUnits }) => organisationUnits);
    }

    handleDeselectAll() {
        if (this.props.currentRoot) {
            this.setState({ loading: true });
            this.getDescendantOrgUnits().then(orgUnits => {
                this.setState({ loading: false });
                this.removeFromSelection(orgUnits);
            });
        } else {
            this.props.onUpdateSelection([]);
        }
    }

    selectedFiltersCount() {
        return Object.keys(this.props.selectedFilters).filter(key => {
            return this.props.selectedFilters[key];
        }).length;
    }

    render() {
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

OrgUnitSelectAll.propTypes = {
    // selected is an array of selected organisation unit IDs
    selected: PropTypes.array.isRequired,

    // Whenever the selection changes, onUpdateSelection will be called with
    // one argument: The new array of selected organisation unit paths
    onUpdateSelection: PropTypes.func.isRequired,

    // If currentRoot is set, only org units that are descendants of the
    // current root org unit will be added to or removed from the selection
    currentRoot: PropTypes.object,

    // selected filters values: level, orgUnitGroupId, programId
    selectedFilters: PropTypes.shape({
        level: PropTypes.number,
        orgUnitGroupId: PropTypes.string,
        programId: PropTypes.string,
    }),
};

OrgUnitSelectAll.contextTypes = { api: PropTypes.object.isRequired };

export default OrgUnitSelectAll;
