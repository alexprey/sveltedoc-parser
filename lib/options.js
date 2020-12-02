const { isString, printArray, isVisibilitySupported, VISIBILITIES } = require('./utils');

/**
 * @typedef {import("../typings").SvelteParserOptions} SvelteParserOptions
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

const ERROR_ENCODING_FORMAT = 'Expected options.encoding to be a string. ';
const ERROR_VISIBILITIES_FORMAT = 'Expected options.ignoredVisibilities to be an array of strings. ';
const INFO_ENCODING_SUPPORTED = `Supported encodings: ${printArray(ENCODINGS)}.`;
const INFO_VISIBILITIES_SUPPORTED = `Supported visibilities: ${printArray(VISIBILITIES)}.`;

function getUnsupportedEncodingString(enc) {
    return `encoding ${printArray([enc])} not supported. ` +
        INFO_ENCODING_SUPPORTED;
}

function getUnsupportedVisibilitiesString(arr) {
    return `Visibilities [${printArray(arr)}] in ` +
        'options.ignoredVisibilities are not supported. ' +
        INFO_VISIBILITIES_SUPPORTED;
}

const ErrorMessage = Object.freeze({
    OptionsRequired: 'An options object is required.',
    InputRequired: 'One of options.filename or options.fileContent is required.',
    EncodingFormat: ERROR_ENCODING_FORMAT + INFO_ENCODING_SUPPORTED,
    EncodingNotSupported: (enc) => getUnsupportedEncodingString(enc),
    IgnoredVisibilitiesFormat: ERROR_VISIBILITIES_FORMAT + INFO_VISIBILITIES_SUPPORTED,
    IgnoredVisibilitiesNotSupported: (arr) => `${getUnsupportedVisibilitiesString(arr)}`,
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
