import React from "react";
import _ from "lodash";
import { makeStyles } from "@material-ui/core";

export type Item = { text: string; value: string };

export interface SelectMultipleProps {
    items: Item[];
    onSelectionChange: (selectedValues: string[]) => void;
    onDoubleClick: (value: string) => void;
    refSelect?: React.Ref<HTMLSelectElement>;
    value?: string[];
    height?: number;
}

const useStyles = makeStyles({
    select: {
        border: "none",
        outline: "none",
        fontFamily: "Roboto",
        fontSize: "13px",
        width: "100%",
    },
    option: {
        padding: "0.25rem 0.5rem",
    },
});

export const SelectMultiple: React.FC<SelectMultipleProps> = ({
    refSelect,
    items,
    onSelectionChange,
    onDoubleClick,
    height,
}) => {
    const classes = useStyles();
    const handleChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const selectedOptions = Array.from(e.target.selectedOptions);
        const values = selectedOptions.map(option => option.value);
        onSelectionChange(values);
    };

    const handleDoubleClick = (e: React.MouseEvent<HTMLOptionElement>) => {
        onDoubleClick(e.currentTarget.value);
    };

    return (
        <select
            style={{ minHeight: `${height}px` }}
            ref={refSelect}
            multiple
            onChange={handleChange}
            className={classes.select}
        >
            {items.map(item => (
                <option
                    className={classes.option}
                    key={item.value}
                    value={item.value}
                    onDoubleClick={handleDoubleClick}
                >
                    {item.text}
                </option>
            ))}
        </select>
    );
};
