const CommonEvent = Object.freeze({
    DATA: 'data',
    EVENT: 'event',
    GLOBAL_COMMENT: 'global-comment',
});

const TemplateEvent = Object.freeze({
    ...CommonEvent,
    NAME: 'name',
    REF: 'ref',
    SLOT: 'slot',
    EXPRESSION: 'expression',
});

const ScriptEvent = Object.freeze({
    ...CommonEvent,
    METHOD: 'method',
    COMPUTED: 'computed',
    IMPORTED_COMPONENT: 'imported-component',
});

module.exports = {
    CommonEvent,
    TemplateEvent,
    ScriptEvent,
};
