const EventEmitter = require('events');
const { ScopeType } = require('../common');
const ts = require('typescript');

const RE_ANONYMOUS_FUNCTION = /^{?\s*function\s+\(/i;
const RE_STATIC_SCOPE = /\scontext=('module'|"module")/gi;

/**
 * @typedef ScriptParserOptions
 * @property {Svelte3FeatureKeys[]} features
 * @property {boolean} includeSourceLocations
 */

class TypeScriptParser extends EventEmitter {
    /**
     * @param {ScriptParserOptions} options
     */
    constructor(options) {
        super();

        this.includeSourceLocations = options.includeSourceLocations;
        this.features = options.features;

        // Internal properties
        this.identifiers = Object.create(null); // Empty Map
        this.imports = Object.create(null); // Empty Map
        this.dispatcherConstructorNames = [];
        this.dispatcherNames = [];
    }

    /**
     * @typedef {import("../helpers").HtmlBlock} HtmlBlock
     * @param {HtmlBlock[]} scripts
     */
    parse(scripts) {
        scripts.forEach(script => {
            this.parseScript(script);
        });
    }

    /**
     * @param {{ content: string; offset: number; attributes?: string }} script
     * @param {ScopeType} scope if passed, overrides the scopeType used during parsing
     */
    parseScript(script, scope) {
        const isStaticScope = RE_STATIC_SCOPE.test(script.attributes);

        const sourceFile = ts.createSourceFile('x.ts', script.content, ts.ScriptTarget.Latest, true);

        const scriptParseContext = {
            scopeType: scope || (isStaticScope ? ScopeType.SCOPE_STATIC : ScopeType.SCOPE_DEFAULT),
            offset: script.offset,
            sourceFile: sourceFile,
        };

        // TODO Process source File
    }

    /**
     * Call this to parse javascript expressions found in the template. The
     * content of the parsed scripts, such as dispatchers and identifiers, are
     * available so they will be recognized when used in template javascript
     * expressions.
     *
     * @param {string} expression javascript expression found in the template
     */
    parseScriptExpression(expression, offset = 0) {
        // Add name for anonymous functions to prevent parser error
        expression = expression.replace(RE_ANONYMOUS_FUNCTION, function (m) {
            // Preserve the curly brace if it appears in the quotes
            return m.startsWith('{') ? '{function a(' : 'function a(';
        });

        const expressionWrapper = {
            content: expression,
            offset: offset,
        };

        this.parseScript(expressionWrapper, ScopeType.SCOPE_MARKUP);
    }
}

module.exports = TypeScriptParser;