const chai = require('chai');
const expect = chai.expect;

const jsdoc = require('../../../lib/jsdoc');

describe('JSDoc parser module tests', () => {
    describe('Parse type keyword', () => {
        it('Any object with star declaration', () => {
            const type = jsdoc.parseTypeKeyword('{*}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('any');
        });

        it('Any object as any', () => {
            const type = jsdoc.parseTypeKeyword('{any}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('any');
        });

        it('Class', () => {
            const type = jsdoc.parseTypeKeyword('{string}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('string');
        });

        it('Object literal', () => {
            const type = jsdoc.parseTypeKeyword('{{ prop: string }}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('{ prop: string }');
        });

        it('Nested object literals', () => {
            const type = jsdoc.parseTypeKeyword('{{ prop: { internal: string } }}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('{ prop: { internal: string } }');
        });

        it('Array with generic declaration', () => {
            const type = jsdoc.parseTypeKeyword('{Array<string>}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('Array<string>');
        });

        it('Array of array declaration', () => {
            const type = jsdoc.parseTypeKeyword('{Array<Array<string>>}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('Array<Array<string>>');
        });

        it('Array with bracet declaration', () => {
            const type = jsdoc.parseTypeKeyword('{string[]}');

            expect(type).is.exist;
            expect(type.kind).is.equal('type');
            expect(type.type).is.equal('string[]');
        });

        it('Union of classes', () => {
            const type = jsdoc.parseTypeKeyword('{KeyboardEvent|MouseEvent}');

            expect(type).is.exist;
            expect(type.kind).is.equal('union');
            expect(type.type.length).is.equal(2);

            expect(type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(type.type.some(t => t.type === 'MouseEvent')).to.be.true;
        });

        it('Union of object literals', () => {
            const type = jsdoc.parseTypeKeyword('{{ some: string }|{ other: boolean }}');

            expect(type).is.exist;
            expect(type.kind).is.equal('union');
            expect(type.type.length).is.equal(2);

            expect(type.type.some(t => t.type === '{ some: string }')).to.be.true;
            expect(type.type.some(t => t.type === '{ other: boolean }')).to.be.true;
        });

        it('Union of classes with spacings', () => {
            const type = jsdoc.parseTypeKeyword('{KeyboardEvent | MouseEvent}');

            expect(type).is.exist;
            expect(type.kind).is.equal('union');
            expect(type.type.length).is.equal(2);

            expect(type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(type.type.some(t => t.type === 'MouseEvent')).to.be.true;
        });

        it('Union of arrays', () => {
            const type = jsdoc.parseTypeKeyword('{KeyboardEvent|Array<KeyboardEvent>|MouseEvent|Array<MouseEvent>}');

            expect(type).is.exist;
            expect(type.kind).is.equal('union');
            expect(type.type.length).is.equal(4);

            expect(type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(type.type.some(t => t.type === 'MouseEvent')).to.be.true;
            expect(type.type.some(t => t.type === 'Array<KeyboardEvent>')).to.be.true;
            expect(type.type.some(t => t.type === 'Array<MouseEvent>')).to.be.true;
        });

        it('Constant string', () => {
            const type = jsdoc.parseTypeKeyword('{\'plain\'}');

            expect(type).is.exist;
            expect(type.kind).is.equal('const');
            expect(type.type).is.equal('string');
            expect(type.value).is.equal('plain');
        });

        it('Union of string constants', () => {
            const type = jsdoc.parseTypeKeyword('{\'plain\'|\'primary<alert>\'|\'secondary\'|\'plain-inverse\'}');

            expect(type).is.exist;
            expect(type.kind).is.equal('union');
            expect(type.type.length).is.equal(4);

            expect(type.type.some(t => t.kind === 'const' && t.value === 'plain'), 'should have \'plain\' const').to.be.true;
            expect(type.type.some(t => t.kind === 'const' && t.value === 'primary<alert>'), 'should have \'primary<alert>\' const').to.be.true;
            expect(type.type.some(t => t.kind === 'const' && t.value === 'secondary'), 'should have \'secondary\' const').to.be.true;
            expect(type.type.some(t => t.kind === 'const' && t.value === 'plain-inverse'), 'should have \'plain-inverse\' const').to.be.true;
        });
    });

    describe('Parse parameter keyword', () => {
        it('Parameter name should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.optional).is.not.true;
        });

        it('Description should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter Description');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.description).is.equal('Description');
            expect(param.optional).is.not.true;
        });

        it('Description with hyphen should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter - Description');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.description).is.equal('Description');
            expect(param.optional).is.not.true;
        });

        it('Property parameter should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter.name - Description');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter.name');
            expect(param.description).is.equal('Description');
            expect(param.optional).is.not.true;
        });

        it('Property parameter or array should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter[].name - Description');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter[].name');
            expect(param.description).is.equal('Description');
            expect(param.optional).is.not.true;
        });

        it('Optional parameter name should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} [parameter]');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.default).is.not.exist;
            expect(param.optional).is.true;
        });

        it('(Google Closure Compiler syntax) Optional parameter name should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string=} parameter');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.default).is.not.exist;
            expect(param.optional).is.true;

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('string');
        });

        it('Optional parameter name with default value should be parsed', () => {
            const param = jsdoc.parseParamKeyword('{string} [parameter=Default value]');

            expect(param).is.exist;
            expect(param.name).is.equal('parameter');
            expect(param.default).is.equal('Default value');
            expect(param.optional).is.true;

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('string');
        });

        it('Parameter without type', () => {
            const param = jsdoc.parseParamKeyword('parameter');

            expect(param.name).is.equal('parameter');
            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('any');
        });

        it('Repeatable parameter', () => {
            const param = jsdoc.parseParamKeyword('{...string} parameter');

            expect(param.type).is.exist;
            expect(param.repeated).is.true;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('string');
        });

        it('Any object with star declaration', () => {
            const param = jsdoc.parseParamKeyword('{*} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('any');
        });

        it('Any object as any', () => {
            const param = jsdoc.parseParamKeyword('{any} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('any');
        });

        it('Class', () => {
            const param = jsdoc.parseParamKeyword('{string} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('string');
        });

        it('Array with generic declaration', () => {
            const param = jsdoc.parseParamKeyword('{Array<string>} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('Array<string>');
        });

        it('Array of array declaration', () => {
            const param = jsdoc.parseParamKeyword('{Array<Array<string>>} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('Array<Array<string>>');
        });

        it('Array with bracet declaration', () => {
            const param = jsdoc.parseParamKeyword('{string[]} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('type');
            expect(param.type.type).is.equal('string[]');
        });

        it('Union of classes', () => {
            const param = jsdoc.parseParamKeyword('{KeyboardEvent|MouseEvent} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('union');
            expect(param.type.type.length).is.equal(2);

            expect(param.type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(param.type.type.some(t => t.type === 'MouseEvent')).to.be.true;
        });

        it('Union of classes with spacing', () => {
            const param = jsdoc.parseParamKeyword('{ KeyboardEvent | MouseEvent } parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('union');
            expect(param.type.type.length).is.equal(2);

            expect(param.type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(param.type.type.some(t => t.type === 'MouseEvent')).to.be.true;
        });

        it('Union of arrays', () => {
            const param = jsdoc.parseParamKeyword('{KeyboardEvent|Array<KeyboardEvent>|MouseEvent|Array<MouseEvent>} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('union');
            expect(param.type.type.length).is.equal(4);

            expect(param.type.type.some(t => t.type === 'KeyboardEvent')).to.be.true;
            expect(param.type.type.some(t => t.type === 'MouseEvent')).to.be.true;
            expect(param.type.type.some(t => t.type === 'Array<KeyboardEvent>')).to.be.true;
            expect(param.type.type.some(t => t.type === 'Array<MouseEvent>')).to.be.true;
        });

        it('Constant string', () => {
            const param = jsdoc.parseParamKeyword('{\'plain\'} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('const');
            expect(param.type.type).is.equal('string');
            expect(param.type.value).is.equal('plain');
        });

        it('Union of string constants', () => {
            const param = jsdoc.parseParamKeyword('{\'plain\'|\'primary<alert>\'|\'secondary\'|\'plain-inverse\'} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('union');
            expect(param.type.type.length).is.equal(4);

            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'plain'), 'should have \'plain\' const').to.be.true;
            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'primary<alert>'), 'should have \'primary<alert>\' const').to.be.true;
            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'secondary'), 'should have \'secondary\' const').to.be.true;
            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'plain-inverse'), 'should have \'plain-inverse\' const').to.be.true;
        });

        it('Union of string constants with missing quote', () => {
            const param = jsdoc.parseParamKeyword('{\'plain\'|\'primary<alert>\'|secondary\'|\'plain-inverse\'} parameter');

            expect(param.type).is.exist;
            expect(param.type.kind).is.equal('union');
            expect(param.type.type.length).is.equal(4);

            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'plain'), 'should have \'plain\' const').to.be.true;
            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'primary<alert>'), 'should have \'primary<alert>\' const').to.be.true;
            expect(param.type.type.some(t => t.kind === 'type' && t.type === 'secondary\''), 'should have \'secondary\' as a not constant').to.be.true;
            expect(param.type.type.some(t => t.kind === 'const' && t.value === 'plain-inverse'), 'should have \'plain-inverse\' const').to.be.true;
        });

        it('Union of string constants with figure bracet', () => {
            const param = jsdoc.parseParamKeyword('{\'plain\'|\'primary<alert>\'|\'seco{ndary}\'|\'plain-inverse\'} parameter');

            expect(param.type).is.exist;
        });
    });

    describe('Parse return keyword', () => {
        it('description', () => {
            const returns = jsdoc.parseReturnKeyword('return description');

            expect(returns).to.exist;
            expect(returns.type).to.equal('any');
            expect(returns.description).to.equal('return description');
            
            expect(returns.doctype).to.exist;
            expect(returns.doctype.kind).to.equal('type');
            expect(returns.doctype.type).to.equal('any');
        });

        it('prefixed description', () => {
            const returns = jsdoc.parseReturnKeyword(' -  return description');

            expect(returns).to.exist;
            expect(returns.type).to.equal('any');
            expect(returns.description).to.equal('return description');
            
            expect(returns.doctype).to.exist;
            expect(returns.doctype.kind).to.equal('type');
            expect(returns.doctype.type).to.equal('any');
        });

        it('type', () => {
            const returns = jsdoc.parseReturnKeyword('{*}');

            expect(returns).to.exist;
            expect(returns.type).to.equal('any');
            expect(returns.description).to.not.exist;

            expect(returns.doctype).to.exist;
            expect(returns.doctype.kind).to.equal('type');
            expect(returns.doctype.type).to.equal('any');
        });

        it('type with description', () => {
            const returns = jsdoc.parseReturnKeyword('{*} return description');

            expect(returns).to.exist;
            expect(returns.type).to.equal('any');
            expect(returns.description).to.equal('return description');

            expect(returns.doctype).to.exist;
            expect(returns.doctype.kind).to.equal('type');
            expect(returns.doctype.type).to.equal('any');
        });

        it('type with prefixed description', () => {
            const returns = jsdoc.parseReturnKeyword('{*}  - return description');

            expect(returns).to.exist;
            expect(returns.type).to.equal('any');
            expect(returns.description).to.equal('return description');
            
            expect(returns.doctype).to.exist;
            expect(returns.doctype.kind).to.equal('type');
            expect(returns.doctype.type).to.equal('any');
        });
    });
});
