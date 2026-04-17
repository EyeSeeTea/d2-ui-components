import { FormControl, InputLabel, LinearProgress, MenuItem, Select } from "@material-ui/core";
import Button from "@material-ui/core/Button";
import _ from "lodash";
import React from "react";
import i18n from "../utils/i18n";

export interface OrgUnit {
    readonly id: string;
    readonly path: string;
}

export interface OrgUnitSelectProps {
    readonly selectableIds?: ReadonlyArray<string>;
    readonly selected: ReadonlyArray<string>;
    readonly onUpdateSelection: (selection: ReadonlyArray<string>) => void;
    readonly onItemSelection: (value: string | number) => void;
}

export interface OrgUnitSelectState {
    loading: boolean;
    selection: string | number | undefined;
}

/* eslint-disable @typescript-eslint/no-explicit-any */
export interface OrgUnitSelectBaseComponent {
    props: OrgUnitSelectProps;
    state: OrgUnitSelectState;
    setState: (state: any, callback?: () => void) => void;
}

export interface OrgUnitSelectComponent extends OrgUnitSelectBaseComponent {
    handleChangeSelection: (event: React.ChangeEvent<{ value: unknown }>) => void;
    handleSelect: () => void;
    handleDeselect: () => void;
}
/* eslint-enable @typescript-eslint/no-explicit-any */

interface DropdownMenuItem {
    readonly id: string | number;
    readonly displayName: string;
}

const style = {
    button: {
        margin: 5,
    },
    progress: {
        height: 2,
        backgroundColor: "rgba(0,0,0,0)",
        top: 46,
    },
    selector: {
        width: "33%",
        marginTop: 18,
    },
};

function addToSelection(this: OrgUnitSelectBaseComponent, orgUnits: ReadonlyArray<OrgUnit>): void {
    const { selectableIds, selected } = this.props;
    const additions = orgUnits.filter(({ id }) => !selectableIds || selectableIds.includes(id));
    const newSelection = _.uniq([...selected, ...additions.map(ou => ou.path)]);

    this.props.onUpdateSelection(newSelection);
}

function removeFromSelection(
    this: OrgUnitSelectBaseComponent,
    orgUnits: ReadonlyArray<OrgUnit>
): void {
    const removedOus = orgUnits.filter(ou => this.props.selected.includes(ou.path));
    const removed = removedOus.map(ou => ou.path);
    const selectedOus = this.props.selected.filter(ou => !removed.includes(ou));

    this.props.onUpdateSelection(selectedOus);
}

function handleChangeSelection(
    this: OrgUnitSelectComponent,
    event: React.ChangeEvent<{ value: unknown }>
): void {
    this.setState({ selection: event.target.value as string | number });
    this.props.onItemSelection(event.target.value as string | number);
}

function renderDropdown(
    this: OrgUnitSelectComponent,
    menuItems: ReadonlyArray<DropdownMenuItem>,
    label: string
): React.ReactElement {
    const disabled = this.state.loading || !this.state.selection;

    return (
        <div style={{ position: "relative", minHeight: 89 }}>
            <FormControl style={style.selector}>
                <InputLabel>{label}</InputLabel>

                <Select
                    value={this.state.selection || ""}
                    onChange={this.handleChangeSelection}
                    disabled={this.state.loading}
                >
                    <MenuItem value={""}>{i18n.t("<No value>")}</MenuItem>
                    {menuItems.map(item => (
                        <MenuItem key={item.id} value={item.id}>
                            {item.displayName}
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            <div style={{ marginLeft: 10, marginTop: 24, display: "inline-block" }}>
                {this.state.loading && <LinearProgress style={style.progress} />}
                <Button
                    variant="contained"
                    style={style.button}
                    onClick={this.handleSelect}
                    disabled={disabled}
                >
                    {i18n.t("Select")}
                </Button>

                <Button
                    variant="contained"
                    style={style.button}
                    onClick={this.handleDeselect}
                    disabled={disabled}
                >
                    {i18n.t("Deselect")}
                </Button>
            </div>
        </div>
    );
}

export { addToSelection, removeFromSelection, handleChangeSelection, renderDropdown };
