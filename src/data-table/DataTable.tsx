import classnames from "classnames";
import { CircularProgress } from "@material-ui/core";
import Paper from "@material-ui/core/Paper";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import Table from "@material-ui/core/Table";
import Toolbar from "@material-ui/core/Toolbar";
import _ from "lodash";
import React, { ReactNode, useEffect, useState } from "react";
import { ContextualMenu } from "./ContextualMenu";
import { DataTableBody } from "./DataTableBody";
import { DataTableHeader } from "./DataTableHeader";
import { DataTablePagination } from "./DataTablePagination";
import {
    MouseActionsMapping,
    PaginationOptions,
    ReferenceObject,
    RowConfig,
    TableAction,
    TableColumn,
    TableGlobalAction,
    TableInitialState,
    TableNotification,
    TableObject,
    TablePagination,
    TableSelection,
    TableSorting,
    TableState,
} from "./types";
import { defaultRowConfig } from "./utils/formatting";
import {
    getActionRows,
    getSelectionMessages,
    parseActions,
    SelectionMessages,
} from "./utils/selection";
import { sortObjects } from "./utils/sorting";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {
            width: "100%",
        },
        toolbar: {
            display: "flex",
            flexWrap: "wrap",
            paddingLeft: 0,
            paddingRight: 0,
        },
        paper: {
            flex: "1 1 0%",
            display: "inline-table",
            marginLeft: "5px",
            marginRight: "5px",
        },
        tableWrapper: {
            display: "flex",
            flex: "1 1 0%",
            paddingBottom: theme.spacing(2),
            marginTop: "5px",
        },
        table: {
            width: "100%",
            minWidth: 750,
        },
        spacer: {
            flex: "1 1 auto",
            order: 10,
        },
        loading: {
            order: 10,
        },
        paginator: {
            order: 10,
            marginLeft: "auto",
        },
    })
);

export interface DataTableProps<T extends ReferenceObject> {
    rows: T[];
    columns: TableColumn<T>[];
    actions?: TableAction<T>[];
    rowConfig?(row: T): RowConfig;
    mouseActionsMapping?: MouseActionsMapping;
    globalActions?: TableGlobalAction[];
    initialState?: TableInitialState<T>;
    forceSelectionColumn?: boolean;
    allowReorderingColumns?: boolean;
    hideSelectionMessages?: boolean;
    hideColumnVisibilityOptions?: boolean;
    hideSelectAll?: boolean;
    tableNotifications?: TableNotification[];
    filterComponents?: ReactNode; // Portal to the navigation toolbar
    sideComponents?: ReactNode; // Portal to right-most of the Data Table
    ids?: string[]; // Enables selection in all pages (disabled with [])
    loading?: boolean;
    childrenKeys?: string[];
    // State controlled by parent
    sorting?: TableSorting<T>;
    selection?: TableSelection[];
    pagination?: Partial<TablePagination>;
    paginationOptions?: Partial<PaginationOptions>;
    onChange?(state: TableState<T>): void;
    resetKey?: string;
    selectionMessages?: SelectionMessages;
    onReorderColumns?(columns: Array<keyof T>): void;
    customClasses?: CustomClassesType;
    stickyHeader?: boolean;
    columnsAlignment?: "left" | "center" | "right";
    customConfig?: React.ReactNode;
    childrenTransfer?: React.ReactNode;
    keepDisabledColumns?: boolean;
}

