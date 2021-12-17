const EventEmitter = require('events');
const { ScopeType } = require('../common');
const { ScriptEvent } = require('../v3/events');
const ts = require('typescript');
const { parseComment, VISIBILITIES } = require('../utils');

const RE_ANONYMOUS_FUNCTION = /^{?\s*function\s+\(/i;
const RE_STATIC_SCOPE = /\scontext=('module'|"module")/gi;

/**
 * @typedef ScriptParserContext
 * @property {ScopeType} scopeType
 * @property {ts.SourceFile} sourceCode
 * @property {number} offset
 * @property {string} content
 */

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
     * @sideEffect mutates `item.locations`.
     *
     * Attaches the node's location to the item if requested by the user.
     *
     * @param {import('../../typings').ISvelteItem} item the item to attach locations to
     * @param {{ location?: { start: number, end: number } }} node the parsed node containing a location
     * @param {{ offset: number }} context parse context containing an offset for locations
     */
    attachLocationsIfRequired(item, node, context) {
        if (this.includeSourceLocations && node.location) {
            item.locations = [{
                start: node.location.start + context.offset,
                end: node.location.end + context.offset,
            }];
        }
    }

    /**
     * @param {ScriptParserContext} parseContext
     * @param {ts.Node} node 
     * @param {ts.SyntaxKind[]} stopList 
     * @param {string} defaultVisibility
     */
    findLeadingCommentForNode(parseContext, node, stopList, defaultVisibility) {
        const comments = ts.getLeadingCommentRanges(parseContext.content, node.pos);

        if (comments && comments.length > 0) {
            const comment = comments[comments.length - 1];
            const commentText = parseContext.content.substring(comment.pos, comment.end);

            return parseComment(commentText, defaultVisibility);
        }

        if (stopList.includes(node.kind)) {
            return {
                keywords: [],
                description: '',
                visibility: defaultVisibility
            };
        }

        const parent = node.parent;

        if (parent) {
            return this.findLeadingCommentForNode(parseContext, parent, stopList, defaultVisibility);
        }

        return {
            keywords: [],
            description: '',
            visibility: defaultVisibility
        };
    }

    /**
     * @private
     * @param {ScriptParserContext} parseContext 
     */
    emitDataItem(variable, parseContext) {
        /** @type {import('../../typings').SvelteDataItem} */
        const item = {
            name: variable.name,
            kind: variable.kind,
            static: parseContext.scopeType === ScopeType.SCOPE_STATIC,
            readonly: variable.kind === 'const',
            type: variable.type,
            importPath: variable.importPath,
            originalName: variable.originalName,
            localName: variable.localName,
            keywords: variable.keywords,
            description: variable.description,
            visibility: variable.visibility,
        };

        this.attachLocationsIfRequired(item, variable, parseContext);

        this.emit(ScriptEvent.DATA, item);
    }

    /**
     * @param {ScriptParserContext} parseContext
     * @param {ts.VariableDeclaration} node 
     * @param {string} defaultVisibility
     */
    extractVariablesFromDeclaration(parseContext, node, defaultVisibility) {
        const result = [];
        const nameNode = node.name;

        let variableKind = 'const';

        const parent = node.parent;

        if (parent && parent.kind === ts.SyntaxKind.VariableDeclarationList) {            
            if ((parent.flags & ts.NodeFlags.Let) === ts.NodeFlags.Let) {
                variableKind = 'let';
            } else if ((parent.flags & ts.NodeFlags.Const) === ts.NodeFlags.Const) {
                variableKind = 'const';
            }
        }

        if (nameNode) {
            if (nameNode.kind === ts.SyntaxKind.Identifier) {
                // Single variable
                const comment = this.findLeadingCommentForNode(parseContext, nameNode, [ ts.SyntaxKind.ImportDeclaration, ts.SyntaxKind.VariableStatement ], defaultVisibility);

                result.push({
                    ...comment,
                    name: nameNode.text,
                    kind: variableKind,
                    localName: nameNode.text,
                    location: {
                        start: nameNode.pos,
                        end: nameNode.end,
                    }
                });
            }

            if (nameNode.kind === ts.SyntaxKind.ObjectBindingPattern) {
                // Multiple variables
                nameNode.elements.forEach(element => {
                    const comment = this.findLeadingCommentForNode(parseContext, element, [ ts.SyntaxKind.ObjectBindingPattern ], defaultVisibility);

                    const name = element.name.text;
                    const originalName = element.propertyName
                        ? element.propertyName.text
                        : undefined;

                    result.push({
                        ...comment,
                        name: name,
                        kind: variableKind,
                        localName: name,
                        originalName: originalName || name,
                        location: {
                            start: element.name.pos,
                            end: element.name.end,
                        }
                    });
                });
            }
        }

        return result;
    }

    /**
     * @private
     * @param {ts.VariableDeclaration} node 
     * @param {ScriptParserContext} parseContext 
     * @param {number} level 
     * @param {string} defaultVisibility
     */
    parseVariableDeclaration(node, parseContext, level, defaultVisibility) {
        if (parseContext.scopeType === ScopeType.SCOPE_MARKUP) {
            return;
        }

        const variables = this.extractVariablesFromDeclaration(parseContext, node, defaultVisibility);

        variables.forEach(variable => {
            const item = {
                ...variable,
                type: node.type 
                    ? node.type.getText()
                    : 'any'
            };

            this.emitDataItem(item, parseContext);
        });
    }

    /**
     * @private
     * @param {ts.Node} node 
     * @param {ScriptParserContext} parseContext
     * @param {number} level
     */
    parseNode(node, parseContext, level) {
        if (!node) {
            throw TypeError('parseNode was called without a node');
        }

        if (node.kind === ts.SyntaxKind.VariableStatement && parseContext.scopeType !== ScopeType.SCOPE_MARKUP) {
            const isPublic = node.modifiers && node.modifiers.includes(ts.ModifierFlags.Export);
            if (node.declarationList && node.declarationList.declarations) {
                node.declarationList.declarations.forEach(variableDeclaration => {
                    this.parseVariableDeclaration(variableDeclaration, parseContext, level, isPublic ? 'public' : 'private');
                });
            }

            return;
        }

        if (node.kind === ts.SyntaxKind.NamedExports) {
            node.elements.forEach(
                /** @param {ts.NamedExports} element */ 
                (element) => {
                    const comment = this.findLeadingCommentForNode(parseContext, element, [ ts.SyntaxKind.NamedExports ], 'public');

                    const name = element.name.text;
                    const originalName = element.propertyName
                        ? element.propertyName.text
                        : undefined;

                    const dataItem = {
                        ...comment,
                        name: name,
                        kind: 'const',
                        localName: name,
                        originalName: originalName || name,
                        location: {
                            start: element.name.pos,
                            end: element.name.end,
                        }
                    };

                    this.emitDataItem(dataItem, parseContext);
            });

            return;
        }

        ts.forEachChild(node, child => this.parseNode(child, parseContext, level++));
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
            content: script.content,
        };

        this.parseNode(sourceFile, scriptParseContext);

        // TODO Process source File
        // https://ts-ast-viewer.com to debug
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