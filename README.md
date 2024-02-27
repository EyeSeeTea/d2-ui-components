# Components

## Dialog Button

A button that opens a modal info dialog when clicked.

```
import { Icon, IconButton } from "@material-ui/core";
import { DialogButton } from "@eyeseetea/d2-ui-components";

const MyDialogHandler = () => (
    <DialogButton
        title="Help"
        contents="This is some help message"
        buttonComponent={
            ({ onClick }) => (
                <IconButton tooltip="Help" onClick={onClick}>
                    <Icon color="primary">help</Icon>
                </IconButton>
            )
        }
    />
);
```

## Confirmation Dialog

A wrapper that creates all the logic needed to build a modal dialog.

```
import { ConfirmationDialog } from "@eyeseetea/d2-ui-components";

const MyDialog = () => (
    <ConfirmationDialog
        isOpen={this.dialogOpen}
        onSave={this.handleDialogConfirm}
        onCancel={this.handleDialogCancel}
        title={"Delete Instance?"}
        description={"Are you sure you want to delete this instance?"}
        saveText={"Ok"}
    />
);
```

## Date Picker

```
import { DatePicker } from "@eyeseetea/d2-ui-components";

const MyDatePicker = () => (
    <DatePicker
        label="Label of the TextInput component"
        value={new Date("2019/01/30")}
        onChange={newValue => console.log(newValue)}
    />
);
```

## Multiple Selector

```
import { MultipleSelector } from "@eyeseetea/d2-ui-components";

const MyMultipleSelector = () => (
    <MultiSelector
        d2={d2}
        height={300}
        onChange={values => console.log("New selected values", values)}
        options={[{text: "Option 1", value: "id1"}, {text: "Option 2", value: "id2"}]}
        selected={["id1"]}
        ordered={true}
    />
);
```

## Simple checkbox

Visually similar to material-ui checkbox but much lighter, useful when you have lots of checks in a page.

```
import { SimpleCheckBox } from "@eyeseetea/d2-ui-components";

const MySimpleCheckBox = () => (
    <SimpleCheckBox
        checked={true}
        onClick={values => console.log("Checkbox was clicked")}
    />
);
```

## Organisation Units selector

```
import { OrgUnitsSelector }  from "@eyeseetea/d2-ui-components";

const MyOrgUnitsSelector = () => (
    <OrgUnitsSelector
        api={api}
        onChange={orgUnitsPaths => console.log("Selected orgUnitPaths", orgUnitsPaths)}
        selected={["/ImspTQPwCqd/O6uvpzGd5pu", "/ImspTQPwCqd/PMa2VCrupOd"]}
        levels={[1, 2]}
        rootIds={["ImspTQPwCqd"]}
        listParams={{ maxLevel: 4 }}
        withElevation={false}
        typeInput="radio"
        selectableLevels=[1,3] // the biggest selectableLevel has not children in OrgUnitTree
        controls={filterByLevel: false, filterByGroup: true, selectAll: true)
    />
);
```

# Snackbar feedback

There should be a unique snackbar for the whole app, so we need to insert a single provider in the main component:

```
import { SnackbarProvider }  from "@eyeseetea/d2-ui-components";

const MyAppWithSnackbar = (
    <SnackbarProvider>
        <MyApp />
    </SnackbarProvider>
);
```

To use it, create a HOC with `withSnackbar`, add `snackbar` to your propTypes, and show messages using the functions `props.snackbar[.level]`. Levels supported: _success_, _error_, _info_, _warning_.

```
import { withSnackbar } from "@eyeseetea/d2-ui-components";
import PropTypes from "prop-types";

const MyComponent = ({name, snackbar}) => (
    <div>
        <a onClick={() => snackbar.success(name)}>Success</a>
        <a onClick={() => snackbar.error(name)}>Error</a>
        <a onClick={() => snackbar.info(name)}>Info</a>
        <a onClick={() => snackbar.warning(name)}>Warning</a>
    </div>
);

MyComponent.propTypes = {
    name: PropTypes.object.isRequired,
    snackbar: PropTypes.object.isRequired,
}

export default withSnackbar(MyComponent);
```

# Loading Mask

There should be a unique loading mask for the whole app, so we need to insert a single provider in the main component:

```
import { LoadingProvider }  from "@eyeseetea/d2-ui-components";

const MyAppWithLoadingMask = (
    <LoadingProvider>
        <MyApp />
    </LoadingProvider>
);
```

To use it, create a HOC with `withLoading`, add `loading` to your propTypes, and show the mask using the functions `props.loading.show()`.

```
import { withLoading } from "@eyeseetea/d2-ui-components";
import PropTypes from "prop-types";

const MyComponent = ({name, loading}) => (
    <div>
        <a onClick={() => loading.show()}>Show loading mask</a>
        <a onClick={() => loading.show(false)}>Hide loading mask</a>
        <a onClick={() => loading.hide()}>Also hides loading mask</a>
        <a onClick={() => loading.show(true, 'Message', 35)}>Show loading mask with extra information</a>
        <a onClick={() => loading.updateMessage('String')}>Update message</a>
        <a onClick={() => loading.updateProgress(98)}>Update progress</a>
        <a onClick={() => loading.reset()}>Hide and clear message/progress</a>
    </div>
);

MyComponent.propTypes = {
    name: PropTypes.object.isRequired,
    loading: PropTypes.object.isRequired,
}

export default withLoading(MyComponent);
```

## Objects table

Display D2 objects in a table with:

-   Sortable columns.
-   Filters: By default, it shows a search bar to filter by name, custom filters can be added.
-   Details sidebar.
-   Configurable context actions.
-   Pagination.
-   _Create_ button action.

