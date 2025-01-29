import Checkbox from "@material-ui/core/Checkbox";
import IconButton from "@material-ui/core/IconButton";
import { makeStyles } from "@material-ui/core/styles";
import TableBody from "@material-ui/core/TableBody";
import TableCell from "@material-ui/core/TableCell";
import TableRow from "@material-ui/core/TableRow";
import Tooltip from "@material-ui/core/Tooltip";
import CheckBoxTwoToneIcon from "@material-ui/icons/CheckBoxTwoTone";
import ChevronRightIcon from "@material-ui/icons/ChevronRight";
import MoreVertIcon from "@material-ui/icons/MoreVert";
import _ from "lodash";
import React, { MouseEvent, useState } from "react";
import i18n from "../utils/i18n";
import {
    Alignment,
    MouseActionMapping,
    MouseActionsMapping,
    ReferenceObject,
    RowConfig,
    TableAction,
    TableColumn,
    TableSelection,
    TableSorting,
} from "./types";
import { formatRowValue } from "./utils/formatting";
import { isEventCtrlClick, parseActions, updateSelection } from "./utils/selection";

const defaultMouseActionsMapping: MouseActionsMapping = {
    left: { type: "primary" },
    right: { type: "contextual" },
};

const useStyles = makeStyles({
    bottomBorder: {
        borderBottom: "2px solid #E0E0E0",
    },
    flex: {
        display: "flex",
    },
    checkboxCell: {
        paddingLeft: 12,
    },
    centerText: {
        textAlign: "center",
    },
    childrenRow: {
        background: "#E0E0E0",
    },
    disabledRow: {
        backgroundColor: "#EEEEEE",
        pointerEvents: "none",
    },
});

const rotateIconStyle = (isOpen: boolean) => ({
    transform: isOpen ? "rotate(90deg)" : "none",
});

export interface DataTableBodyProps<T extends ReferenceObject> {
    rows: T[];
    columns: TableColumn<T>[];
    rowConfig?(row: T): RowConfig;
    visibleColumns: (keyof T)[];
    sorting: TableSorting<T>;
    availableActions?: TableAction<T>[];
    selected: TableSelection[];
    onChange?(newSelection: TableSelection[]): void;
    openContextualMenu?(row: T, positionLeft: number, positionTop: number): void;
    enableMultipleAction?: boolean;
    loading?: boolean;
    childrenKeys?: string[];
    mouseActionsMapping?: MouseActionsMapping;
    alignment?: Alignment;
}

