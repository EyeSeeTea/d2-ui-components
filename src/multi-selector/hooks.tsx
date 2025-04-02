import React from "react";
import _ from "lodash";

import { MultiSelectorProps, OptionItem } from "./MultiSelector";
import i18n from "../locales";

export const useMultiSelectorMethods = (props: MultiSelectorProps) => {
    const { options, searchFilterLabel, selected } = props;

    const [filterText, setFilterText] = React.useState("");
    const leftSelectReft = React.useRef<HTMLSelectElement>(null);
    const rigthSelectReft = React.useRef<HTMLSelectElement>(null);

    const [optionItems, setOptionItems] = React.useState<OptionItem>({
        leftItems: options,
        rightItems: options.filter(option => selected.includes(option.value)),
        rightSelected: [],
        leftSelected: [],
    });

    const textFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(event.target.value);
    };

    const rightItemsValues = optionItems.rightItems.map(item => item.value);

    const filteredLeft = _(options)
        .filter(option => option.text.toLowerCase().includes(filterText.toLowerCase()))
        .reject(option => rightItemsValues.includes(option.value))
        .value();

    const filteredRight = optionItems.rightItems.filter(option =>
        option.text.toLowerCase().includes(filterText.toLowerCase())
    );

    const moveItemsToRight = () => {
        setOptionItems(prev => {
            const newLeftItems = prev.leftItems.filter(item => !prev.leftSelected.includes(item));
            const newRightItems = prev.rightItems.concat(prev.leftSelected);
            return {
                ...prev,
                leftItems: newLeftItems,
                rightSelected: [],
                leftSelected: [],
                rightItems: _(newRightItems)
                    .uniqBy(item => item.value)
                    .value(),
            };
        });
        if (leftSelectReft.current) {
            leftSelectReft.current.selectedIndex = -1;
        }
    };

    const moveItemsToLeft = () => {
        setOptionItems(prev => {
            const rightSelectedValues = prev.rightSelected.map(item => item.value);
            const newLeftItems = prev.leftItems.concat(prev.rightSelected);
            const newRightItems = _(prev.rightItems)
                .reject(item => rightSelectedValues.includes(item.value))
                .value();

            return {
                ...prev,
                leftItems: _(newLeftItems)
                    .uniqBy(item => item.value)
                    .value(),
                rightSelected: [],
                leftSelected: [],
                rightItems: newRightItems,
            };
        });
        if (rigthSelectReft.current) {
            rigthSelectReft.current.selectedIndex = -1;
        }
    };

    const moveAllItems = (action: "assign" | "remove", optionItem: OptionItem) => {
        const isAddingAll = action === "assign";
        return {
            ...optionItem,
            leftItems: isAddingAll
                ? []
                : _(optionItem.leftItems.concat(filteredRight))
                      .uniqBy(item => item.value)
                      .value(),
            rightSelected: [],
            leftSelected: [],
            rightItems: isAddingAll
                ? _(filteredLeft.concat(optionItem.rightItems))
                      .uniqBy(item => item.value)
                      .value()
                : optionItem.rightItems.filter(item => !filteredRight.includes(item)),
        };
    };

    const reorderSelectedItems = (direction: "up" | "down") => {
        setOptionItems(prev => {
            if (prev.rightSelected.length === 0) return prev;

            const newRightItems = [...prev.rightItems];

            const selectedIndices = prev.rightSelected
                .map(selected => newRightItems.findIndex(item => item.value === selected.value))
                .filter(index => index !== -1);

            if (selectedIndices.length === 0) return prev;

            const sortedIndices =
                direction === "up"
                    ? [...selectedIndices].sort((a, b) => a - b)
                    : [...selectedIndices].sort((a, b) => b - a);

            // TODO: avoid mutating newRightItems
            sortedIndices.forEach(index => {
                const newIndex = direction === "up" ? index - 1 : index + 1;
                if (newIndex >= 0 && newIndex < newRightItems.length) {
                    const currentItem = newRightItems[index];
                    const targetItem = newRightItems[newIndex];

                    if (currentItem && targetItem) {
                        newRightItems[index] = targetItem;
                        newRightItems[newIndex] = currentItem;
                    }
                }
            });

            return { ...prev, rightItems: newRightItems };
        });
    };

    const onSelectionChange = (
        selectedValues: string[],
        side: "left" | "right",
        ref: React.RefObject<HTMLSelectElement>
    ) => {
        const selectedOptions = options.filter(option => selectedValues.includes(option.value));

        setOptionItems(prev => {
            return {
                ...prev,
                leftSelected: side === "right" ? [] : selectedOptions,
                rightSelected: side === "right" ? selectedOptions : [],
            };
        });

        if (ref.current) {
            ref.current.selectedIndex = -1;
        }
    };

    const updateItemsOnDoubleClick = (value: string, side: "left" | "right") => {
        const item = options.find(option => option.value === value);
        if (!item) return;

        setOptionItems(prev => {
            return {
                ...prev,
                rightItems:
                    side === "right"
                        ? prev.rightItems.filter(item => item.value !== value)
                        : prev.rightItems.concat(item),
                leftItems:
                    side === "right"
                        ? prev.leftItems.concat(item)
                        : prev.leftItems.filter(item => item.value !== value),
                rightSelected: [],
                leftSelected: [],
            };
        });
    };

    const thereAreItemsInLeft = filteredLeft.length > 0;
    const thereAreItemsInRight = filteredRight.length > 0;

    const totalSelected = optionItems.rightSelected.length + optionItems.leftSelected.length;

    return {
        filteredLeft,
        filteredRight,
        filterText,
        leftSelectReft,
        rigthSelectReft,
        textFilterChange,
        moveItemsToRight,
        moveItemsToLeft,
        moveAllItems,
        reorderSelectedItems,
        onSelectionChange,
        updateItemsOnDoubleClick,
        thereAreItemsInLeft,
        thereAreItemsInRight,
        totalSelected,
        searchFilterLabel: searchFilterLabel || i18n.t("Search"),
        optionItems,
        setOptionItems,
    };
};
