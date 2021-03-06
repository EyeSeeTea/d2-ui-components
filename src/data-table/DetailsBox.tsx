import Paper from "@material-ui/core/Paper";
import { makeStyles } from "@material-ui/core/styles";
import CloseIcon from "@material-ui/icons/Close";
import React from "react";
import i18n from "../utils/i18n";
import { ObjectsTableDetailField, ReferenceObject } from "./types";
import { formatRowValue } from "./utils/formatting";

const useStyles = makeStyles({
    root: {
        flex: "0 1 0%",
        marginLeft: "1rem",
        marginRight: "1rem",
        padding: "1.5rem",
        opacity: 1,
        maxWidth: 500,
        minWidth: 300,
        height: "0%",
    },
    label: {
        fontWeight: "bold",
    },
    fieldValue: {
        color: "#333",
        minWidth: "100%",
        overflow: "hidden",
        textOverflow: "ellipsis",
    },
    field: {
        paddingBottom: "1rem",
        fontFamily: "Roboto",
    },
    closeButton: {
        cursor: "pointer",
        float: "right",
        display: "inline-block",
        position: "relative",
    },
});

export interface DetailsBoxProps<T extends ReferenceObject> {
    details: ObjectsTableDetailField<T>[];
    data: T;
    onClose(): void;
}

export function DetailsBox<T extends ReferenceObject>(props: DetailsBoxProps<T>) {
    const classes = useStyles();
    const { details, data, onClose } = props;

    const getDetailBoxContent = () => {
        if (!data) {
            return <div>{i18n.t("Loading details...")}</div>;
        } else if (details.length === 0) {
            return <div>{i18n.t("No detail fields provided")}</div>;
        }

        return details.map(field => {
            const fieldName = field.name;
            const valueToRender = formatRowValue(field, data);
            if (valueToRender === null) return null;

            return (
                <div key={`details-box-${fieldName}`} className={classes.field}>
                    <div className={`${classes.fieldValue} ${classes.label}`}>{field.text}</div>

                    <div className={classes.fieldValue}>{valueToRender || "-"}</div>
                </div>
            );
        });
    };

    return (
        <Paper className={classes.root} square>
            <CloseIcon className={classes.closeButton} onClick={onClose} />
            <div>{getDetailBoxContent()}</div>
        </Paper>
    );
}
