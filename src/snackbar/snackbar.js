import React from "react";
import PropTypes from "prop-types";
import classNames from "classnames";

import { Snackbar, SnackbarContent, IconButton, withStyles } from "@material-ui/core";
import CheckCircleIcon from "@material-ui/icons/CheckCircle";
import ErrorIcon from "@material-ui/icons/Error";
import InfoIcon from "@material-ui/icons/Info";
import CloseIcon from "@material-ui/icons/Close";
import WarningIcon from "@material-ui/icons/Warning";

import { styles } from "./styles";

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

const CustomSnackbar = ({ snackbarIsOpen, message, variant, closeSnackbar, autoHideDuration }) => {
    const Icon = variantIcon[variant];
    if (!Icon) {
        throw new Error(`Unknown variant: ${variant}`);
    }

    return (
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
                        <Icon className={classNames(classes.icon, classes.iconVariant)} />
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
    );
};

CustomSnackbar.propTypes = {
    classes: PropTypes.object.isRequired,
};

CustomSnackbar.defaultProps = {};

export default withStyles(styles)(CustomSnackbar);
