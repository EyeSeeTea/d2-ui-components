import type { Meta, StoryObj } from "@storybook/react";

import { Wizard } from "./Wizard";
import React from "react";
import SnackbarProvider from "../snackbar/SnackbarProvider";

const meta: Meta<typeof Wizard> = {
    title: "Wizard",
    component: Wizard,
    parameters: {
        // More on Story layout: https://storybook.js.org/docs/configure/story-layout
        layout: "fullscreen",
    },
};

const ConfigurationComponent = () => {
    return (
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            Configuration
        </div>
    );
};

const OutlierComponent = () => {
    return (
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>
            Outlier
        </div>
    );
};

const TrendComponent = () => {
    return (
        <div style={{ border: "1px solid #ccc", padding: "10px", borderRadius: "5px" }}>Trend</div>
    );
};

export const steps = [
    {
        key: "configuration",
        label: "Configuration",
        completed: false,
        component: ConfigurationComponent,
    },
    {
        key: "outlier",
        label: "Outliers",
        completed: true,
        component: OutlierComponent,
    },
    {
        key: "trends",
        label: "Trends",
        completed: false,
        component: TrendComponent,
    },
];

export default meta;
type Story = StoryObj<typeof Wizard>;

export const Primary: Story = {
    decorators: [
        Story => (
            <SnackbarProvider>
                <Story />
            </SnackbarProvider>
        ),
    ],
    args: {
        initialStepKey: "outlier",
        steps: steps,
    },
};
