import React from "react";
import PropTypes from "prop-types";
import moment from "moment";
import MomentUtils from "@date-io/moment";
import { Dictionary } from "lodash";

import { MuiPickersUtilsProvider, DatePicker as MuiDatePicker } from "material-ui-pickers";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";
import cyan from "@material-ui/core/colors/cyan";

export interface DatePickerProps {
    label?: string;
    placeholder?: string;
    value?: Date;
    onChange: (date: Date) => {};
    isFilter?: boolean;
    format?: string;
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

class DatePicker extends React.PureComponent<DatePickerProps> {
    static propTypes = {
        label: PropTypes.string,
        value: PropTypes.object,
        onChange: PropTypes.func.isRequired,
        placeholder: PropTypes.string,
        isFilter: PropTypes.bool,
        format: PropTypes.string,
    };

    getMaterialTheme = (isFilter: boolean, colors: Dictionary<string>) =>
        createMuiTheme({
            typography: {
                useNextVariants: true,
            },
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
                        "&$focused": {
                            color: cyan["500"],
                        },
                    },
                },
                MuiInput: {
                    input: {
                        color: colors.input,
                    },
                    underline: {
                        "&&&&:hover:before": {
                            borderBottom: `1px solid #bdbdbd`,
                        },
                        "&:hover:not($disabled):before": {
                            borderBottom: `1px solid ${colors.grey}`,
                        },
                        "&:after": {
                            borderBottom: `2px solid ${cyan["500"]}`,
                        },
                        "&:before": {
                            borderBottom: `1px solid #bdbdbd`,
                        },
                    },
                },
            },
        });

    render() {
        const { placeholder, value, onChange, isFilter, label, format } = this.props;
        const dateFormat = format || moment.localeData().longDateFormat("L");
        const fieldColors = isFilter ? colors.filter : colors.form;
        const materialTheme = this.getMaterialTheme(isFilter, fieldColors);
        return (
            <MuiThemeProvider theme={materialTheme}>
                <MuiPickersUtilsProvider utils={MomentUtils}>
                    <MuiDatePicker
                        margin="normal"
                        label={label}
                        placeholder={placeholder}
                        value={value}
                        format={dateFormat}
                        onChange={onChange}
                        clearable={true}
                        autoOk={true}
                    />
                </MuiPickersUtilsProvider>
            </MuiThemeProvider>
        );
    }
}

export { DatePicker };
