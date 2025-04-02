import React from "react";
import {
    Button,
    IconButton,
    Paper,
    TextField,
    makeStyles,
    deprecatedPropType,
} from "@material-ui/core";
import { SelectMultiple } from "./SelectMultiple";
import ArrowUpward from "@material-ui/icons/ArrowUpward";
import ArrowDownward from "@material-ui/icons/ArrowDownward";
import i18n from "../locales";
import { useMultiSelectorMethods } from "./hooks";

type Item = { text: string; value: string };

export type OptionItem = {
    leftItems: Item[];
    rightItems: Item[];
    rightSelected: Item[];
    leftSelected: Item[];
};

export type MultiSelectorProps = {
    ordered?: boolean;
    options: Item[];
    searchFilterLabel?: string;
    selected: string[];
    onChange: (selected: string[]) => void;
    classes?: {
        wrapper: string;
        searchField: string;
    };
    // keeping d2 for backward compatibility
    // but not used in the component
    // we should remove it in a major version
    d2?: object;
    height?: number;
};

export const MultiSelector_ = (props: MultiSelectorProps) => {
    const { classes, ordered, height = 300, searchFilterLabel, onChange } = props;

    const componentClasses = useStyles();

    const {
        filterText,
        textFilterChange,
        leftSelectReft,
        rigthSelectReft,
        optionItems,
        setOptionItems,
        thereAreItemsInLeft,
        thereAreItemsInRight,
        filteredLeft,
        filteredRight,
        totalSelected,
        moveItemsToRight,
        moveItemsToLeft,
        onSelectionChange,
        updateItemsOnDoubleClick,
        moveAllItems,
        reorderSelectedItems,
    } = useMultiSelectorMethods(props);

    const placeholderText = searchFilterLabel
        ? searchFilterLabel
        : "Search available/selected items";

    React.useEffect(() => {
        onChange(optionItems.rightItems.map(item => item.value));
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [optionItems]);

    const showReOrderButtons = ordered && thereAreItemsInRight;

    return (
        <div className={classes?.wrapper} data-multi-selector={true}>
            {searchFilterLabel && (
                <TextField
                    type="search"
                    className={classes?.searchField}
                    value={filterText}
                    onChange={textFilterChange}
                    placeholder={placeholderText}
                    data-test="search"
                    fullWidth
                />
            )}
            <div>
                <div
                    className={componentClasses.multiSelectorContainer}
                    style={{ minHeight: `${height}px` }}
                >
                    <div className={componentClasses.left}>
                        <Paper className={componentClasses.paper}>
                            <SelectMultiple
                                height={height}
                                ordered={ordered}
                                items={filteredLeft}
                                refSelect={leftSelectReft}
                                onSelectionChange={selectedValues =>
                                    onSelectionChange(selectedValues, "left", rigthSelectReft)
                                }
                                onDoubleClick={value => updateItemsOnDoubleClick(value, "left")}
                            />
                        </Paper>
                    </div>
                    <MiddleButtons
                        totalSelected={totalSelected}
                        disableRight={!thereAreItemsInLeft || optionItems.leftSelected.length === 0}
                        onRight={moveItemsToRight}
                        disableLeft={
                            !thereAreItemsInRight || optionItems.rightSelected.length === 0
                        }
                        onLeft={moveItemsToLeft}
                        classNameContainer={componentClasses.middle}
                        classNameLabel={componentClasses.selectedText}
                    />
                    <div className={componentClasses.right}>
                        <div className={componentClasses.rightContainer}>
                            <Paper>
                                <SelectMultiple
                                    height={height}
                                    refSelect={rigthSelectReft}
                                    items={filteredRight}
                                    onSelectionChange={selectedValues =>
                                        onSelectionChange(selectedValues, "right", leftSelectReft)
                                    }
                                    onDoubleClick={value =>
                                        updateItemsOnDoubleClick(value, "right")
                                    }
                                />
                            </Paper>
                        </div>
                        {showReOrderButtons && (
                            <div className={componentClasses.orderButtons}>
                                <IconButton
                                    disabled={!thereAreItemsInRight}
                                    onClick={() => reorderSelectedItems("up")}
                                >
                                    <ArrowUpward />
                                </IconButton>
                                <IconButton
                                    disabled={!thereAreItemsInRight}
                                    onClick={() => reorderSelectedItems("down")}
                                >
                                    <ArrowDownward />
                                </IconButton>
                            </div>
                        )}
                    </div>
                </div>
                <div className={componentClasses.buttonsContainer}>
                    <div>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!thereAreItemsInLeft}
                            onClick={() => setOptionItems(prev => moveAllItems("assign", prev))}
                        >
                            {i18n.t("Assign All")} {thereAreItemsInLeft ? filteredLeft.length : ""}{" "}
                            →
                        </Button>
                    </div>

                    <div style={{ paddingInlineEnd: showReOrderButtons ? "3em" : "0" }}>
                        <Button
                            variant="contained"
                            color="primary"
                            disabled={!thereAreItemsInRight}
                            onClick={() => setOptionItems(prev => moveAllItems("remove", prev))}
                        >
                            {i18n.t("Remove All")}{" "}
                            {thereAreItemsInRight ? filteredRight.length : ""} ←
                        </Button>
                    </div>
                </div>
            </div>
        </div>
    );
};

type MiddleButtonsProps = {
    totalSelected: number;
    disableRight: boolean;
    disableLeft: boolean;
    onRight: () => void;
    onLeft: () => void;
    classNameContainer: string;
    classNameLabel: string;
};

const MiddleButtons = (props: MiddleButtonsProps) => {
    const {
        classNameContainer,
        classNameLabel,
        disableLeft,
        disableRight,
        onLeft,
        onRight,
        totalSelected,
    } = props;
    return (
        <div className={classNameContainer}>
            {totalSelected > 0 && (
                <span className={classNameLabel}>
                    {totalSelected} {i18n.t("selected")}
                </span>
            )}
            <Button disabled={disableRight} variant="contained" color="primary" onClick={onRight}>
                →
            </Button>
            <Button disabled={disableLeft} variant="contained" color="primary" onClick={onLeft}>
                ←
            </Button>
        </div>
    );
};

const useStyles = makeStyles({
    multiSelectorContainer: {
        display: "flex",
        flexDirection: "row",
        paddingBlock: "1em",
    },
    left: {
        display: "flex",
        flex: "1 0 120px",
        flexDirection: "column",
        gap: "1em",
    },
    right: {
        display: "flex",
        flex: "1 0 120px",
    },
    orderButtons: {
        alignSelf: "center",
        display: "flex",
        flexDirection: "column",
    },
    rightContainer: {
        display: "flex",
        flexDirection: "column",
        gap: "1em",
        width: "100%",
    },
    middle: {
        alignSelf: "center",
        display: "flex",
        flex: "0 0 120px",
        flexDirection: "column",
        gap: "1em",
        paddingInline: "1em",
        boxSizing: "border-box",
    },
    selectedText: {
        fontSize: "0.8em",
        fontFamily: "Roboto",
        textAlign: "center",
    },
    buttonsContainer: {
        display: "flex",
        justifyContent: "space-between",
    },
    paper: {
        height: "100%",
    },
});

export default MultiSelector_;
