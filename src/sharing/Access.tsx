import React from "react";
import IconButton from "@material-ui/core/IconButton";
import ClearIcon from "@material-ui/icons/Clear";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";
import PublicIcon from "@material-ui/icons/Public";
import BusinessIcon from "@material-ui/icons/Business";
import { createStyles, withStyles, WithStyles } from "@material-ui/core/styles";
import i18n from "../utils/i18n";

import PermissionPicker from "./PermissionPicker";
import { AccessObject, accessStringToObject, accessObjectToString } from "./utils";
import { AccessOptions } from "./PermissionPicker";

const accessTypes = ["user", "userGroup", "external", "public"] as const;
type AccessType = typeof accessTypes[number];

const icons: Record<AccessType, typeof PersonIcon> = {
    user: PersonIcon,
    userGroup: GroupIcon,
    external: PublicIcon,
    public: BusinessIcon,
};

interface SvgIconProps {
    readonly userType: string;
}

const SvgIcon: React.FC<SvgIconProps> = ({ userType }) => {
    const Icon = icons[userType as AccessType] || PersonIcon;

    return <Icon color="action" />;
};

const styles = createStyles({
    accessView: {
        fontWeight: 400,
        display: "flex",
        flexDirection: "row",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "4px 8px",
    },
    accessDescription: {
        display: "flex",
        flexDirection: "column",
        flex: 1,
        paddingLeft: 16,
    },
});

interface AccessOwnProps {
    readonly access: AccessObject;
    readonly accessType: string;
    readonly accessOptions: AccessOptions;
    readonly primaryText: string;
    readonly secondaryText?: string | null;
    readonly onChange: (access: AccessObject) => void;
    readonly onRemove?: (() => void) | null;
    readonly disabled?: boolean;
    readonly showPermissionPicker: boolean;
}

type AccessProps = AccessOwnProps & WithStyles<typeof styles>;

export const Access = withStyles(styles)(
    ({
        access,
        accessType,
        accessOptions,
        primaryText,
        secondaryText,
        onChange,
        onRemove,
        disabled,
        classes,
        showPermissionPicker,
    }: AccessProps) => (
        <div className={classes.accessView}>
            <SvgIcon userType={accessType} />
            <div className={classes.accessDescription}>
                <div>{primaryText}</div>
                <div style={{ color: "#818181", paddingTop: 4 }}>{secondaryText || " "}</div>
            </div>
            {showPermissionPicker && (
                <PermissionPicker
                    access={access}
                    accessOptions={accessOptions}
                    onChange={onChange}
                    disabled={disabled}
                />
            )}
            <span title={onRemove ? i18n.t("Remove") : i18n.t("This access cannot be removed")}>
                <IconButton disabled={!onRemove} onClick={onRemove ?? undefined}>
                    <ClearIcon color={!onRemove ? "disabled" : "action"} />
                </IconButton>
            </span>
        </div>
    )
);

interface GroupAccessProps {
    readonly access: string;
    readonly groupType: string;
    readonly groupName: string;
    readonly dataShareable: boolean;
    readonly onChange: (accessString: string) => void;
    readonly onRemove?: (() => void) | null;
    readonly disabled?: boolean;
    readonly showPermissionPicker: boolean;
}

export const GroupAccess: React.FC<GroupAccessProps> = basicProps => {
    const accessObject = accessStringToObject(basicProps.access);
    const onChange = (newAccess: AccessObject) =>
        basicProps.onChange(accessObjectToString(newAccess));

    return (
        <Access
            {...basicProps}
            access={accessObject}
            onChange={onChange}
            accessType={basicProps.groupType}
            primaryText={basicProps.groupName}
            accessOptions={{
                meta: { canView: true, canEdit: true, noAccess: false },
                data: basicProps.dataShareable && {
                    canView: true,
                    canEdit: true,
                    noAccess: true,
                },
            }}
        />
    );
};

interface ExternalAccessProps {
    readonly access?: boolean;
    readonly disabled?: boolean;
    readonly onChange: (externalAccess: boolean) => void;
    readonly onRemove?: (() => void) | null;
    readonly showPermissionPicker: boolean;
}

export const ExternalAccess: React.FC<ExternalAccessProps> = props => {
    const newProps: AccessOwnProps = {
        ...props,
        accessType: "external",
        primaryText: i18n.t("External access"),
        secondaryText: props.access ? i18n.t("Anyone can view without login") : i18n.t("No access"),
        access: {
            meta: { canEdit: false, canView: Boolean(props.access) },
            data: { canEdit: false, canView: false },
        },
        onChange: (newAccess: AccessObject) => props.onChange(newAccess.meta.canView),
        accessOptions: {
            meta: { canView: true, canEdit: false, noAccess: true },
        },
    };

    return <Access {...newProps} />;
};

interface PublicAccessProps {
    readonly access?: string;
    readonly disabled?: boolean;
    readonly dataShareable: boolean;
    readonly onChange: (accessString: string) => void;
    readonly onRemove?: (() => void) | null;
    readonly showPermissionPicker: boolean;
}

export const PublicAccess: React.FC<PublicAccessProps> = basicProps => {
    const accessObject = accessStringToObject(basicProps.access);
    const onChange = (newAccess: AccessObject) =>
        basicProps.onChange(accessObjectToString(newAccess));
    const { canEdit, canView } = accessObject.meta;
    const description = canEdit
        ? "Anyone can find and view"
        : canView
        ? "Anyone can view"
        : "No access";

    return (
        <Access
            access={accessObject}
            onChange={onChange}
            disabled={basicProps.disabled}
            onRemove={basicProps.onRemove}
            showPermissionPicker={basicProps.showPermissionPicker}
            accessType="public"
            primaryText={i18n.t("Public access")}
            secondaryText={description}
            accessOptions={{
                meta: { canView: true, canEdit: true, noAccess: true },
                data: basicProps.dataShareable && {
                    canView: true,
                    canEdit: true,
                    noAccess: true,
                },
            }}
        />
    );
};
