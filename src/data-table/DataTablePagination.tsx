import Pagination from "@material-ui/core/TablePagination";
import _ from "lodash";
import React from "react";
import { PartialBy } from "../utils/types";
import { PaginationOptions, TablePagination } from "./types";

export interface DataTablePaginationProps {
    pagination: PartialBy<TablePagination, "total">;
    paginationOptions: Partial<PaginationOptions>;
    defaultTotal: number;
    onChange?(newPagination: TablePagination): void;
}

export function DataTablePagination(props: DataTablePaginationProps) {
    const { pagination, paginationOptions, onChange = _.noop, defaultTotal } = props;
    const { pageSizeOptions = [10, 25, 50, 100] } = paginationOptions;
    const { page, pageSize, total = defaultTotal } = pagination;

    const handleChangePage = (_event: unknown, page: number) => {
        onChange({
            ...pagination,
            page: page + 1,
        });
    };

    const handleChangePageSize = (event: React.ChangeEvent<HTMLInputElement>) => {
        const pageSize = parseInt(event.target.value, 10);
        onChange({
            ...pagination,
            pageSize,
            page: 1,
        });
    };

    const currentPage = total > 0 ? page - 1 : 0;

    return (
        <Pagination
            rowsPerPageOptions={pageSizeOptions}
            component="div"
            count={total}
            rowsPerPage={pageSize}
            page={currentPage}
            onPageChange={handleChangePage}
            onRowsPerPageChange={handleChangePageSize}
        />
    );
}
