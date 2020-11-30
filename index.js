const { loadFileStructureFromOptions } = require('./lib/helpers');
const SvelteVersionDetector = require('./lib/detector');
const { isString, printArray, isVisibilitySupported } = require('./lib/utils');

/**
 * @typedef {import("./typings").SvelteParserOptions} SvelteParserOptions
 * @typedef {import('./typings').SymbolVisibility} SymbolVisibility
 */

/** @type {BufferEncoding[]} */
const ENCODINGS = [
    'ascii',
    'utf8',
    'utf-8',
    'utf16le',
    'ucs2',
    'ucs-2',
    'base64',
    'latin1',
    'binary',
    'hex'
];

/** @type {SymbolVisibility[]} */
const VISIBILITIES = ['public', 'protected', 'private'];

/** @type {BufferEncoding} */
const DEFAULT_ENCODING = 'utf8';

/** @type {SymbolVisibility[]} */
const DEFAULT_IGNORED_VISIBILITIES = ['protected', 'private'];

const ERROR_OPTIONS_REQUIRED = 'An options object is required.';
const ERROR_INPUT_REQUIRED = 'One of options.filename or options.fileContent is required.';
const ERROR_ENCODING_NOT_SUPPORTED =
    'options.encoding must be one of: ' + printArray(ENCODINGS);

const ERROR_IGNORED_VISIBILITIES_FORMAT =
    'options.ignoredVisibilities must be an array of those strings: ' +
    printArray(VISIBILITIES);

const ERROR_IGNORED_VISIBILITIES_NOT_SUPPORTED =
    `options.ignoredVisibilities expected any of [${printArray(VISIBILITIES)}] ` +
    'but found these instead: ';

/**
 * @param {SvelteParserOptions} options
 * @throws an error if any option is invalid
 */
function validateOptions(options) {
    if (!options) {
        throw new Error(ERROR_OPTIONS_REQUIRED);
    }

    if (!isString(options.filename) && !isString(options.fileContent)) {
        throw new Error(ERROR_INPUT_REQUIRED);
    }

    if (options.encoding && !ENCODINGS.includes(options.encoding)) {
        throw new Error(ERROR_ENCODING_NOT_SUPPORTED);
    }

    if (options.ignoredVisibilities) {
        if (!Array.isArray(options.ignoredVisibilities)) {
            throw new Error(ERROR_IGNORED_VISIBILITIES_FORMAT);
        }

        if (!options.ignoredVisibilities.every(isVisibilitySupported)) {
            const notSupported = options.ignoredVisibilities.filter(
                (iv) => !isVisibilitySupported(iv)
            );

            throw new Error(
                ERROR_IGNORED_VISIBILITIES_NOT_SUPPORTED +
                printArray(notSupported)
            );
        }
    }
}

/**
 * Applies default values to options.
 * @param {SvelteParserOptions} options
 */
function normalizeOptions(options) {
    options.encoding = options.encoding || DEFAULT_ENCODING;
    options.ignoredVisibilities = options.ignoredVisibilities || DEFAULT_IGNORED_VISIBILITIES;
}

function buildSvelte2Parser(structure, options) {
    const Parser = require('./lib/parser');

    // Convert structure object to old version source options
    const hasScript = structure.scripts && structure.scripts.length > 0;
    const hasStyle = structure.styles && structure.styles.length > 0;

    options.source = {
        template: structure.template,
        script: hasScript ? structure.scripts[0].content : '',
        scriptOffset: hasScript ? structure.scripts[0].offset : 0,
        style: hasStyle ? structure.styles[0].content : '',
        styleOffset: hasStyle ? structure.styles[0].offset : 0,
    };

    return new Parser(options);
}

function buildSvelte3Parser(structure, options) {
    const Parser = require('./lib/v3/parser');

    return new Parser(structure, options);
}

function buildSvelteParser(structure, options, version) {
    if (version === SvelteVersionDetector.SVELTE_VERSION_3) {
        return buildSvelte3Parser(structure, options);
    }

    if (version === SvelteVersionDetector.SVELTE_VERSION_2) {
        return buildSvelte2Parser(structure, options);
    }

    if (version) {
        throw new Error(`Svelte V${version} is not supported`);
    }

    throw new Error('Undefined Svelte version is not supported, you should specify default version in options');
}

