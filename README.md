# Components

## Dialog Button

A button that opens a modal info dialog when clicked.

```
import { Icon, IconButton } from "@material-ui/core";
import { DialogButton } from "d2-ui-components";

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
import { ConfirmationDialog } from "d2-ui-components";

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
import { DatePicker } from "d2-ui-components";

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
import { MultipleSelector } from "d2-ui-components";

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
import { SimpleCheckBox } from "d2-ui-components";

const MySimpleCheckBox = () => (
    <SimpleCheckBox
        checked={true}
        onClick={values => console.log("Checkbox was clicked")}
    />
);
```

## Organisation Units selector

```
import { OrgUnitsSelector }  from "d2-ui-components";

const MyOrgUnitsSelector = () => (
    <OrgUnitsSelector
        d2={d2}
        onChange={orgUnitsPaths => console.log("Selected orgUnitPaths", orgUnitsPaths)}
        selected={["/ImspTQPwCqd/O6uvpzGd5pu", "/ImspTQPwCqd/PMa2VCrupOd"]}
        levels={[1, 2]}
        rootIds={["ImspTQPwCqd"]}
        listParams={{ maxLevel: 4 }}
        withElevation={false}
        typeInput="radio"
        selectableLevels=[1,3] // the biggest selectableLevel has not children in OrgUnitTree
    />
);
```

# Snackbar feedback

There should be a unique snackbar for the whole app, so we need to insert a single provider in the main component:

```
import { SnackbarProvider }  from "d2-ui-components";

const MyAppWithSnackbar = (
    <SnackbarProvider>
        <MyApp />
    </SnackbarProvider>
);
```

To use it, create a HOC with `withSnackbar`, add `snackbar` to your propTypes, and show messages using the functions `props.snackbar[.level]`. Levels supported: _success_, _error_, _info_, _warning_.

```
import { withSnackbar } from "d2-ui-components";
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
import { LoadingProvider }  from "d2-ui-components";

const MyAppWithLoadingMask = (
    <LoadingProvider>
        <MyApp />
    </LoadingProvider>
);
```

To use it, create a HOC with `withLoading`, add `loading` to your propTypes, and show the mask using the functions `props.loading.show()`.

```
import { withLoading } from "d2-ui-components";
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
$ yarn build && yarn publish build/
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

### Local development with applications

In d2-ui-components:

```
yarn build-babel --watch
```
```
node_modules/.bin/watch 'cp -av build/* ../path-to-application/node_modules/d2-ui-components/' build/
```

In the application:

<details>
  <summary>./node_modules/react-scripts/config/webpackDevServer.config.js</summary>
    
```
// @remove-on-eject-begin
/**
 * Copyright (c) 2015-present, Facebook, Inc.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 */
// @remove-on-eject-end
'use strict';

const errorOverlayMiddleware = require('react-dev-utils/errorOverlayMiddleware');
const evalSourceMapMiddleware = require('react-dev-utils/evalSourceMapMiddleware');
const noopServiceWorkerMiddleware = require('react-dev-utils/noopServiceWorkerMiddleware');
//const ignoredFiles = require('react-dev-utils/ignoredFiles');
const path = require('path');
const paths = require('./paths');
const fs = require('fs');

const protocol = process.env.HTTPS === 'true' ? 'https' : 'http';
const host = process.env.HOST || '0.0.0.0';

const ignoredFiles = function (appSrc) {
      const regexp = new RegExp(
        `^(?!${escape(
          path.normalize(appSrc + '/').replace(/[\\]+/g, '/')
        )}).+/node_modules/(?!d2-ui-components)`,
        'g'
      );
      console.log({regexp})
      return regexp;
    };


