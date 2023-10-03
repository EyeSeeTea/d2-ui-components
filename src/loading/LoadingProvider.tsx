import React, { useState } from "react";
import LoadingContext from "./context";
import LoadingConsumer from "./LoadingConsumer";
import { LoadingOptions } from "./types";

type LoadingProviderProps = {
    children: React.ReactNode;
};

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
    const [state, setState] = useState<LoadingOptions>({
        isLoading: false,
        message: "",
        progress: -1,
    });

    const show = (isLoading = true, message?: string, progress?: number) => {
        setState(state => ({
            ...state,
            isLoading,
            message,
            progress,
        }));
    };

    const hide = () => show(false);

    const reset = () => show(false, "", -1);

    const updateMessage = (message: string) => {
        setState(state => ({ ...state, message }));
    };

    const updateProgress = (progress: number) => {
        setState(state => ({ ...state, progress }));
    };

    const value = {
        ...state,
        show,
        hide,
        reset,
        updateMessage,
        updateProgress,
    };

    return (
        <LoadingContext.Provider value={value}>
            <LoadingConsumer />
            {children}
        </LoadingContext.Provider>
    );
};

export default LoadingProvider;
