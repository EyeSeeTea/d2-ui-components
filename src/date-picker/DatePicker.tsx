import MomentUtils from "@date-io/moment";
import { createTheme, MuiThemeProvider } from "@material-ui/core";
import {
    DatePicker as MuiDatePicker,
    DatePickerProps as MuiDatePickerProps,
    MuiPickersUtilsProvider,
} from "@material-ui/pickers";
import { Dictionary } from "lodash";
import moment from "moment";
import PropTypes from "prop-types";
import React, { CSSProperties } from "react";

export interface DatePickerProps extends MuiDatePickerProps {
    isFilter?: boolean;
    errorText?: string;
    errorStyle?: CSSProperties;
}

const colors: { filter: Dictionary<string>; form: Dictionary<string> } = {
    filter: {
        grey: "#aaaaaa",
        input: "#565656",
    },
    form: {
        grey: "#0000004d",
        input: "#000000de",
    },
};

const getMaterialTheme = (isFilter: boolean, colors: Dictionary<string>) =>
    createTheme({
        overrides: {
            ...(isFilter && {
                MuiFormControl: {
                    marginNormal: {
                        marginTop: 8,
                        marginBottom: 0,
                        marginLeft: 10,
                    },
                },
            }),
            MuiFormLabel: {
                root: {
                    color: colors.grey,
                },
            },
            MuiInput: {
                input: {
                    color: colors.input,
                },
            },
        },
    });

export const DatePicker: React.FC<DatePickerProps> = ({
    isFilter = false,
    errorStyle,
    errorText,
    ...datePickerProps
}) => {
    const fieldColors = isFilter ? colors.filter : colors.form;
    const materialTheme = getMaterialTheme(isFilter, fieldColors);

    return (
        <MuiThemeProvider theme={materialTheme}>
            <MuiPickersUtilsProvider utils={MomentUtils}>
                <React.Fragment>
                    <MuiDatePicker {...datePickerProps} />
                    {errorText && <div style={errorStyle}>{errorText}</div>}
                </React.Fragment>
            </MuiPickersUtilsProvider>
        </MuiThemeProvider>
    );
};

DatePicker.propTypes = {
    label: PropTypes.string,
    value: PropTypes.object,
    onChange: PropTypes.func.isRequired,
    placeholder: PropTypes.string,
    isFilter: PropTypes.bool,
};

DatePicker.defaultProps = {
    margin: "normal",
    variant: "dialog",
    clearable: true,
    autoOk: true,
    format: moment.localeData().longDateFormat("L"),
};
