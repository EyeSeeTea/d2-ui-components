import React, { Component } from "react";
import Button from "@material-ui/core/Button";

import i18n from "../utils/i18n";
import { Paper, CircularProgress } from "@material-ui/core";

// TODO: TOAST!
// TODO: Undo support (in TOAST?)

interface StoreItem {
    readonly value: string;
    readonly text: string;
}

interface D2Store {
    state: any;
    subscribe: (callback: (state: any) => void) => { unsubscribe: () => void };
    getState?: () => any;
}

interface GroupEditorProps {
    readonly itemStore: D2Store;
    readonly assignedItemStore: D2Store;
    readonly filterText?: string;
    readonly onAssignItems: (items: string[]) => Promise<void>;
    readonly onRemoveItems: (items: string[]) => Promise<void>;
    readonly onMoveItems?: (items: string[]) => void;
    readonly height?: number;
    readonly showOptionsTooltip?: boolean;
}

interface GroupEditorState {
    selectedLeft: number;
    selectedRight: number;
    loading: boolean;
}

export default class GroupEditor extends Component<GroupEditorProps, GroupEditorState> {
    context: { d2: any } = { d2: null };
    static contextTypes = { d2: () => null };

    static defaultProps = {
        height: 500,
        filterText: "",
        onMoveItems: () => {},
        showOptionsTooltip: true,
    };

    state: GroupEditorState = {
        // Number of items selected in the left/right columns
        selectedLeft: 0,
        selectedRight: 0,

        // Loading
        loading: true,
    };

    disposables: Array<{ unsubscribe: () => void }> = [];
    leftSelect!: HTMLSelectElement;
    rightSelect!: HTMLSelectElement;

    componentDidMount(): void {
        this.disposables.push(
            this.props.itemStore.subscribe(state => this.setState({ loading: !state }))
        );
        this.disposables.push(this.props.assignedItemStore.subscribe(() => this.forceUpdate()));
    }

    UNSAFE_componentWillReceiveProps(props: GroupEditorProps): void {
        if (props.hasOwnProperty("filterText") && this.leftSelect && this.rightSelect) {
            this.setState({
                selectedLeft: ([] as HTMLOptionElement[]).filter.call(
                    this.leftSelect.selectedOptions,
                    (item: HTMLOptionElement) =>
                        item.text
                            .toLowerCase()
                            .indexOf(`${props.filterText}`.trim().toLowerCase()) !== -1
                ).length,
                selectedRight: ([] as HTMLOptionElement[]).filter.call(
                    this.rightSelect.selectedOptions,
                    (item: HTMLOptionElement) =>
                        item.text
                            .toLowerCase()
                            .indexOf(`${props.filterText}`.trim().toLowerCase()) !== -1
                ).length,
            });
        }
    }

    componentWillUnmount(): void {
        this.disposables.forEach(disposable => {
            disposable.unsubscribe();
        });
    }

