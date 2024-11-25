import _ from "lodash";
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

export function isSelectableLevelsDefined(selectableLevels) {
    return !selectableLevels || selectableLevels.length === 0 ? undefined : selectableLevels;
}

class OrgUnitSelectByGroup extends React.Component {
    constructor(props, context) {
        super(props, context);

        this.state = {
            loading: false,
            selection: undefined,
        };
        this.groupCache = {};

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);
        this.handleChangeSelection = handleChangeSelection.bind(this);

        this.getOrgUnitsForGroup = this.getOrgUnitsForGroup.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDeselect = this.handleDeselect.bind(this);
    }

    getOrgUnitsForGroup(groupId, ignoreCache = false) {
        const { api } = this.context;
        return new Promise(resolve => {
            if (this.props.currentRoot) {
                log.debug(
                    `Loading org units for group ${groupId} within ${this.props.currentRoot.displayName}`
                );
                this.setState({ loading: true });

                api.get("/organisationUnits/" + this.props.currentRoot.id, {
                    paging: false,
                    includeDescendants: true,
                    fields: "id,path",
                    filter: `organisationUnitGroups.id:eq:${groupId}`,
                })
                    .getData()
                    .then(({ organisationUnits }) => organisationUnits)
                    .then(orgUnits => {
                        log.debug(
                            `Loaded ${orgUnits.length} org units for group ${groupId} within ${this.props.currentRoot.displayName}`
                        );
                        this.setState({ loading: false });

                        resolve(orgUnits.slice());
                    });
            } else if (!ignoreCache && this.groupCache.hasOwnProperty(groupId)) {
                resolve(this.groupCache[groupId].slice());
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
                    .then(({ objects }) => _.first(objects) || {})
                    .then(({ organisationUnits = [] }) => {
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
                        this.groupCache[groupId] = filterOrgUnits;
                        // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                        resolve(filterOrgUnits);
                    })
                    .catch(err => {
                        this.setState({ loading: false });
                        log.error(`Failed to load org units in group ${groupId}:`, err);
                    });
            }
        });
    }

    handleSelect() {
        this.getOrgUnitsForGroup(this.state.selection).then(this.addToSelection);
    }

    handleDeselect() {
        this.getOrgUnitsForGroup(this.state.selection).then(this.removeFromSelection);
    }

    render() {
        const menuItems = this.props.groups;
        const label = i18n.t("Organisation unit group");

        // The minHeight on the wrapping div below is there to compensate for the fact that a
        // Material-UI SelectField will change height depending on whether or not it has a value
        return renderDropdown.call(this, menuItems, label);
    }
}

OrgUnitSelectByGroup.propTypes = {
    // groups is an array of either ModelCollection objects or plain objects,
    // where each object should contain `id` and `displayName` properties
    groups: PropTypes.oneOfType([PropTypes.object, PropTypes.array]).isRequired,

    // selected is an array of selected organisation unit IDs
    selected: PropTypes.array.isRequired,

    // Whenever the selection changes, onUpdateSelection will be called with
    // one argument: The new array of selected organisation unit paths
    onUpdateSelection: PropTypes.func.isRequired,

    // When a the selected item of the dropdown is changed, onItemSelection will be called with
    // one argument: The selected org unit id in the dropdown
    onItemSelection: PropTypes.func.isRequired,

    // If currentRoot is set, only org units that are descendants of the
    // current root org unit will be added to or removed from the selection
    currentRoot: PropTypes.object,

    // TODO: Add group cache prop?
};

OrgUnitSelectByGroup.contextTypes = { api: PropTypes.any.isRequired };

export default OrgUnitSelectByGroup;
