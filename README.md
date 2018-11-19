# The sveltedoc parser

Generate a JSON documentation for a Svelte file

[![npm](https://img.shields.io/npm/v/sveltedoc-parser.svg)](https://www.npmjs.com/package/sveltedoc-parser)

## Install

```shell
npm install --save sveltedoc-parser
```

## Features

- JSDoc support
- Extract the component description from JSDoc
- Extract used components list (with short or reference notations)
- Extract data properties
- Extract computed properties with dependencies
- Extract events that fired by this component
- Extract events that propogated from child component
- Extract custom implemented events
- Extract list of used default and named `slots`
- Extract component methods
- Extract component helpers
- Extract component actions
- Extract used `refs` in template nodes

## Configuration

| json Path | Description | Default value |
|---------|-----------|---------------|
| **filename** | The filename to parse. **Required**, unless `fileContent` is passed. | |
| **fileContent** | The file content to parse. **Required**, unless `filename` is passed. | |
| **encoding** | The file encoding. | `utf8` |
| **features** | The component features to parse and extracting. | By default used all supported features (see below). |
| **ignoredVisibilities** | The list of ignored visibilities. | `['private', 'protected']` |

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
