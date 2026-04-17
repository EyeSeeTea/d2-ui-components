import i18n from "../utils/i18n";
import Divider from "@material-ui/core/Divider";
import IconButton from "@material-ui/core/IconButton";
import MenuList from "@material-ui/core/MenuList";
import Popover from "@material-ui/core/Popover";
import { createStyles, withStyles, WithStyles } from "@material-ui/core/styles";
import CreateIcon from "@material-ui/icons/Create";
import NotInterestedIcon from "@material-ui/icons/NotInterested";
import VisibilityIcon from "@material-ui/icons/Visibility";
import React, { Component, Fragment } from "react";
import PermissionOption from "./PermissionOption";
import { AccessObject } from "./utils";

const styles = createStyles({
    optionHeader: {
        paddingLeft: 16,
        paddingTop: 16,
        fontWeight: 500,
        color: "gray",
    },
});

interface AccessPermissionOption {
    readonly canView: boolean;
    readonly canEdit: boolean;
    readonly noAccess: boolean;
}

export interface AccessOptions {
    readonly meta: AccessPermissionOption;
    readonly data?: AccessPermissionOption | false;
}

interface AccessIconProps {
    readonly metaAccess: Readonly<{ canView: boolean; canEdit: boolean }>;
    readonly disabled: boolean;
}

const AccessIcon: React.FC<AccessIconProps> = ({ metaAccess, disabled }) => {
    const iconProps = {
        color: disabled ? ("disabled" as const) : ("action" as const),
    };
    if (metaAccess.canEdit) {
        return <CreateIcon {...iconProps} />;
    }

    return metaAccess.canView ? (
        <VisibilityIcon {...iconProps} />
    ) : (
        <NotInterestedIcon {...iconProps} />
    );
};

interface PermissionPickerProps {
    readonly access: AccessObject;
    readonly accessOptions: AccessOptions;
    readonly onChange: (access: AccessObject) => void;
    readonly disabled?: boolean;
}

interface PermissionPickerState {
    readonly open: boolean;
    readonly anchor: HTMLElement | null;
}

class PermissionPicker extends Component<PermissionPickerProps, PermissionPickerState> {
    static defaultProps = {
        disabled: false,
    };

    state: PermissionPickerState = {
        open: false,
        anchor: null,
    };

    onOptionClick = (access: Partial<AccessObject>) => () => {
        const newAccess: AccessObject = {
            ...this.props.access,
            ...access,
        };

        this.props.onChange(newAccess);
    };

    openMenu = (event: React.MouseEvent<HTMLElement>) => {
        event.preventDefault();
        this.setState({
            open: true,
            anchor: event.currentTarget,
        });
    };

    closeMenu = () => {
        this.setState({
            open: false,
        });
    };

    render = () => {
        const { data, meta } = this.props.access;
        const { data: dataOptions, meta: metaOptions } = this.props.accessOptions;

        return (
            <Fragment>
                <IconButton onClick={this.openMenu} disabled={this.props.disabled}>
                    <AccessIcon metaAccess={meta} disabled={this.props.disabled ?? false} />
                </IconButton>
                <Popover
                    open={this.state.open}
                    anchorEl={this.state.anchor}
                    onClose={this.closeMenu}
                >
                    <OptionHeader text={i18n.t("METADATA")} />
                    <MenuList>
                        <PermissionOption
                            disabled={!metaOptions.canEdit}
                            primaryText={i18n.t("Can edit and view")}
                            isSelected={meta.canEdit}
                            onClick={this.onOptionClick({ meta: { canView: true, canEdit: true } })}
                        />
                        <PermissionOption
                            disabled={!metaOptions.canView}
                            primaryText={i18n.t("Can view only")}
                            isSelected={!meta.canEdit && meta.canView}
                            onClick={this.onOptionClick({
                                meta: { canView: true, canEdit: false },
                            })}
                        />
                        <PermissionOption
                            disabled={!metaOptions.noAccess}
                            primaryText={i18n.t("No access")}
                            isSelected={!meta.canEdit && !meta.canView}
                            onClick={this.onOptionClick({
                                meta: { canView: false, canEdit: false },
                            })}
                        />
                    </MenuList>
                    <Divider />

                    {dataOptions && (
                        <Fragment>
                            <OptionHeader text={i18n.t("DATA")} />
                            <MenuList>
                                <PermissionOption
                                    disabled={!dataOptions.canEdit}
                                    primaryText={i18n.t("Can capture and view")}
                                    isSelected={data.canEdit}
                                    onClick={this.onOptionClick({
                                        data: { canView: true, canEdit: true },
                                    })}
                                />
                                <PermissionOption
                                    disabled={!dataOptions.canView}
                                    primaryText={i18n.t("Can view only")}
                                    isSelected={!data.canEdit && data.canView}
                                    onClick={this.onOptionClick({
                                        data: { canView: true, canEdit: false },
                                    })}
                                />
                                <PermissionOption
                                    disabled={!dataOptions.noAccess}
                                    primaryText={i18n.t("No access")}
                                    isSelected={!data.canEdit && !data.canView}
                                    onClick={this.onOptionClick({
                                        data: {
                                            canView: false,
                                            canEdit: false,
                                        },
                                    })}
                                />
                            </MenuList>
                        </Fragment>
                    )}
                </Popover>
            </Fragment>
        );
    };
}

interface OptionHeaderOwnProps {
    readonly text: string;
}

type OptionHeaderProps = OptionHeaderOwnProps & WithStyles<typeof styles>;

const OptionHeader = withStyles(styles)(({ text, classes }: OptionHeaderProps) => (
    <div className={classes.optionHeader}>{text.toUpperCase()}</div>
));

export default PermissionPicker;
