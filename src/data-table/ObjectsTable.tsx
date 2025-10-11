import React, { useState, ReactNode, MouseEvent, useCallback, useMemo } from "react";
import _ from "lodash";
import classnames from "classnames";
import { createStyles, makeStyles, Theme } from "@material-ui/core/styles";
import DetailsIcon from "@material-ui/icons/Details";
import { SearchBox } from "..";

import { DataTable, DataTableProps } from "./DataTable";
import { DetailsBox } from "./DetailsBox";
import { ActionButton } from "./ActionButton";
import { filterObjects } from "./utils/filtering";
import { TableObject, ObjectsTableDetailField, ReferenceObject } from "./types";

const useStyles = makeStyles((theme: Theme) =>
    createStyles({
        root: {},
        paper: {
            width: "100%",
            marginBottom: theme.spacing(2),
        },
        title: {
            flex: "1 1 auto",
        },
        searchBox: {
            maxWidth: "550px",
            width: "33%",
        },
    })
);

export interface ObjectsTableProps<T extends ReferenceObject> extends DataTableProps<T> {
    details?: ObjectsTableDetailField<T>[];
    initialSearch?: string;
    onChangeSearch?(search: string): void;
    searchBoxLabel?: string;
    searchBoxColumns?: (keyof T)[];
    onActionButtonClick?(event: MouseEvent<unknown>): void;
    actionButtonLabel?: ReactNode;
    className?: string;
    customConfig?: React.ReactNode;
}

export function ObjectsTable<T extends ReferenceObject = TableObject>(props: ObjectsTableProps<T>) {
    const {
        details = [],
        initialSearch,
        onChangeSearch = _.noop,
        searchBoxLabel,
        searchBoxColumns,
        onActionButtonClick,
        actionButtonLabel,
        rows: parentRows,
        actions: parentActions = [],
        filterComponents: parentFilterComponents,
        sideComponents: parentSideComponents,
        resetKey = "",
        childrenKeys = [],
        className,
        ...rest
    } = props;
    const classes = useStyles();

    const [detailsPaneObject, setDetailsPaneObject] = useState<T | null>(null);
    const [searchValue, setSearchValue] = useState(initialSearch);
    const showSearchBox = searchBoxColumns || onChangeSearch !== _.noop;

    const handleDetailsBoxClose = useCallback(() => {
        setDetailsPaneObject(null);
    }, []);

    const childrenRows: T[] = _.flattenDeep(
        parentRows.map(row => Object.values(_.pick(row, childrenKeys)))
    );

    const actions = parentActions.map(action => ({
        ...action,
        icon: action.name === "details" && !action.icon ? <DetailsIcon /> : action.icon,
        onClick:
            action.name === "details"
                ? (selectedIds: string[]) => {
                      if (selectedIds.length === 1) {
                          const allRows = [...parentRows, ...childrenRows];
                          const row = _.find(allRows, ["id", selectedIds[0]]);
                          if (row) setDetailsPaneObject(row);
                      }
                      if (action.onClick) action.onClick(selectedIds);
                  }
                : action.onClick,
    }));

    const handleSearchChange = useCallback(
        (newSearch: string) => {
            setSearchValue(newSearch);
            onChangeSearch(newSearch);
        },
        [onChangeSearch]
    );

    const filterComponents = useMemo(
        () => (
            <React.Fragment>
                {showSearchBox && (
                    <SearchBox
                        key={"objects-table-search-box"}
                        className={classes.searchBox}
                        value={searchValue}
                        hintText={searchBoxLabel || "Search items"}
                        onChange={handleSearchChange}
                    />
                )}
                {parentFilterComponents}
            </React.Fragment>
        ),
        [
            classes.searchBox,
            showSearchBox,
            searchValue,
            searchBoxLabel,
            handleSearchChange,
            parentFilterComponents,
        ]
    );

    const sideComponents = useMemo(
        () => (
            <React.Fragment>
                {!!detailsPaneObject && (
                    <DetailsBox
                        key={"objects-table-details-box"}
                        details={details}
                        data={detailsPaneObject}
                        onClose={handleDetailsBoxClose}
                    />
                )}
                {parentSideComponents}
            </React.Fragment>
        ),
        [detailsPaneObject, details, handleDetailsBoxClose, parentSideComponents]
    );

    const rows =
        searchBoxColumns && searchValue
            ? filterObjects(parentRows, searchBoxColumns, searchValue)
            : parentRows;

    return (
        <div className={classnames([classes.root, className])}>
            <DataTable
                rows={rows}
                actions={actions}
                filterComponents={filterComponents}
                sideComponents={sideComponents}
                resetKey={resetKey + "-" + searchValue}
                childrenKeys={childrenKeys}
                {...rest}
            />
            {onActionButtonClick && (
                <ActionButton onClick={onActionButtonClick} label={actionButtonLabel} />
            )}
        </div>
    );
}
