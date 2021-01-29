const espree = require('espree');
const eslint = require('eslint');
const EventEmitter = require('events');

const { getAstDefaultOptions } = require('../options');
const {
    hasOwnProperty,
    getCommentFromSourceCode,
    buildPropertyAccessorChainFromAst,
    getValueForPropertyAccessorChain,
} = require('../utils');

const {
    parseFunctionDeclaration,
    parseVariableDeclaration,
} = require('./v3-utils');

const RE_STATIC_SCOPE = /\sscope=('module'|"module")/gi;

const SCOPE_DEFAULT = 'default';
const SCOPE_STATIC = 'static';
const SCOPE_MARKUP = 'markup';

class ScriptParser extends EventEmitter {
    /**
     * @typedef {import("../helpers").HtmlBlock} HtmlBlock
     * @param {HtmlBlock[]} scripts
     */
    constructor(scripts) {
        super();

        this.scripts = scripts;

        // Internal properties
        this.identifiers = Object.create(null); // Empty Map
        this.imports = Object.create(null); // Empty Map
        this.dispatcherConstructorNames = [];
        this.dispatcherNames = [];
    }

    parse() {
        this.scripts.forEach(script => {
            this.parseScript(script);
        });
    }

    /**
     * @param {HtmlBlock} script
     */
    parseScript(script) {
        const ast = espree.parse(
            script.content,
            getAstDefaultOptions()
        );
        const sourceCode = new eslint.SourceCode({
            text: script.content,
            ast: ast
        });

        const isStaticScope = RE_STATIC_SCOPE.test(script.attributes);
        const scriptParseContext = {
            scopeType: isStaticScope
                ? SCOPE_STATIC
                : SCOPE_DEFAULT,
            offset: script.offset,
            sourceCode: sourceCode
        };

        this.parseBodyRecursively(ast, scriptParseContext, 0);
    }

    /**
     * Call this to parse javascript expressions found in the template. The
     * content of the parsed scripts, such as dispatchers and identifiers, are
     * available so they will be recognized when used in template javascript
     * expressions.
     *
     * @param {string} expression javascript expression found in the template
     */
    parseJavascriptExpression(expression, offset = 0) {
        const expressionWrapper = {
            content: expression,
            offset: offset,
        };

        this.parseScript(expressionWrapper);
    }

    parseEventDeclaration(node) {
        if (node.type !== 'CallExpression') {
            throw new Error('Node should have a CallExpressionType, but is ' + node.type);
        }

        const args = node.arguments;

        if (!args || !args.length) {
            return null;
        }

        const nameNode = args[0];

        let name;

        try {
            const chain = buildPropertyAccessorChainFromAst(nameNode);

            // This function can throw if chain is not valid
            name = getValueForPropertyAccessorChain(this.identifiers, chain);
        } catch (error) {
            name = nameNode.type === 'Literal'
                ? nameNode.value
                : undefined;
        }

        return {
            name: name,
            node: node,
            location: {
                start: nameNode.start,
                end: nameNode.end
            }
        };
    }

