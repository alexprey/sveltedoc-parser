/**
 * @typedef {import('../typings').JSVisibilityScope} JSVisibilityScope
 * @type {Readonly<JSVisibilityScope[]>}
 */
const VISIBILITIES = Object.freeze(['public', 'protected', 'private']);
const RE_VISIBILITY = new RegExp(`^(${VISIBILITIES.join('|')})$`);
const RE_KEYWORDS = /@\**\s*([a-z0-9_-]+)(\s+(-\s+)?([\wÀ-ÿ\s*{}[\]()='"`_^$#&²~|\\£¤€%µ,?;.:/!§<>+¨-]+))?/ig;

const DEFAULT_VISIBILITY = 'public';
const UNHANDLED_EVENT_NAME = '****unhandled-event-name****';

const isVisibilitySupported = (v) => RE_VISIBILITY.test(v);

const getVisibility = (keywords, defaultVisibility) => {
    const keyword = keywords.find((keyword) => isVisibilitySupported(keyword.name));

    if (keyword) {
        return keyword.name;
    }

    return defaultVisibility;
};

const parseComment = (text, defaultVisibility = DEFAULT_VISIBILITY) => {
    const result = {
        keywords: [],
        visibility: defaultVisibility,
        description: '',
    };

    const parsedText = text.split(/\n/)
        .map((line) => {
            return line.trim()
                .replace(/^\/\*+/, '').trim()
                .replace(/\s*\*+\/$/, '').trim()
                .replace(/^\s*\*/, '').trim();
        })
        .join('\n')
        .trim();

    let index = 0;
    let indexDescription = parsedText.length;

    while (index < parsedText.length && index !== -1) {
        const matches = RE_KEYWORDS.exec(parsedText);

        if (!matches) {
            break;
        }

        if (index === 0) {
            indexDescription = matches.index;
        }

        index = matches.index;

        const name = matches[1];
        const description = (matches[4] || '').trim();

        result.keywords.push({ name, description });
    }

    result.description = parsedText.substring(0, indexDescription).trim();
    result.visibility = getVisibility(result.keywords, result.visibility);

    return result;
};

/**
 * @param {Node} node
 * @param {SourceCode} sourceCode
 * @param {*} options
 */
const getCommentFromSourceCode = (node, sourceCode, {
    defaultVisibility = DEFAULT_VISIBILITY,
    useFirst = false,
    useLeading = true,
    useTrailing = true
} = {}) => {
    let lastComment = null;

    if (node) {
        const comments = sourceCode.getComments(node);

        if (useLeading && comments.leading && comments.leading.length > 0) {
            const leadingCommentIndex = useFirst ? 0 : comments.leading.length - 1;

            lastComment = comments.leading[leadingCommentIndex].value;
        }

        if (useTrailing && comments.trailing && comments.trailing.length > 0) {
            const trailingCommentIndex = useFirst ? 0 : comments.trailing.length - 1;

            lastComment = comments.trailing[trailingCommentIndex].value;
        }
    }

    if (lastComment) {
        return parseComment(lastComment, defaultVisibility);
    }

    return {
        visibility: defaultVisibility,
        description: null,
        keywords: []
    };
};

class NodeFunction {
    constructor(node) {
        Object.assign(this, node);
    }
}

const value = (property) => {
    const keyName = property.key.type === 'Literal'
        ? property.key.value
        : property.key.name;

    switch (property.value.type) {
        case 'Literal':
            return { [keyName]: property.value.value };

        case 'Identifier':
            return {
                [keyName]: property.value.name === 'undefined'
                    ? undefined
                    : property.value.name
            };

        case 'ObjectExpression':
            return { [keyName]: values(property) };

        case 'FunctionExpression':
        case 'ArrowFunctionExpression':
            return { [keyName]: new NodeFunction(property.value) };
    }

    return { [keyName]: property.value };
};

const values = (entry) => {
    const values = {};

    entry.value.properties.forEach((property) => {
        if (property.value.type === 'ObjectExpression') {
            Object.assign(values, {
                [property.key.name]: value(property)
            });
        } else {
            Object.assign(values, value(property));
        }
    });

    return values;
};

/**
  *
  * @param {{ type: string; value: string }[]} tokens
  */
const buildPropertyAccessorChainFromTokens = (tokens) => {
    const next = tokens[0];

    if (!next) {
        return [];
    }

    if (!next.type === 'Identifier') {
        return [];
    }

    const chain = [next.value];

    let punctIndex = 1;
    let isChained = tokens[punctIndex] && tokens[punctIndex].value === '.';
    let chained = tokens[punctIndex + 1];

    while (isChained && chained && chained.type === 'Identifier') {
        chain.push(chained.value);
        punctIndex += 2;
        isChained = tokens[punctIndex] && tokens[punctIndex].value === '.';
        chained = tokens[punctIndex + 1];
    }

    return chain;
};

/**
 * Builds an array of property names from a 'MemberExpression' node.
 *   - Supports nested 'MemberExpression', 'Identifier', and 'Literal' nodes
 *   - Does not support bracket notation (computed === true).
 *
 * @example
 * dispatch(PLAIN.NESTED.INNER);
 * // Parsing the 'MemberExpression' node
 * // corresponding to 'PLAIN.NESTED.INNER'
 * // would yield the array ['PLAIN', 'NESTED', 'INNER']
 *
 * @param {{ type: string; object: any, property: any, computed: boolean }} node
 */
const buildPropertyAccessorChainFromAst = (node) => {
    if (node.type === 'Identifier') {
        return [node.name];
    }

    if (node.type === 'Literal') {
        return [node.value];
    }

    if (node.type !== 'MemberExpression') {
        return [undefined];
    }

    const chain = [];

    if (!node.computed) {
        // Dot notation
        chain.push(...buildPropertyAccessorChainFromAst(node.object));
        chain.push(node.property.name);
    } else {
        // TODO: Support bracket notation
        chain.push(undefined);
    }

    return chain.includes(undefined) ? [undefined] : chain;
};

/**
 * Builds an object expression (i.e. { ... }) from an 'ObjectExpression' node.
 * Supports a limited range of property types:
 *   - 'ObjectExpression' (nested)
 *   - 'Literal' (string, int, boolean, etc)
 *
 * @param {{ type: 'ObjectExpression'; properties: any[] }} node
 */
const buildObjectFromObjectExpression = (node) => {
    if (node.type !== 'ObjectExpression') {
        throw new TypeError("Node must be of type 'ObjectExpression' but is", node.type);
    }

    const obj = {};

    node.properties.forEach((property) => {
        if (property.value.type === 'ObjectExpression') {
            obj[property.key.name] = buildObjectFromObjectExpression(property.value);
        } else if (property.value.type === 'Literal') {
            obj[property.key.name] = property.value.value;
        }
    });

    return obj;
};

/**
 *
 * @param {Record<string, { type: string; value?: any }>} record
 * @param {string[]} chain
 */
const getValueForPropertyAccessorChain = (record, chain) => {
    const rootExpression = record[chain[0]];

    if (rootExpression.type === 'Literal') {
        return rootExpression.value;
    }

    if (rootExpression.type !== 'ObjectExpression') {
        return UNHANDLED_EVENT_NAME;
    }

    let current = buildObjectFromObjectExpression(rootExpression);

    for (const identifier of chain.slice(1)) {
        current = current[identifier];

        if (!current) {
            return UNHANDLED_EVENT_NAME;
        }
    }

    return current;
};

const tokensInterval = (tokens, range) => {
    return tokens.filter((item) => {
        return item.range[0] > range[0] && item.range[1] < range[1];
    });
};

const getIdentifierValue = (tokens, identifierName, rangeLimit) => {
    const range = [tokens[0].range[0], rangeLimit];
    const searchingTokens = tokensInterval(tokens, range).reverse();
    const tokenIndex = searchingTokens.findIndex((item, i, array) => {
        if (item.type === 'Identifier' && item.value === identifierName) {
            const nextToken = array[i - 1];

            return nextToken.type === 'Punctuator' && nextToken.value === '=';
        }

        return false;
    });

    const valueToken = searchingTokens[tokenIndex - 2];

    if (valueToken) {
        switch (valueToken.type) {
            case 'String':
                return valueToken.value.replace(/['"]/g, '');

            case 'Identifier':
                return getIdentifierValue(
                    tokens, valueToken.value, valueToken.range[0]);
        }
    }

    return { notFoundIdentifier: identifierName };
};

const getIdentifierValueFromStart = (tokens, identifierName) => {
    const tokenIndex = tokens.findIndex((token, i, array) => {
        if (token.type === 'Identifier' && token.value === identifierName) {
            const nextToken = array[i + 1];

            return nextToken.type === 'Punctuator' && nextToken.value === '=';
        }

        return false;
    });

    if (tokenIndex !== -1) {
        const valueToken = tokens[tokenIndex + 2];

        switch (valueToken.type) {
            case 'String':
                return valueToken.value.replace(/['"`]/g, '');

            case 'Identifier':
                return getIdentifierValueFromStart(tokens, valueToken.value);
        }
    }

    return null;
};

const unCamelcase = (text) => {
    const chars = [];

    text.split('').forEach((char) => {
        if (/[A-Z]/.test(char)) {
            char = char.toLowerCase();

            if (chars.length) {
                chars.push('-');
            }
        }

        chars.push(char);
    });

    return chars.join('');
};

const buildCamelCase = (text) => {
    return text.split('').reduce((state, char) => {
        const isLegal = /[a-zA-Z]/.test(char);
        const isNumeric = /[0-9]/.test(char);

        if (isLegal || isNumeric) {
            if (state.chars.length === 0 || !state.prevIsLegal) {
                state.chars.push(char.toUpperCase());
            } else {
                state.chars.push(char);
            }
        }

        state.prevIsLegal = isLegal;

        return state;
    }, {
        chars: [],
        prevIsLegal: false
    }).chars.join('');
};

const getDependencies = (ast, source) => {
    const dependencies = [];

    if (ast && ast.params && ast.params.length === 1 && ast.params[0].type === 'ObjectPattern') {
        ast.params[0].properties.forEach(property => {
            dependencies.push(property.key.name);
        });
    }

    return dependencies;
};

const escapeImportKeyword = (code) => {
    return code.replace(/import/g, 'importX');
};

const anyType = { kind: 'type', text: 'any', type: 'any' };
const inferTypeFromVariableDeclaration = (variable) => {
    try {
        const value = variable.declarator.init.value;
        const typeOfValue = typeof value;

        if (typeOfValue !== 'undefined') {
            return { kind: 'type', text: typeOfValue, type: typeOfValue };
        }

        return anyType;
    } catch (error) {
        return anyType;
    }
};

const isTopLevelComment = (comment) => {
    return comment.keywords.some((keyword) => keyword.name === 'component');
};

const isString = (x) => typeof x === 'string' || x instanceof String;

const printArray = (array = []) => array.map(s => `'${s}'`).join(', ');

const hasOwnProperty = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop);

module.exports.VISIBILITIES = VISIBILITIES;
module.exports.DEFAULT_VISIBILITY = DEFAULT_VISIBILITY;
module.exports.UNHANDLED_EVENT_NAME = UNHANDLED_EVENT_NAME;
module.exports.isVisibilitySupported = isVisibilitySupported;
module.exports.getVisibility = getVisibility;
module.exports.parseComment = parseComment;
module.exports.getCommentFromSourceCode = getCommentFromSourceCode;
module.exports.NodeFunction = NodeFunction;
module.exports.value = value;
module.exports.values = values;
module.exports.buildObjectFromObjectExpression = buildObjectFromObjectExpression;
module.exports.buildPropertyAccessorChainFromAst = buildPropertyAccessorChainFromAst;
module.exports.buildPropertyAccessorChainFromTokens = buildPropertyAccessorChainFromTokens;
module.exports.getValueForPropertyAccessorChain = getValueForPropertyAccessorChain;
module.exports.tokensInterval = tokensInterval;
module.exports.getIdentifierValue = getIdentifierValue;
module.exports.getIdentifierValueFromStart = getIdentifierValueFromStart;
module.exports.unCamelcase = unCamelcase;
module.exports.getDependencies = getDependencies;
module.exports.escapeImportKeyword = escapeImportKeyword;
module.exports.inferTypeFromVariableDeclaration = inferTypeFromVariableDeclaration;
module.exports.isTopLevelComment = isTopLevelComment;
module.exports.buildCamelCase = buildCamelCase;
module.exports.isString = isString;
module.exports.printArray = printArray;
module.exports.hasOwnProperty = hasOwnProperty;
