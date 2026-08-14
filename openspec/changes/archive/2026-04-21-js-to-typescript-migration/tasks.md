## 1. Barrel / index re-exports

- [x] 1.1 [BE] Convert `src/auth/index.js` to `index.ts`
- [x] 1.2 [BE] Convert `src/org-unit-select/index.js` to `index.ts`
- [x] 1.3 [BE] Convert `src/group-editor/index.js` to `index.ts`
- [x] 1.4 [BE] Convert `src/org-unit-tree/index.js` to `index.ts`

## 2. Utility modules

- [x] 2.1 [BE] Convert `src/utils/lodash.js` to `lodash.ts` with typed exports
- [x] 2.2 [BE] Convert `src/utils/date.js` to `date.ts` with typed function signatures
- [x] 2.3 [BE] Convert `src/utils/d2-auth.js` to `d2-auth.ts` with typed function signatures
- [x] 2.4 [BE] Convert `src/helpers/d2.js` to `d2.tsx` (contains JSX) with typed function signatures; extend `src/types/d2-ui.d.ts` with a minimal `D2Model` interface if needed
- [x] 2.5 [BE] Convert `src/sharing/utils.js` to `utils.ts` with typed function signatures
- [x] 2.6 [BE] Convert `src/org-unit-select/common.js` to `common.tsx` (contains JSX) with typed function signatures
- [x] 2.7 [BE] Convert `src/org-unit-tree/utils.js` to `utils.ts` with typed function signatures

## 3. Org-unit tree components

- [x] 3.1 [FE] Convert `src/org-unit-tree/OrgUnitTree.component.js` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 3.2 [FE] Convert `src/org-unit-tree/OrgUnitTreeMultipleRoots.component.js` to `.tsx`; replace `prop-types` with TypeScript props interface

## 4. Org-unit select components

- [x] 4.1 [FE] Convert `src/org-unit-select/OrgUnitSelectAll.component.js` to `.tsx`; replace `prop-types` and `contextTypes` with typed patterns
- [x] 4.2 [FE] Convert `src/org-unit-select/OrgUnitSelectByLevel.component.js` to `.tsx`; replace `prop-types` and `contextTypes` with typed patterns
- [x] 4.3 [FE] Convert `src/org-unit-select/OrgUnitSelectByGroup.component.js` to `.tsx`; replace `prop-types` and `contextTypes` with typed patterns
- [x] 4.4 [FE] Convert `src/org-unit-select/OrgUnitSelectByProgram.component.js` to `.tsx`; replace `prop-types` and `contextTypes` with typed patterns

## 5. Sharing components

- [x] 5.1 [FE] Convert `src/sharing/PermissionOption.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 5.2 [FE] Convert `src/sharing/PermissionPicker.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 5.3 [FE] Convert `src/sharing/Access.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 5.4 [FE] Convert `src/sharing/AutoComplete.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 5.5 [FE] Convert `src/sharing/UserSearch.jsx` to `.tsx`; replace `prop-types` with TypeScript props/state interfaces

## 6. Group editor components

- [x] 6.1 [FE] Convert `src/group-editor/GroupEditor.component.js` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 6.2 [FE] Convert `src/group-editor/GroupEditorWithOrdering.component.js` to `.tsx`; replace `prop-types` with TypeScript props interface

## 7. Remaining components

- [x] 7.1 [FE] Convert `src/dialog-button/DialogButton.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 7.2 [FE] Convert `src/simple-check-box/SimpleCheckBox.js` to `.tsx`; replace `prop-types` with TypeScript props interface
- [x] 7.3 [FE] Convert `src/org-units-selector/OrgUnitsSelector.jsx` to `.tsx`; replace `prop-types` with TypeScript props interface

## 8. Build and config cleanup

- [x] 8.1 [BE] Remove `allowJs: true` from `tsconfig.json`
- [x] 8.2 [BE] Simplify `jest.config.js`: drop `babel-jest` transform for JS, use `ts-jest` only; update `testRegex` if needed; convert `setupEnzyme.js` to `.ts`
- [x] 8.3 [BE] Remove `prop-types` from `devDependencies` in `package.json` (pre-existing imports in `DatePicker.tsx` and `Wizard.tsx` cleaned up as part of Boy Scout Rule)
- [x] 8.4 [BE] Run `yarn build && yarn test && yarn lint` to verify the full migration
