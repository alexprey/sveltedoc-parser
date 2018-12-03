# Change Log
All notable changes to the "svelte-intellisense" extension will be documented in this file.

Check [Keep a Changelog](http://keepachangelog.com/) for recommendations on how to structure this file.

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