import React from "react";
import { makeStyles } from "@material-ui/core/styles";
import Menu from "@material-ui/core/Menu";
import MenuItem from "@material-ui/core/MenuItem";
import Typography from "@material-ui/core/Typography";

import { TableAction, ReferenceObject } from "./types";

const useStyles = makeStyles({
    root: {
        position: "fixed",
    },
    item: {
        paddingTop: "8px",
        paddingBottom: "8px",
    },
    icon: {
        display: "flex",
        paddingLeft: "6px",
        paddingRight: "10px",
    },
    text: {
        paddingLeft: "10px",
        paddingRight: "15px",
    },
});

export interface ContextualMenuProps<T extends ReferenceObject> {
    isOpen: boolean;
    rows: T[];
    positionLeft: number;
    positionTop: number;
    onClose(): void;
    actions: TableAction<T>[];
}

export function ContextualMenu<T extends ReferenceObject>(props: ContextualMenuProps<T>) {
    const classes = useStyles({});
    const { isOpen, rows, positionLeft, positionTop, onClose, actions } = props;

    const handleActionClick = (action: TableAction<T>) => {
        return () => {
            if (rows.length > 0 && action.onClick) action.onClick(rows);
            onClose();
        };
    };

    return (
        <Menu
            className={classes.root}
            open={isOpen}
            anchorReference="anchorPosition"
            anchorPosition={{
                left: positionLeft,
                top: positionTop,
            }}
            anchorOrigin={{
                vertical: "center",
                horizontal: "center",
            }}
            onClose={onClose}
        >
            {actions.map(action => (
                <MenuItem
                    className={classes.item}
                    key={action.name}
                    onClick={handleActionClick(action)}
                >
                    <div className={classes.icon}>{action.icon}</div>

                    <Typography className={classes.text} noWrap>
                        {action.text}
                    </Typography>
                </MenuItem>
            ))}
        </Menu>
    );
}