module.exports = function(proxy, allowedHost) {
  return {
    // WebpackDevServer 2.4.3 introduced a security fix that prevents remote
    // websites from potentially accessing local content through DNS rebinding:
    // https://github.com/webpack/webpack-dev-server/issues/887
    // https://medium.com/webpack/webpack-dev-server-middleware-security-issues-1489d950874a
    // However, it made several existing use cases such as development in cloud
    // environment or subdomains in development significantly more complicated:
    // https://github.com/facebook/create-react-app/issues/2271
    // https://github.com/facebook/create-react-app/issues/2233
    // While we're investigating better solutions, for now we will take a
    // compromise. Since our WDS configuration only serves files in the `public`
    // folder we won't consider accessing them a vulnerability. However, if you
    // use the `proxy` feature, it gets more dangerous because it can expose
    // remote code execution vulnerabilities in backends like Django and Rails.
    // So we will disable the host check normally, but enable it if you have
    // specified the `proxy` setting. Finally, we let you override it if you
    // really know what you're doing with a special environment variable.
    disableHostCheck:
      !proxy || process.env.DANGEROUSLY_DISABLE_HOST_CHECK === 'true',
    // Enable gzip compression of generated files.
    compress: true,
    // Silence WebpackDevServer's own logs since they're generally not useful.
    // It will still show compile warnings and errors with this setting.
    clientLogLevel: 'none',
    // By default WebpackDevServer serves physical files from current directory
    // in addition to all the virtual build products that it serves from memory.
    // This is confusing because those files won’t automatically be available in
    // production build folder unless we copy them. However, copying the whole
    // project directory is dangerous because we may expose sensitive files.
    // Instead, we establish a convention that only files in `public` directory
    // get served. Our build script will copy `public` into the `build` folder.
    // In `index.html`, you can get URL of `public` folder with %PUBLIC_URL%:
    // <link rel="shortcut icon" href="%PUBLIC_URL%/favicon.ico">
    // In JavaScript code, you can access it with `process.env.PUBLIC_URL`.
    // Note that we only recommend to use `public` folder as an escape hatch
    // for files like `favicon.ico`, `manifest.json`, and libraries that are
    // for some reason broken when imported through Webpack. If you just want to
    // use an image, put it in `src` and `import` it from JavaScript instead.
    contentBase: paths.appPublic,
    // By default files from `contentBase` will not trigger a page reload.
    watchContentBase: true,
    // Enable hot reloading server. It will provide /sockjs-node/ endpoint
    // for the WebpackDevServer client so it can learn when the files were
    // updated. The WebpackDevServer client is included as an entry point
    // in the Webpack development configuration. Note that only changes
    // to CSS are currently hot reloaded. JS changes will refresh the browser.
    hot: true,
    // It is important to tell WebpackDevServer to use the same "root" path
    // as we specified in the config. In development, we always serve from /.
    publicPath: '/',
    // WebpackDevServer is noisy by default so we emit custom message instead
    // by listening to the compiler events with `compiler.hooks[...].tap` calls above.
    quiet: true,
    // Reportedly, this avoids CPU overload on some systems.
    // https://github.com/facebook/create-react-app/issues/293
    // src/node_modules is not ignored to support absolute imports
    // https://github.com/facebook/create-react-app/issues/1065
    watchOptions: {
      ignored: ignoredFiles(paths.appSrc),
    },
    // Enable HTTPS if the HTTPS environment variable is set to 'true'
    https: protocol === 'https',
    host,
    overlay: false,
    historyApiFallback: {
      // Paths with dots should still use the history fallback.
      // See https://github.com/facebook/create-react-app/issues/387.
      disableDotRule: true,
    },
    public: allowedHost,
    proxy,
    before(app, server) {
      if (fs.existsSync(paths.proxySetup)) {
        // This registers user provided middleware for proxy reasons
        require(paths.proxySetup)(app);
      }

      // This lets us fetch source contents from webpack for the error overlay
      app.use(evalSourceMapMiddleware(server));
      // This lets us open files from the runtime error overlay.
      app.use(errorOverlayMiddleware());

      // This service worker file is effectively a 'no-op' that will reset any
      // previous service worker registered for the same host:port combination.
      // We do this in development to avoid hitting the production cache if
      // it used the same host and port.
      // https://github.com/facebook/create-react-app/issues/2272#issuecomment-302832432
      app.use(noopServiceWorkerMiddleware());
    },
  };
};
```

</details>
