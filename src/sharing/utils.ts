interface AccessPermission {
    readonly canView: boolean;
    readonly canEdit: boolean;
}

export interface AccessObject {
    readonly meta: AccessPermission;
    readonly data: AccessPermission;
}

interface AccessEntry {
    readonly id: string;
    readonly name: string;
    readonly displayName: string;
    readonly access?: string;
}

interface TransformedAccessEntry {
    readonly id: string;
    readonly name: string;
    readonly displayName: string;
    readonly type: string;
    readonly canView: boolean;
    readonly canEdit: boolean;
}

export const cachedAccessTypeToString = (canView: boolean, canEdit: boolean): string => {
    if (canView) {
        return canEdit ? "rw------" : "r-------";
    }

    return "--------";
};

export const transformAccessObject = (
    access: AccessEntry,
    type: string
): TransformedAccessEntry => ({
    id: access.id,
    name: access.name,
    displayName: access.displayName,
    type,
    canView: access.access ? access.access.includes("r") : false,
    canEdit: access.access ? access.access.includes("rw") : false,
});

export const accessStringToObject = (access: string | undefined): AccessObject => {
    if (!access) {
        return {
            data: { canView: false, canEdit: false },
            meta: { canView: false, canEdit: false },
        };
    }

    const metaAccess = access.substring(0, 2);
    const dataAccess = access.substring(2, 4);

    return {
        meta: {
            canView: metaAccess.includes("r"),
            canEdit: metaAccess.includes("rw"),
        },
        data: {
            canView: dataAccess.includes("r"),
            canEdit: dataAccess.includes("rw"),
        },
    };
};

export const accessObjectToString = (accessObject: AccessObject): string => {
    const convert = ({ canEdit, canView }: AccessPermission): string => {
        if (canEdit) {
            return "rw";
        }

        return canView ? "r-" : "--";
    };

    let accessString = "";
    accessString += convert(accessObject.meta);
    accessString += convert(accessObject.data);
    accessString += "----";

    return accessString;
};