export function DataTable<T extends ReferenceObject = TableObject>(props: DataTableProps<T>) {
    const classes = useStyles();
    const {
        customClasses,
        stickyHeader,
        rows,
        columns,
        rowConfig = defaultRowConfig,
        actions: availableActions = [],
        globalActions = [],
        initialState = {},
        forceSelectionColumn,
        hideSelectionMessages,
        hideColumnVisibilityOptions,
        hideSelectAll,
        tableNotifications = [],
        filterComponents,
        sideComponents,
        ids = rows.map(row => row.id),
        loading = false,
        childrenKeys = [],
        sorting: controlledSorting,
        selection: controlledSelection,
        pagination: controlledPagination,
        paginationOptions = {},
        onChange = _.noop,
        resetKey,
        mouseActionsMapping,
        selectionMessages: overrideSelectionMessages,
        allowReorderingColumns,
        onReorderColumns,
        customConfig,
        childrenTransfer,
        keepDisabledColumns = true,
    } = props;

    const renderPosition = paginationOptions.renderPosition || defaultRenderPosition;
    const [stateSelection, updateSelection] = useState(initialState.selection || []);
    const [statePagination, updatePagination] = useState(initialState.pagination);
    const [visibleColumns, updateVisibleColumns] = useState<Array<keyof T>>([]);
    const [stateSorting, updateSorting] = useState(
        initialState.sorting || {
            field: columns[0].name,
            order: "asc" as const,
        }
    );

    useEffect(() => updatePagination(pagination => ({ ...pagination, page: 1 })), [resetKey]);

    useEffect(() => {
        const newVisibleColumns = columns.filter(({ hidden }) => !hidden).map(({ name }) => name);
        updateVisibleColumns(newVisibleColumns);
    }, [columns]);

    useEffect(() => {
        if (onReorderColumns) onReorderColumns(visibleColumns);
    }, [onReorderColumns, visibleColumns]);

    const { pageSizeInitialValue: pageSize = 25 } = paginationOptions;

    const sorting = controlledSorting || stateSorting;
    const selection = controlledSelection || stateSelection;
    const pagination = {
        pageSize,
        total: undefined,
        page: 1,
        ...statePagination,
        ...controlledPagination,
    };

    const rowObjects = controlledPagination
        ? rows
        : sortObjects(rows, columns, pagination, sorting);
    const selectableRows = React.useMemo(() => {
        return rowObjects.filter(row => row.selectable !== false);
    }, [rowObjects]);
    const allSelected =
        rowObjects.length > 0 && _.differenceBy(selectableRows, selection, "id").length === 0;
    const enableMultipleAction = _.isUndefined(forceSelectionColumn)
        ? _.some(availableActions, "multiple")
        : forceSelectionColumn;
    const totalRows = pagination.total ? pagination.total : rows.length;

    const selectionMessagesBase = React.useMemo(
        () =>
            getSelectionMessages(
                rowObjects,
                selection,
                totalRows,
                ids,
                childrenKeys,
                overrideSelectionMessages
            ),
        [rowObjects, selection, totalRows, ids, childrenKeys, overrideSelectionMessages]
    );
    const selectionMessages = hideSelectionMessages ? [] : selectionMessagesBase;

    // Contextual menu
    const [contextMenuTarget, setContextMenuTarget] = useState<number[] | null>(null);
    const [contextMenuActions, setContextMenuActions] = useState<TableAction<T>[]>([]);
    const [contextMenuRows, setContextMenuRows] = useState<T[]>([]);

    const handleSelectionChange = (selection: TableSelection[]) => {
        updateSelection(selection);
        onChange({ selection, pagination, sorting });
    };

    const handlePaginationChange = (pagination: TablePagination) => {
        updatePagination(pagination);
        onChange({ selection, pagination, sorting });
    };

    const handleSortingChange = (sorting: TableSorting<T>) => {
        const newPagination = { ...pagination, page: 1 };
        updateSorting(sorting);
        updatePagination(newPagination);
        onChange({ selection, pagination: newPagination, sorting });
    };

    const handleSelectAllClick = (event: React.ChangeEvent<HTMLInputElement>) => {
        const refs = rowObjects
            .filter(row => {
                const { selectable = true } = rowConfig(row);
                return selectable;
            })
            .map(({ id }) => ({ id }));

        handleSelectionChange(
            event.target.checked
                ? _.unionBy(selection, refs, "id")
                : _.differenceBy(selection, refs, "id")
        );
    };

    const handleCloseContextMenu = () => {
        setContextMenuTarget(null);
    };

    const handleOpenContextualMenu = (
        selectedRow: T,
        positionLeft: number,
        positionTop: number
    ) => {
        const actionRows = getActionRows(selectedRow, rows, selection, childrenKeys);
        const actions = parseActions(actionRows, availableActions);
        if (actions.length > 0) {
            setContextMenuTarget([positionTop, positionLeft]);
            setContextMenuActions(actions);
            setContextMenuRows(actionRows);
        }
    };

    const dataTablePaginationOptions = {
        paginationOptions: paginationOptions,
        pagination: pagination,
        defaultTotal: rows.length,
        onChange: handlePaginationChange,
    };

    return (
        <div className={classes.root}>
            <Toolbar className={classnames(classes.toolbar, customClasses?.toolbar)}>
                <React.Fragment>
                    {filterComponents}
                    <div className={classes.spacer}></div>
                    {loading && <CircularProgress size={30} className={classes.loading} />}
                    {renderPosition.top && (
                        <div className={classes.paginator}>
                            <DataTablePagination {...dataTablePaginationOptions} />
                        </div>
                    )}
                </React.Fragment>
            </Toolbar>
            <div className={classnames(classes.tableWrapper, customClasses?.tableWrapper)}>
                <Paper className={classnames(classes.paper, customClasses?.paper)} square>
                    <Table stickyHeader={stickyHeader} className={classes.table} size={"medium"}>
                        <DataTableHeader
                            columns={columns}
                            globalActions={globalActions}
                            ids={ids}
                            visibleColumns={visibleColumns}
                            onVisibleColumnsChange={updateVisibleColumns}
                            sorting={sorting}
                            onSortingChange={handleSortingChange}
                            onSelectAllClick={handleSelectAllClick}
                            allSelected={allSelected}
                            tableNotifications={[...tableNotifications, ...selectionMessages]}
                            handleSelectionChange={handleSelectionChange}
                            enableMultipleAction={enableMultipleAction}
                            hideColumnVisibilityOptions={hideColumnVisibilityOptions}
                            hideSelectAll={hideSelectAll}
                            allowReorderingColumns={allowReorderingColumns}
                            alignment={props.columnsAlignment}
                            customConfig={customConfig}
                            childrenTransfer={childrenTransfer}
                            keepDisabledColumns={keepDisabledColumns}
                        />
                        <DataTableBody
                            rows={rowObjects}
                            columns={columns}
                            rowConfig={rowConfig}
                            visibleColumns={visibleColumns}
                            sorting={sorting}
                            selected={selection}
                            onChange={handleSelectionChange}
                            openContextualMenu={handleOpenContextualMenu}
                            availableActions={availableActions}
                            mouseActionsMapping={mouseActionsMapping}
                            enableMultipleAction={enableMultipleAction}
                            loading={loading}
                            childrenKeys={childrenKeys}
                            alignment={props.columnsAlignment}
                        />
                    </Table>
                </Paper>
                {sideComponents}
            </div>

            {renderPosition.bottom && (
                <div className={classes.paginator}>
                    <DataTablePagination {...dataTablePaginationOptions} />
                </div>
            )}

            {contextMenuTarget && (
                <ContextualMenu
                    isOpen={!!contextMenuTarget}
                    rows={contextMenuRows}
                    actions={contextMenuActions}
                    positionLeft={contextMenuTarget[0]}
                    positionTop={contextMenuTarget[1]}
                    onClose={handleCloseContextMenu}
                    selection={selection}
                />
            )}
        </div>
    );
}

const defaultRenderPosition: NonNullable<PaginationOptions["renderPosition"]> = {
    top: true,
    bottom: false,
};

type CssClassName = string;
type CustomClassesType = { toolbar: CssClassName; paper: CssClassName; tableWrapper: CssClassName };
