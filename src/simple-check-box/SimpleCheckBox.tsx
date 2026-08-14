import React from "react";
import "./SimpleCheckBox.css";

interface SimpleCheckBoxProps {
    readonly onClick: () => void;
    readonly checked: boolean;
}

export default function SimpleCheckBox(props: SimpleCheckBoxProps): React.ReactElement {
    const { onClick, checked } = props;

    return (
        <span onClick={onClick}>
            <input type="checkbox" readOnly={true} checked={checked} className="simple-checkbox" />
            <span />
        </span>
    );
}