export function DataTableBody<T extends ReferenceObject>(props: DataTableBodyProps<T>) {
    const {
        rows,
        columns,
        rowConfig,
        visibleColumns,
        sorting,
        availableActions = [],
        selected,
        onChange = _.noop,
        openContextualMenu = _.noop,
        enableMultipleAction,
        loading,
        childrenKeys = [],
        mouseActionsMapping = defaultMouseActionsMapping,
    } = props;
    const { field, order } = sorting;
    const classes = useStyles();
    const [expandedRows, updateExpandedRows] = useState<string[]>([]);

    function createRow(row: T, index: number | string, level = 0) {
        const labelId = `data-table-row-${index}`;
        const showRowActions = parseActions([row], availableActions).length > 0;
        const primaryAction = _(availableActions).find({ primary: true });

        const contextualAction = (event: MouseEvent<unknown>) => {
            if (isEventCtrlClick(event)) return;
            event.stopPropagation();
            openContextualMenu(row, event.clientY, event.clientX);
        };

        const runMouseAction = (
            event: MouseEvent<unknown>,
            mouseActionMapping: MouseActionMapping
        ) => {
            switch (mouseActionMapping.type) {
                case "primary":
                    if (primaryAction && primaryAction.onClick) primaryAction.onClick([row.id]);
                    break;
                case "contextual":
                    contextualAction(event);
                    break;
                case "action": {
                    const action = availableActions.find(a => a.name === mouseActionMapping.action);
                    if (action && action.onClick) action.onClick([row.id]);
                    break;
                }
            }
        };

        const handleClick = (event: MouseEvent<unknown>) => {
            const { tagName, type = null } = event.target as HTMLAnchorElement;
            if (!tagName) return;
            const isCheckboxClick = tagName.localeCompare("input") && type === "checkbox";
            const activeSelection = _.reject(selected, { indeterminate: true });

            if (event.type === "contextmenu") {
                event.preventDefault();
                runMouseAction(event, mouseActionsMapping["right"]);
            } else if (enableMultipleAction && (isEventCtrlClick(event) || isCheckboxClick)) {
                onChange(updateSelection(activeSelection, row));
            } else {
                runMouseAction(event, mouseActionsMapping["left"]);
            }
        };

        const childrenRows: T[] = _(Object.values(_.pick(row, childrenKeys)))
            .flattenDeep()
            .orderBy([field], [order])
            .value();

        const openChildrenRows = (event: MouseEvent<unknown>) => {
            event.stopPropagation();
            updateExpandedRows(expandedRows => {
                if (expandedRows.includes(row.id)) {
                    return expandedRows.filter(id => id !== row.id);
                } else {
                    return [...expandedRows, row.id];
                }
            });
        };

        const config = rowConfig ? rowConfig(row) : {};
        const { style, cellStyle, disabled, selectable = !disabled } = config;
        const selectedItem = _.find(selected, { id: row.id });
        const { checked = !!selectedItem, indeterminate = false, icon = <CheckBoxTwoToneIcon /> } =
            selectedItem || {};
        const rowClassName = _.compact([
            level === 0 ? classes.bottomBorder : classes.childrenRow,
            disabled ? classes.disabledRow : null,
        ]).join(" ");

        const currentColumns = _.compact(
            visibleColumns.map(column => columns.find(({ name }) => name === column))
        );

        return (
            <React.Fragment key={`data-table-row-${index}`}>
                <TableRow
                    className={rowClassName}
                    onClick={event => handleClick(event)}
                    onContextMenu={event => handleClick(event)}
                    role="checkbox"
                    selected={checked || indeterminate}
                    style={style}
                    hover
                >
                    {(enableMultipleAction || childrenRows.length > 0) && (
                        <TableCell
                            padding="checkbox"
                            className={classes.checkboxCell}
                            style={cellStyle}
                        >
                            <div className={classes.flex}>
                                {enableMultipleAction && (
                                    <Checkbox
                                        checked={checked}
                                        indeterminate={indeterminate}
                                        indeterminateIcon={icon}
                                        disabled={!selectable}
                                    />
                                )}
                                {childrenRows.length > 0 && (
                                    <IconButton
                                        style={{
                                            transition: "all ease 200ms",
                                            ...rotateIconStyle(expandedRows.includes(row.id)),
                                        }}
                                        onClick={openChildrenRows}
                                    >
                                        <ChevronRightIcon />
                                    </IconButton>
                                )}
                            </div>
                        </TableCell>
                    )}

                    {currentColumns.map(column => (
                        <TableCell
                            key={`${labelId}-column-${column.name}`}
                            scope="row"
                            align={props.alignment || column.alignment || "left"}
                            style={cellStyle}
                        >
                            {formatRowValue(column, row)}
                        </TableCell>
                    ))}

                    <TableCell
                        key={`${labelId}-actions`}
                        padding="none"
                        align={"center"}
                        style={cellStyle}
                    >
                        {!!showRowActions && (
                            <Tooltip title={i18n.t("Actions")}>
                                <IconButton onClick={event => contextualAction(event)}>
                                    <MoreVertIcon />
                                </IconButton>
                            </Tooltip>
                        )}
                    </TableCell>
                </TableRow>

                {expandedRows.includes(row.id) &&
                    childrenRows.map((childrenRow: T, childrenIndex: number) =>
                        createRow(childrenRow, `${index}-${childrenIndex}`, level + 1)
                    )}
            </React.Fragment>
        );
    }

    return (
        <TableBody>
            {rows.map((row, index) => createRow(row, index))}

            {!loading && rows.length === 0 && (
                <TableRow>
                    <TableCell colSpan={columns.length + 2}>
                        <p className={classes.centerText}>No results found</p>
                    </TableCell>
                </TableRow>
            )}
        </TableBody>
    );
}
