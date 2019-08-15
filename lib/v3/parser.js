const EventEmitter = require('events');
const util = require('util');
const path = require('path');

const espree = require('espree');
const HtmlParser = require('htmlparser2').Parser;

const utils = require('./../utils');
const jsdoc = require('./../jsdoc');

const DEFAULT_OPTIONS = {};

const SUPPORTED_FEATURES = [
    'name',
    'data',
    'computed',
    'methods',
    'components',
    'description',
    'events',
    'slots',
    'refs'
];

const SCOPE_DEFAULT = 'default';
const SCOPE_STATIC = 'static';
const SCOPE_MARKUP = 'markup';

class Parser extends EventEmitter {
    constructor(structure, options) {
        super();

        this._options = Object.assign({}, DEFAULT_OPTIONS, options);

        this.structure = structure;
        this.features = options.features || SUPPORTED_FEATURES;
        this.includeSourceLocations = options.includeSourceLocations;
        this.componentName = null;
        this.filename = options.filename;
        this.eventsEmmited = {};
        this.defaultMethodVisibility = options.defaultMethodVisibility;
        this.defaultActionVisibility = options.defaultActionVisibility;
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
            this.emit('name', utils.unCamelcase(this.componentName));
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

    emitDataItem(variable, scopeType, defaultVisibility, parentComment) {
        const comment = parentComment || utils.getComment(variable.node, defaultVisibility);

        const item = Object.assign({},  comment, {
            name: variable.name,
            kind: variable.kind,
            static: scopeType === SCOPE_STATIC,
            readonly: variable.kind === 'const',
            type: jsdoc.DEFAULT_TYPE,
            importPath: variable.importPath,
            originalName: variable.originalName
        });

        this.updateType(item);

        this.emit('data', item);
    }

    emitMethodItem(method, scopeType, defaultVisibility, parentComment) {
        const comment = parentComment || utils.getComment(method.node, defaultVisibility);

        const item = Object.assign({}, comment, {
            name: method.name,
            args: method.args,
            static: scopeType === SCOPE_STATIC
        });

        this.emit('method', item);
    }

    emitComputedItem(computed, scopeType, defaultVisibility) {
        const item = Object.assign({}, utils.getComment(computed.node, defaultVisibility), {
            name: computed.name,
            static: scopeType === SCOPE_STATIC,
            type: jsdoc.DEFAULT_TYPE
        });

        this.updateType(item);

        this.emit('computed', item);
    }

    emitEventItem(event) {
        const item = Object.assign({}, utils.getComment(event.node, 'public'), {
            name: event.name
        });

        this.emit('event', item);
    }

    emitRefItem(ref) {
        const item = Object.assign({}, ref, {
            visibility: 'private'
        });

        this.emit('ref', item);
    }

    emitImportedComponentItem(importNode, name, path) {
        const item = Object.assign({}, utils.getComment(importNode, 'private'), {
            name: name,
            importPath: path,
            // TODO: 3.*, Backward compatibility: Remove this property
            value: path
        });

        this.emit('component', item);
    }

    parseBodyRecursively(rootNode, scopeType, level) {
        const nodes = rootNode.body
            ? rootNode.body
            : (rootNode.length > 0 ? rootNode : [rootNode]);

        nodes.forEach(node => {
            if (node.type === 'ExpressionStatement') {
                const expressionNode = node.expression;
                if (expressionNode.type === 'CallExpression') {
                    const callee = expressionNode.callee;
                    if (callee.type === 'Identifier' && this.dispatcherNames.indexOf(callee.name) >= 0) {
                        const eventItem = this.parseEvenDeclaration(expressionNode);
                        this.emitEventItem(eventItem);
                        
                        return;
                    }
                }

                if (expressionNode.type === 'ArrowFunctionExpression') {
                    if (expressionNode.body) {
                        this.parseBodyRecursively(expressionNode.body, scopeType, level + 1);
                        return;
                    }
                }
            }

            if (node.type === 'CallExpression') {
                const callee = node.callee;
                if (callee.type === 'Identifier' && this.dispatcherNames.indexOf(callee.name) >= 0) {
                    const eventItem = this.parseEvenDeclaration(node);
                    this.emitEventItem(eventItem);
                    
                    return;
                }
            }

            if (node.type === 'VariableDeclaration' && scopeType !== SCOPE_MARKUP) {
                const variables = this.parseVariableDeclaration(node);
                variables.forEach(variable => {
                    if (level === 0) {
                        this.emitDataItem(variable, scopeType, 'private');
                    }

                    if (variable.declarator.init) {
                        const initNode = variable.declarator.init;
                        if (initNode.type === 'CallExpression') {
                            const callee = initNode.callee;
                            if (callee.type === 'Identifier' && this.dispatcherConstructorNames.indexOf(callee.name) >= 0) {
                                this.dispatcherNames.push(variable.name);
                            }
                        } else if (initNode.type === 'ArrowFunctionExpression') {
                            if (initNode.body) {
                                this.parseBodyRecursively(initNode.body, scopeType, level + 1);
                            }
                        }
                    }
                });

                return;
            }

            if (node.type === 'FunctionDeclaration') {
                this.emitMethodItem(this.parseFunctionDeclaration(node), scopeType, 'private');

                if (node.body) {
                    this.parseBodyRecursively(node.body, scopeType, level + 1);
                }
                return;
            }

            if (node.type === 'ExportNamedDeclaration' && level === 0  && scopeType !== SCOPE_MARKUP) {
                const declaration = node.declaration;
                if (declaration) {
                    const exportNodeComment = utils.getComment(node, 'public', this.features, true, false);

                    if (declaration.type === 'VariableDeclaration') {
                        const variables = this.parseVariableDeclaration(declaration);
                        variables.forEach(variable => {
                            this.emitDataItem(variable, scopeType, 'public', exportNodeComment);
                        });

                        return;
                    }

                    if (declaration.type === 'FunctionDeclaration') {
                        const func = this.parseFunctionDeclaration(declaration);
                        this.emitMethodItem(func, scopeType, 'public', exportNodeComment);

                        return;
                    }
                }
            }

            if (node.type === 'LabeledStatement' && level === 0 && scopeType !== SCOPE_MARKUP) {
                const idNode = node.label;
                if (idNode && idNode.type === 'Identifier' && idNode.name === '$') {
                    if (node.body && node.body.type === 'ExpressionStatement') {
                        const expression = node.body.expression;
                        if (expression && expression.type === 'AssignmentExpression') {
                            const leftNode = expression.left;
                            if (leftNode.type === 'Identifier') {
                                this.emitComputedItem({
                                    name: leftNode.name,
                                    node: node
                                }, scopeType, 'private');

                                return;
                            }
                        }
                    }
                }
            }

            if (node.type === 'ImportDeclaration' && level === 0 && scopeType !== SCOPE_MARKUP) {
                const specifier = node.specifiers[0];
                const source = node.source;
                if (source && source.type === 'Literal') {
                    const sourceFileName = source.value;

                    if (specifier && specifier.type === 'ImportDefaultSpecifier') {
                        const importEntry = {
                            identifier: specifier.local.name,
                            sourceFilename: sourceFileName
                        };

                        if (!this.imports.hasOwnProperty(importEntry.identifier)) {
                            this.imports[importEntry.identifier] = importEntry;
                            
                            if (importEntry.identifier) {
                                if (importEntry.identifier[0] === importEntry.identifier[0].toUpperCase()) {
                                    this.emitImportedComponentItem(node, importEntry.identifier, importEntry.sourceFilename);
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
                                        kind: 'const'
                                    }, scopeType, 'private');
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
                                    kind: 'const'
                                }, scopeType, 'private');
                            }
                        });
                    }

                    if (sourceFileName === 'svelte') {
                        // Dispatcher constructors
                        node.specifiers
                            .filter(specifier => specifier.imported.name === 'createEventDispatcher')
                            .forEach(specifier => {
                                this.dispatcherConstructorNames.push(specifier.local.name);
                            });
                    }
                }                

                // Import svelte API functions
                if (node.source.type === 'Literal' && node.source.value === 'svelte') {
                    
                }
            }

