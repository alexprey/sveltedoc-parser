# Change Log
All notable changes to the "svelte-intellisense" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## UNRELEASED

## [3.0.1] 17.08.2020

- [Fixed] Solve issue #26, support `export { variables as var }` statement.
- [Added] now interface `SvelteDataItem` provides a new property `localName` with information about internal name of component property.

## [3.0.0] 08.08.2020

- [Fixed] Solve vulnerability issues:
    - Update `espree` to `7.2.0`
    - Update `htmlparser2` to `3.9.2`
    - Add dependency to `eslint` to fix issues after upgrading to new versions
- [Breaking] Increase requirement of Node.js to `10.0.0`, Node.js v8 now is not supported, this is related with security isssues above. Please let me know if it still required.

## [2.3.4] 10.12.2019

- [Fixed] Now `keywords` feature correctly supported.

Thanks to [hontas](https://github.com/hontas) for following changes:

- [Fixed] Svelte V3: Fix parsing of types for data items, defined by `@type` keyword.

## [2.3.3] 05.12.2019

Thanks to [hontas](https://github.com/hontas) for following changes:

- [Added] Svelte V3: Implement component documentation parsing provided by top level comment in HTML markup or in the JS section, marked with `@component` JSDoc attribute.

## [2.3.2] 02.12.2019

Thanks to [Hostas](https://github.com/hontas) for following fixes:

- [Fixed] Svelte V3: Improve type parsing for properties with default values.
- [Fixed] Svelte V3: In some cases `type` property was setup with wrong structure and data, now it fixed.

## [2.3.1] 25.11.2019

- [Fixed] Svelte V3: Fix parsing issues when anonymous functions are used in event handlers at markup (Issue #18)

## [2.3.0] 02.10.2019

- [Added] Svelte V3: Implement support of script element locations
- [Fixed] Svelte V3: Fix parsing when component have multiple `<script>` blocks
- [Added] Spec: Property `locations` was added to items and presents the list of item code locations
- [Changed] Spec: Property `loc` for items marked as depricated, see `locations` property instead

## [2.2.0] 15.08.2019

- [Added] Svelte V3: Add a new properties for data items: `originalName` and `importPath`
- [Changed] Svelte V3: Add support for multiple bindings to one data item, now `bind` property of the item are array
- [Changed] Property `value` for component items marked as depricated and new proprty `importPath` are used now
- [Fixed] Issues with parsing

## [2.1.0] 09.08.2019

- [Added] Svelte V3: Implement support for property binding parsing (`bind:property={...}`)
- [Added] Svelte V3: Implement support for event parsing which dispatched from code (`dispatch(...)`)
- [Added] Svelte V3: Implement support for event parsing which dispatched from markup expressions (`<button on:click="{() => dispatch(....)}">`)
- [Added] Svelte V3: Implement support for ref parsing (`bind:this={...}`)
- [Fixed] Spec: Property `SvelteDataItem.let` changed to `SvelteDateItem.kind`, that was named as `let` by mistake

## [2.0.0] 05.08.2019

- [Added] Support for V3 syntax

## [1.2.0] 01.02.2019

- [Added] Implement source locations provider for most of component symbols

## [1.1.5] 07.12.2018

- [Fixed] Fix and refactor param keyword parsing to handle some wrong cases (fix and close issue #7)

## [1.1.3] 03.12.2018

- [Fixed] Improve crash handling in parser logic, now all errors fall into `reject(...)` method instead throwing up

## [1.1.2] 30.11.2018

- [Fixed] Fix issue when parsing types from JSDoc, cover more cases. Previously type `@type {('plain'|'plain-negative')}` was not supported in case of `-` symbol

## [1.1.1] 20.11.2018

- [Fix] Fix `typings.d.ts` file to be importable

## [1.1.0] 19.11.2018
- [Fix] Fix issue with component name parsing with default features set (Missing feature `name` in defaults features list)
- [Added] Implement parsing of js types for data properties from `@type` keyword and from default value

## [1.0.0]
- Initial release