    //
    // Event handlers
    //
    onAssignItems = (): void => {
        this.setState({ loading: true });
        this.props
            .onAssignItems(
                ([] as HTMLOptionElement[]).map.call(
                    this.leftSelect.selectedOptions,
                    (item: HTMLOptionElement) => item.value
                ) as string[]
            )
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onRemoveItems = (): void => {
        this.setState({ loading: true });
        this.props
            .onRemoveItems(
                ([] as HTMLOptionElement[]).map.call(
                    this.rightSelect.selectedOptions,
                    (item: HTMLOptionElement) => item.value
                ) as string[]
            )
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onAssignAll = (): void => {
        this.setState({ loading: true });
        this.props
            .onAssignItems(
                ([] as HTMLOptionElement[]).map.call(
                    this.leftSelect.options,
                    (item: HTMLOptionElement) => item.value
                ) as string[]
            )
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onRemoveAll = (): void => {
        this.setState({ loading: true });
        this.props
            .onRemoveItems(
                ([] as HTMLOptionElement[]).map.call(
                    this.rightSelect.options,
                    (item: HTMLOptionElement) => item.value
                ) as string[]
            )
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    //
    // Data handling utility functions
    //
    getItemStoreIsCollection(): boolean {
        return (
            this.props.itemStore.state !== undefined &&
            typeof this.props.itemStore.state.values === "function" &&
            typeof this.props.itemStore.state.has === "function"
        );
    }
    getItemStoreIsArray(): boolean {
        return (
            this.props.itemStore.state !== undefined &&
            this.props.itemStore.state.constructor.name === "Array"
        );
    }
    getAssignedItemStoreIsCollection(): boolean {
        return (
            this.props.assignedItemStore.state !== undefined &&
            typeof this.props.assignedItemStore.state.values === "function" &&
            typeof this.props.assignedItemStore.state.has === "function"
        );
    }
    getAssignedItemStoreIsArray(): boolean {
        return (
            this.props.assignedItemStore.state !== undefined &&
            this.props.assignedItemStore.state.constructor.name === "Array"
        );
    }
    getAllItems(): StoreItem[] {
        return this.getItemStoreIsCollection()
            ? Array.from(this.props.itemStore.state.values()).map((item: any) => ({
                  value: item.id,
                  text: item.name,
              }))
            : this.props.itemStore.state || [];
    }
    getItemCount(): number {
        return (
            (this.getItemStoreIsCollection() && this.props.itemStore.state.size) ||
            (this.getItemStoreIsArray() && this.props.itemStore.state.length) ||
            0
        );
    }
    getIsValueAssigned(value: string): boolean {
        return this.getAssignedItemStoreIsCollection()
            ? this.props.assignedItemStore.state.has(value)
            : this.props.assignedItemStore.state &&
                  this.props.assignedItemStore.state.indexOf(value) !== -1;
    }
    getAssignedItems(): StoreItem[] {
        return this.getAllItems().filter(item => this.getIsValueAssigned(item.value));
    }
    getAvailableItems(): StoreItem[] {
        return this.getAllItems().filter(item => !this.getIsValueAssigned(item.value));
    }
    getAllItemsFiltered(): StoreItem[] {
        return this.filterItems(this.getAllItems());
    }
    getAssignedItemsFiltered(): StoreItem[] {
        return this.filterItems(this.getAssignedItems());
    }
    getAvailableItemsFiltered(): StoreItem[] {
        return this.filterItems(this.getAvailableItems());
    }
    getAssignedItemsCount(): number {
        return this.getAssignedItems().length;
    }
    getAvailableItemsCount(): number {
        return this.getAvailableItems().length;
    }
    getAssignedItemsFilterCount(): number {
        return this.getFilterText().length === 0
            ? 0
            : this.getAssignedItems().length - this.getAssignedItemsFiltered().length;
    }
    getAvailableItemsFilterCount(): number {
        return this.getFilterText().length === 0
            ? 0
            : this.getAvailableItems().length - this.getAvailableItemsFiltered().length;
    }
    getAssignedItemsUnfilteredCount(): number {
        return this.getFilterText().length === 0
            ? this.getAssignedItemsCount()
            : this.getAssignedItemsCount() - this.getAssignedItemsFilterCount();
    }
    getAvailableItemsUnfilteredCount(): number {
        return this.getFilterText().length === 0
            ? this.getAvailableItemsCount()
            : this.getAvailableItemsCount() - this.getAvailableItemsFilterCount();
    }
    getFilterText(): string {
        return this.props.filterText ? this.props.filterText.trim().toLowerCase() : "";
    }
    getAvailableSelectedCount(): number {
        return Math.max(this.state.selectedLeft, 0);
    }
    getAssignedSelectedCount(): number {
        return Math.max(this.state.selectedRight, 0);
    }
    getSelectedCount(): number {
        return Math.max(this.getAvailableSelectedCount(), this.getAssignedSelectedCount());
    }

    getSelectedItems(): string[] {
        return ([] as HTMLOptionElement[]).map.call(
            this.rightSelect.selectedOptions,
            (item: HTMLOptionElement) => item.value
        ) as string[];
    }

    byAssignedItemsOrder = (left: StoreItem, right: StoreItem): number => {
        const assignedItemStore = this.props.assignedItemStore.state;

        // Don't order anything if the assignedItemStore is not an array
        // TODO: Support sorting for a ModelCollectionProperty
        if (!Array.isArray(assignedItemStore)) {
            return 0;
        }

        return assignedItemStore.indexOf(left.value) > assignedItemStore.indexOf(right.value)
            ? 1
            : -1;
    };

    clearSelection(left = true, right = true): void {
        if (left) {
            this.leftSelect.selectedIndex = -1;
        }

        if (right) {
            this.rightSelect.selectedIndex = -1;
        }

        this.setState(state => ({
            selectedLeft: left ? 0 : state.selectedLeft,
            selectedRight: right ? 0 : state.selectedRight,
        }));
    }

    filterItems(items: StoreItem[]): StoreItem[] {
        return items.filter(
            item =>
                this.getFilterText().length === 0 ||
                item.text.trim().toLowerCase().indexOf(this.getFilterText()) !== -1
        );
    }

    //
    // Rendering
    //
    render(): React.ReactNode {
        const filterHeight = this.getFilterText().length > 0 ? 15 : 0;
        const height = this.props.height ?? 500;
        const editorStyles: Record<string, React.CSSProperties> = {
            container: {
                display: "flex",
                marginTop: 16,
                marginBottom: 32,
                height: `${height}px`,
            },
            left: {
                flex: "1 0 120px",
            },
            middle: {
                flex: "0 0 120px",
                alignSelf: "center",
                textAlign: "center",
            },
            right: {
                flex: "1 0 120px",
            },
            paper: {
                width: "100%",
                height: "100%",
            },
            select: {
                width: "100%",
                minHeight: "50px",
                height: `${height - filterHeight}px`,
                border: "none",
                fontFamily: "Roboto",
                fontSize: 13,
                outline: "none",
                overflowX: "auto",
            },
            options: {
                padding: ".25rem .5rem",
            },
            buttons: {
                minWidth: "100px",
                maxWidth: "100px",
                marginTop: "8px",
            },
            selected: {
                fontSize: 13,
                minHeight: "15px",
                marginTop: "45px",
                padding: "0 8px",
            },
            status: {
                marginTop: "8px",
                minHeight: "60px",
            },
            hidden: {
                fontSize: 13,
                color: "#404040",
                fontStyle: "italic",
                textAlign: "center",
                width: "100%",
                background: "#d0d0d0",
                maxHeight: "15px",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
            },
        };

        const onChangeLeft = (e: React.ChangeEvent<HTMLSelectElement>): void => {
            this.clearSelection(false, true);
            this.setState({
                selectedLeft: e.target.selectedOptions.length,
            });
        };

        const onChangeRight = (e: React.ChangeEvent<HTMLSelectElement>): void => {
            this.clearSelection(true, false);
            this.setState({
                selectedRight: e.target.selectedOptions.length,
            });
        };

        const hiddenLabel = (itemCount: number): string =>
            this.getItemCount() > 0 && this.getFilterText().length > 0
                ? `${itemCount} ${i18n.t("Hidden by filters")}`
                : "";

        const selectedLabel = (): string =>
            this.getSelectedCount() > 0 ? `${this.getSelectedCount()} ${i18n.t("Selected")}` : "";

        const { showOptionsTooltip = true } = this.props;

        return (
            <div style={editorStyles.container}>
                <div style={editorStyles.left}>
                    <Paper style={editorStyles.paper}>
                        <div style={editorStyles.hidden}>
                            {hiddenLabel(this.getAvailableItemsFilterCount())}
                        </div>
                        <select
                            multiple
                            style={editorStyles.select}
                            onChange={onChangeLeft}
                            ref={r => {
                                if (r) this.leftSelect = r;
                            }}
                        >
                            {this.getAvailableItemsFiltered().map(item => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                    onDoubleClick={this.onAssignItems}
                                    style={editorStyles.options}
                                    title={showOptionsTooltip ? item.text : undefined}
                                >
                                    {item.text}
                                </option>
                            ))}
                        </select>
                    </Paper>
                    <Button
                        data-test={"group-editor-assign-all"}
                        variant="contained"
                        disabled={
                            this.state.loading || this.getAvailableItemsUnfilteredCount() === 0
                        }
                        onClick={this.onAssignAll}
                        style={{ marginTop: "1rem" }}
                        color="secondary"
                    >
                        {`${i18n.t("Assign all")} ${
                            this.getAvailableItemsUnfilteredCount() === 0
                                ? ""
                                : this.getAvailableItemsUnfilteredCount()
                        } \u2192`}
                    </Button>
                </div>
                <div style={editorStyles.middle}>
                    <div style={editorStyles.selected}>{selectedLabel()}</div>
                    <Button
                        data-test={"group-editor-assign-item"}
                        variant="contained"
                        onClick={this.onAssignItems}
                        style={editorStyles.buttons}
                        color="secondary"
                        disabled={this.state.loading || this.state.selectedLeft === 0}
                    >
                        {"\u2192"}
                    </Button>
                    <Button
                        data-test={"group-editor-remove-all"}
                        variant="contained"
                        onClick={this.onRemoveItems}
                        style={editorStyles.buttons}
                        color="secondary"
                        disabled={this.state.loading || this.state.selectedRight === 0}
                    >
                        {"\u2190"}
                    </Button>
                    <div style={editorStyles.status}>
                        {this.state.loading ? <CircularProgress size={30} /> : undefined}
                    </div>
                </div>
                <div style={editorStyles.right}>
                    <Paper style={editorStyles.paper}>
                        <div style={editorStyles.hidden}>
                            {hiddenLabel(this.getAssignedItemsFilterCount())}
                        </div>
                        <select
                            multiple
                            style={editorStyles.select}
                            onChange={onChangeRight}
                            ref={r => {
                                if (r) this.rightSelect = r;
                            }}
                        >
                            {this.getAssignedItemsFiltered()
                                .sort(this.byAssignedItemsOrder)
                                .map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                        onDoubleClick={this.onRemoveItems}
                                        style={editorStyles.options}
                                        title={showOptionsTooltip ? item.text : undefined}
                                    >
                                        {item.text}
                                    </option>
                                ))}
                        </select>
                    </Paper>
                    <Button
                        data-test={"group-editor-remove-all"}
                        variant="contained"
                        style={{ float: "right", marginTop: "1rem" }}
                        disabled={
                            this.state.loading || this.getAssignedItemsUnfilteredCount() === 0
                        }
                        onClick={this.onRemoveAll}
                        color="secondary"
                    >
                        {`\u2190 ${i18n.t("Remove all")} ${
                            this.getAssignedItemsUnfilteredCount() > 0
                                ? this.getAssignedItemsUnfilteredCount()
                                : ""
                        }`}
                    </Button>
                </div>
            </div>
        );
    }
}
