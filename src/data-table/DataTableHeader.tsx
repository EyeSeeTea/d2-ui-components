import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TableCell from "@material-ui/core/TableCell";
import TableHead from "@material-ui/core/TableHead";
import TableRow from "@material-ui/core/TableRow";
import TableSortLabel from "@material-ui/core/TableSortLabel";
import ExpandMoreIcon from "@material-ui/icons/ExpandMore";
import SettingsIcon from "@material-ui/icons/Settings";
import ViewColumnIcon from "@material-ui/icons/ViewColumn";
import _ from "lodash";
import React, { MouseEvent, useState } from "react";
import i18n from "../utils/i18n";
import ColumnSelectorDialog from "./ColumnSelectorDialog";
import { ContextualMenu } from "./ContextualMenu";
import { DataTableNotifications } from "./DataTableNotifications";
import {
    Alignment,
    ReferenceObject,
    TableColumn,
    TableGlobalAction,
    TableNotification,
    TableSelection,
    TableSorting,
} from "./types";

const useStyles = makeStyles({
    visuallyHidden: {
        border: 0,
        clip: "rect(0 0 0 0)",
        height: 1,
        margin: -1,
        overflow: "hidden",
        padding: 0,
        position: "absolute",
        top: 20,
        width: 1,
    },
    bottomBorder: {
        borderBottom: "3px solid #E0E0E0",
    },
    checkboxCell: {
        paddingLeft: "12px",
    },
});

export interface DataTableHeaderProps<T extends ReferenceObject> {
    columns: TableColumn<T>[];
    globalActions: TableGlobalAction[];
    ids: string[];
    visibleColumns: (keyof T)[];
    onVisibleColumnsChange?(newVisibleColumns: (keyof T)[]): void;
    sorting: TableSorting<T>;
    onSortingChange?(newSorting: TableSorting<T>): void;
    allSelected?: boolean;
    tableNotifications?: TableNotification[];
    handleSelectionChange?(newSelection: TableSelection[]): void;
    onSelectAllClick?: (event: React.ChangeEvent<HTMLInputElement>, checked: boolean) => void;
    enableMultipleAction: boolean;
    hideColumnVisibilityOptions?: boolean;
    hideSelectAll?: boolean;
    allowReorderingColumns?: boolean;
    alignment?: Alignment;
    globalActionComponents?: React.ReactNode;
    childrenTransfer?: React.ReactNode;
    keepDisabledColumns?: boolean;
}

export function DataTableHeader<T extends ReferenceObject>(props: DataTableHeaderProps<T>) {
    const classes = useStyles();
    const {
        columns,
        globalActions,
        ids,
        visibleColumns,
        onVisibleColumnsChange,
        sorting,
        onSortingChange,
        allSelected = false,
        tableNotifications = [],
        handleSelectionChange,
        onSelectAllClick,
        enableMultipleAction,
        hideColumnVisibilityOptions = false,
        hideSelectAll = false,
        allowReorderingColumns,
        globalActionComponents,
        childrenTransfer,
        keepDisabledColumns = true,
    } = props;

    const { field, order } = sorting;
    const [openColumnSettings, setOpenColumnSettings] = useState<boolean>(false);
    const [contextMenuTarget, setContextMenuTarget] = useState<number[] | null>(null);
    const contextMenuRows = ids.map(id => ({ id }));

    const createSortHandler = (property: keyof T) => (_event: React.MouseEvent<unknown>) => {
        const isDesc = field === property && order === "desc";
        if (onSortingChange) onSortingChange({ field: property, order: isDesc ? "asc" : "desc" });
    };

    const currentColumns = _.compact(
        visibleColumns.map(column => columns.find(({ name }) => name === column))
    );

    const tableActions = _.compact([
        !hideColumnVisibilityOptions
            ? {
                  name: "column-settings",
                  text: i18n.t("Column settings"),
                  onClick: () => setOpenColumnSettings(true),
                  icon: <ViewColumnIcon />,
              }
            : undefined,
        ...globalActions,
    ]);

    const showTableConfig = tableActions.length > 0 || Boolean(globalActionComponents);

    const openTableActions = (event: MouseEvent<HTMLTableHeaderCellElement>) => {
        setContextMenuTarget([event.clientX, event.clientY + event.currentTarget.clientHeight / 2]);
    };

    const closeTableActions = () => {
        setContextMenuTarget(null);
    };

    return (
        <React.Fragment>
            {openColumnSettings && (
                <ColumnSelectorDialog
                    columns={columns}
                    visibleColumns={visibleColumns}
                    onChange={onVisibleColumnsChange || _.noop}
                    onCancel={() => setOpenColumnSettings(false)}
                    allowReorderingColumns={allowReorderingColumns}
                    childrenTransfer={childrenTransfer}
                    keepDisabledColumns={keepDisabledColumns}
                />
            )}
            <TableHead>
                <TableRow className={classes.bottomBorder}>
                    {enableMultipleAction && (
                        <TableCell className={classes.checkboxCell} padding="checkbox">
                            {!hideSelectAll && (
                                <Checkbox checked={allSelected} onChange={onSelectAllClick} />
                            )}
                        </TableCell>
                    )}
                    {currentColumns.map(column => {
                        return (
                            <TableCell
                                key={`data-table-cell-${column.name}`}
                                align={props.alignment || column.alignment || "left"}
                                sortDirection={
                                    field === column.name && column.sortable ? order : false
                                }
                            >
                                <TableSortLabel
                                    active={field === column.name && column.sortable}
                                    direction={order}
                                    onClick={createSortHandler(column.name)}
                                    IconComponent={ExpandMoreIcon}
                                    disabled={column.sortable === false}
                                    hideSortIcon={column.sortable === false}
                                >
                                    {column.text}
                                </TableSortLabel>
                            </TableCell>
                        );
                    })}
                    <TableCell padding="none" align={"center"} onClick={openTableActions}>
                        {showTableConfig && (
                            <IconButton>
                                <SettingsIcon />
                            </IconButton>
                        )}
                    </TableCell>
                </TableRow>
                {tableNotifications.length > 0 && (
                    <TableRow>
                        <TableCell padding="none" colSpan={columns.length + 2}>
                            <DataTableNotifications
                                messages={tableNotifications}
                                updateSelection={handleSelectionChange || _.noop}
                            />
                        </TableCell>
                    </TableRow>
                )}
            </TableHead>
            {contextMenuTarget && (
                <ContextualMenu
                    isOpen={!!contextMenuTarget}
                    positionLeft={contextMenuTarget[0]}
                    positionTop={contextMenuTarget[1]}
                    rows={contextMenuRows}
                    selection={contextMenuRows}
                    actions={tableActions}
                    onClose={closeTableActions}
                    globalActionComponents={globalActionComponents}
                />
            )}
        </React.Fragment>
    );
}
