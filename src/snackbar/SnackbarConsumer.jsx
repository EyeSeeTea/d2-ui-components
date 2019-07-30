import React from "react";

import SnackbarContext from "./context";
import Snackbar from "./snackbar";

const SnackbarConsumer = () => {
    return (
        <SnackbarContext.Consumer>
            {({ ...props }) => <Snackbar {...props} />}
        </SnackbarContext.Consumer>
    );
};

SnackbarConsumer.propTypes = {};

export default SnackbarConsumer;
