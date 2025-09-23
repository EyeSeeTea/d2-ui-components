import _ from "lodash";
import { Transfer, TransferOption } from "@dhis2/ui";
import { DialogContent } from "@material-ui/core";
import React from "react";
import { ConfirmationDialog, ReferenceObject, TableColumn } from "..";
import i18n from "../utils/i18n";
import { TableColumnSelector } from "./TableColumnSelector";

interface ColumnSelectorDialogProps<T extends ReferenceObject> {
    columns: TableColumn<T>[];
    visibleColumns: (keyof T)[];
    allowReorderingColumns?: boolean;
    onChange: (visibleColumns: (keyof T)[]) => void;
    onCancel: () => void;
    childrenTransfer?: React.ReactNode;
    keepDisabledColumns?: boolean;
}

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

    const selectedColumns = React.useMemo((): string[] => {
        const disableColumns = columns.filter(col => col.disabled).map(col => col.name.toString());
        return _(visibleColumns).map(String).concat(disableColumns).uniq().value();
    }, [visibleColumns, columns]);

    const updateSelectedColumns = React.useCallback(
        ({ selected }: { selected: Array<keyof T> }) => {
            if (keepDisabledColumns) {
                const mandatoryColumns = columns.filter(col => col.disabled).map(col => col.name);
                const merged = _(selected).concat(mandatoryColumns).uniq().value();
                onChange(merged);
            } else {
                onChange(selected);
            }
        },
        [keepDisabledColumns, columns, onChange]
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
                            selected={keepDisabledColumns ? selectedColumns : visibleColumns}
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
