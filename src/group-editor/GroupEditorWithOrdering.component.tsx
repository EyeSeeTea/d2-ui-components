import React, { Component } from "react";
import _ from "lodash";
import Icon from "@material-ui/core/Icon";
import IconButton from "@material-ui/core/IconButton";
import log from "loglevel";

import GroupEditor from "./GroupEditor.component";
import i18n from "../utils/i18n";
import { ensure } from "../utils/assert";

function moveItemOneSpotDownIn(currentlySelected: string[]): (itemToFind: string) => void {
    return itemToFind => {
        const indexOfItem = Array.prototype.findIndex.call(
            currentlySelected,
            (item: string) => item === itemToFind
        );

        // Can only move the item when the indexOfItem does not refer to the last item
        if (indexOfItem < currentlySelected.length - 1) {
            // Swap the item in the list
            const tempItem = ensure(
                currentlySelected[indexOfItem + 1],
                "Expected item at next index"
            );
            currentlySelected[indexOfItem + 1] = ensure(
                currentlySelected[indexOfItem],
                "Expected item at current index"
            );
            currentlySelected[indexOfItem] = tempItem;
        }
    };
}

function moveItemOneSpotUpIn(currentlySelected: string[]): (itemToFind: string) => void {
    return itemToFind => {
        const indexOfItem = Array.prototype.findIndex.call(
            currentlySelected,
            (item: string) => item === itemToFind
        );

        // Can only move the item when the indexOfItem does not refer to the first item
        if (indexOfItem > 0) {
            // Swap the item in the list
            const tempItem = ensure(
                currentlySelected[indexOfItem - 1],
                "Expected item at previous index"
            );
            currentlySelected[indexOfItem - 1] = ensure(
                currentlySelected[indexOfItem],
                "Expected item at current index"
            );
            currentlySelected[indexOfItem] = tempItem;
        }
    };
}

const styles: Record<string, React.CSSProperties> = {
    wrapper: {
        paddingRight: "2.5rem",
        position: "relative",
    },
    arrowsDiv: {
        width: "2.5rem",
        position: "absolute",
        top: "45%",
        right: 0,
    },
    arrow: {
        color: "#000000de",
    },
};

interface AssignedItemStore {
    state: any;
    subscribe: (callback: (state: any) => void) => { unsubscribe: () => void };
    getState: () => any;
}

interface GroupEditorWithOrderingProps {
    readonly itemStore: any;
    readonly assignedItemStore: AssignedItemStore;
    readonly filterText?: string;
    readonly onAssignItems: (items: string[]) => Promise<void>;
    readonly onRemoveItems: (items: string[]) => Promise<void>;
    readonly onMoveItems?: (items: string[]) => void;
    readonly onOrderChanged?: (items: string[]) => void;
    readonly height?: number;
    readonly showOptionsTooltip?: boolean;
}

class GroupEditorWithOrdering extends Component<GroupEditorWithOrderingProps> {
    static defaultProps = {
        onOrderChanged: () => {},
    };

    groupEditor!: GroupEditor;

    setRef = (r: GroupEditor): void => {
        this.groupEditor = r;
    };

    moveUp = (): void => {
        if (!Array.isArray(this.props.assignedItemStore.getState())) {
            log.warn(
                "Moving in <GroupEditorWithOrdering /> is not supported (yet) when the assignedItemStore's state is a ModelCollectionProperty"
            );
            return;
        }

        const currentlySelected = Array.from(this.props.assignedItemStore.getState()) as string[];
        const itemsToMoveUp = this.groupEditor.getSelectedItems();

        itemsToMoveUp.forEach(moveItemOneSpotUpIn(currentlySelected));

        // Emit the changed order to the event handler
        if (this.props.onOrderChanged) this.props.onOrderChanged(currentlySelected);
    };

    moveDown = (): void => {
        if (!Array.isArray(this.props.assignedItemStore.getState())) {
            log.warn(
                "Moving in <GroupEditorWithOrdering /> is not supported (yet) when the assignedItemStore's state is a ModelCollectionProperty"
            );
            return;
        }

        const currentlySelected = Array.from(this.props.assignedItemStore.getState()) as string[];
        const itemsToMoveDown = this.groupEditor.getSelectedItems();

        itemsToMoveDown
            .reverse() // Reverse the list to move the items lower in the list first
            .forEach(moveItemOneSpotDownIn(currentlySelected));

        // Emit the changed order to the event handler
        if (this.props.onOrderChanged) this.props.onOrderChanged(currentlySelected);
    };

    render(): React.ReactNode {
        const other = _.omit(this.props, ["onOrderChanged"]);

        return (
            <div style={styles.wrapper}>
                <GroupEditor ref={this.setRef} {...other} />
                <div style={styles.arrowsDiv}>
                    <IconButton
                        data-test={"group-editor-move-up"}
                        style={styles.arrow}
                        title={i18n.t("Move up")}
                        onClick={this.moveUp}
                    >
                        <Icon>arrow_upward</Icon>
                    </IconButton>

                    <IconButton
                        data-test={"group-editor-move-down"}
                        style={styles.arrow}
                        title={i18n.t("Move down")}
                        onClick={this.moveDown}
                    >
                        <Icon>arrow_downward</Icon>
                    </IconButton>
                </div>
            </div>
        );
    }
}

export default GroupEditorWithOrdering;
