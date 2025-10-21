import { MenuItem, Select } from "@material-ui/core";
import React from "react";
import i18n from "../utils/i18n";
import { DropdownForm, DropdownItem } from "./GenericDropdown";

export interface DropdownProps<Value extends string = string> {
    className?: string;
    items: DropdownItem[];
    onChange: (value: Value | undefined) => void;
    label?: string;
    value?: Value;
    hideEmpty?: boolean;
}

interface SelectProps {
    className?: string;
    label?: string;
}

const SelectWrapper: React.FC<SelectProps> = React.memo(props => {
    const { className, label, children } = props;
    return label ? (
        <DropdownForm className={className} label={label}>
            {children}
        </DropdownForm>
    ) : (
        <div className={className}>{children}</div>
    );
});

export const Dropdown: React.FC<DropdownProps> = React.memo(props => {
    const { items, value, onChange, label, hideEmpty, className } = props;

    const selectValue =
        value === undefined || !items.map(item => item.value).includes(value) ? "" : value;

    return (
        <SelectWrapper className={className} label={label}>
            <Select
                data-cy={label}
                value={selectValue}
                onChange={ev => onChange((ev.target.value as string) || undefined)}
                MenuProps={{
                    getContentAnchorEl: null,
                    anchorOrigin: { vertical: "bottom", horizontal: "left" },
                }}
            >
                {!hideEmpty && <MenuItem value={""}>{i18n.t("<No value>")}</MenuItem>}
                {items.map(item => (
                    <MenuItem key={item.value} value={item.value} disabled={item.disabled}>
                        {item.text}
                    </MenuItem>
                ))}
            </Select>
        </SelectWrapper>
    );
});
