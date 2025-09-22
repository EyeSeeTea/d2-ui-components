import { CSSProperties, ReactNode } from "react";

export type ReferenceObject = { id: string; selectable?: boolean };

export interface TableObject extends ReferenceObject {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    [key: string]: any;
}

export interface TableColumn<T extends ReferenceObject> {
    name: keyof T;
    text: string;
    sortable?: boolean;
    hidden?: boolean;
    getValue?(row: T, defaultValue: ReactNode): ReactNode;
    alignment?: Alignment;
    disabled?: boolean;
}

export type Alignment = "left" | "center" | "right";

export interface TableAction<T extends ReferenceObject> {
    name: string;
    text: string;
    icon?: ReactNode;
    multiple?: boolean;
    primary?: boolean;
    onClick?(selectedIds: string[]): void;
    isActive?(rows: T[]): boolean;
}

export interface RowConfig {
    style?: CSSProperties;
    cellStyle?: CSSProperties;
    disabled?: boolean;
    selectable?: boolean;
}

export type TableGlobalAction = Omit<TableAction<ReferenceObject>, "isActive">;

export interface TableSorting<T extends ReferenceObject> {
    field: keyof T;
    order: "asc" | "desc";
}

export interface TablePagination {
    pageSize: number;
    total: number;
    page: number;
}

export interface TableState<T extends ReferenceObject> {
    selection: TableSelection[];
    sorting: TableSorting<T>;
    pagination: TablePagination;
}

export type TableInitialState<T extends ReferenceObject> = Partial<
    Omit<TableState<T>, "pagination">
> & {
    pagination?: Partial<TablePagination>;
};

export interface TableNotification {
    // These props should be refactored and included everything into (...args) => ReactNode
    message: ReactNode;
    link?: string;
    newSelection?: TableSelection[];
}

export interface TableSelection {
    id: string;
    checked?: boolean;
    indeterminate?: boolean;
    icon?: ReactNode;
}

export type ObjectsTableDetailField<T extends ReferenceObject> = Pick<
    TableColumn<T>,
    "name" | "text" | "getValue"
>;

export type MouseActionMapping =
    | { type: "primary" }
    | { type: "contextual" }
    | { type: "action"; action: string };

export type MouseActionsMapping = Record<"left" | "right", MouseActionMapping>;

export interface PaginationOptions {
    pageSizeOptions: number[];
    pageSizeInitialValue: number;
    renderPosition?: { bottom: boolean; top: boolean };
}
