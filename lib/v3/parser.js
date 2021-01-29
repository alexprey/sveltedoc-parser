const EventEmitter = require('events');
const path = require('path');

const espree = require('espree');
const eslint = require('eslint');

const utils = require('./../utils');
const jsdoc = require('./../jsdoc');
const {
    normalize: normalizeOptions,
    validateFeatures,
    getAstDefaultOptions
} = require('../options');

const {
    parseFunctionDeclaration,
    parseVariableDeclaration,
    parseAndMergeKeywords,
    updateType
} = require('./v3-utils');

const TemplateParser = require('./template');
const TemplateEvent = require('./template').TemplateEvent;

const hasOwnProperty = utils.hasOwnProperty;

const SUPPORTED_FEATURES = [
    'name',
    'data',
    'computed',
    'methods',
    'components',
    'description',
    'keywords',
    'events',
    'slots',
    'refs'
];

const SCOPE_DEFAULT = 'default';
const SCOPE_STATIC = 'static';
const SCOPE_MARKUP = 'markup';

const RE_ANONYMOUS_FUNCTION = /^{?\s*function\s+\(/i;

class Parser extends EventEmitter {
    constructor(options) {
        super();

        Parser.validateOptions(options);

        // External options
        this.filename = options.filename;
        this.structure = options.structure;
        this.features = options.features;
        this.includeSourceLocations = options.includeSourceLocations;

        // Internal properties
        this.componentName = null;
        this.eventsEmitted = {};
        this.identifiers = {};
        this.imports = {};
        this.dispatcherConstructorNames = [];
        this.dispatcherNames = [];
    }

    walk() {
        process.nextTick(() => {
            try {
                this.__walk();
            } catch (error) {
                this.emit('failure', error);
            }
        });

        return this;
    }

    __walk() {
        if (this.features.includes('name')) {
            this.parseComponentName();
        }

        if (this.structure.scripts) {
            this.structure.scripts.forEach(scriptBlock => {
                this.parseScriptBlock(scriptBlock);
            });
        }

        if (this.structure.template) {
            this.parseTemplate();
        }

        this.emit('end');
    }

    static getDefaultOptions() {
        return {
            includeSourceLocations: true,
            features: [...SUPPORTED_FEATURES],
        };
    }

    static validateOptions(options) {
        normalizeOptions(options, Parser.getDefaultOptions());

        validateFeatures(options, SUPPORTED_FEATURES);
    }

    static getEventName(feature) {
        return feature.endsWith('s')
            ? feature.substring(0, feature.length - 1)
            : feature;
    }

    parseComponentName() {
        if (this.componentName === null) {
            if (this.filename) {
                this.componentName = path.parse(this.filename).name;
            }
        }

        if (this.componentName) {
            this.emit('name', utils.buildCamelCase(this.componentName));
        }
    }

    emitDataItem(variable, parseContext, defaultVisibility, parentComment) {
        const comment = parentComment || utils.getCommentFromSourceCode(variable.node, parseContext.sourceCode, { defaultVisibility });

        const item = Object.assign({}, comment, {
            name: variable.name,
            kind: variable.kind,
            static: parseContext.scopeType === SCOPE_STATIC,
            readonly: variable.kind === 'const',
            type: utils.inferTypeFromVariableDeclaration(variable),
            importPath: variable.importPath,
            originalName: variable.originalName,
            localName: variable.localName
        });

        if (variable.declarator && variable.declarator.init) {
            item.defaultValue = variable.declarator.init.value;
        }

        if (this.includeSourceLocations && variable.location) {
            item.locations = [{
                start: variable.location.start + parseContext.offset,
                end: variable.location.end + parseContext.offset,
            }];
        }

        updateType(item);

        this.emit('data', item);
    }

    emitMethodItem(method, parseContext, defaultVisibility, parentComment) {
        const comment = parentComment || utils.getCommentFromSourceCode(method.node, parseContext.sourceCode, { defaultVisibility });

        parseAndMergeKeywords(comment.keywords, method);

        const item = Object.assign({}, comment, {
            name: method.name,
            params: method.params,
            return: method.return,
            static: parseContext.scopeType === SCOPE_STATIC
        });

        if (this.includeSourceLocations && method.location) {
            item.locations = [{
                start: method.location.start + parseContext.offset,
                end: method.location.end + parseContext.offset
            }];
        }

        this.emit('method', item);
    }

    emitComputedItem(computed, parseContext, defaultVisibility) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(computed.node, parseContext.sourceCode, { defaultVisibility }), {
            name: computed.name,
            static: parseContext.scopeType === SCOPE_STATIC,
            type: jsdoc.DEFAULT_TYPE
        });

        if (this.includeSourceLocations && computed.location) {
            item.locations = [{
                start: computed.location.start + parseContext.offset,
                end: computed.location.end + parseContext.offset
            }];
        }

        updateType(item);

        this.emit('computed', item);
    }

    emitEventItem(event, parseContext) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(event.node, parseContext.sourceCode, { defaultVisibility: 'public' }), {
            name: event.name
        });

        if (this.includeSourceLocations && event.location) {
            item.locations = [{
                start: event.location.start + parseContext.offset,
                end: event.location.end + parseContext.offset
            }];
        }

        this.emit('event', item);
    }

    emitImportedComponentItem(component, parseContext) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(component.node, parseContext.sourceCode, { defaultVisibility: 'private' }), {
            name: component.name,
            importPath: component.path,
        });

        if (this.includeSourceLocations && component.location) {
            item.locations = [{
                start: component.location.start + parseContext.offset,
                end: component.location.end + parseContext.offset
            }];
        }

        this.emit('component', item);
    }

    emitGlobalComment(comment) {
        if (comment && utils.isTopLevelComment(comment)) {
            if (this.features.includes('description')) {
                this.emit('description', comment.description);
            }

            this.emit('keywords', comment.keywords);
        }
    }

    parseBodyRecursively(rootNode, parseContext, level) {
        const nodes = rootNode.body
            ? rootNode.body
            : (rootNode.length > 0 ? rootNode : [rootNode]);

        nodes.forEach((node, index) => {
            if (index === 0 && level === 0) {
                const firstComment = utils.getCommentFromSourceCode(node, parseContext.sourceCode, { useTrailing: false, useFirst: true });

                this.emitGlobalComment(firstComment);
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

                        this.emitEventItem(eventItem, parseContext);

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

                    this.emitEventItem(eventItem, parseContext);

                    return;
                }
            }

            if (node.type === 'VariableDeclaration' && parseContext.scopeType !== SCOPE_MARKUP) {
                const variables = parseVariableDeclaration(node);

                variables.forEach(variable => {
                    if (level === 0) {
                        this.emitDataItem(variable, parseContext, 'private');
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
                this.emitMethodItem(parseFunctionDeclaration(node), parseContext, 'private');

                if (node.body) {
                    this.parseBodyRecursively(node.body, parseContext, level + 1);
                }

                return;
            }

            if (node.type === 'ExportNamedDeclaration' && level === 0 && parseContext.scopeType !== SCOPE_MARKUP) {
                const declaration = node.declaration;
                const specifiers = node.specifiers;

                if (declaration) {
                    const exportNodeComment = utils.getCommentFromSourceCode(node, parseContext.sourceCode, { defaultVisibility: 'public', useLeading: true, useTrailing: false });

                    if (declaration.type === 'VariableDeclaration') {
                        const variables = parseVariableDeclaration(declaration);

                        variables.forEach(variable => {
                            this.emitDataItem(variable, parseContext, 'public', exportNodeComment);

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

                        this.emitMethodItem(func, parseContext, 'public', exportNodeComment);

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

                            this.emitDataItem({
                                node: specifier,
                                name: exportedOrLocalName,
                                localName: specifier.local.name,
                                kind: 'const',
                                location: {
                                    start: specifier.exported ? specifier.exported.start : specifier.local.start,
                                    end: specifier.exported ? specifier.exported.end : specifier.local.end
                                }
                            }, parseContext, 'public');
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
                                this.emitComputedItem({
                                    name: leftNode.name,
                                    location: {
                                        start: leftNode.start,
                                        end: leftNode.end
                                    },
                                    node: node
                                }, parseContext, 'private');

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

                                    this.emitImportedComponentItem(component, parseContext);

                                    return;
                                } else {
                                    const imported = specifier.imported
                                        ? specifier.imported.name
                                        : undefined;

                                    this.emitDataItem({
                                        node,
                                        name: importEntry.identifier,
                                        originalName: imported || importEntry.identifier,
                                        importPath: importEntry.sourceFilename,
                                        kind: 'const',
                                        location: {
                                            start: specifier.local.start,
                                            end: specifier.local.end
                                        }
                                    }, parseContext, 'private');
                                }
                            }
                        }
                    } else if (node.specifiers.length > 0) {
                        node.specifiers.forEach((specifier) => {
                            if (specifier.type === 'ImportSpecifier') {
                                this.emitDataItem({
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
                                }, parseContext, 'private');
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

    parseScriptBlock(scriptBlock) {
        const ast = espree.parse(
            scriptBlock.content,
            getAstDefaultOptions()
        );

        const sourceCode = new eslint.SourceCode({
            text: scriptBlock.content,
            ast: ast
        });

        const isStaticScope = /\sscope=('module'|"module")/gi.test(scriptBlock.attributes);

        const scriptParseContext = {
            scopeType: isStaticScope
                ? SCOPE_STATIC
                : SCOPE_DEFAULT,
            offset: scriptBlock.offset,
            sourceCode: sourceCode
        };

        this.parseBodyRecursively(ast, scriptParseContext, 0);
    }

    parseTemplateJavascriptExpression(expression, offset) {
        // Add name for anonymous functions to prevent parser error
        expression = expression.replace(RE_ANONYMOUS_FUNCTION, function (m) {
            // Preserve the curly brace if it appears in the quotes
            return m.startsWith('{') ? '{function a(' : 'function a(';
        });

        const ast = espree.parse(
            expression,
            getAstDefaultOptions()
        );

        const sourceCode = new eslint.SourceCode({
            text: expression,
            ast: ast
        });

        const scriptParseContext = {
            // scope: SCOPE_MARKUP, // TODO: This is not used. SCOPE_TYPE instead
            offset: offset,
            sourceCode: sourceCode
        };

        this.parseBodyRecursively(ast, scriptParseContext, 0);
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
            const chain = utils.buildPropertyAccessorChainFromAst(nameNode);

            // This function can throw if chain is not valid
            name = utils.getValueForPropertyAccessorChain(this.identifiers, chain);
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

    parseTemplate() {
        const templateParser = new TemplateParser(this);

        // Forward emit of basic template events
        templateParser.on(TemplateEvent.DATA, (dataItem) => {
            this.emit('data', dataItem);
        });
        templateParser.on(TemplateEvent.EVENT, (event) => {
            this.emit('event', event);
        });
        templateParser.on(TemplateEvent.NAME, (name) => {
            this.emit('name', name);
        });
        templateParser.on(TemplateEvent.REF, (refItem) => {
            this.emit('ref', refItem);
        });
        templateParser.on(TemplateEvent.SLOT, (slot) => {
            this.emit('slot', slot);
        });

        // Special cases where more parsing is required
        templateParser.on(TemplateEvent.EXPRESSION, (expression) => {
            this.parseTemplateJavascriptExpression(expression);
        });
        templateParser.on(TemplateEvent.GLOBAL_COMMENT, (comment) => {
            this.emitGlobalComment(comment);
        });

        templateParser.parse();
    }
}

module.exports = Parser;
module.exports.SUPPORTED_FEATURES = SUPPORTED_FEATURES;
