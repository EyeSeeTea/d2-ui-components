import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import CloseIcon from "@material-ui/icons/Close";
import green from "@material-ui/core/colors/green";
import amber from "@material-ui/core/colors/amber";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import WarningIcon from "@material-ui/icons/Warning";
import { withStyles } from "@material-ui/core/styles";
import SnackbarContext from "./context";
import { MuiThemeProvider, createMuiTheme } from "@material-ui/core";

const anchorOrigin = {
    vertical: "bottom",
    horizontal: "center",
};

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

const styles = theme => ({
    success: {
        backgroundColor: green[600],
    },
    error: {
        backgroundColor: theme.palette.error.dark,
    },
    info: {
        backgroundColor: theme.palette.primary.dark,
    },
    warning: {
        backgroundColor: amber[700],
    },
    icon: {
        fontSize: 20,
    },
    iconVariant: {
        opacity: 0.9,
        marginRight: theme.spacing.unit,
    },
    message: {
        display: "flex",
        alignItems: "center",
        whiteSpace: "pre-wrap",
    },
});

const theme = createMuiTheme({
    typography: {
        useNextVariants: true,
    },
    overrides: {
        MuiSnackbarContent: {
            message: {
                maxWidth: "85%",
            },
        },
    },
});

const SnackbarConsumer = props => {
    const { classes } = props;

    return (
        <SnackbarContext.Consumer>
            {({ snackbarIsOpen, message, variant, closeSnackbar, autoHideDuration }) => {
                const Icon = variantIcon[variant];
                if (!Icon) {
                    throw new Error(`Unknown variant: ${variant}`);
                }

                return (
                    <MuiThemeProvider theme={theme}>
                        <Snackbar
                            anchorOrigin={anchorOrigin}
                            open={snackbarIsOpen}
                            autoHideDuration={autoHideDuration}
                            onClose={closeSnackbar}
                        >
                            <SnackbarContent
                                className={classes[variant]}
                                aria-describedby="client-snackbar"
                                message={
                                    <span id="client-snackbar" className={classes.message}>
                                        <Icon
                                            className={classNames(
                                                classes.icon,
                                                classes.iconVariant
                                            )}
                                        />
                                        {message}
                                    </span>
                                }
                                action={[
                                    <IconButton
                                        key="close"
                                        aria-label="Close"
                                        color="inherit"
                                        className={classes.close}
                                        onClick={closeSnackbar}
                                    >
                                        <CloseIcon className={classes.icon} />
                                    </IconButton>,
                                ]}
                            />
                        </Snackbar>
                    </MuiThemeProvider>
                );
            }}
        </SnackbarContext.Consumer>
    );
};

SnackbarConsumer.propTypes = {
    classes: PropTypes.object.isRequired,
};

export default withStyles(styles)(SnackbarConsumer);
