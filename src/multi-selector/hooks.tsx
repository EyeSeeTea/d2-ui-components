import React from "react";
import _ from "lodash";
import i18n from "../locales";

import { MultiSelectorProps, OptionItem } from "./MultiSelector";

export const useMultiSelectorMethods = (props: MultiSelectorProps) => {
    const { onChange, options, searchFilterLabel, selected } = props;

    const [filterText, setFilterText] = React.useState("");
    const leftSelectReft = React.useRef<HTMLSelectElement>(null);
    const rigthSelectReft = React.useRef<HTMLSelectElement>(null);

    const uniqueOptions = React.useMemo(
        () =>
            _(options)
                .uniqBy(option => option.value)
                .value(),
        [options]
    );

    const [optionItems, setOptionItems] = React.useState<OptionItem>(() => {
        return {
            leftItems: uniqueOptions,
            rightItems: uniqueOptions.filter(option => selected.includes(option.value)),
            rightSelected: [],
            leftSelected: [],
        };
    });

    React.useEffect(() => {
        setOptionItems(prev => ({
            ...prev,
            rightItems: uniqueOptions.filter(option => selected.includes(option.value)),
        }));
    }, [selected, uniqueOptions]);

    const textFilterChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setFilterText(event.target.value);
    };

    const rightItemsValues = optionItems.rightItems.map(item => item.value);

    const filteredLeft = _(uniqueOptions)
        .filter(option => option.text.toLowerCase().includes(filterText.toLowerCase()))
        .reject(option => rightItemsValues.includes(option.value))
        .value();

    const filteredRight = optionItems.rightItems.filter(option =>
        option.text.toLowerCase().includes(filterText.toLowerCase())
    );

    const moveItemsToRight = () => {
        const newLeftItems = optionItems.leftItems.filter(
            item => !optionItems.leftSelected.includes(item)
        );
        const newRightItems = _(optionItems.rightItems.concat(optionItems.leftSelected))
            .uniqBy(item => item.value)
            .value();

        const newState: OptionItem = {
            ...optionItems,
            leftItems: newLeftItems,
            rightItems: newRightItems,
            leftSelected: [],
            rightSelected: [],
        };

        setOptionItems(newState);
        onChange(newRightItems.map(item => item.value));

        if (leftSelectReft.current) {
            leftSelectReft.current.selectedIndex = -1;
        }
    };

    const moveItemsToLeft = () => {
        const rightSelectedValues = optionItems.rightSelected.map(item => item.value);
        const newLeftItems = _(optionItems.leftItems.concat(optionItems.rightSelected))
            .uniqBy(item => item.value)
            .value();
        const newRightItems = _(optionItems.rightItems)
            .reject(item => rightSelectedValues.includes(item.value))
            .value();

        const newState: OptionItem = {
            ...optionItems,
            leftItems: newLeftItems,
            rightItems: newRightItems,
            leftSelected: [],
            rightSelected: [],
        };

        setOptionItems(newState);
        onChange(newRightItems.map(item => item.value));

        if (rigthSelectReft.current) {
            rigthSelectReft.current.selectedIndex = -1;
        }
    };

    const moveAllItems = (action: "assign" | "remove") => {
        const isAddingAll = action === "assign";

        const rightItems = isAddingAll
            ? _(filteredLeft.concat(optionItems.rightItems))
                  .uniqBy(item => item.value)
                  .value()
            : optionItems.rightItems.filter(item => !filteredRight.includes(item));

        const leftItems = isAddingAll
            ? []
            : _(filteredLeft.concat(optionItems.rightItems))
                  .uniqBy(item => item.value)
                  .value();

        const newState: OptionItem = {
            ...optionItems,
            leftItems: leftItems,
            rightItems: rightItems,
            leftSelected: [],
            rightSelected: [],
        };

        setOptionItems(newState);
        onChange(newState.rightItems.map(item => item.value));
    };

    const reorderSelectedItems = (direction: "up" | "down") => {
        if (optionItems.rightSelected.length === 0) return;

        const newRightItems = [...optionItems.rightItems];

        const selectedIndices = optionItems.rightSelected
            .map(selected => newRightItems.findIndex(item => item.value === selected.value))
            .filter(index => index !== -1);

        if (selectedIndices.length === 0) return;

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

        const newState: OptionItem = { ...optionItems, rightItems: newRightItems };
        setOptionItems(newState);
        onChange(newRightItems.map(item => item.value));
    };

    const onSelectionChange = (
        selectedValues: string[],
        side: "left" | "right",
        ref: React.RefObject<HTMLSelectElement>
    ) => {
        const selectedOptions = uniqueOptions.filter(option =>
            selectedValues.includes(option.value)
        );

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
        const item = uniqueOptions.find(option => option.value === value);
        if (!item) return;

        const newState: OptionItem = {
            ...optionItems,
            rightItems:
                side === "right"
                    ? optionItems.rightItems.filter(item => item.value !== value)
                    : optionItems.rightItems.concat(item),
            leftItems:
                side === "right"
                    ? optionItems.leftItems.concat(item)
                    : optionItems.leftItems.filter(item => item.value !== value),
            rightSelected: [],
            leftSelected: [],
        };

        setOptionItems(newState);
        onChange(newState.rightItems.map(item => item.value));
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
