import React from "react";
import i18n from "../utils/i18n";
import {
    ConfirmationDialog,
    ConfirmationDialogProps,
} from "../confirmation-dialog/ConfirmationDialog";

interface DialogButtonOwnProps {
    readonly buttonComponent: React.ComponentType<any>;
    readonly title: React.ReactNode;
    readonly contents: React.ReactNode;
    readonly initialIsOpen?: boolean;
    readonly isVisible?: boolean;
}

type DialogButtonProps = DialogButtonOwnProps &
    Omit<ConfirmationDialogProps, "isOpen" | "title" | "description" | "onCancel" | "cancelText">;

interface DialogButtonState {
    isOpen: boolean;
    props: DialogButtonProps;
}

export class DialogButton extends React.Component<DialogButtonProps, DialogButtonState> {
    static defaultProps = {
        initialIsOpen: undefined,
        isVisible: true,
    };

    state: DialogButtonState = {
        isOpen: !!this.props.initialIsOpen,
        props: this.props,
    };

    static getDerivedStateFromProps(
        nextProps: DialogButtonProps,
        prevState: DialogButtonState
    ): Partial<DialogButtonState> | null {
        // Force the dialog opening only when initialIsOpen transitions from undefined to true
        if (prevState.props.initialIsOpen === undefined && nextProps.initialIsOpen) {
            return { isOpen: nextProps.initialIsOpen, props: nextProps };
        } else {
            return null;
        }
    }

    handleClickOpen = (): void => {
        this.setState({ isOpen: true });
    };

    handleClose = (): void => {
        this.setState({ isOpen: false });
    };

    render(): React.ReactNode {
        const {
            buttonComponent: CustomButton,
            title,
            contents,
            isVisible,
            initialIsOpen: _initialIsOpen,
            ...other
        } = this.props;
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
