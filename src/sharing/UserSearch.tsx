import React, { Component } from "react";
import { createStyles, withStyles, WithStyles } from "@material-ui/core/styles";
import debounce from "lodash/debounce";
import i18n from "../utils/i18n";

import { AccessObject, accessObjectToString } from "./utils";
import PermissionPicker from "./PermissionPicker";
import AutoComplete from "./AutoComplete";
import { SearchResult } from "./types";

const styles = createStyles({
    container: {
        fontWeight: 400,
        padding: 16,
        backgroundColor: "#F5F5F5",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
    },

    innerContainer: {
        display: "flex",
        flexDirection: "row",
        flex: 1,
    },

    title: {
        color: "#818181",
        paddingBottom: 8,
    },
});

interface SearchResultItem {
    readonly id: string;
    readonly displayName: string;
    readonly type: string;
}

interface SharingRuleInput {
    readonly id: string;
    readonly displayName: string;
    readonly access: string;
}

interface UserSearchOwnProps {
    readonly onSearch: (searchText: string) => Promise<SearchResult>;
    readonly addUserAccess: (access: SharingRuleInput) => void;
    readonly addUserGroupAccess: (access: SharingRuleInput) => void;
    readonly dataShareable: boolean;
    readonly currentAccessIds: ReadonlyArray<string>;
    readonly showPermissionPicker: boolean;
}

type UserSearchProps = UserSearchOwnProps & WithStyles<typeof styles>;

interface UserSearchState {
    readonly defaultAccess: AccessObject;
    readonly searchResult: ReadonlyArray<SearchResultItem>;
    readonly searchText: string;
}

const searchDelay = 300;

class UserSearch extends Component<UserSearchProps, UserSearchState> {
    private readonly debouncedFetch: ReturnType<typeof debounce>;

    constructor(props: UserSearchProps) {
        super(props);
        this.debouncedFetch = debounce(this.fetchSearchResult, searchDelay);
    }

    state: UserSearchState = {
        defaultAccess: {
            meta: { canView: true, canEdit: true },
            data: { canView: false, canEdit: false },
        },
        searchResult: [],
        searchText: "",
    };

    componentWillUnmount() {
        this.debouncedFetch.cancel();
    }

    onItemSelected = (selected: { id: string; name: string } | null) => {
        if (!selected) return;

        this.debouncedFetch("");
        const selection = this.state.searchResult.find(r => r.id === selected.id);

        if (!selection) return;

        const accessString = accessObjectToString(this.state.defaultAccess);
        const sharingRule: SharingRuleInput = {
            id: selection.id,
            displayName: selection.displayName,
            access: accessString,
        };

        if (selection.type === "userAccess") {
            this.props.addUserAccess(sharingRule);
        } else {
            this.props.addUserGroupAccess(sharingRule);
        }
        this.clearSearchText();
    };

    hasNoCurrentAccess = (userOrGroup: { id: string }): boolean =>
        this.props.currentAccessIds.indexOf(userOrGroup.id) === -1;

    fetchSearchResult = (searchText: string) => {
        if (searchText === "") {
            this.handleSearchResult([]);
        } else {
            this.props.onSearch(searchText).then(({ users, userGroups }) => {
                const addType = (type: string) => (result: {
                    id: string;
                    displayName: string;
                }): SearchResultItem => ({
                    ...result,
                    type,
                });
                const searchResult = users
                    .map(addType("userAccess"))
                    .filter(this.hasNoCurrentAccess)
                    .concat(
                        userGroups.map(addType("userGroupAccess")).filter(this.hasNoCurrentAccess)
                    );

                this.handleSearchResult(searchResult);
            });
        }
    };

    handleSearchResult = (searchResult: ReadonlyArray<SearchResultItem>) => {
        this.setState({ searchResult });
    };

    onInputChanged = (searchText: string) => {
        this.debouncedFetch(searchText);
        this.setState({ searchText });
    };

    accessOptionsChanged = (accessOptions: AccessObject) => {
        this.setState({
            defaultAccess: accessOptions,
        });
    };

    clearSearchText = () => {
        this.setState({
            searchText: "",
        });
    };

    render() {
        const { classes, showPermissionPicker } = this.props;
        return (
            <div className={classes.container}>
                <div className={classes.title}>{i18n.t("Add users and user groups")}</div>
                <div className={classes.innerContainer}>
                    <AutoComplete
                        suggestions={this.state.searchResult as ReadonlyArray<SearchResultItem>}
                        placeholderText={i18n.t("Enter names")}
                        onItemSelected={this.onItemSelected}
                        onInputChanged={this.onInputChanged}
                        searchText={this.state.searchText}
                    />
                    {showPermissionPicker && (
                        <PermissionPicker
                            access={this.state.defaultAccess}
                            accessOptions={{
                                meta: {
                                    canView: true,
                                    canEdit: true,
                                    noAccess: false,
                                },
                                data: this.props.dataShareable && {
                                    canView: true,
                                    canEdit: true,
                                    noAccess: true,
                                },
                            }}
                            onChange={this.accessOptionsChanged}
                        />
                    )}
                </div>
            </div>
        );
    }
}

export default withStyles(styles)(UserSearch);
