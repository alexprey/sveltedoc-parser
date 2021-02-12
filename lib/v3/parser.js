const EventEmitter = require('events');
const path = require('path');

const utils = require('./../utils');
const jsdoc = require('./../jsdoc');
const {
    normalize: normalizeOptions,
    validateFeatures,
} = require('../options');

const {
    parseAndMergeKeywords,
    updateType
} = require('./v3-utils');

const TemplateParser = require('./template');
const { TemplateEvent, ScriptEvent } = require('./events');

const ScriptParser = require('./script');
const { SCOPE_STATIC } = require('./script');

/**
 * @typedef {import('../../typings').Svelte3Feature} Svelte3Feature
 * @type {Svelte3Feature[]}
*/
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

class Parser extends EventEmitter {
    /**
     * @param {import('../options').SvelteParserOptions} options
     */
    constructor(options) {
        super();

        Parser.validateOptions(options);

        // External options
        this.filename = options.filename;
        this.features = options.features;
        this.includeSourceLocations = options.includeSourceLocations;
        /** @type {import("../helpers").FileStructure} */
        this.structure = options.structure;

        // Internal properties
        this.componentName = null;

        this.scriptParser = null;
        this.templateParser = null;
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

        if (this.structure.scripts && this.structure.scripts.length) {
            this.parseScriptBlocks(this.structure.scripts);
        }

        if (this.structure.template) {
            this.parseTemplate(this.structure.template);
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

    /**
     * @sideEffect mutates `item.locations`.
     *
     * Attaches the node's location to the item if requested by the user.
     *
     * @param {*} item the item to attach locations to
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

        this.attachLocationsIfRequired(item, variable, parseContext);

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

        this.attachLocationsIfRequired(item, method, parseContext);

        this.emit('method', item);
    }

    emitComputedItem(computed, parseContext, defaultVisibility) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(computed.node, parseContext.sourceCode, { defaultVisibility }), {
            name: computed.name,
            static: parseContext.scopeType === SCOPE_STATIC,
            type: jsdoc.DEFAULT_TYPE
        });

        this.attachLocationsIfRequired(item, computed, parseContext);

        updateType(item);

        this.emit('computed', item);
    }

    emitEventItem(event, parseContext) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(event.node, parseContext.sourceCode, { defaultVisibility: 'public' }), {
            name: event.name
        });

        this.attachLocationsIfRequired(item, event, parseContext);

        this.emit('event', item);
    }

    emitImportedComponentItem(component, parseContext) {
        const item = Object.assign({}, utils.getCommentFromSourceCode(component.node, parseContext.sourceCode, { defaultVisibility: 'private' }), {
            name: component.name,
            importPath: component.path,
        });

        this.attachLocationsIfRequired(item, component, parseContext);

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

    parseScriptBlocks(scripts) {
        const scriptParser = this.buildScriptParser();

        scriptParser.parse(scripts);

        return scriptParser;
    }

    parseTemplateJavascriptExpression(expression) {
        const scriptParser = this.buildScriptParser();

        scriptParser.parseScriptExpression(expression);

        return scriptParser;
    }

    parseTemplate(template) {
        const templateParser = this.buildTemplateParser();

        templateParser.parse(template);

        return templateParser;
    }

    buildScriptParser() {
        if (this.scriptParser) {
            return this.scriptParser;
        }

        this.scriptParser = new ScriptParser();

        this.subscribeToScriptParser(this.scriptParser);

        return this.scriptParser;
    }

    buildTemplateParser() {
        if (this.templateParser) {
            return this.templateParser;
        }

        this.templateParser = new TemplateParser({
            features: this.features,
            includeSourceLocations: this.includeSourceLocations
        });

        this.subscribeToTemplateParser(this.templateParser);

        return this.templateParser;
    }

    subscribeToScriptParser(scriptParser) {
        scriptParser.on(ScriptEvent.COMPUTED, (computed, context, visibility, comment) => {
            this.emitComputedItem(computed, context, visibility, comment);
        });
        scriptParser.on(ScriptEvent.DATA, (data, context, visibility, comment) => {
            this.emitDataItem(data, context, visibility, comment);
        });
        scriptParser.on(ScriptEvent.EVENT, (event, context) => {
            this.emitEventItem(event, context);
        });
        scriptParser.on(ScriptEvent.GLOBAL_COMMENT, (comment) => {
            this.emitGlobalComment(comment);
        });
        scriptParser.on(ScriptEvent.IMPORTED_COMPONENT, (component, context) => {
            this.emitImportedComponentItem(component, context);
        });
        scriptParser.on(ScriptEvent.METHOD, (method, context, visibility, comment) => {
            this.emitMethodItem(method, context, visibility, comment);
        });
    }

    subscribeToTemplateParser(templateParser) {
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
    }
}

module.exports = Parser;
module.exports.SUPPORTED_FEATURES = SUPPORTED_FEATURES;
