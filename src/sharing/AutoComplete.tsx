import React, { Component } from "react";
import Downshift from "downshift";
import { withStyles, WithStyles } from "@material-ui/core/styles";
import TextField from "@material-ui/core/TextField";
import Paper from "@material-ui/core/Paper";
import MenuItem from "@material-ui/core/MenuItem";
import Popper from "@material-ui/core/Popper";
import PersonIcon from "@material-ui/icons/Person";
import GroupIcon from "@material-ui/icons/Group";

interface SuggestionItem {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
}

interface SelectedItem {
    readonly id: string;
    readonly name: string;
}

interface InputComponentProps {
    readonly InputProps: object;
}

const Input: React.FC<InputComponentProps> = ({ InputProps }) => {
    return <TextField id="user-search-input" fullWidth InputProps={{ ...InputProps }} />;
};

interface SuggestionProps {
    readonly suggestion: SuggestionItem;
    readonly itemProps: Record<string, unknown>;
    readonly isHighlighted: boolean;
    readonly selectedItem: SelectedItem | null;
}

const Suggestion: React.FC<SuggestionProps> = ({
    suggestion,
    itemProps,
    isHighlighted,
    selectedItem,
}) => {
    const isSelected = selectedItem !== null && selectedItem.id === suggestion.id;

    return (
        <MenuItem
            {...itemProps}
            key={suggestion.displayName}
            selected={isHighlighted}
            component="div"
            style={{
                fontWeight: isSelected ? 500 : 400,
            }}
        >
            <span style={{ marginRight: 10 }}>
                {suggestion.type === "userGroupAccess" ? <GroupIcon /> : <PersonIcon />}
            </span>
            {suggestion.displayName}
        </MenuItem>
    );
};

const styles = () => ({
    root: {
        flexGrow: 1,
        height: 60,
    },
    popper: {
        zIndex: 2000,
        maxHeight: "420px",
        overflowY: "hidden" as const,
        boxShadow: "0px 0px 1px 1px rgba(0,0,0,0.2)",
    },
    container: {
        flexGrow: 1,
        position: "relative" as const,
    },
    inputRoot: {
        flexWrap: "wrap" as const,
    },
});

let popperNode: HTMLElement | null = null;

interface AutoCompleteOwnProps {
    readonly placeholderText?: string;
    readonly onInputChanged: (value: string) => void;
    readonly onItemSelected: (item: SelectedItem | null) => void;
    readonly suggestions: ReadonlyArray<SuggestionItem>;
    readonly searchText: string;
}

type AutoCompleteProps = AutoCompleteOwnProps & WithStyles<typeof styles>;

class AutoComplete extends Component<AutoCompleteProps> {
    static defaultProps = {
        placeholderText: "",
    };

    render() {
        const { classes, placeholderText, suggestions, searchText } = this.props;

        return (
            <div className={classes.root}>
                <Downshift
                    id="user-autocomplete"
                    onInputValueChange={this.props.onInputChanged}
                    onChange={this.props.onItemSelected}
                    itemToString={(item: SelectedItem | null) => (item ? item.name : "")}
                    inputValue={searchText}
                >
                    {({
                        getInputProps,
                        getItemProps,
                        getMenuProps,
                        highlightedIndex,
                        isOpen,
                        selectedItem,
                    }) => {
                        return (
                            <div className={classes.container}>
                                <Input
                                    InputProps={getInputProps({
                                        placeholder: placeholderText,
                                        inputRef: (node: HTMLElement | null) => {
                                            popperNode = node;
                                        },
                                    })}
                                />
                                <div {...getMenuProps()}>
                                    {isOpen && (
                                        <Popper
                                            className={classes.popper}
                                            open
                                            anchorEl={popperNode}
                                        >
                                            <Paper
                                                elevation={2}
                                                square
                                                style={{
                                                    width: popperNode
                                                        ? popperNode.clientWidth
                                                        : undefined,
                                                }}
                                            >
                                                {suggestions.map((suggestion, index) => {
                                                    return (
                                                        <Suggestion
                                                            key={suggestion.id}
                                                            suggestion={suggestion}
                                                            itemProps={getItemProps({
                                                                item: {
                                                                    name: suggestion.displayName,
                                                                    id: suggestion.id,
                                                                },
                                                            })}
                                                            isHighlighted={
                                                                highlightedIndex === index
                                                            }
                                                            selectedItem={
                                                                selectedItem as SelectedItem | null
                                                            }
                                                        />
                                                    );
                                                })}
                                            </Paper>
                                        </Popper>
                                    )}
                                </div>
                            </div>
                        );
                    }}
                </Downshift>
            </div>
        );
    }
}

export default withStyles(styles)(AutoComplete);
