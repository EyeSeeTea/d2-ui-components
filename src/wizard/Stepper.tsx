import { makeStyles, Step, StepButton, Stepper as MuiStepper } from "@material-ui/core";
import _ from "lodash";
import React, { MouseEvent } from "react";
import { Help } from "./Help";
import { WizardStep } from "./Wizard";

const currentStepClassName = "current-step";

function mergeStepClasses(className: string | undefined, isActive: boolean): string {
    return _([isActive ? currentStepClassName : undefined, className])
        .compact()
        .join(" ");
}

export const Stepper: React.FC<StepperProps> = ({
    steps,
    lastClickableStepIndex = 0,
    currentStepKey,
    onStepClicked,
}) => {
    const classes = useStyles();

    if (steps.length === 0) return null;

    const index = _(steps).findIndex(step => step.key === currentStepKey);
    const currentStepIndex = index >= 0 ? index : 0;
    const currentStep = steps[currentStepIndex];

    return (
        <MuiStepper
            nonLinear={true}
            activeStep={currentStepIndex}
            className={["Wizard-Stepper", classes.stepper].join(" ")}
        >
            {steps.map((step, index) => (
                <Step
                    key={step.key}
                    completed={step.completed || false}
                    disabled={index > lastClickableStepIndex}
                    className={_(["Wizard-Step", step.stepClassName]).compact().value().join(" ")}
                >
                    <StepButton
                        key={step.key}
                        {...(step.icon ? { icon: step.icon } : {})}
                        data-test-current={currentStep === step}
                        onClick={onStepClicked ? onStepClicked(step.key) : undefined}
                        classes={{ root: classes.stepButton }}
                        className={mergeStepClasses(step.stepButtonClassName, currentStep === step)}
                    >
                        {step.label}
                    </StepButton>

                    {step.help && <Help step={step} currentStepKey={currentStepKey} />}
                </Step>
            ))}
        </MuiStepper>
    );
};

type EventHandler = (event: MouseEvent<HTMLElement>) => void;

export interface StepperProps {
    steps: WizardStep[];
    lastClickableStepIndex?: number;
    currentStepKey?: string;
    onStepClicked?: (stepKey: string) => EventHandler;
}

const useStyles = makeStyles(() => ({
    stepButton: {
        width: "auto",
    },
    stepper: {
        marginLeft: 10,
        marginRight: 10,
    },
}));

export default Stepper;
