import React, { PureComponent } from "react";
import PropTypes from "prop-types";
import moment from "moment";
import MomentUtils from "@date-io/moment";

import { MuiPickersUtilsProvider, DatePicker as MuiDatePicker } from "material-ui-pickers";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";
import { withStyles } from "@material-ui/core/styles";
import cyan from "@material-ui/core/colors/cyan";

const grey = "#aaaaaa";

const styles = () => ({
    fieldContainer: {
        display: "inline-block",
        marginLeft: 10,
    },
});

const materialTheme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    overrides: {
        MuiFormControl: {
            marginNormal: {
                marginTop: 8,
                marginBottom: 0,
            },
        },
        MuiFormLabel: {
            root: {
                color: grey,
                "&$focused": {
                    color: cyan["500"],
                },
            },
        },
        MuiInput: {
            input: {
                color: "#565656",
            },
            underline: {
                "&&&&:hover:before": {
                    borderBottom: `1px solid #e0e0e0`,
                },
                "&:hover:not($disabled):before": {
                    borderBottom: `1px solid ${grey}`,
                },
                "&:after": {
                    borderBottom: `2px solid ${cyan["500"]}`,
                },
                "&:before": {
                    borderBottom: `1px solid #e0e0e0`,
                },
            },
        },
    },
});

class DateTableFilter extends PureComponent {
    static propTypes = {
        placeholder: PropTypes.string,
        value: PropTypes.object,
        onChange: PropTypes.func.isRequired,
    };

    render() {
        const { placeholder, value, onChange, classes } = this.props;
        const format = moment.localeData().longDateFormat("L");

        return (
            <div className={classes.fieldContainer}>
                <MuiThemeProvider theme={materialTheme}>
                    <MuiPickersUtilsProvider utils={MomentUtils}>
                        <MuiDatePicker
                            margin="normal"
                            placeholder={placeholder}
                            value={value}
                            format={format}
                            onChange={onChange}
                            clearable={true}
                            autoOk={true}
                        />
                    </MuiPickersUtilsProvider>
                </MuiThemeProvider>
            </div>
        );
    }
}

export default withStyles(styles)(DateTableFilter);
