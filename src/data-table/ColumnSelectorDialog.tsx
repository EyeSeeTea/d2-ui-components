import _ from "lodash";
import { Transfer, TransferOption } from "@dhis2/ui";
import { DialogContent } from "@material-ui/core";
import React from "react";
import { ConfirmationDialog, ReferenceObject, TableColumn } from "..";
import i18n from "../utils/i18n";
import { TableColumnSelector } from "./TableColumnSelector";

interface ColumnSelectorDialogProps<T extends ReferenceObject> {
    columns: TableColumn<T>[];
    visibleColumns: TableColumnsType<T>;
    allowReorderingColumns?: boolean;
    onChange: (visibleColumns: TableColumnsType<T>) => void;
    onCancel: () => void;
    childrenTransfer?: React.ReactNode;
    keepDisabledColumns?: boolean;
}

type TableColumnsType<T> = (keyof T)[];

type UpdateSelectedColumns<T> = (params: { selected: TableColumnsType<T> }) => void;

export function ColumnSelectorDialog<T extends ReferenceObject>(
    props: ColumnSelectorDialogProps<T>
) {
    const {
        childrenTransfer,
        columns,
        visibleColumns,
        onChange,
        onCancel,
        allowReorderingColumns = true,
        keepDisabledColumns = true,
    } = props;
    const sortableColumns = columns.map(
        ({ name, text: label, disabled }): TransferOption => ({
            label,
            value: name.toString(),
            disabled: disabled ?? false,
        })
    );

    const mergeWithDisabled = React.useCallback(
        (selected: TableColumnsType<T>): TableColumnsType<T> => {
            if (!keepDisabledColumns) return selected;
            const mandatoryColumns = columns.filter(col => col.disabled).map(col => col.name);
            return _(selected).concat(mandatoryColumns).uniq().value();
        },
        [keepDisabledColumns, columns]
    );

    const selectedColumns = React.useMemo((): string[] => {
        return mergeWithDisabled(visibleColumns).map(String);
    }, [visibleColumns, mergeWithDisabled]);

    const updateSelectedColumns = React.useCallback<UpdateSelectedColumns<T>>(
        ({ selected }) => {
            // selected is always an empty array if the internal "Remove All ⇍" button is clicked
            onChange(mergeWithDisabled(selected));
        },
        [onChange, mergeWithDisabled]
    );

    return (
        <ConfirmationDialog
            isOpen={true}
            title={i18n.t("Columns to show in table")}
            onCancel={onCancel}
            cancelText={i18n.t("Close")}
            maxWidth={"lg"}
            fullWidth={true}
            disableEnforceFocus
        >
            <DialogContent>
                {allowReorderingColumns ? (
                    <>
                        <Transfer
                            options={sortableColumns}
                            selected={selectedColumns}
                            enableOrderChange={true}
                            filterable={true}
                            filterablePicked={true}
                            selectedWidth="100%"
                            optionsWidth="100%"
                            height="400px"
                            onChange={updateSelectedColumns}
                        />
                        {childrenTransfer}
                    </>
                ) : (
                    <TableColumnSelector
                        columns={columns}
                        visibleColumns={visibleColumns}
                        onChange={onChange}
                    />
                )}
            </DialogContent>
        </ConfirmationDialog>
    );
}

export default ColumnSelectorDialog;
