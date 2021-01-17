const utils = require('../../../lib/utils');

const espree = require('espree');
const { expect } = require('chai');

describe('"utils.js" module', () => {
    describe('"buildCamelCase" method', () => {
        it('when input is already camel cased then should return same value', () => {
            const result = utils.buildCamelCase('CamelCasedTestMethodName12');

            expect(result).to.equal('CamelCasedTestMethodName12');
        });

        it('when spaces used in name then should remove them and make next char uppercased', () => {
            const result = utils.buildCamelCase('Spaces In the name');

            expect(result).to.equal('SpacesInTheName');
        });

        it('when first letter is lowercased then should be changed to upper case', () => {
            const result = utils.buildCamelCase('lowercasedFirstLetter');

            expect(result).to.equal('LowercasedFirstLetter');
        });

        it('when illegal chars in name then should remove then and make next char uppercased', () => {
            const result = utils.buildCamelCase('Illegal-chars-In-the-name');

            expect(result).to.equal('IllegalCharsInTheName');
        });
    });

    describe('buildPropertyAccessorChainFromAst', () => {
        it('should generate the correct array when parsing a nested "MemberExpression"', () => {
            const expectedChain = ['EVENT', 'SIGNAL', 'NOTIFY'];
            const script = `
            callee(${expectedChain.join('.')});
            `;
            const ast = espree.parse(script);
            const node = ast.body[0].expression.arguments[0];
            const chain = utils.buildPropertyAccessorChainFromAst(node);

            expect(chain).to.deep.equal(expectedChain);
        });
    });

    describe('buildObjectFromObjectExpression', () => {
        it('should generate the correct object when parsing a nested "ObjectExpression"', () => {
            const expectedObject = {
                SIGNAL: {
                    NOTIFY: 'notify'
                }
            };
            const script = `
            var EVENT = {
                SIGNAL: {
                    NOTIFY: 'notify'
                }
            }`;
            const ast = espree.parse(script);

            const node = ast.body[0].declarations[0].init;
            const object = utils.buildObjectFromObjectExpression(node);

            expect(object).to.deep.equal(expectedObject);
        });
    });

    describe('getValueForPropertyAccessorChain', () => {
        it('should retrieve the correct value when searching an object', () => {
            const expectedValue = 'notify';

            const script = `
            var EVENT = {
                SIGNAL: {
                    NOTIFY: 'notify'
                }
            }`;
            const ast = espree.parse(script);

            const node = ast.body[0].declarations[0].init;

            const container = {
                EVENT: node
            };
            const chain = ['EVENT', 'SIGNAL', 'NOTIFY'];
            const value = utils.getValueForPropertyAccessorChain(container, chain);

            expect(value).to.equal(expectedValue);
        });
    });
});
