# The sveltedoc parser

Generate a JSON documentation for a Svelte file

[![npm](https://img.shields.io/npm/v/sveltedoc-parser.svg)](https://www.npmjs.com/package/sveltedoc-parser)

Changelog of release versions can be found [here](/CHANGELOG.md)

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
- Extract all fired events
    - Events that fired by this component by `fire(...)` method
    - Events that propogated from child component or HTML elements
    - Custom event handlers with `private` visibility scope
- Extract list of used default and named `slots`
- Extract component methods
    - Extract description from JSDoc comment
    - Extract parameters description from JSDoc comment
    - Extract JS type from JSDoc for parameters (`@param {string} parameter`)
    - Identify optional parameters (`@param [parameter]`), Google Closure Compiler syntax supported as well (`@param {string=} parameter`)
    - Identify default values for optional parameters (`@param [parameter=Default value]`)
- Extract component helpers
- Extract component actions
- Extract component transitions
- Extract source locations for component symbols

## Configuration

| json Path | Description | Default value |
|---------|-----------|---------------|
| **filename** | The filename to parse. **Required**, unless `fileContent` is passed. | |
| **fileContent** | The file content to parse. **Required**, unless `filename` is passed. | |
| **encoding** | The file encoding. | `utf8` |
| **features** | The component features to parse and extracting. | By default used all supported features (see below). |
| **ignoredVisibilities** | The list of ignored visibilities. | `['private', 'protected']` |
| **includeSourceLocations** | Flag, which indicates that source locations should be provided for component symbols. | `false` |

### Supported feature names

- `'name'` - Extract the component name.
- `'data'` - Extract and parse the list of component data properties.
- `'computed'` - Extract and parse the list of component computed properties.
- `'methods'` - Extract the list of component methods.
- `'actions'` - Extract the list of component actions.
- `'helpers'` - Extract the list of component helpers.
- `'components'` - Extract the list of imported components.
- `'description'` - Extract the component description.
- `'events'` - Extract the list of events that fired by this component.
- `'slots'` - Extract the list of slots provided by this component.
- `'transitions'` - Extract the list of transitions used by this component.
- `'refs'` - Extract the list of references used by this component.

## Output format

Output format are described at [this document](/typings.d.ts).

See example of output [here](/test/overall/overall.main.doc.json) presented in JSON format for [this component](/test/overall/main.svelte).

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

## Issues

All list of known issues presented at [this page](https://github.com/alexprey/sveltedoc-parser/issues).

Found a new issues? Please contribute and write detailed description [here](https://github.com/alexprey/sveltedoc-parser/issues/new).

## Contributors

Author [Alexey Mulyukin](https://github.com/alexprey)

Based on [vuedoc-parse](https://gitlab.com/vuedoc/parser)
