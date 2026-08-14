import { ButtonProps, Icon, IconButton, Tooltip } from "@material-ui/core";
import React from "react";
import { DialogButton } from "../dialog-button/DialogButton";
import i18n from "../utils/i18n";
import { WizardStep } from "./Wizard";

const HelpButton: React.FC<ButtonProps> = ({ onClick }) => (
    <Tooltip title={i18n.t("Help")}>
        <IconButton onClick={onClick}>
            <Icon color="primary">help</Icon>
        </IconButton>
    </Tooltip>
);

export const Help: React.FC<HelpProps> = ({ step, currentStepKey = "" }) => (
    <DialogButton
        buttonComponent={HelpButton}
        title={`${step.label} - ${i18n.t("Help")}`}
        contents={step.help}
        initialIsOpen={step.helpDialogIsInitialOpen}
        isVisible={!!step.help && step.key === currentStepKey}
    />
);

export interface HelpProps {
    step: WizardStep;
    currentStepKey?: string;
}

export default Help;
