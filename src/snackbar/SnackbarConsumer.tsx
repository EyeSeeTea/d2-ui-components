import { Typography } from "@material-ui/core";
import amber from "@material-ui/core/colors/amber";
import green from "@material-ui/core/colors/green";
import IconButton from "@material-ui/core/IconButton";
import Snackbar from "@material-ui/core/Snackbar";
import SnackbarContent from "@material-ui/core/SnackbarContent";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import CloseIcon from "@material-ui/icons/Close";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import WarningIcon from "@material-ui/icons/Warning";
//@ts-ignore
import classNames from "classnames";
import React from "react";
import SnackbarContext from "./context";

const anchorOrigin = {
    vertical: "bottom" as const,
    horizontal: "center" as const,
};

const variantIcon = {
    success: CheckCircleIcon,
    warning: WarningIcon,
    error: ErrorIcon,
    info: InfoIcon,
};

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            bottom: 0,
        },
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
            marginRight: theme.spacing(4), // Or anything between 30px and 38px
        },
        content: {
            display: "flex" as const,
            alignItems: "center" as const,
            whiteSpace: "pre-wrap" as const,
        },
        message: {
            maxHeight: 500,
            overflow: "auto",
            paddingRight: 10,
        },
    })
);

const SnackbarConsumer = () => {
    const classes = useStyles();

    return (
        <SnackbarContext.Consumer>
            {state => {
                if (!state) throw new Error("Snackbar context has not been defined");
                const { isOpen, message, variant, closeSnackbar, autoHideDuration } = state;

                function notifyClose(_ev: React.SyntheticEvent<any>, reason: string) {
                    if (reason !== "clickaway") closeSnackbar();
                }

                if (!variant || !variantIcon[variant]) {
                    throw new Error(`Unknown variant: ${variant}`);
                }

                const Icon = variantIcon[variant];

                return (
                    <Snackbar
                        className={classes.root}
                        anchorOrigin={anchorOrigin}
                        open={isOpen}
                        autoHideDuration={autoHideDuration}
                        onClose={notifyClose}
                    >
                        <SnackbarContent
                            className={classes[variant]}
                            aria-describedby="client-snackbar"
                            message={
                                <span id="client-snackbar" className={classes.content}>
                                    <Icon
                                        className={classNames(classes.icon, classes.iconVariant)}
                                    />
                                    <Typography className={classes.message}>{message}</Typography>
                                </span>
                            }
                            action={[
                                <IconButton
                                    key="close"
                                    aria-label="Close"
                                    color="inherit"
                                    onClick={closeSnackbar}
                                >
                                    <CloseIcon className={classes.icon} />
                                </IconButton>,
                            ]}
                        />
                    </Snackbar>
                );
            }}
        </SnackbarContext.Consumer>
    );
};

export default SnackbarConsumer;
