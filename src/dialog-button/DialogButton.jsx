import React from "react";
import PropTypes from "prop-types";
import i18n from "../utils/i18n";
import { ConfirmationDialog } from "../confirmation-dialog/ConfirmationDialog";

export class DialogButton extends React.Component {
    static propTypes = {
        buttonComponent: PropTypes.func.isRequired,
        title: PropTypes.node.isRequired,
        contents: PropTypes.node.isRequired,
        initialIsOpen: PropTypes.bool,
        isVisible: PropTypes.bool,
    };

    static defaultProps = {
        initialIsOpen: undefined,
        isVisible: true,
    };

    state = {
        isOpen: !!this.props.initialIsOpen,
        props: this.props,
    };

    static getDerivedStateFromProps(nextProps, prevState) {
        // Force the dialog opening only when initialIsOpen transitions from undefined to true
        if (prevState.props.initialIsOpen === undefined && nextProps.initialIsOpen) {
            return { isOpen: nextProps.initialIsOpen, props: nextProps };
        } else {
            return null;
        }
    }

    handleClickOpen = () => {
        this.setState({ isOpen: true });
    };

    handleClose = () => {
        this.setState({ isOpen: false });
    };

    render() {
        const { buttonComponent: CustomButton, title, contents, isVisible, ...other } = this.props;
        const { isOpen } = this.state;

        if (!isVisible) return null;

        return (
            <React.Fragment>
                <CustomButton onClick={this.handleClickOpen} />

                <ConfirmationDialog
                    {...other}
                    isOpen={isOpen}
                    title={title}
                    description={contents}
                    onCancel={this.handleClose}
                    cancelText={i18n.t("Close")}
                />
            </React.Fragment>
        );
    }
}

export default DialogButton;
