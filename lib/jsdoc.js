
const PARAM_NAME = '[a-z0-9$\\.\\[\\]_]+';

const TYPE = '\\{([^\\}]*)\\}';
const PARAM_TYPE = '\\{((?:\\.\\.\\.)?[^\\}]*)=?\\}';

const TYPE_RE = new RegExp(`^\\s*${TYPE}`, 'i');
const PARAM_RE = new RegExp(`^\\s*(?:${PARAM_TYPE}\\s+)?(?:\\[\\s*(${PARAM_NAME})\\s*(?:=\s*([^\\]]+))?\\]|(${PARAM_NAME}))(?:\\s+(?:\\-\\s+)?(.*))?`, 'i');
const RETURN_RE = new RegExp(`^\\s*(${TYPE}\\s+)?-?(.*)`, 'i');

const DEFAULT_TYPE = 'any';

function parseType(type, param) {
    if (type.indexOf('|') > -1) {
        param.type = type.split('|');
    } else if (type.startsWith('...')) {
        param.type = type.substring(3);
        param.repeated = true;
    } else if (type === '*') {
        param.type = DEFAULT_TYPE;
    } else {
        param.type = type;
    }
}

function parseJSDocType(typeValue) {
    typeValue = typeValue.trim();
    if (typeValue.indexOf('|') > -1) {
        if (typeValue.startsWith('(') && typeValue.endsWith(')')) {
            typeValue = typeValue.substring(1, typeValue.length - 1).trim();
        }

        const types = typeValue.split('|');

        return {
            'kind': 'union',
            'text': typeValue,
            'type': types
                .map(type => parseJSDocType(type))
                .filter(type => type != null)
        }
    }

    if (typeValue.startsWith('\'') && typeValue.endsWith('\'')) {
        return {
            'kind': 'const',
            'text': typeValue,
            'type': 'string',
            'value': typeValue.substr(1, typeValue.length - 2)
        }
    }

    if (typeValue === '*') {
        return {
            'kind': 'type',
            'text': typeValue,
            'type': DEFAULT_TYPE
        }    
    }

    return {
        'kind': 'type',
        'text': typeValue,
        'type': typeValue
    }
}

function parseJSTypeFromValueNode(valueNode) {
    if (valueNode == null) {
        return null;
    }

    if (valueNode.type === 'ArrayExpression') {
        return {
            'kind': 'type',
            'text': 'Array<any>',
            'type': 'Array<any>'
        };
    }

    if (typeof(valueNode) === 'object') {
        return {
            'kind': 'type',
            'text': 'any',
            'type': 'any'
        };
    }

    return {
        'kind': 'type',
        'text': typeof(valueNode),
        'type': typeof(valueNode)
    };
}

function parseTypeKeyword(text) {
    const match = TYPE_RE.exec(text);

    if (match) {
        const typeValue = match[1];

        if (typeValue) {
            return parseJSDocType(typeValue);
        }
    }

    return null;
}

function parseParamKeyword(text) {
    const param = {
        type: {
            'kind': 'type',
            'text': '*',
            'type': DEFAULT_TYPE
        },
        name: null, 
        optional: false,
        default: null,
        description: null
    };
    
    const match = PARAM_RE.exec(text);

    if (match) {
        if (match[1]) {
            let parameterType = match[1];

            // Check if that repeated parameter, like `@param {...string} parameter`
            if (parameterType.startsWith('...')) {
                param.repeated = true;
                parameterType = parameterType.substr(3);
            }

            // Check Google Closure Compiler syntax for optional parameters, like `@param {string=} parameter`
            if (parameterType.endsWith('=')) {
                param.optional = true;
                parameterType = parameterType.substr(0, parameterType.length - 1);
            }

            param.type = parseJSDocType(parameterType);
        }

        // Optional parameter name
        if (match[2]) {
            param.name = match[2].trim();
            param.optional = true;

            if (match[3]) {
                param.default = match[3].trim();
            }
        }

        // Required parameter name
        if (match[4]) {
            param.name = match[4].trim();
        }

        // Description
        if (match[5]) {
            param.description = match[5].trim();
        }
    }

    return param;

    if (match) {
        if (match[2]) {
            param.type = parseJSDocType(match[2]);
        }

        if (match[3][0] === '[') {
            param.optional = true;
            param.name = match[4] || match[3].substring(1, match[3].length - 1);

            if (match[6]) {
                param.default = match[6];
            }
        } else {
            param.name = match[3];
        }

        param.description = match[7];
    }

    return param;
}

function parseReturnKeyword(text) {
    const output = { type: DEFAULT_TYPE, desc: '' };
    const matches = RETURN_RE.exec(text);

    if (matches[2]) {
        parseType(matches[2], output);
    }

    output.desc = matches[3];

    return output;
}

module.exports = {
    parseType,
    parseParamKeyword,
    parseReturnKeyword,
    parseTypeKeyword,
    parseJSTypeFromValueNode,

    DEFAULT_TYPE
};