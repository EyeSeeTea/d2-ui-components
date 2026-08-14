import ListItemIcon from "@material-ui/core/ListItemIcon";
import ListItemText from "@material-ui/core/ListItemText";
import MenuItem from "@material-ui/core/MenuItem";
import DoneIcon from "@material-ui/icons/Done";
import { makeStyles } from "@material-ui/core/styles";
import React from "react";

const useStyles = makeStyles({
    permissionOptionIcon: {
        minWidth: 0,
        paddingRight: "inherit",
        paddingLeft: 0,
    },
    listItemTextUnselected: {
        paddingLeft: 40,
    },
});

interface PermissionOptionProps {
    readonly disabled: boolean;
    readonly isSelected?: boolean;
    readonly primaryText: string;
    readonly onClick: () => void;
}

const PermissionOption: React.FC<PermissionOptionProps> = ({
    disabled,
    isSelected = false,
    primaryText,
    onClick,
}) => {
    const classes = useStyles();

    if (disabled) {
        return null;
    }

    return (
        <MenuItem disabled={disabled} onClick={onClick} selected={isSelected}>
            {isSelected && (
                <ListItemIcon className={classes.permissionOptionIcon}>
                    <DoneIcon />
                </ListItemIcon>
            )}

            <ListItemText
                primary={primaryText}
                className={!isSelected ? classes.listItemTextUnselected : undefined}
            />
        </MenuItem>
    );
};

export default PermissionOption;