    parseBodyRecursively(rootNode, parseContext, level) {
        const nodes = rootNode.body
            ? rootNode.body
            : (rootNode.length > 0 ? rootNode : [rootNode]);

        nodes.forEach((node, index) => {
            if (index === 0 && level === 0) {
                const firstComment = getCommentFromSourceCode(node, parseContext.sourceCode, { useTrailing: false, useFirst: true });

                this.emit('global-comment', firstComment);
            }

            if (node.type === 'BlockStatement') {
                this.parseBodyRecursively(node.body, parseContext, level);

                return;
            }

            if (node.type === 'ExpressionStatement') {
                const expressionNode = node.expression;

                if (expressionNode.type === 'CallExpression') {
                    const callee = expressionNode.callee;

                    if (expressionNode.arguments) {
                        this.parseBodyRecursively(expressionNode.arguments, parseContext, level + 1);
                    }

                    if (callee.type === 'Identifier' && this.dispatcherNames.indexOf(callee.name) >= 0) {
                        const eventItem = this.parseEventDeclaration(expressionNode);

                        this.emit('event', eventItem, parseContext);

                        return;
                    }
                }

                if (expressionNode.type === 'ArrowFunctionExpression') {
                    if (expressionNode.body) {
                        this.parseBodyRecursively(expressionNode.body, parseContext, level + 1);

                        return;
                    }
                }
            }

            if (node.type === 'CallExpression') {
                const callee = node.callee;

                if (node.arguments) {
                    this.parseBodyRecursively(node.arguments, parseContext, level + 1);
                }

                if (callee.type === 'Identifier' && this.dispatcherNames.includes(callee.name)) {
                    const eventItem = this.parseEventDeclaration(node);

                    this.emit('event', eventItem, parseContext);

                    return;
                }
            }

            if (node.type === 'VariableDeclaration' && parseContext.scopeType !== SCOPE_MARKUP) {
                const variables = parseVariableDeclaration(node);

                variables.forEach(variable => {
                    if (level === 0) {
                        this.emit('data', variable, parseContext, 'private');
                    }

                    if (variable.declarator.init) {
                        const idNode = variable.declarator.id;
                        const initNode = variable.declarator.init;

                        // Store top level variables in 'identifiers'
                        if (level === 0 && idNode.type === 'Identifier') {
                            this.identifiers[idNode.name] = variable.declarator.init;
                        }

                        if (initNode.type === 'CallExpression') {
                            const callee = initNode.callee;

                            if (initNode.arguments) {
                                this.parseBodyRecursively(initNode.arguments, parseContext, level + 1);
                            }

                            if (callee.type === 'Identifier' && this.dispatcherConstructorNames.includes(callee.name)) {
                                this.dispatcherNames.push(variable.name);
                            }
                        } else if (initNode.type === 'ArrowFunctionExpression') {
                            if (initNode.body) {
                                this.parseBodyRecursively(initNode.body, parseContext, level + 1);
                            }
                        }
                    }
                });

                return;
            }

            if (node.type === 'FunctionDeclaration') {
                const func = parseFunctionDeclaration(node);

                this.emit('method', func, parseContext, 'private');

                if (node.body) {
                    this.parseBodyRecursively(node.body, parseContext, level + 1);
                }

                return;
            }

            if (node.type === 'ExportNamedDeclaration' && level === 0 && parseContext.scopeType !== SCOPE_MARKUP) {
                const declaration = node.declaration;
                const specifiers = node.specifiers;

                if (declaration) {
                    const exportNodeComment = getCommentFromSourceCode(node, parseContext.sourceCode, { defaultVisibility: 'public', useLeading: true, useTrailing: false });

                    if (declaration.type === 'VariableDeclaration') {
                        const variables = parseVariableDeclaration(declaration);

                        variables.forEach(variable => {
                            this.emit('data', variable, parseContext, 'public', exportNodeComment);

                            if (variable.declarator.init) {
                                const initNode = variable.declarator.init;

                                if (initNode.type === 'CallExpression') {
                                    const callee = initNode.callee;

                                    if (initNode.arguments) {
                                        this.parseBodyRecursively(initNode.arguments, parseContext, level + 1);
                                    }

                                    if (callee.type === 'Identifier' && this.dispatcherConstructorNames.includes(callee.name)) {
                                        this.dispatcherNames.push(variable.name);
                                    }
                                } else if (initNode.type === 'ArrowFunctionExpression') {
                                    if (initNode.body) {
                                        this.parseBodyRecursively(initNode.body, parseContext, level + 1);
                                    }
                                }
                            }
                        });

                        return;
                    }

                    if (declaration.type === 'FunctionDeclaration') {
                        const func = parseFunctionDeclaration(declaration);

                        this.emit('method', func, parseContext, 'public', exportNodeComment);

                        if (declaration.body) {
                            this.parseBodyRecursively(declaration.body, parseContext, level + 1);
                        }

                        return;
                    }
                }

                if (specifiers) {
                    specifiers.forEach(specifier => {
                        if (specifier.type === 'ExportSpecifier') {
                            const exportedOrLocalName = specifier.exported
                                ? specifier.exported.name
                                : specifier.local.name;

                            const dataItem = {
                                node: specifier,
                                name: exportedOrLocalName,
                                localName: specifier.local.name,
                                kind: 'const',
                                location: {
                                    start: specifier.exported ? specifier.exported.start : specifier.local.start,
                                    end: specifier.exported ? specifier.exported.end : specifier.local.end
                                }
                            };

                            this.emit('data', dataItem, parseContext, 'public');
                        }
                    });
                }
            }

            if (node.type === 'LabeledStatement' && level === 0 && parseContext.scopeType !== SCOPE_MARKUP) {
                const idNode = node.label;

                if (idNode && idNode.type === 'Identifier' && idNode.name === '$') {
                    if (node.body && node.body.type === 'ExpressionStatement') {
                        const expression = node.body.expression;

                        if (expression && expression.type === 'AssignmentExpression') {
                            const leftNode = expression.left;

                            if (leftNode.type === 'Identifier') {
                                const computedItem = {
                                    name: leftNode.name,
                                    location: {
                                        start: leftNode.start,
                                        end: leftNode.end
                                    },
                                    node: node
                                };

                                this.emit('computed', computedItem, parseContext, 'private');

                                return;
                            }
                        }
                    }
                }
            }

            if (node.type === 'ImportDeclaration' && level === 0 && parseContext.scopeType !== SCOPE_MARKUP) {
                const specifier = node.specifiers[0];
                const source = node.source;

                if (source && source.type === 'Literal') {
                    const sourceFileName = source.value;

                    if (specifier && specifier.type === 'ImportDefaultSpecifier') {
                        const importEntry = {
                            identifier: specifier.local.name,
                            sourceFilename: sourceFileName
                        };

                        if (!hasOwnProperty(this.imports, importEntry.identifier)) {
                            this.imports[importEntry.identifier] = importEntry;

                            if (importEntry.identifier) {
                                if (importEntry.identifier[0] === importEntry.identifier[0].toUpperCase()) {
                                    const component = {
                                        node: node,
                                        name: importEntry.identifier,
                                        path: importEntry.sourceFilename,
                                        location: {
                                            start: specifier.local.start,
                                            end: specifier.local.end
                                        }
                                    };

                                    this.emit('imported-component', component, parseContext);

                                    return;
                                } else {
                                    const imported = specifier.imported
                                        ? specifier.imported.name
                                        : undefined;

                                    const dataItem = {
                                        node,
                                        name: importEntry.identifier,
                                        originalName: imported || importEntry.identifier,
                                        importPath: importEntry.sourceFilename,
                                        kind: 'const',
                                        location: {
                                            start: specifier.local.start,
                                            end: specifier.local.end
                                        }
                                    };

                                    this.emit('data', dataItem, parseContext, 'private');
                                }
                            }
                        }
                    } else if (node.specifiers.length > 0) {
                        node.specifiers.forEach((specifier) => {
                            if (specifier.type === 'ImportSpecifier') {
                                const dataItem = {
                                    node: specifier,
                                    name: specifier.local.name,
                                    originalName: specifier.imported
                                        ? specifier.imported.name
                                        : specifier.local.name,
                                    importPath: sourceFileName,
                                    kind: 'const',
                                    location: {
                                        start: specifier.local.start,
                                        end: specifier.local.end
                                    }
                                };

                                this.emit('data', dataItem, parseContext, 'private');
                            }
                        });
                    }

                    // Import svelte API functions
                    if (sourceFileName === 'svelte') {
                        // Dispatcher constructors
                        node.specifiers
                            .filter(specifier => specifier.imported.name === 'createEventDispatcher')
                            .forEach(specifier => {
                                this.dispatcherConstructorNames.push(specifier.local.name);
                            });
                    }
                }
            }

            if (node.body) {
                this.parseBodyRecursively(node.body, parseContext, level + 1);
            }
        });
    }
}

module.exports = ScriptParser;
module.exports.SCOPE_STATIC = SCOPE_STATIC;
