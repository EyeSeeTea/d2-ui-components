import React, { PropsWithChildren, useState } from "react";
import SnackbarContext from "./context";
import SnackbarConsumer from "./SnackbarConsumer";
import { Message, SnackbarLevel, SnackbarOptions } from "./types";

export const SnackbarProvider: React.FC<PropsWithChildren<{}>> = ({ children }) => {
    const [state, setState] = useState<SnackbarOptions>({
        isOpen: false,
        message: "",
        variant: "success",
    });

    const openSnackbar = (
        variant: SnackbarLevel,
        message: Message,
        options: Partial<SnackbarOptions> = {}
    ) => {
        const defaultAutoHideDuration = variant === "success" ? 2000 : undefined;
        const { autoHideDuration = defaultAutoHideDuration } = options;

        setState({
            isOpen: true,
            message,
            variant,
            autoHideDuration,
        });
    };

    const byLevel = {
        success: (message: Message, options: Partial<SnackbarOptions> = {}) => {
            openSnackbar("success", message, options);
        },
        info: (message: Message, options: Partial<SnackbarOptions> = {}) => {
            openSnackbar("info", message, options);
        },
        warning: (message: Message, options: Partial<SnackbarOptions> = {}) => {
            openSnackbar("warning", message, options);
        },
        error: (message: Message, options: Partial<SnackbarOptions> = {}) => {
            openSnackbar("error", message, options);
        },
    };

    const closeSnackbar = () => {
        setState(state => ({
            ...state,
            message: "",
            isOpen: false,
        }));
    };

    const value = {
        ...byLevel,
        ...state,
        openSnackbar: openSnackbar,
        closeSnackbar: closeSnackbar,
    };

    return (
        <SnackbarContext.Provider value={value}>
            <SnackbarConsumer />
            {children}
        </SnackbarContext.Provider>
    );
};

export default SnackbarProvider;
