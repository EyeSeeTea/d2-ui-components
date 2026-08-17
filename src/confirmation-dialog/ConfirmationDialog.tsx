import {
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogProps,
    DialogTitle,
    makeStyles,
} from "@material-ui/core";
import _ from "lodash";
import React, { ReactNode } from "react";
import i18n from "../utils/i18n";

export interface ConfirmationDialogProps extends Partial<Omit<DialogProps, "title">> {
    isOpen?: boolean;
    title?: string | ReactNode;
    description?: string | ReactNode;
    onSave?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onCancel?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    onInfoAction?: (event: React.MouseEvent<HTMLButtonElement, MouseEvent>) => void;
    saveText?: string;
    cancelText?: string;
    infoActionText?: string;
    disableSave?: boolean;
}

export const ConfirmationDialog: React.FC<React.PropsWithChildren<ConfirmationDialogProps>> = ({
    title = "",
    description,
    onSave,
    onCancel,
    onInfoAction,
    isOpen = false,
    children,
    cancelText = i18n.t("Cancel"),
    saveText = i18n.t("Save"),
    infoActionText = i18n.t("Info"),
    disableSave = false,
    ...other
}) => {
    const classes = useStyles();

    return (
        <Dialog open={isOpen} onClose={onCancel || _.noop} {...other}>
            <DialogTitle>{title}</DialogTitle>

            <DialogContent>
                {description && renderNode(description)}
                {children}
            </DialogContent>

            <DialogActions>
                {onInfoAction && (
                    <Button
                        key={"info"}
                        className={classes.infoButton}
                        onClick={onInfoAction}
                        autoFocus
                    >
                        {infoActionText}
                    </Button>
                )}
                {onCancel && (
                    <Button key={"cancel"} onClick={onCancel} autoFocus>
                        {cancelText}
                    </Button>
                )}
                {onSave && (
                    <Button key={"save"} onClick={onSave} color="primary" disabled={disableSave}>
                        {saveText}
                    </Button>
                )}
            </DialogActions>
        </Dialog>
    );
};

function renderNode(node: ReactNode) {
    if (typeof node === "string") {
        return node.split("\n").map((text, idx) => <p key={idx}>{text}</p>);
    } else {
        return node;
    }
}

const useStyles = makeStyles({
    infoButton: { marginRight: "auto" },
});

export default ConfirmationDialog;
