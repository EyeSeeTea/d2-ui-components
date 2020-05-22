import React, { useCallback, useState } from "react";
import { ConfirmationDialog, ConfirmationDialogProps } from "./ConfirmationDialog";

export interface ConfirmationDialogHookState extends Omit<ConfirmationDialogProps, "isOpen"> {
    autoClose?: boolean;
}

export type ConfirmationDialogHookResult = [
    (props: ConfirmationDialogProps) => JSX.Element | null,
    (state: ConfirmationDialogHookState) => void,
    () => void
];

export function useConfirmationDialog(
    initialState: ConfirmationDialogHookState | null = null
): ConfirmationDialogHookResult {
    const [modalState, updateModal] = useState<ConfirmationDialogHookState | null>(initialState);
    const closeModal = useCallback(() => updateModal(null), []);

    const component = useCallback(
        (props: ConfirmationDialogProps) => {
            if (modalState === null) return null;
            const { autoClose = true, onSave, onCancel, onInfoAction, ...rest } = modalState;

            return (
                <ConfirmationDialog
                    {...props}
                    {...rest}
                    isOpen={true}
                    onSave={event => {
                        if (onSave) onSave(event);
                        if (autoClose) closeModal();
                    }}
                    onCancel={event => {
                        if (onCancel) onCancel(event);
                        if (autoClose) closeModal();
                    }}
                    onInfoAction={event => {
                        if (onInfoAction) onInfoAction(event);
                        if (autoClose) closeModal();
                    }}
                />
            );
        },
        [closeModal, modalState]
    );

    return [component, updateModal, closeModal];
}

export default useConfirmationDialog;
