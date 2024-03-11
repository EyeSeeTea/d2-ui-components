import { makeStyles } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import _ from "lodash";
import { ReactComponentLike } from "prop-types";
import React, { ReactElement, useCallback, useEffect, useState } from "react";
import { useSnackbar } from "../snackbar";
import { FeedbackMessages } from "./FeedbackMessages";
import { Navigation, NavigationProps } from "./Navigation";
import Stepper, { StepperProps } from "./Stepper";
import { getAdjacentSteps } from "./utils";

export const Wizard: React.FC<WizardProps> = ({
    className,
    steps,
    stepKey,
    initialStepKey = steps[0] ? steps[0].key : "",
    onStepChangeRequest,
    onStepChange,
    useSnackFeedback = false,
    lastClickableStepIndex: initialLastClickableStepIndex = 0,
    stepsDisableUntilReached = true,
    StepperComponent = Stepper,
    NavigationComponent = Navigation,
}) => {
    const classes = useStyles();
    const snackbar = useSnackbar();

    const [stateStepKey, setCurrentStepKey] = useState(initialStepKey);
    const currentStepKey = stepKey || stateStepKey;

    const [messages, setMessages] = useState<string[]>([]);
    const [lastClickableStepIndex, setLastClickableStepIndex] = useState(
        initialLastClickableStepIndex
    );

    const notifyStepChange = useCallback(
        (skepKey: string) => {
            if (onStepChange) onStepChange(skepKey);
        },
        [onStepChange]
    );

    const setStep = useCallback(
        async (newStepKey: string) => {
            const stepsByKey = _.keyBy(steps, "key");
            const newStep = stepsByKey[newStepKey];
            const currentStep = stepsByKey[currentStepKey];
            const currentStepIndex = _(steps).findIndex(step => step.key === currentStepKey);
            const newStepIndex = _(steps).findIndex(step => step.key === newStepKey);
            const shouldValidate = newStepIndex > currentStepIndex;
            const errorMessages =
                shouldValidate && onStepChangeRequest
                    ? await onStepChangeRequest(currentStep, newStep)
                    : [];

            if (_(errorMessages).isEmpty()) {
                const newLastClickableStepIndex = Math.max(lastClickableStepIndex, newStepIndex);
                notifyStepChange(newStepKey);
                setCurrentStepKey(newStepKey);
                setLastClickableStepIndex(newLastClickableStepIndex);
                setMessages([]);
            } else if (errorMessages) {
                if (useSnackFeedback) {
                    snackbar.error(errorMessages.join("\n"), {
                        autoHideDuration: null,
                    });
                } else {
                    setMessages(errorMessages);
                }
            }
        },
        [
            currentStepKey,
            lastClickableStepIndex,
            notifyStepChange,
            onStepChangeRequest,
            snackbar,
            steps,
            useSnackFeedback,
        ]
    );

    const onStepClicked = useCallback(
        (stepKey: string) => () => {
            setStep(stepKey);
        },
        [setStep]
    );

    const nextStep = useCallback(() => {
        const { nextStepKey } = getAdjacentSteps(steps, currentStepKey);
        if (nextStepKey) setStep(nextStepKey);
    }, [currentStepKey, steps, setStep]);

    const prevStep = useCallback(() => {
        const { prevStepKey } = getAdjacentSteps(steps, currentStepKey);
        if (prevStepKey) setStep(prevStepKey);
    }, [currentStepKey, steps, setStep]);

    const { prevStepKey, nextStepKey } = getAdjacentSteps(steps, currentStepKey);
    const index = _(steps).findIndex(step => step.key === currentStepKey);
    const currentStepIndex = index >= 0 ? index : 0;
    const currentStep = steps[currentStepIndex];
    const { component: StepComponent, props: stepProps = {}, warning, description } = currentStep;

    useEffect(() => {
        notifyStepChange(currentStepKey);
    }, [notifyStepChange, currentStepKey]);

    return (
        <div className={[className, classes.root].join(" ")}>
            <StepperComponent
                steps={steps}
                lastClickableStepIndex={lastClickableStepIndex}
                currentStepKey={currentStepKey}
                onStepClicked={onStepClicked}
                stepsDisableUntilReached={stepsDisableUntilReached}
            />

            {useSnackFeedback && <FeedbackMessages messages={messages} />}

            <Paper className={classes.contents} data-wizard-contents={true}>
                {warning && <div className={classes.warning}>{warning}</div>}

                {description && <div className={classes.description}>{description}</div>}

                {<StepComponent {...stepProps} />}

                <NavigationComponent
                    steps={steps}
                    currentStepKey={currentStepKey}
                    disableNext={!nextStepKey}
                    disablePrev={!prevStepKey}
                    onNext={nextStep}
                    onPrev={prevStep}
                />
            </Paper>
        </div>
    );
};

const useStyles = makeStyles(() => ({
    root: {
        width: "100%",
    },
    description: {
        marginBottom: 15,
        marginLeft: 3,
        fontSize: "1.1em",
    },
    warning: {
        marginBottom: 15,
        marginLeft: 3,
        fontSize: "1.1em",
        color: "#F00",
        textAlign: "center",
        backgroundColor: "#EEE",
        padding: 20,
    },
    contents: {
        margin: 10,
        padding: 25,
    },
}));

export interface WizardStep {
    component: ReactComponentLike;
    key: string;
    label: string;
    warning?: string;
    description?: string;
    props?: object;
    help?: React.ReactNode;
    helpDialogIsInitialOpen?: boolean;
    completed?: boolean;
}

export interface WizardProps {
    className?: string;
    stepKey?: string;
    initialStepKey?: string;
    useSnackFeedback?: boolean;
    lastClickableStepIndex?: number;
    stepsDisableUntilReached?: boolean;
    steps: WizardStep[];
    NavigationComponent?: (props: NavigationProps) => ReactElement | null;
    StepperComponent?: (props: StepperProps) => ReactElement | null;
    onStepChangeRequest?: (
        currentStep: WizardStep,
        newStep: WizardStep
    ) => Promise<string[] | undefined>;
    onStepChange?: (stepKey: string) => void;
}

export { NavigationProps as WizardNavigationProps, StepperProps as WizardStepperProps };

export default Wizard;
