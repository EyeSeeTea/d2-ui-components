import React, { Component } from "react";
import PropTypes from "prop-types";
import { withStyles } from "@material-ui/core/styles";
import debounce from "lodash/debounce";
import i18n from "../utils/i18n";

import { accessObjectToString } from "./utils";
import PermissionPicker from "./PermissionPicker";
import AutoComplete from "./AutoComplete";

const styles = {
    container: {
        fontWeight: "400",
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
};

const searchDelay = 300;

class UserSearch extends Component {
    constructor(props) {
        super(props);
        this.debouncedFetch = debounce(this.fetchSearchResult, searchDelay);
    }

    state = {
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

    onItemSelected = selected => {
        this.debouncedFetch("");
        const selection = this.state.searchResult.find(r => r.id === selected.id);

        const type = selection.type;
        delete selection.type;

        if (type === "userAccess") {
            this.props.addUserAccess({
                ...selection,
                access: accessObjectToString(this.state.defaultAccess),
            });
        } else {
            this.props.addUserGroupAccess({
                ...selection,
                access: accessObjectToString(this.state.defaultAccess),
            });
        }
        this.clearSearchText();
    };

    hasNoCurrentAccess = userOrGroup => this.props.currentAccessIds.indexOf(userOrGroup.id) === -1;

    fetchSearchResult = searchText => {
        if (searchText === "") {
            this.handleSearchResult([]);
        } else {
            this.props.onSearch(searchText).then(({ users, userGroups }) => {
                const addType = type => result => ({ ...result, type });
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

    handleSearchResult = searchResult => {
        this.setState({ searchResult });
    };

    onInputChanged = searchText => {
        this.debouncedFetch(searchText);
        this.setState({ searchText });
    };

    accessOptionsChanged = accessOptions => {
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
                        suggestions={this.state.searchResult}
                        placeholderText={i18n.t("Enter names")}
                        onItemSelected={this.onItemSelected}
                        onInputChanged={this.onInputChanged}
                        searchText={this.state.searchText}
                        classes={{}}
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

UserSearch.propTypes = {
    onSearch: PropTypes.func.isRequired,
    addUserAccess: PropTypes.func.isRequired,
    dataShareable: PropTypes.bool.isRequired,
    addUserGroupAccess: PropTypes.func.isRequired,
    currentAccessIds: PropTypes.array.isRequired,
    showPermissionPicker: PropTypes.bool.isRequired,
};

export default withStyles(styles)(UserSearch);
