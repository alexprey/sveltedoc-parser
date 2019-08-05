const EventEmitter = require('events');
const util = require('util');

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
    // 'actions',
    // 'helpers',
    'components',
    // 'description',
    'events',
    'slots',
    // 'transitions',
    // 'store'
];

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

    emitDataItem(variable, isStaticScope, defaultVisibility) {
        const item = Object.assign({}, utils.getComment(variable.node, defaultVisibility), {
            name: variable.name,
            kind: variable.kind,
            static: isStaticScope,
            readonly: variable.kind === 'const',
            type: jsdoc.DEFAULT_TYPE
        });

        this.updateType(item);

        this.emit('data', item);
    }

    emitMethodItem(method, isStaticScope, defaultVisibility) {
        const item = Object.assign({}, utils.getComment(method.node, defaultVisibility), {
            name: method.name,
            args: method.args,
            static: isStaticScope
        });

        this.emit('method', item);
    }

    emitComputedItem(computed, isStaticScope, defaultVisibility) {
        const item = Object.assign({}, utils.getComment(computed.node, defaultVisibility), {
            name: computed.name,
            static: isStaticScope,
            type: jsdoc.DEFAULT_TYPE
        });

        this.updateType(item);

        this.emit('computed', item);
    }

    emitImportedComponentItem(importNode, name, path) {
        const item = Object.assign({}, utils.getComment(importNode, 'private'), {
            name: name,
            value: path
        });

        this.emit('component', item);
    }

    parseScriptBlock(scriptBlock) {
        const ast = espree.parse(scriptBlock.content, {
            attachComment: true,
            tokens: true,
            ecmaVersion: 9,
            sourceType: 'module',
            ecmaFeatures: {
                experimentalObjectRestSpread: true
            }
        });

        const isStaticScope = /\sscope=('module'|"module")/gi.test(scriptBlock.attributes)

        ast.body.forEach(node => {
            if (node.type === 'VariableDeclaration') {
                const variables = this.parseVariableDeclaration(node);
                variables.forEach(variable => {
                    this.emitDataItem(variable, isStaticScope, 'private');
                });

                return;
            }

            if (node.type === 'FunctionDeclaration') {
                this.emitMethodItem(this.parseFunctionDeclaration(node), isStaticScope, 'private');

                return;
            }

            if (node.type === 'ExportNamedDeclaration') {
                const declaration = node.declaration;
                if (declaration) {
                    if (declaration.type === 'VariableDeclaration') {
                        const variables = this.parseVariableDeclaration(declaration);
                        variables.forEach(variable => {
                            this.emitDataItem(variable, isStaticScope, 'public');
                        });

                        return;
                    }

                    if (declaration.type === 'FunctionDeclaration') {
                        this.emitMethodItem(this.parseFunctionDeclaration(declaration), isStaticScope, 'public');
                        return;
                    }
                }
            }

            if (node.type === 'LabeledStatement') {
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
                                }, isStaticScope, 'private');

                                return;
                            }
                        }
                    }
                }
            }

            if (node.type === 'ImportDeclaration') {
                const specifier = node.specifiers[0];

                if (specifier && specifier.type === 'ImportDefaultSpecifier') {
                    const source = node.source;

                    if (source && source.type === 'Literal') {
                        const importEntry = {
                            identifier: specifier.local.name,
                            sourceFilename: source.value
                        };

                        if (!this.imports.hasOwnProperty(importEntry.identifier)) {
                            this.imports[importEntry.identifier] = importEntry;
                            
                            if (importEntry.identifier) {
                                if (importEntry.identifier[0] === importEntry.identifier[0].toUpperCase()) {
                                    this.emitImportedComponentItem(node, importEntry.identifier, importEntry.sourceFilename);
                                    return;
                                } else {
                                    this.emitDataItem({
                                        node,
                                        name: importEntry.identifier,
                                        kind: 'const'
                                    }, isStaticScope, 'private');
                                }
                            }
                        }
                    }
                } else if (node.specifiers.length > 0) {
                    node.specifiers.forEach((specifier) => {
                        if (specifier.type === 'ImportSpecifier') {
                            this.emitDataItem({
                                node: specifier,
                                name: specifier.local.name,
                                kind: 'const'
                            }, isStaticScope, 'private');
                        }
                    });
                }
            }

            //console.log(util.inspect(node, false, null, true));
        });
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
                    node: node
                });
            } else if (idNode.type === 'ObjectPattern') {
                idNode.properties.forEach(propertyNode => {
                    const propertyIdNode = propertyNode.key;
                    if (propertyIdNode.type === 'Identifier') {
                        result.push({
                            name: propertyIdNode.name,
                            kind: node.kind,
                            node: node
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