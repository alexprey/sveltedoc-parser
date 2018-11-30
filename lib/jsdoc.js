const PARAM_NAME = '[a-z0-9$\\.\\[\\]_]+';
const TYPE = '\\s*\\(?\\s*(?:(?:[a-z_]+[a-z0-9_<>\\[\\]]*|\'[^\']*\')\\s*\\|?\\s*)+\\s*\\)?\\s*';

const TYPE_RE = new RegExp(`^\\s*\\{(${TYPE})\\}`, 'i');
const PARAM_RE = new RegExp(`^\\s*(\\{\\(?(${TYPE})\\)?\\}\\s+)?(${PARAM_NAME}|\\[(${PARAM_NAME})(=(.*))?\\])\\s+-?\\s*(.*)`, 'i');
const RETURN_RE = new RegExp(`^\\s*(\\{\\(?(${TYPE})\\)?\\}\\s+)?-?(.*)`, 'i');

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
        type: DEFAULT_TYPE, 
        name: null, 
        description: null 
    };
    const matches = PARAM_RE.exec(text);

    if (matches) {
        if (matches[2]) {
            parseType(matches[2], param);
        }

        if (matches[3][0] === '[') {
            param.optional = true;
            param.name = matches[4] || matches[3].substring(1, matches[3].length - 1);

            if (matches[6]) {
                param.default = matches[6];
            }
        } else {
            param.name = matches[3];
        }

        param.description = matches[7];
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

module.exports.parseType = parseType;
module.exports.parseParamKeyword = parseParamKeyword;
module.exports.parseReturnKeyword = parseReturnKeyword;
module.exports.parseTypeKeyword = parseTypeKeyword;
module.exports.parseJSTypeFromValueNode = parseJSTypeFromValueNode;

module.exports.DEFAULT_TYPE = DEFAULT_TYPE;