Whenever you want to update the objects table, pass a different `key` prop (i.e `new Date()`), as you would do with any other React component.

The visibility of the float action button depends on the onButtonClick prop. If a function is defined it will be visible, otherwise, if the prop is undefined it will be hidden.

```
const columns = [
    { name: "displayName", text: i18n.t("Name"), sortable: true },
    { name: "publicAccess", text: i18n.t("Public access"), sortable: true },
    { name: "lastUpdated", text: i18n.t("Last updated"), sortable: true },
];

const detailsFields = [
    { name: "displayName", text: i18n.t("Name") },
    { name: "code", text: i18n.t("Code") },
    { name: "href", text: i18n.t("API link") },
];

const actions = [
    {
        name: "details",
        text: i18n.t("Details"),
        multiple: false,
        type: "details",
    },
    {
        name: "delete",
        text: i18n.t("Delete"),
        multiple: true,
    },
];

const CustomFilters = (
    <Checkbox ... />
);

const MyObjectsTable = () => (
    <ObjectsTable
        d2={d2}
        model={d2.models.dataSet}
        columns={columns}
        detailsFields={detailsFields}
        pageSize={20}
        initialSorting={["displayName", "asc"]}
        actions={actions}
        onButtonClick={() => console.log("Floating button clicked")}
        buttonLabel={someString || <SomeComponent >}
        list={list} // list(d2, filters, pagination) -> {pager, objects}
        customFiltersComponent={CustomFilters}
        customFilters={{key1: "value1", key2: "value2}}
        onSelectionChange={objectIds => console.log(objectIds)}
        hideSearchBox={false}
    />
);
```

## Wizard

Display a Step by Step customizable wizard

```
const getStepsBaseInfo = [
    {
        key: "general-info",
        label: "General info",
        component: GeneralInfoStep,
        validationKeys: ["name"],
        description: "Description for a wizard step",
        help: "Help text",
    },
    {
        key: "summary",
        label: "Summary",
        component: SaveStep,
        validationKeys: [],
        description: undefined,
        help: undefined,
    },
];

onStepChangeRequest = async currentStep => {
    return getValidationMessages(
        currentStep.validationKeys
    );
};

const MyWizard = props => {
    const steps = getStepsBaseInfo.map(step => ({
        ...step,
        props: {
            onCancel: () => console.log("User wants to cancel the wizard!"),
        },
    }));

    const urlHash = props.location.hash.slice(1);
    const stepExists = steps.find(step => step.key === urlHash);
    const firstStepKey = steps.map(step => step.key)[0];
    const initialStepKey = stepExists ? urlHash : firstStepKey;
    const lastClickableStepIndex = props.isEdit ? steps.length - 1 : 0;

    return (
        <Wizard
            useSnackFeedback={true}
            onStepChangeRequest={onStepChangeRequest}
            initialStepKey={initialStepKey}
            lastClickableStepIndex={lastClickableStepIndex}
            steps={steps}
        />
    );
};
```

# Sharing

```
import React from "react";
import { D2Api } from "d2-api";
import { Sharing, MetaObject } from "@eyeseetea/d2-ui-components";

const initialSharedObject: MetaObject = {
    meta: {
        allowPublicAccess: true,
        allowExternalAccess: true,
    },
    object: {
        id: "uKLXQPfYBQB",
        displayName: "My data set",
        user: { id: "M5zQapPyTZI", name: "Tom Waikiki" },
        publicAccess: "rwrw----",
        externalAccess: false,
        userAccesses: [{ id: "G1zcewaT5b", displayName: "John Traore", access: "rwrw----" }],
    },
};

const showOptions = {
    dataSharing: true,
    publicSharing: true,
    externalSharing: true,
    permissionPicker: true,
};

function searchUsers(api: D2Api, query: string) {
    const options = {
        fields: { id: true, displayName: true },
        filter: { displayName: { ilike: query } },
    };
    return api.metadata.get({ users: options, userGroups: options }).getData();
}

const MySharingComponent: React.FC<{api: D2Api}> = ({ api }) => {
    const [sharedObject, setSharedObject] = React.useState(initialSharedObject);
    const search = React.useCallback((query: string) => searchUsers(api, query), [api]);

    return (
        <Sharing
            meta={sharedObject}
            showOptions={showOptions}
            onSearch={search}
            onChange={(newSharing, onSuccess) => {
                setSharedObject({
                    ...sharedObject,
                    object: { ...sharedObject.object, ...newSharing },
                });
                if (onSuccess) onSuccess();
            }}
        />
    );
};
```

# Setup

```
$ yarn install
```

Run tests, linter and prettier:

```
$ yarn code-quality
```

To publish a new package to npmjs:

```
$ yarn build
```

Then run for alpha channel:

```
$ yarn publish build/ --new-version VERSION
```

or the following command for the beta channel:

```
$ yarn publish build/ --tag beta --new-version VERSION
```

## i18n

-   Import i18n from utils module (`import i18n from "../utils/i18n";`) then use it: `i18n.t("Some literal")`. This uses `@dhis2/i18n` infrastructure with namespace `d2-ui-components`.

-   Do not call `i18n.t("Some literal")` on module or class level, only within functions. At that point, the locale is not yet selected, and you'll get always the default English translations.

### Update an existing language

```
$ yarn update-po
# ... add/edit translations in po files ...
$ yarn localize
```

### Create a new language

```
$ cp i18n/en.pot i18n/es.po
# ... add translations to i18n/es.po ...
$ yarn localize
```

### Development

In d2-ui-components, only the first time:

```
$ yarn build
$ (cd build && yarn link)
```

When starting development:

```
$ yarn build-watch
```

In the main React application:

```
$ yarn link "@eyeseetea/d2-ui-components"
```
