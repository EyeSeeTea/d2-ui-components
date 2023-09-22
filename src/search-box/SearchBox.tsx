import TextField from "@material-ui/core/TextField";
import _ from "lodash";
import React, { useCallback, useState, useEffect } from "react";
import i18n from "../utils/i18n";

export interface SearchBoxProps {
    value?: string;
    debounce?: number;
    onChange(value: string): void;
    hintText?: string;
    className?: string;
}

const styles = {
    textField: { paddingTop: 8 },
};

export const SearchBox: React.FC<SearchBoxProps> = ({
    value,
    hintText = i18n.t("Search by name"),
    onChange,
    debounce: debounceTime = 400,
    className,
}) => {
    const [stateValue, updateStateValue] = useState(value);
    useEffect(() => updateStateValue(value), [value]);

    const onChangeDebounced = React.useMemo(() => {
        return _.debounce((value: string) => {
            onChange(value);
        }, debounceTime);
    }, [onChange, debounceTime]);

    const onKeyUp = useCallback(
        (event: React.ChangeEvent<HTMLInputElement>) => {
            const value = event.target.value;
            onChangeDebounced(value);
            updateStateValue(value);
        },
        [onChangeDebounced, updateStateValue]
    );

    return (
        <TextField
            type="search"
            value={stateValue || ""}
            style={styles.textField}
            fullWidth={true}
            onChange={onKeyUp}
            placeholder={hintText}
            data-test="search"
            className={className}
        />
    );
};

export default SearchBox;
