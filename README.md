# The sveltedoc parser

Generate a JSON documentation for a Svelte file

[![npm](https://img.shields.io/npm/v/sveltedoc-parser.svg)](https://www.npmjs.com/package/sveltedoc-parser)
![GitHub Workflow Status (branch)](https://img.shields.io/github/workflow/status/alexprey/sveltedoc-parser/Node%20CI/master)

## Changelog 

## [3.0.5] 28.11.2020

- 🛠 **[Fixed]** Fix [Issue #35](https://github.com/alexprey/sveltedoc-parser/issues/35): Object literals not supported in @type keyword. Thanks for @soft-decay

### [3.0.4] 25.08.2020

- 🛠 **[Fixed]** Fix [issue #5](https://github.com/alexprey/sveltedoc-parser/issues/5) (slots items have a private access level by default)

### [3.0.3] 25.08.2020

- 🛠 **[Fixed]** Fix [issue #28](https://github.com/alexprey/sveltedoc-parser/issues/28) (Inline event handlers in markup cause errors when used without quotes)
    - Change dependency from `htmlparser2` to [htmlparser2-svelte](https://www.npmjs.com/package/htmlparser2-svelte) special fork of [htmlparser2](https://www.npmjs.com/package/htmlparser2) to handle Svelte specific cases to parse markup

### [3.0.2] 24.08.2020

- 🛠 **[Fixed]** Fix issue #6 (Build a correct component name from a file name)
```
round.button.svelte -> RoundButton
```
- 🛠 **[Fixed]** Fix issue #27 (Events is not exposed from exported functions and arrow functions)
- 🛠 **[Fixed]** Fix issue #31 (Propogated events in markup should be parsed even it was before handled)
- 🛠 **[Fixed]** Fix issue #32 (Event is not registered when dispatched from functions used as a parameters of another functions)

### [3.0.1] 17.08.2020

- 🛠 **[Fixed]** Solve issue #26, support `export { variables as var }` statement.
- ✔ **[Added]** now interface `SvelteDataItem` provides a new property `localName` with information about internal name of component property.

### [3.0.0] 08.08.2020

- 🛠 **[Fixed]** Solve vulnerability issues:
    - Update `espree` to `7.2.0`
    - Update `htmlparser2` to `3.9.2`
    - Add dependency to `eslint` to fix issues after upgrading to new versions
- 🔥 **[Breaking]** Increase requirement of Node.js to `10.0.0`, Node.js v8 now is not supported, this is related with security isssues above. Please let me know if it still required.

Full changelog of release versions can be found [here](/CHANGELOG.md)

## Install

```shell
npm install --save sveltedoc-parser
```

## Features

- JSDoc support
    - Support description extraction for everything items
    - Support visibility scope from JSDoc keywords: `@public`, `@protected`, `@private`
- Extract global component description and keywords from JSDoc comment (_Svelte 3_)
    - Top level comment must include `@component`. [Example script](/test/svelte3/integration/globalComment/globalComment.script.svelte), [Example html](/test/svelte3/integration/globalComment/globalComment.markup.svelte)
- Extract list of imported components
    - Extract relative path to imported component (supports full-syntax and short-syntax import styles)
- Extract data properties
    - Extract description from JSDoc comment
    - Extract JS type from JSDoc (`@type {string}`) or parse default value if is not provided
- Extract computed properties with list of dependencies
- Extract list of references that attached to components or HTML elements
- Extract information about events
    - Events that propagated from child component or HTML elements `<button on:click>...</button>`
    - Parse event modifiers `... on:click|once`
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
| **defaultVersion** | Optional. Specify default version of svelte syntax, if auto-detector can't identify correct version. | `undefined` |

### Supported feature names

- `'name'` - Extract the component name (_Supported by Svelte 2 and Svelte 3_).
- `'data'` - Extract and parse the list of component data properties (_Supported by Svelte 2 and Svelte 3_).
- `'computed'` - Extract and parse the list of component computed properties (_Supported by Svelte 2 and Svelte 3_).
- `'methods'` - Extract the list of component methods (_Supported by Svelte 2 and Svelte 3_).
- `'actions'` - Extract the list of component actions (_Supported by Svelte 2_).
- `'helpers'` - Extract the list of component helpers (_Supported by Svelte 2_).
- `'components'` - Extract the list of imported components (_Supported by Svelte 2 and Svelte 3_).
- `'description'` - Extract the component description (_Supported by Svelte 2 and Svelte 3_).
- `'keywords'` - Extract the component keywords (_Supported by Svelte 2 and Svelte 3_).
- `'events'` - Extract the list of events that fired by this component (_Supported by Svelte 2 and Svelte 3_).
- `'slots'` - Extract the list of slots provided by this component (_Supported by Svelte 2 and Svelte 3_).
- `'transitions'` - Extract the list of transitions used by this component (_Supported by Svelte 2_).
- `'refs'` - Extract the list of references used by this component (_Supported by Svelte 2 and Svelte 3_).

## Output format

Output format are described at [this document](/typings.d.ts).

Please follow to [Examples](/examples/) folder to check how Svelte components transforms to JSON document.

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

## License

[MIT](/LICENSE)
