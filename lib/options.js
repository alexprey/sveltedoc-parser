const { isString, printArray, isVisibilitySupported } = require('./utils');

/**
 * @typedef {import("../typings").SvelteParserOptions} SvelteParserOptions
 * @typedef {import('../typings').JSVisibilityScope} JSVisibilityScope
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
const VISIBILITIES = [
    'public',
    'protected',
    'private'
];

const ERROR_OPTIONS_REQUIRED = 'An options object is required.';
const ERROR_INPUT_REQUIRED = 'One of options.filename or options.fileContent is required.';
const ERROR_IGNORED_VISIBILITIES_FORMAT =
    'options.ignoredVisibilities must be an array containing only these strings: ' +
    printArray(VISIBILITIES);
const ERROR_IGNORED_VISIBILITIES_EXPECTED =
    `options.ignoredVisibilities expected any of ${printArray(VISIBILITIES)}, ` +
    'but found these unsupported visibilities: ';

const ErrorMessage = Object.freeze({
    OptionsRequired: ERROR_OPTIONS_REQUIRED,
    InputRequired: ERROR_INPUT_REQUIRED,
    EncodingFormat: 'Expected options.encoding to be a string. Use one of: ' + printArray(ENCODINGS),
    EncodingNotSupported: (enc) => `encoding '${isString(enc) ? "'" + enc + "'" : enc}' is not supported. options.encoding must be one of: ` + printArray(ENCODINGS),
    IgnoredVisibilitiesFormat: ERROR_IGNORED_VISIBILITIES_FORMAT,
    IgnoredVisibilitiesNotSupported: (arr) => ERROR_IGNORED_VISIBILITIES_EXPECTED + printArray(arr),
});

/** @type {BufferEncoding} */
const DEFAULT_ENCODING = 'utf8';

/** @type {SymbolVisibility[]} */
const DEFAULT_IGNORED_VISIBILITIES = ['protected', 'private'];

/** @returns {SvelteParserOptions} */
function getDefaultOptions() {
    return {
        encoding: DEFAULT_ENCODING,
        ignoredVisibilities: [...DEFAULT_IGNORED_VISIBILITIES],
    };
}

function retrieveFileOptions(options) {
    return {
        structure: options.structure,
        fileContent: options.fileContent,
        filename: options.filename,
        encoding: options.encoding,
    };
}

/**
 * Applies default values to options.
 * @param {SvelteParserOptions} options
 */
function normalize(options) {
    const defaults = getDefaultOptions();

    Object.keys(defaults).forEach((optionKey) => {
        /**
         * If the key was not set by the user, apply default value.
         * This is better than checking for falsy values because it catches
         * use cases were a user tried to do something not intended with
         * an option (e.g. putting a value of 'false' or an empty string)
         */
        if (!(optionKey in options)) {
            options[optionKey] = defaults[optionKey];
        }
    });
}

/**
 * @param {SvelteParserOptions} options
 * @throws an error if any options are invalid
 */
function validate(options) {
    if (!options) {
        throw new Error(ErrorMessage.OptionsRequired);
    }

    normalize(options);

    const hasFilename =
        ('filename' in options) &&
        isString(options.filename) &&
        options.filename.length > 0;

    // Don't check length for fileContent because it could be an empty file.
    const hasFileContent =
        ('fileContent' in options) &&
        isString(options.fileContent);

    if (!hasFilename && !hasFileContent) {
        throw new Error(ErrorMessage.InputRequired);
    }

    if ('encoding' in options) {
        if (!isString(options.encoding)) {
            throw new Error(ErrorMessage.EncodingFormat);
        }

        if (!ENCODINGS.includes(options.encoding)) {
            throw new Error(ErrorMessage.EncodingNotSupported(options.encoding));
        }
    } else {
        // Sanity check. At this point, 'encoding' should be set.
        throw new Error(ErrorMessage.EncodingMissing);
    }

    if ('ignoredVisibilities' in options) {
        if (!Array.isArray(options.ignoredVisibilities)) {
            throw new Error(ErrorMessage.IgnoredVisibilitiesFormat);
        }

        if (!options.ignoredVisibilities.every(isVisibilitySupported)) {
            const notSupported = options.ignoredVisibilities.filter(
                (iv) => !isVisibilitySupported(iv)
            );

            throw new Error(ErrorMessage.IgnoredVisibilitiesNotSupported(notSupported));
        }
    } else {
        // Sanity check. At this point, 'ignoredVisibilities' should be set.
        throw new Error(ErrorMessage.IgnoredVisibilitiesMissing);
    }
}

module.exports = {
    ErrorMessage: ErrorMessage,
    validate: validate,
    retrieveFileOptions: retrieveFileOptions,
};