            // console.log(util.inspect(node, false, null, true));

            if (node.body) {
                this.parseBodyRecursively(node.body, scopeType, level + 1);
            }
        });
    }

    getAstParsingOptions() {
        return {
            attachComment: true,
            tokens: true,
            ecmaVersion: 9,
            sourceType: 'module',
            ecmaFeatures: {
                experimentalObjectRestSpread: true
            }
        };
    }

    parseScriptBlock(scriptBlock) {
        const ast = espree.parse(
            scriptBlock.content, 
            this.getAstParsingOptions()
        );

        const isStaticScope = /\sscope=('module'|"module")/gi.test(scriptBlock.attributes)

        this.parseBodyRecursively(
            ast, 
            isStaticScope 
                ? SCOPE_STATIC 
                : SCOPE_DEFAULT, 
            0
        );
    }

    parseMarkupExpressionBlock(expression) {
        const ast = espree.parse(
            expression, 
            this.getAstParsingOptions()
        );

        this.parseBodyRecursively(ast, SCOPE_MARKUP, 0);
    }

    parseEvenDeclaration(node) {
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
            node: node
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
                    declarator: declarator
                });
            } else if (idNode.type === 'ObjectPattern') {
                idNode.properties.forEach(propertyNode => {
                    const propertyIdNode = propertyNode.key;
                    if (propertyIdNode.type === 'Identifier') {
                        result.push({
                            name: propertyIdNode.name,
                            kind: node.kind,
                            node: node,
                            declarator: declarator
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

        const args = [];
        node.params.forEach(param => {
            if (param.type === 'Identifier') {
                args.push({
                    name: param.name,
                });
            }
        });

        return {
            node: node,
            name: node.id.name,
            args: args
        };
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
        let lastComment = null;
        let lastAttributeIndex = 0;
        let lastAttributeLocations = {};

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
            },
            onopentagname: () => {
                lastAttributeIndex = parser._tokenizer._index;
                lastAttributeLocations = {};
            },
            onopentag: (tagName, attrs) => {
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
                    if (this.features.includes('events')) {
                        // Expose events that propogated from child events
                        // Handle event syntax like ```<button on:click>Some link</button>```
                        const propogatedEvents = Object.keys(attrs)
                            .filter(name => name.length > 3 && name.indexOf('on:') === 0 && !attrs[name])
                            .map(name => {
                                const nameWithModificators = name.substr(3).split('|');

                                return {
                                    name: nameWithModificators[0],
                                    parent: tagName,
                                    modificators: nameWithModificators.slice(1),
                                    loc: this.includeSourceLocations && lastAttributeLocations.hasOwnProperty(name)
                                        ? lastAttributeLocations[name]
                                        : null
                                }
                            });

                        const baseEvents = propogatedEvents;

                        // Fill additional informations about events
                        baseEvents.forEach((event) => {
                            if (lastComment) {
                                lastComment = `/** ${lastComment} */`;
                            }

                            const comment = utils.parseComment(lastComment || '');

                            event.visibility = comment.visibility;
                            event.description = comment.description || '';
                            event.keywords = comment.keywords;

                            if (!this.eventsEmmited.hasOwnProperty(event.name)) {
                                this.eventsEmmited[event.name] = event;

                                this.parseKeywords(comment.keywords, event);
                                this.emit('event', event);
                            }

                            lastComment = null;
                        });

                        lastComment = null;
                    }

                    if (this.features.includes('data')) {
                        const bindProperties = Object.keys(attrs)
                            .filter(name => name.length > 5 && name.indexOf('bind:') === 0)
                            .filter(name => name !== 'bind:this')
                            .map(name => {
                                const sourcePropertyName = name.substr(5);
                                let targetPropertyName = sourcePropertyName;
                                const attributeValue = attrs[name];
                                if (attributeValue && attributeValue.length > 2 && attributeValue.charAt(0) === '{' && attributeValue.charAt(attributeValue.length - 1) === '}') {
                                    targetPropertyName = attributeValue.substr(1, attributeValue.length - 2);
                                }

                                return {
                                    sourcePropertyName: sourcePropertyName,
                                    targetPropertyName: targetPropertyName,
                                    parent: tagName,
                                    loc: this.includeSourceLocations && lastAttributeLocations.hasOwnProperty(name)
                                        ? lastAttributeLocations[name]
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
                                loc: bindProperty.loc,
                                visibility: 'private',
                                static: false,
                                readonly: false
                            };

                            this.emit('data', dataItem);
                        });
                    }

                    if (this.features.includes('refs')) {
                        if (attrs.hasOwnProperty('bind:this') && attrs['bind:this']) {
                            const value = attrs['bind:this'];
                            if (value.length > 2 && value.charAt(0) === '{' && value.charAt(value.length - 1) === '}') {
                                const bindedVariableName = value.substr(1, value.length - 2);

                                this.emitRefItem({
                                    name: bindedVariableName,
                                    parent: tagName,
                                    loc: this.includeSourceLocations && lastAttributeLocations.hasOwnProperty('bind:this')
                                        ? lastAttributeLocations['bind:this']
                                        : null
                                });
                            }
                        }
                    }

                    // Parse event handlers
                    Object.keys(attrs)
                        .filter(name => name.length > 3 && name.indexOf('on:') === 0 && attrs[name])
                        .forEach(name => {
                            this.parseMarkupExpressionBlock(attrs[name]);
                        });
                }
            }
        }, {
            lowerCaseTags: false,
            lowerCaseAttributeNames: false
        });

        parser.write(this.structure.template);
        parser.end();
    }

    parseKeywords(keywords = [], event) {
        event.params = [];

        keywords.forEach(({ name, description }) => {
            switch (name) {
                case 'arg':
                case 'param':
                case 'argument':
                    event.params.push(jsdoc.parseParamKeyword(description));
                    break;

                case 'return':
                case 'returns':
                    event.return = jsdoc.parseReturnKeyword(description);
                    break;
            }
        });

        if (event.params.length === 0) {
            delete event.params;
        }
    }
}

module.exports = Parser;
module.exports.SUPPORTED_FEATURES = SUPPORTED_FEATURES;