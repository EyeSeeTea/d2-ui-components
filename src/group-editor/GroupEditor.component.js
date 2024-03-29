import React, { Component } from "react";
import PropTypes from "prop-types";
import Button from "@material-ui/core/Button";

import i18n from "../utils/i18n";
import { Paper, CircularProgress } from "@material-ui/core";

// TODO: TOAST!
// TODO: Undo support (in TOAST?)

export default class GroupEditor extends Component {
    state = {
        // Number of items selected in the left/right columns
        selectedLeft: 0,
        selectedRight: 0,

        // Loading
        loading: true,
    };

    componentDidMount() {
        this.disposables = [];

        this.disposables.push(
            this.props.itemStore.subscribe(state => this.setState({ loading: !state }))
        );
        this.disposables.push(this.props.assignedItemStore.subscribe(() => this.forceUpdate()));
    }

    UNSAFE_componentWillReceiveProps(props) {
        if (props.hasOwnProperty("filterText") && this.leftSelect && this.rightSelect) {
            this.setState({
                selectedLeft: [].filter.call(
                    this.leftSelect.selectedOptions,
                    item =>
                        item.text
                            .toLowerCase()
                            .indexOf(`${props.filterText}`.trim().toLowerCase()) !== -1
                ).length,
                selectedRight: [].filter.call(
                    this.rightSelect.selectedOptions,
                    item =>
                        item.text
                            .toLowerCase()
                            .indexOf(`${props.filterText}`.trim().toLowerCase()) !== -1
                ).length,
            });
        }
    }

    componentWillUnmount() {
        this.disposables.forEach(disposable => {
            disposable.unsubscribe();
        });
    }

