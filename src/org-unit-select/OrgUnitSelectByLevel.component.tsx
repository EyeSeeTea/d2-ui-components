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

interface LevelItem {
    readonly level: number;
    readonly displayName: string;
}

interface OrgUnitSelectByLevelProps extends OrgUnitSelectProps {
    readonly levels: ReadonlyArray<LevelItem>;
    readonly currentRoot?: {
        readonly id: string;
        readonly displayName: string;
        readonly path: string;
        readonly level?: number;
    };
    readonly withinUserHierarchyInFilters?: boolean;
}

class OrgUnitSelectByLevel extends React.Component<OrgUnitSelectByLevelProps, OrgUnitSelectState> {
    declare context: { api: any };
    static contextTypes = { api: () => null };

    levelCache: Record<number, OrgUnit[]> = {};

    addToSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    removeFromSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    handleChangeSelection: (event: React.ChangeEvent<{ value: unknown }>) => void;

    constructor(props: OrgUnitSelectByLevelProps, context: { api: any }) {
        super(props, context);

        this.state = {
            loading: false,
            selection: undefined,
        };

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);
        this.handleChangeSelection = handleChangeSelection.bind(this);

        this.getOrgUnitsForLevel = this.getOrgUnitsForLevel.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDeselect = this.handleDeselect.bind(this);
    }

    getOrgUnitsForLevel(level: number, ignoreCache = false): Promise<OrgUnit[]> {
        const { api } = this.context;
        return new Promise(resolve => {
            if (this.props.currentRoot) {
                const rootLevel =
                    this.props.currentRoot.level || this.props.currentRoot.path
                        ? this.props.currentRoot.path.match(/\//g)!.length
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
                    .then(
                        ({ organisationUnits }: { organisationUnits: OrgUnit[] }) =>
                            organisationUnits
                    )
                    .then((orgUnitArray: OrgUnit[]) => {
                        log.debug(
                            `Loaded ${orgUnitArray.length} org units for level ` +
                                `${relativeLevel} under ${this.props.currentRoot!.displayName}`
                        );
                        this.setState({ loading: false });
                        resolve(orgUnitArray);
                    });
            } else if (!ignoreCache && this.levelCache.hasOwnProperty(level)) {
                resolve(this.levelCache[level]!.slice());
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
                    .then(({ objects }: { objects: OrgUnit[] }) => objects)
                    .then((orgUnitArray: OrgUnit[]) => {
                        log.debug(`Loaded ${orgUnitArray.length} org units for level ${level}`);
                        this.setState({ loading: false });
                        this.levelCache[level] = orgUnitArray;

                        // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                        resolve(orgUnitArray.slice());
                    })
                    .catch((err: Error) => {
                        this.setState({ loading: false });
                        log.error(`Failed to load org units in level ${level}:`, err);
                    });
            }
        });
    }

    handleSelect(): void {
        this.getOrgUnitsForLevel(this.state.selection as number).then(orgUnits => {
            this.addToSelection(orgUnits);
        });
    }

    handleDeselect(): void {
        this.getOrgUnitsForLevel(this.state.selection as number).then(orgUnits => {
            this.removeFromSelection(orgUnits);
        });
    }

    render(): React.ReactNode {
        const currentRoot = this.props.currentRoot;
        const currentRootLevel = currentRoot
            ? currentRoot.level || currentRoot.path.match(/\//g)!.length
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

export default OrgUnitSelectByLevel;
