import React from "react";
import context from "./context";
import _ from "lodash";

const levels = ["success", "info", "warning", "error"];

export function withSnackbar(WrappedComponent) {
    return class extends React.Component {
        static displayName = `withSnackbar${WrappedComponent.displayName}`;
        static contextType = context;

        openSnackbarByLevel = _(levels)
            .map(key => [key, (...args) => this.context.openSnackbar(key, ...args)])
            .fromPairs()
            .value();

        render() {
            return <WrappedComponent {...this.props} snackbar={this.openSnackbarByLevel} />;
        }
    };
}

const defaultProps = {
    isOpen: false,
    message: "",
};

const buildOptions = (level, message, options = {}) => {
    const defaultAutoHideDuration = level === "success" ? 2000 : undefined;
    const autoHideDuration = options.hasOwnProperty("autoHideDuration")
        ? options.autoHideDuration
        : defaultAutoHideDuration;
    return {
        message,
        isOpen: true,
        variant: level,
        autoHideDuration,
    };
};

export const useSnackbar = initialProps => {
    const [props, updateProps] = useState({
        ...defaultProps,
        ...initialProps,
    });

    useEffect(() => {
        if (!document.getElementById("snackbar-container")) {
            const container = document.createElement("div");
            container.setAttribute("id", "snackbar-container");
            document.body.prepend(container);
            ReactDOM.render(<Snackbar {...props} />, container);
        }

        document.getElementById("snackbar-container").hidden = !props.isLoading;
    }, [props]);

    const value = useMemo(
        () => ({
            openSnackbar: (...args) => updateProps(buildOptions(...args)),
            closeSnackbar: () => updateProps(defaultProps),
            ...props,
            ..._(levels)
                .map(key => [key, (...args) => updateProps(buildOptions(key, ...args))])
                .fromPairs()
                .value(),
        }),
        [props]
    );

    return value;
};
