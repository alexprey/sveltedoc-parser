# The sveltedoc parser

Generate a JSON documentation for a Svelte file

[![npm](https://img.shields.io/npm/v/sveltedoc-parser.svg)](https://www.npmjs.com/package/sveltedoc-parser)

## Changelog: [2.3.0] 02.10.2019

- [Added] Svelte V3: Implement support of script element locations
- [Fixed] Svelte V3: Fix parsing when component have multiple `<script>` blocks
- [Added] Spec: Property `locations` was added to items and presents the list of item code locations
- [Changed] Spec: Property `loc` for items marked as depricated, see `locations` property instead

Full changelog of release versions can be found [here](/CHANGELOG.md)

## Install

```shell
npm install --save sveltedoc-parser
```

## Features

- JSDoc support
    - Support description extraction for everything items
    - Support visibility scope from JSDoc keywords: `@public`, `@protected`, `@private`
- Extract list of imported components
    - Extract relative path to imported component (supports full-syntax and short-syntax import styles)
- Extract data properties
    - Extract description from JSDoc comment
    - Extract JS type from JSDoc (`@type {string}`) or parse default value if is not provided
- Extract computed properties with list of dependencies
- Extract list of references that attached to components or HTML elements
- Extract information about events
    - Events that propogated from child component or HTML elements `<button on:click>...</button>`
    - Parse event modificators `... on:click|once`
- Extract all fired events (_Svelte 2 only_)
    - Events that fired by this component by `fire(...)` method
    - Custom event handlers with `private` visibility scope
- Extract all dispatched events (_Svelte 3_)
    - Events that dispatched from script block by user-created dispatcher
    - Events that dispatched from markup expressions by user-created dispatcher
- Extract list of used default and named `slots`
- Extract component methods
    - Extract description from JSDoc comment
    - Extract parameters description from JSDoc comment
    - Extract JS type from JSDoc for parameters (`@param {string} parameter`)
    - Identify optional parameters (`@param [parameter]`), Google Closure Compiler syntax supported as well (`@param {string=} parameter`)
    - Identify default values for optional parameters (`@param [parameter=Default value]`)
- Extract component helpers (_Svelte 2 only_)
- Extract component actions (_Svelte 2 only_)
- Extract component transitions (_Svelte 2 only_)
- Extract source locations for component symbols
    - data
    - slots
    - methods
    - refs
    - events

## Configuration

| json Path | Description | Default value |
|---------|-----------|---------------|
| **filename** | The filename to parse. **Required**, unless `fileContent` is passed. | |
| **fileContent** | The file content to parse. **Required**, unless `filename` is passed. | |
| **encoding** | The file encoding. | `utf8` |
| **features** | The component features to parse and extracting. | By default used all supported features (see below). |
| **ignoredVisibilities** | The list of ignored visibilities. | `['private', 'protected']` |
| **includeSourceLocations** | Flag, which indicates that source locations should be provided for component symbols. | `false` |
| **version** | Optional. Use `2` or `3` to specify which svelte syntax should be used. When that is not provided, parser try to detect version of the syntax. | `undefined` |
| **defaultVersion** | Optional. Specify default version of svelte syntax, if auto-detector can't indetify correct version. | `undefined` |

### Supported feature names

- `'name'` - Extract the component name (_Supported by Svelte 2 and Svelte 3_).
- `'data'` - Extract and parse the list of component data properties (_Supported by Svelte 2 and Svelte 3_).
- `'computed'` - Extract and parse the list of component computed properties (_Supported by Svelte 2 and Svelte 3_).
- `'methods'` - Extract the list of component methods (_Supported by Svelte 2 and Svelte 3_).
- `'actions'` - Extract the list of component actions (_Supported by Svelte 2_).
- `'helpers'` - Extract the list of component helpers (_Supported by Svelte 2_).
- `'components'` - Extract the list of imported components (_Supported by Svelte 2 and Svelte 3_).
- `'description'` - Extract the component description (_Supported by Svelte 2 and Svelte 3_).
- `'events'` - Extract the list of events that fired by this component (_Supported by Svelte 2 and Svelte 3_).
- `'slots'` - Extract the list of slots provided by this component (_Supported by Svelte 2 and Svelte 3_).
- `'transitions'` - Extract the list of transitions used by this component (_Supported by Svelte 2_).
- `'refs'` - Extract the list of references used by this component (_Supported by Svelte 2 and Svelte 3_).

## Output format

Output format are described at [this document](/typings.d.ts).

See example of output for Svelte 2 component [here](/test/svelte2/integration/overall/overall.main.doc.json) presented in JSON format for [this component](/test/svelte2/integration/overall/main.svelte).

## Usage

```js
const sveltedoc = require('sveltedoc-parser');
const options = {
    filename: 'main.svelte'
};

sveltedoc.parse(options)
    .then(componentDoc => {
        console.log(componentDoc);
    })
    .catch(e => {
        console.error(e);
    });
```

## API

### parse(options)

Method to parse svelte component and provide doc object structure with details information.

### detectVersion(options)

Method to detect svelte syntax version

- Returns `3` when Svelte 3 special syntax feature are used
- Returns `2` when Svelte 2 special syntax feature are used
- Returns `defaultVersion` or `undefined` when specific version can't be identified

## Issues

All list of known issues presented at [this page](https://github.com/alexprey/sveltedoc-parser/issues).

Found a new issues? Please contribute and write detailed description [here](https://github.com/alexprey/sveltedoc-parser/issues/new).

## Contributors

Author [Alexey Mulyukin](https://github.com/alexprey)

Based on [vuedoc-parse](https://gitlab.com/vuedoc/parser)
