import { useCallback, useEffect, useMemo, useState } from "react";
import {
    ObjectsTableDetailField,
    ObjectsTableProps,
    PaginationOptions,
    ReferenceObject,
    TableAction,
    TableColumn,
    TableNotification,
    TablePagination,
    TableSelection,
    TableSorting,
    TableState,
} from "..";
import i18n from "../utils/i18n";
import { ObjectsListProps } from "./ObjectsList";
import _ from "lodash";

export interface TableConfig<Obj extends ReferenceObject>
    extends Omit<
        ObjectsTableProps<Obj>,
        "rows" | "isLoading" | "onChange" | "pagination" | "onChangeSearch" | "reload"
    > {
    columns: TableColumn<Obj>[];
    actions: TableAction<Obj>[];
    paginationOptions: PaginationOptions;
    initialSorting: TableSorting<Obj>;
    initialSelection?: TableSelection[];
    details?: ObjectsTableDetailField<Obj>[];
    searchBoxLabel?: string;
    initialSearch?: string;
}

export interface Pager {
    page: number;
    pageCount: number;
    total: number;
    pageSize: number;
}

export type GetRows<Obj extends ReferenceObject> = (
    search: string,
    paging: TablePagination,
    sorting: TableSorting<Obj>
) => Promise<{ objects: Obj[]; pager: Pager }>;

export type GetAllIds<Obj extends ReferenceObject> = (
    search: string,
    sorting: TableSorting<Obj>
) => Promise<string[]>;

// Group state to avoid multiple re-renders on individual setState dispatchers
interface State<Obj extends ReferenceObject> {
    rows: Obj[] | undefined;
    pagination: TablePagination;
    sorting: TableSorting<Obj>;
    isLoading: boolean;
    ids?: string[];
}

export function useObjectsTable<Obj extends ReferenceObject>(
    config: TableConfig<Obj>,
    getRows: GetRows<Obj>,
    getAllIds?: GetAllIds<Obj>
): ObjectsListProps<Obj> {
    const initialState = useMemo(
        () => ({
            pagination: {
                page: 1,
                pageSize: config.paginationOptions.pageSizeInitialValue ?? 20,
                total: 0,
            },
            sorting: config.initialSorting,
            selection: config.initialSelection,
        }),
        [
            config.initialSelection,
            config.initialSorting,
            config.paginationOptions.pageSizeInitialValue,
        ]
    );

    const [state, setState] = useState<State<Obj>>(() => ({
        rows: undefined,
        pagination: initialState.pagination,
        sorting: initialState.sorting,
        isLoading: false,
    }));

    const [search, setSearch] = useState(config.initialSearch ?? "");

    const loadRows = useCallback(
        async (sorting: TableSorting<Obj>, pagination: Partial<TablePagination>) => {
            setState(state => ({ ...state, isLoading: true }));

            const paging = { ...initialState.pagination, ...pagination };
            const res = await getRows(search.trim(), paging, sorting);
            const ids = getAllIds ? await getAllIds(search.trim(), sorting) : undefined;

            setState({
                rows: res.objects,
                pagination: { ...pagination, ...res.pager },
                sorting,
                isLoading: false,
                ids,
            });
        },
        [getRows, getAllIds, search, initialState.pagination]
    );

    const reload = useCallback(async () => {
        loadRows(state.sorting, state.pagination);
    }, [loadRows, state.sorting, state.pagination]);

    useEffect(() => {
        loadRows(config.initialSorting, initialState.pagination);
    }, [config.initialSorting, loadRows, initialState.pagination]);

    const onChange = useCallback(
        (newState: TableState<Obj>) => {
            loadRows(newState.sorting, newState.pagination);
        },
        [loadRows]
    );

    return {
        ...config,
        isLoading: state.isLoading,
        rows: state.rows ?? [],
        onChange,
        pagination: state.pagination,
        searchBoxLabel: config.searchBoxLabel || i18n.t("Search by name"),
        onChangeSearch: setSearch,
        reload,
        initialState,
        ids: state.ids,
    };
}

export function useTableWithSelectionCount<T extends ReferenceObject>(
    config: TableConfig<T>,
    getRows: GetRows<T>,
    getAllIds?: GetAllIds<T>
): ObjectsListProps<T> {
    const tableProps = useObjectsTable(config, getRows, getAllIds);
    const [selection, setSelection] = useState<TableSelection[]>([]);

    const onChange = useCallback(
        (newState: TableState<T>) => {
            setSelection(newState.selection ?? []);
            tableProps.onChange(newState);
        },
        [tableProps]
    );

    const tableNotifications = useMemo<TableNotification[]>(() => {
        if (selection.length === 0) return [];

        const rows = tableProps.rows;
        const total = tableProps.pagination?.total ?? rows.length;
        const ids = tableProps.ids ?? [];

        const selectionInOtherPages = _.differenceBy(selection, rows, "id");
        const allSelectedInPage =
            rows.length > 0 && _.differenceBy(rows, selection, "id").length === 0;
        const multiplePagesAvailable = total > rows.length;
        const selectAllImplemented = ids.length > 0;

        const isSelectionCountVisible =
            selection.length === total ||
            selectionInOtherPages.length > 0 ||
            (allSelectedInPage && multiplePagesAvailable && selectAllImplemented);
        if (isSelectionCountVisible) return [];

        return [
            {
                message: i18n.t("There are {{count}} items selected on this page.", {
                    count: selection.length,
                }),
                link: i18n.t("Clear selection"),
                newSelection: [],
            },
        ];
    }, [selection, tableProps.rows, tableProps.pagination, tableProps.ids]);

    return { ...tableProps, onChange, tableNotifications };
}
