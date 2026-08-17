import log from "loglevel";
import PropTypes from "prop-types";
import React from "react";
import i18n from "../utils/i18n";
import {
    addToSelection,
    handleChangeSelection,
    removeFromSelection,
    renderDropdown,
} from "./common";

class OrgUnitSelectByLevel extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loading: false,
            selection: undefined,
        };
        this.levelCache = {};

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);
        this.handleChangeSelection = handleChangeSelection.bind(this);

        this.getOrgUnitsForLevel = this.getOrgUnitsForLevel.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDeselect = this.handleDeselect.bind(this);
    }

    getOrgUnitsForLevel(level, ignoreCache = false) {
        const { api } = this.context;
        return new Promise(resolve => {
            if (this.props.currentRoot) {
                const rootLevel =
                    this.props.currentRoot.level || this.props.currentRoot.path
                        ? this.props.currentRoot.path.match(/\//g).length
                        : NaN;
                const relativeLevel = level - rootLevel;

                if (isNaN(relativeLevel) || relativeLevel < 0) {
                    log.info(
                        "Unable to select org unit levels higher up in the hierarchy than the current root"
                    );
                    return resolve([]);
                }

                api.get("/organisationUnits/" + this.props.currentRoot.id, {
                    paging: false,
                    level: level - rootLevel,
                    fields: "id,path",
                })
                    .getData()
                    .then(({ organisationUnits }) => organisationUnits)
                    .then(orgUnitArray => {
                        log.debug(
                            `Loaded ${orgUnitArray.length} org units for level ` +
                                `${relativeLevel} under ${this.props.currentRoot.displayName}`
                        );
                        this.setState({ loading: false });
                        resolve(orgUnitArray);
                    });
            } else if (!ignoreCache && this.levelCache.hasOwnProperty(level)) {
                resolve(this.levelCache[level].slice());
            } else {
                log.debug(`Loading org units for level ${level}`);
                this.setState({ loading: true });

                api.models.organisationUnits
                    .get({
                        paging: false,
                        level,
                        fields: { id: true, path: true },
                        withinUserHierarchy: this.props.withinUserHierarchyInFilters,
                    })
                    .getData()
                    .then(({ objects }) => objects)
                    .then(orgUnitArray => {
                        log.debug(`Loaded ${orgUnitArray.length} org units for level ${level}`);
                        this.setState({ loading: false });
                        this.levelCache[level] = orgUnitArray;

                        // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                        resolve(orgUnitArray.slice());
                    })
                    .catch(err => {
                        this.setState({ loading: false });
                        log.error(`Failed to load org units in level ${level}:`, err);
                    });
            }
        });
    }

    handleSelect() {
        this.getOrgUnitsForLevel(this.state.selection).then(orgUnits => {
            this.addToSelection(orgUnits);
        });
    }

    handleDeselect() {
        this.getOrgUnitsForLevel(this.state.selection).then(orgUnits => {
            this.removeFromSelection(orgUnits);
        });
    }

    render() {
        const currentRoot = this.props.currentRoot;
        const currentRootLevel = currentRoot
            ? currentRoot.level || currentRoot.path.match(/\//g).length
            : 1;

        const menuItems = this.props.levels
            .filter(level => level.level >= currentRootLevel)
            .map(level => ({ id: level.level, displayName: level.displayName }));
        const label = i18n.t("Organisation unit level");

        // The minHeight on the wrapping div below is there to compensate for the fact that a
        // Material-UI SelectField will change height depending on whether or not it has a value
        return renderDropdown.call(this, menuItems, label);
    }
}

OrgUnitSelectByLevel.propTypes = {
    // levels is an array of either ModelCollection objects or plain objects,
    // where each object should contain `level` and `displayName` properties
    levels: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,

    // selected is an array of selected organisation unit IDs
    selected: PropTypes.array.isRequired,

    // Whenever the selection changes, onUpdateSelection will be called with
    // one argument: The new array of selected organisation unit paths
    onUpdateSelection: PropTypes.func.isRequired,

    // When a the selected item of the dropdown is changed, onItemSelection will be called with
    // one argument: The selected level in the dropdown
    onItemSelection: PropTypes.func.isRequired,

    // If currentRoot is set, only org units that are descendants of the
    // current root org unit will be added to or removed from the selection
    currentRoot: (props, propName) => {
        if (props[propName]) {
            if (!props[propName].hasOwnProperty("id")) {
                return new Error("currentRoot must have an `id` property");
            }

            if (
                !props[propName].hasOwnProperty("level") &&
                !props[propName].hasOwnProperty("path")
            ) {
                return new Error("currentRoot must have either a `level` or a `path` property");
            }
        }
    },
    withinUserHierarchyInFilters: PropTypes.bool,
    // TODO: Add level cache prop?
};

OrgUnitSelectByLevel.contextTypes = { api: PropTypes.any.isRequired };

export default OrgUnitSelectByLevel;
