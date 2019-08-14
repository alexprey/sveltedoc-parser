# Change Log
All notable changes to the "svelte-intellisense" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

## Unreleased

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