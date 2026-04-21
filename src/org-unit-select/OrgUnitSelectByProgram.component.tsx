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

interface OrgUnitSelectByProgramProps extends OrgUnitSelectProps {
    readonly programs: ReadonlyArray<{ readonly id: string; readonly displayName: string }>;
    readonly currentRoot?: {
        readonly id: string;
        readonly displayName: string;
        readonly path: string;
        readonly level?: number;
    };
}

class OrgUnitSelectByProgram extends React.Component<
    OrgUnitSelectByProgramProps,
    OrgUnitSelectState
> {
    declare context: { api: any };
    static contextTypes = { api: () => null };

    programCache: Record<string, OrgUnit[]> = {};

    addToSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    removeFromSelection: (orgUnits: ReadonlyArray<OrgUnit>) => void;
    handleChangeSelection: (event: React.ChangeEvent<{ value: unknown }>) => void;

    constructor(props: OrgUnitSelectByProgramProps, context: { api: any }) {
        super(props, context);

        this.state = {
            loading: false,
            selection: undefined,
        };

        this.addToSelection = addToSelection.bind(this);
        this.removeFromSelection = removeFromSelection.bind(this);
        this.handleChangeSelection = handleChangeSelection.bind(this);

        this.getOrgUnitsForProgram = this.getOrgUnitsForProgram.bind(this);
        this.handleSelect = this.handleSelect.bind(this);
        this.handleDeselect = this.handleDeselect.bind(this);
    }

    getOrgUnitsForProgram(programId: string, ignoreCache = false): Promise<OrgUnit[]> {
        const { api } = this.context;
        return new Promise(resolve => {
            if (this.props.currentRoot) {
                const currentRoot = this.props.currentRoot;
                log.debug(
                    `Loading org units for program ${programId} within ${currentRoot.displayName}`
                );
                this.setState({ loading: true });

                api.get("/organisationUnits/" + currentRoot.id, {
                    paging: false,
                    includeDescendants: true,
                    fields: "id,path",
                    filter: `programs.id:eq:${programId}`,
                })
                    .getData()
                    .then(
                        ({ organisationUnits }: { organisationUnits: OrgUnit[] }) =>
                            organisationUnits
                    )
                    .then((orgUnits: OrgUnit[]) => {
                        log.debug(
                            `Loaded ${orgUnits.length} org units for program ${programId} within ${currentRoot.displayName}`
                        );
                        this.setState({ loading: false });

                        resolve(orgUnits.slice());
                    });
            } else if (!ignoreCache && this.programCache.hasOwnProperty(programId)) {
                const cached = this.programCache[programId] as OrgUnit[];
                resolve(cached.slice());
            } else {
                log.debug(`Loading org units for program ${programId}`);
                this.setState({ loading: true });

                const { api } = this.context;
                api.models.programs
                    .get({
                        fields: { organisationUnits: { id: true, path: true } },
                        filter: { id: { eq: programId } },
                    })
                    .getData()
                    .then(
                        ({ objects }: { objects: Array<{ organisationUnits?: OrgUnit[] }> }) =>
                            _.first(objects) || {}
                    )
                    .then(({ organisationUnits = [] }: { organisationUnits?: OrgUnit[] }) => {
                        log.debug(
                            `Loaded ${organisationUnits.length} org units for program ${programId}`
                        );
                        this.setState({ loading: false });
                        this.programCache[programId] = organisationUnits;

                        // Make a copy of the returned array to ensure that the cache won't be modified from elsewhere
                        resolve(organisationUnits.slice());
                    })
                    .catch((err: Error) => {
                        this.setState({ loading: false });
                        log.error(`Failed to load org units in program ${programId}:`, err);
                    });
            }
        });
    }

    handleSelect(): void {
        this.getOrgUnitsForProgram(this.state.selection as string).then(this.addToSelection);
    }

    handleDeselect(): void {
        this.getOrgUnitsForProgram(this.state.selection as string).then(this.removeFromSelection);
    }

    render(): React.ReactNode {
        const menuItems = this.props.programs;
        const label = i18n.t("Program");

        // The minHeight on the wrapping div below is there to compensate for the fact that a
        // Material-UI SelectField will change height depending on whether or not it has a value
        return renderDropdown.call(this, menuItems, label);
    }
}

export default OrgUnitSelectByProgram;