function getEventName(feature) {
    return feature.endsWith('s')
        ? feature.substring(0, feature.length - 1)
        : feature;
}

function convertVisibilityToLevel(visibility) {
    switch (visibility) {
        case 'public':
            return 3;
        case 'protected':
            return 2;
        case 'private':
            return 1;
    }

    return 0;
}

function mergeItems(itemType, currentItem, newItem, ignoreLocations) {
    if (convertVisibilityToLevel(currentItem.visibility) < convertVisibilityToLevel(newItem.visibility)) {
        currentItem.visibility = newItem.visibility;
    }

    if (!currentItem.description && newItem.description) {
        currentItem.description = newItem.description;
    }

    if (!currentItem.type || currentItem.type.type === 'any') {
        if (newItem.type && newItem.type.type !== 'any') {
            currentItem.type = newItem.type;
        }
    }

    if (!currentItem.keywords && newItem.keywords) {
        currentItem.keywords = newItem.keywords;
    }

    if (!ignoreLocations) {
        if (newItem.locations && newItem.locations.length > 0) {
            if (currentItem.locations) {
                currentItem.locations.push(...newItem.locations);
            } else {
                currentItem.locations = [...newItem.locations];
            }
        }
    }

    if (itemType === 'data') {
        if (newItem.bind && newItem.bind.length > 0) {
            if (currentItem.bind) {
                currentItem.bind.push(...newItem.bind);
            } else {
                currentItem.bind = [...newItem.bind];
            }
        }
    }

    return currentItem;
}

function subscribeOnParserEvents(parser, options, version, resolve, reject) {
    const component = {
        version: version
    };

    parser.features.forEach((feature) => {
        switch (feature) {
            case 'name':
            case 'description':
                component[feature] = null;
                parser.on(feature, (value) => (component[feature] = value));
                break;

            case 'keywords':
                component[feature] = [];
                parser.on(feature, (value) => (component[feature] = value));
                break;

            default: {
                component[feature] = [];

                const eventName = getEventName(feature);

                parser.on(eventName, (value) => {
                    const itemIndex = component[feature].findIndex(item => item.name === value.name);

                    if (value.localName) {
                        const localItem = component[feature].find(item => item.name === value.localName);

                        if (localItem) {
                            value = mergeItems(feature, value, localItem, true);
                        }
                    }

                    if (itemIndex < 0) {
                        component[feature].push(value);
                    } else {
                        const currentItem = component[feature][itemIndex];

                        component[feature][itemIndex] = mergeItems(feature, currentItem, value);
                    }
                });
            }
        }
    });

    parser.on('end', () => {
        parser.features.forEach((feature) => {
            if (component[feature] instanceof Array) {
                component[feature] = component[feature].filter((item) => {
                    return !options.ignoredVisibilities.includes(item.visibility);
                });
            }
        });

        resolve(component);
    });

    parser.on('failure', (error) => {
        reject(error);
    });
}

/**
 * Main parse function.
 * @param {SvelteParserOptions} options
 * @example
 * const { parse } = require('sveltedoc-parser');
 * const doc = await parse({
 *     filename: 'main.svelte',
 *     encoding: 'ascii',
 *     features: ['data', 'computed', 'methods'],
 *     ignoredVisibilities: ['private'],
 *     includeSourceLocations: true,
 *     version: 3
 * });
 */
module.exports.parse = (options) => new Promise((resolve, reject) => {
    try {
        validateOptions(options);
        normalizeOptions(options);

        const structure = loadFileStructureFromOptions(options);

        const version = options.version || SvelteVersionDetector.detectVersionFromStructure(structure, options.defaultVersion);

        const parser = buildSvelteParser(structure, options, version);

        subscribeOnParserEvents(parser, options, version, resolve, reject);

        parser.walk();
    } catch (error) {
        reject(error);
    }
});

/**
 * @param {SvelteParserOptions} options
 */
module.exports.detectVersion = (options) => {
    validateOptions(options);

    return SvelteVersionDetector.detectVersionFromOptions(options);
};
