const EventEmitter = require('events');
const path = require('path');

const espree = require('espree');
const eslint = require('eslint');
const HtmlParser = require('htmlparser2-svelte').Parser;

const utils = require('./../utils');
const jsdoc = require('./../jsdoc');
const { validateFeatures, getAstDefaultOptions } = require('../options');

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

const PARAM_ALIASES = {
    arg: true,
    argument: true,
    param: true
};
const RETURN_ALIASES = {
    return: true,
    returns: true,
};

class Parser extends EventEmitter {
    constructor(options) {
        super();

        Parser.validateOptions(options);

        this.structure = options.structure;
        this.features = options.features;
        this.includeSourceLocations = options.includeSourceLocations;
        this.componentName = options.componentName;
        this.filename = options.filename;
        this.eventsEmitted = options.eventsEmitted;
        this.defaultMethodVisibility = options.defaultMethodVisibility;
        this.defaultActionVisibility = options.defaultActionVisibility;
        this.identifiers = options.identifiers;
        this.imports = options.imports;

        this.dispatcherConstructorNames = options.dispatcherConstructorNames;
        this.dispatcherNames = options.dispatcherNames;
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
            defaultMethodVisibility: utils.DEFAULT_VISIBILITY,
            defaultActionVisibility: utils.DEFAULT_VISIBILITY,
            features: [...SUPPORTED_FEATURES],
            componentName: null,
            eventsEmitted: {},
            identifiers: {},
            imports: {},
            dispatcherConstructorNames: [],
            dispatcherNames: [],
        };
    }

    static normalizeOptions(options) {
        const defaults = Parser.getDefaultOptions();

        Object.keys(defaults).forEach((optionKey) => {
            // If the key was not set by the user, apply default value.
            if (!(optionKey in options)) {
                options[optionKey] = defaults[optionKey];
            }
        });
    }

    static validateOptions(options) {
        Parser.normalizeOptions(options);

        // Check the presence and basic format of multiple options
        for (const key of ['eventsEmitted', 'identifiers', 'imports']) {
            const hasKey = (key in options);

            if (!hasKey) {
                throw new Error(`options.${key} is required`);
            }

            const hasCorrectType = typeof options[key] === 'object';

            if (!hasCorrectType) {
                throw new TypeError(`options.${key} must be of type 'object'`);
            }
        }

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

    updateType(item) {
        const typeKeyword = item.keywords.find(kw => kw.name === 'type');

        if (typeKeyword) {
            const parsedType = jsdoc.parseTypeKeyword(typeKeyword.description);

            if (parsedType) {
                item.type = parsedType;
            }
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

        this.updateType(item);

        this.emit('data', item);
    }

    emitMethodItem(method, parseContext, defaultVisibility, parentComment) {
        const comment = parentComment || utils.getCommentFromSourceCode(method.node, parseContext.sourceCode, { defaultVisibility });

        this.parseKeywords(comment.keywords, method);

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

        this.updateType(item);

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

    emitRefItem(ref) {
        const item = Object.assign({}, ref, {
            visibility: 'private'
        });

        this.emit('ref', item);
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
                const variables = this.parseVariableDeclaration(node);

                variables.forEach(variable => {
                    if (level === 0) {
                        this.emitDataItem(variable, parseContext, 'private');
                    }

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

            if (node.type === 'FunctionDeclaration') {
                this.emitMethodItem(this.parseFunctionDeclaration(node), parseContext, 'private');

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
                        const variables = this.parseVariableDeclaration(declaration);

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
                        const func = this.parseFunctionDeclaration(declaration);

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

    parseMarkupExpressionBlock(expression, offset) {
        // Add name for anonymous functions to prevent parser error
        const regex = /^{?\s*function\s+\(/i;

        expression = expression.replace(regex, function (m) {
            // When quotes in attributes used curcly braces are provided here, so we should handle it separatly
            if (m.startsWith('{')) {
                return '{function a(';
            }

            return 'function a(';
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
            scope: SCOPE_MARKUP,
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

        if (!args && args.length < 1) {
            return null;
        }

        const nameNode = args[0];

        return {
            name: nameNode.type === 'Literal'
                ? nameNode.value
                : undefined,
            node: node,
            location: {
                start: nameNode.start,
                end: nameNode.end
            }
        };
    }

    parseVariableDeclaration(node) {
        if (node.type !== 'VariableDeclaration') {
            throw new Error('Node should have a VariableDeclarationType, but is ' + node.type);
        }

        const result = [];

        node.declarations.forEach(declarator => {
            const idNode = declarator.id;

            if (idNode.type === 'Identifier') {
                result.push({
                    name: idNode.name,
                    kind: node.kind,
                    node: node,
                    declarator: declarator,
                    location: {
                        start: idNode.start,
                        end: idNode.end
                    }
                });
            } else if (idNode.type === 'ObjectPattern') {
                idNode.properties.forEach(propertyNode => {
                    const propertyIdNode = propertyNode.key;

                    if (propertyIdNode.type === 'Identifier') {
                        result.push({
                            name: propertyIdNode.name,
                            kind: node.kind,
                            node: node,
                            declarator: declarator,
                            locations: {
                                start: propertyIdNode.start,
                                end: propertyIdNode.end
                            }
                        });
                    }
                });
            }
        });

        return result;
    }

    parseFunctionDeclaration(node) {
        if (node.type !== 'FunctionDeclaration') {
            throw new Error('Node should have a FunctionDeclarationType, but is ' + node.type);
        }

        const params = [];

        node.params.forEach((param) => {
            if (param.type === 'Identifier') {
                params.push({
                    name: param.name,
                });
            }
        });

        const output = {
            node: node,
            name: node.id.name,
            location: {
                start: node.id.start,
                end: node.id.end
            },
            params: params,
        };

        return output;
    }

    parseObjectProperty(node) {
        if (node.type !== 'Property') {
            throw new Error('Node should have a Property, but is ' + node.type);
        }

        if (node.key && node.key.type !== 'Identifier') {
            throw new Error('Wrong property declaration');
        }

        return {
            name: node.key.name
        };
    }

    parseTemplate() {
        let rootElementIndex = 0;
        let lastComment = null;
        let lastAttributeIndex = 0;
        let lastAttributeLocations = {};
        let lastTagName = null;

        const parser = new HtmlParser({
            oncomment: (data) => {
                lastComment = data.trim();
            },
            ontext: (text) => {
                if (text.trim()) {
                    lastComment = null;
                }
            },
            onattribute: (name, value) => {
                if (this.includeSourceLocations && parser.startIndex >= 0 && parser.endIndex >= parser.startIndex) {
                    lastAttributeLocations[name] = {
                        start: lastAttributeIndex,
                        end: parser._tokenizer._index
                    };

                    lastAttributeIndex = parser._tokenizer._index;
                }

                if (this.features.includes('events')) {
                    if (lastTagName !== 'slot') {
                        // Expose events that propogated from child events
                        // Handle event syntax like ```<button on:click>Some link</button>```
                        if (name.length > 3 && name.indexOf('on:') === 0 && !value) {
                            const nameWithModificators = name.substr(3).split('|');

                            const baseEvent = {
                                name: nameWithModificators[0],
                                parent: lastTagName,
                                modificators: nameWithModificators.slice(1),
                                locations: this.includeSourceLocations && hasOwnProperty(lastAttributeLocations, name)
                                    ? [lastAttributeLocations[name]]
                                    : null
                            };

                            if (lastComment) {
                                lastComment = `/** ${lastComment} */`;
                            }

                            const comment = utils.parseComment(lastComment || '');

                            baseEvent.visibility = comment.visibility;
                            baseEvent.description = comment.description || '';
                            baseEvent.keywords = comment.keywords;

                            if (!hasOwnProperty(this.eventsEmitted, baseEvent.name)) {
                                this.eventsEmitted[baseEvent.name] = baseEvent;

                                this.parseKeywords(comment.keywords, baseEvent);
                                this.emit('event', baseEvent);
                            }

                            lastComment = null;
                        }

                        // Parse event handlers
                        if (name.length > 3 && name.indexOf('on:') === 0 && value) {
                            this.parseMarkupExpressionBlock(value);
                        }
                    }
                }
            },
            onopentagname: (tagName) => {
                lastTagName = tagName;
                lastAttributeIndex = parser._tokenizer._index;
                lastAttributeLocations = {};
            },
            onopentag: (tagName, attrs) => {
                const isNotStyleOrScript = !['style', 'script'].includes(tagName);
                const isTopLevelElement = parser._stack.length === 1;

                if (isTopLevelElement && isNotStyleOrScript) {
                    if (lastComment && rootElementIndex === 0) {
                        this.emitGlobalComment(utils.parseComment(lastComment));
                    }

                    rootElementIndex += 1;
                }

                if (tagName === 'slot') {
                    if (this.features.includes('slots')) {
                        const exposedParameters = Object.keys(attrs)
                            .filter(name => name.length > 0 && name !== 'name')
                            .map(name => ({
                                name: name,
                                visibility: 'public'
                            }));

                        const slot = {
                            name: attrs.name || 'default',
                            description: lastComment,
                            visibility: 'public',
                            parameters: exposedParameters
                        };

                        if (this.includeSourceLocations && parser.startIndex >= 0 && parser.endIndex >= parser.startIndex) {
                            slot.loc = {
                                start: parser.startIndex,
                                end: parser.endIndex
                            };
                        }

                        this.emit('slot', slot);
                    }
                } else {
                    if (tagName === 'svelte:options' && attrs.tag) {
                        if (this.features.includes('name')) {
                            this.emit('name', attrs.tag);
                        }
                    }

                    if (this.features.includes('data')) {
                        const bindProperties = Object.keys(attrs)
                            .filter(name => name.length > 5 && name.indexOf('bind:') === 0)
                            .filter(name => name !== 'bind:this')
                            .map(name => {
                                const sourcePropertyName = name.substr(5);

                                let targetPropertyName = sourcePropertyName;

                                const attributeValue = attrs[name];

                                if (attributeValue && attributeValue.length > 0) {
                                    targetPropertyName = attributeValue;
                                }

                                return {
                                    sourcePropertyName: sourcePropertyName,
                                    targetPropertyName: targetPropertyName,
                                    parent: tagName,
                                    locations: this.includeSourceLocations && hasOwnProperty(lastAttributeLocations, name)
                                        ? [lastAttributeLocations[name]]
                                        : null
                                };
                            });

                        bindProperties.forEach(bindProperty => {
                            const dataItem = {
                                name: bindProperty.targetPropertyName,
                                kind: undefined,
                                bind: [{
                                    source: bindProperty.parent,
                                    property: bindProperty.sourcePropertyName
                                }],
                                locations: bindProperty.locations,
                                visibility: 'private',
                                static: false,
                                readonly: false
                            };

                            this.emit('data', dataItem);
                        });
                    }

                    if (this.features.includes('refs')) {
                        if (hasOwnProperty(attrs, 'bind:this') && attrs['bind:this']) {
                            const bindedVariableName = attrs['bind:this'];

                            this.emitRefItem({
                                name: bindedVariableName,
                                parent: tagName,
                                locations: this.includeSourceLocations && hasOwnProperty(lastAttributeLocations, 'bind:this')
                                    ? [lastAttributeLocations['bind:this']]
                                    : null
                            });
                        }
                    }
                }
            }
        }, {
            lowerCaseTags: false,
            lowerCaseAttributeNames: false,
            curlyBracesInAttributes: true
        });

        parser.write(this.structure.template);
        parser.end();
    }

    /**
     * Mutates event.
     * @param {any[]} keywords
     * @param {{ params?: any[] }} event
     */
    parseKeywords(keywords = [], event) {
        if (!event.params) {
            event.params = [];
        }

        keywords.forEach(({ name, description }) => {
            if (name in PARAM_ALIASES) {
                const parsedParam = jsdoc.parseParamKeyword(description);
                const pIndex = event.params.findIndex(
                    p => p.name === parsedParam.name
                );

                /*
                 * Replace the param if there is already one present with
                 * the same name. This will happen with parsed
                 * FunctionDeclaration because params will already be
                 * present from parsing the AST node.
                 */
                if (pIndex >= 0) {
                    event.params[pIndex] = parsedParam;
                } else {
                    /*
                     * This means @param does not match an actual param
                     * in the FunctionDeclaration.
                     * TODO: Implement option to choose behaviour (keep, ignore, warn, throw)
                     */
                    event.params.push(parsedParam);
                }
            } else if (name in RETURN_ALIASES) {
                event.return = jsdoc.parseReturnKeyword(description);
            }
        });

        if (event.params.length === 0) {
            delete event.params;
        }
    }
}

module.exports = Parser;
module.exports.SUPPORTED_FEATURES = SUPPORTED_FEATURES;