    //
    // Event handlers
    //
    onAssignItems = () => {
        this.setState({ loading: true });
        this.props
            .onAssignItems([].map.call(this.leftSelect.selectedOptions, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onRemoveItems = () => {
        this.setState({ loading: true });
        this.props
            .onRemoveItems([].map.call(this.rightSelect.selectedOptions, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onAssignAll = () => {
        this.setState({ loading: true });
        this.props
            .onAssignItems([].map.call(this.leftSelect.options, item => item.value))
            .then(() => {
                this.clearSelection();
                this.setState({ loading: false });
            })
            .catch(() => {
                this.setState({ loading: false });
            });
    };

    onRemoveAll = () => {
        this.setState({ loading: true });
        this.props
            .onRemoveItems([].map.call(this.rightSelect.options, item => item.value))
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
    getItemStoreIsCollection() {
        return (
            this.props.itemStore.state !== undefined &&
            typeof this.props.itemStore.state.values === "function" &&
            typeof this.props.itemStore.state.has === "function"
        );
    }
    getItemStoreIsArray() {
        return (
            this.props.itemStore.state !== undefined &&
            this.props.itemStore.state.constructor.name === "Array"
        );
    }
    getAssignedItemStoreIsCollection() {
        return (
            this.props.assignedItemStore.state !== undefined &&
            typeof this.props.assignedItemStore.state.values === "function" &&
            typeof this.props.assignedItemStore.state.has === "function"
        );
    }
    getAssignedItemStoreIsArray() {
        return (
            this.props.assignedItemStore.state !== undefined &&
            this.props.assignedItemStore.state.constructor.name === "Array"
        );
    }
    getAllItems() {
        return this.getItemStoreIsCollection()
            ? Array.from(this.props.itemStore.state.values()).map(item => ({
                  value: item.id,
                  text: item.name,
              }))
            : this.props.itemStore.state || [];
    }
    getItemCount() {
        return (
            (this.getItemStoreIsCollection() && this.props.itemStore.state.size) ||
            (this.getItemStoreIsArray() && this.props.itemStore.state.length) ||
            0
        );
    }
    getIsValueAssigned(value) {
        return this.getAssignedItemStoreIsCollection()
            ? this.props.assignedItemStore.state.has(value)
            : this.props.assignedItemStore.state &&
                  this.props.assignedItemStore.state.indexOf(value) !== -1;
    }
    getAssignedItems() {
        return this.getAllItems().filter(item => this.getIsValueAssigned(item.value));
    }
    getAvailableItems() {
        return this.getAllItems().filter(item => !this.getIsValueAssigned(item.value));
    }
    getAllItemsFiltered() {
        return this.filterItems(this.getAllItems());
    }
    getAssignedItemsFiltered() {
        return this.filterItems(this.getAssignedItems());
    }
    getAvailableItemsFiltered() {
        return this.filterItems(this.getAvailableItems());
    }
    getAssignedItemsCount() {
        return this.getAssignedItems().length;
    }
    getAvailableItemsCount() {
        return this.getAvailableItems().length;
    }
    getAssignedItemsFilterCount() {
        return this.getFilterText().length === 0
            ? 0
            : this.getAssignedItems().length - this.getAssignedItemsFiltered().length;
    }
    getAvailableItemsFilterCount() {
        return this.getFilterText().length === 0
            ? 0
            : this.getAvailableItems().length - this.getAvailableItemsFiltered().length;
    }
    getAssignedItemsUnfilteredCount() {
        return this.getFilterText().length === 0
            ? this.getAssignedItemsCount()
            : this.getAssignedItemsCount() - this.getAssignedItemsFilterCount();
    }
    getAvailableItemsUnfilteredCount() {
        return this.getFilterText().length === 0
            ? this.getAvailableItemsCount()
            : this.getAvailableItemsCount() - this.getAvailableItemsFilterCount();
    }
    getFilterText() {
        return this.props.filterText ? this.props.filterText.trim().toLowerCase() : "";
    }
    getAvailableSelectedCount() {
        return Math.max(this.state.selectedLeft, 0);
    }
    getAssignedSelectedCount() {
        return Math.max(this.state.selectedRight, 0);
    }
    getSelectedCount() {
        return Math.max(this.getAvailableSelectedCount(), this.getAssignedSelectedCount());
    }

    getSelectedItems() {
        return [].map.call(this.rightSelect.selectedOptions, item => item.value);
    }

    byAssignedItemsOrder = (left, right) => {
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

    clearSelection(left = true, right = true) {
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

    filterItems(items) {
        return items.filter(
            item =>
                this.getFilterText().length === 0 ||
                item.text.trim().toLowerCase().indexOf(this.getFilterText()) !== -1
        );
    }

    //
    // Rendering
    //
    render() {
        const filterHeight = this.getFilterText().length > 0 ? 15 : 0;
        const styles = {
            container: {
                display: "flex",
                marginTop: 16,
                marginBottom: 32,
                height: `${this.props.height}px`,
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
                height: `${this.props.height - filterHeight}px`,
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

        const onChangeLeft = e => {
            this.clearSelection(false, true);
            this.setState({
                selectedLeft: e.target.selectedOptions.length,
            });
        };

        const onChangeRight = e => {
            this.clearSelection(true, false);
            this.setState({
                selectedRight: e.target.selectedOptions.length,
            });
        };

        const hiddenLabel = itemCount =>
            this.getItemCount() > 0 && this.getFilterText().length > 0
                ? `${itemCount} ${i18n.t("Hidden by filters")}`
                : "";

        const selectedLabel = () =>
            this.getSelectedCount() > 0 ? `${this.getSelectedCount()} ${i18n.t("Selected")}` : "";

        const { showOptionsTooltip = true } = this.props;

        return (
            <div style={styles.container}>
                <div style={styles.left}>
                    <Paper style={styles.paper}>
                        <div style={styles.hidden}>
                            {hiddenLabel(this.getAvailableItemsFilterCount())}
                        </div>
                        <select
                            multiple
                            style={styles.select}
                            onChange={onChangeLeft}
                            ref={r => {
                                this.leftSelect = r;
                            }}
                        >
                            {this.getAvailableItemsFiltered().map(item => (
                                <option
                                    key={item.value}
                                    value={item.value}
                                    onDoubleClick={this.onAssignItems}
                                    style={styles.options}
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
                        } →`}
                    </Button>
                </div>
                <div style={styles.middle}>
                    <div style={styles.selected}>{selectedLabel()}</div>
                    <Button
                        data-test={"group-editor-assign-item"}
                        variant="contained"
                        onClick={this.onAssignItems}
                        style={styles.buttons}
                        color="secondary"
                        disabled={this.state.loading || this.state.selectedLeft === 0}
                    >
                        →
                    </Button>
                    <Button
                        data-test={"group-editor-remove-all"}
                        variant="contained"
                        onClick={this.onRemoveItems}
                        style={styles.buttons}
                        color="secondary"
                        disabled={this.state.loading || this.state.selectedRight === 0}
                    >
                        ←
                    </Button>
                    <div style={styles.status}>
                        {this.state.loading ? <CircularProgress size={30} /> : undefined}
                    </div>
                </div>
                <div style={styles.right}>
                    <Paper style={styles.paper}>
                        <div style={styles.hidden}>
                            {hiddenLabel(this.getAssignedItemsFilterCount())}
                        </div>
                        <select
                            multiple
                            style={styles.select}
                            onChange={onChangeRight}
                            ref={r => {
                                this.rightSelect = r;
                            }}
                        >
                            {this.getAssignedItemsFiltered()
                                .sort(this.byAssignedItemsOrder)
                                .map(item => (
                                    <option
                                        key={item.value}
                                        value={item.value}
                                        onDoubleClick={this.onRemoveItems}
                                        style={styles.options}
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

GroupEditor.propTypes = {
    // itemStore: d2-ui store containing all available items, either as a D2 ModelCollection,
    // or an array on the following format: [{value: 1, text: '1'}, {value: 2, text: '2'}, ...]
    itemStore: PropTypes.object.isRequired,

    // assignedItemStore: d2-ui store containing all items assigned to the current group, either
    // as a D2 ModelCollectionProperty or an array of ID's that match values in the itemStore
    assignedItemStore: PropTypes.object.isRequired,

    // filterText: A string that will be used to filter items in both columns
    filterText: PropTypes.string,

    // Note: Callbacks should return a promise that will resolve when the operation succeeds
    // and is rejected when it fails. The component will be in a loading state until the promise
    // resolves or is rejected.

    // assign items callback, called with an array of values to be assigned to the group
    onAssignItems: PropTypes.func.isRequired,

    // remove items callback, called with an array of values to be removed from the group
    onRemoveItems: PropTypes.func.isRequired,

    // remove items callback, called with an array of values to be removed from the group
    onMoveItems: PropTypes.func,

    // The height of the component, defaults to 500px
    height: PropTypes.number,

    showOptionsTooltip: PropTypes.bool,
};

GroupEditor.contextTypes = {
    d2: PropTypes.object,
};

GroupEditor.defaultProps = {
    height: 500,
    filterText: "",
    onMoveItems: () => {},
    showOptionsTooltip: true,
};
