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

    describe('buildPropertyAccessorChainFromTokens', () => {
        it('should correctly parse a single identifier', () => {
            const expectedChain = ['NOTIFY'];
            const script = `
            callee(${expectedChain.join('.')});
            `;
            const tokens = espree.tokenize(script);
            const identifierTokens = tokens.slice(2);

            const chain = utils.buildPropertyAccessorChainFromTokens(identifierTokens);

            expect(chain).to.deep.equal(expectedChain);
        });

        it('should correctly parse chained identifiers', () => {
            const expectedChain = ['EVENT', 'SIGNAL', 'NOTIFY'];
            const script = `
            callee(${expectedChain.join('.')});
            `;
            const tokens = espree.tokenize(script);
            const identifierTokens = tokens.slice(2);

            const chain = utils.buildPropertyAccessorChainFromTokens(identifierTokens);

            expect(chain).to.deep.equal(expectedChain);
        });
    });

    describe('buildPropertyAccessorChainFromAst', () => {
        describe('should build an array when', () => {
            it('AST is a single identifier', () => {
                const expectedChain = ['NOTIFY'];
                const script = `
                callee(${expectedChain.join('.')});
                `;
                const ast = espree.parse(script);
                const node = ast.body[0].expression.arguments[0];
                const chain = utils.buildPropertyAccessorChainFromAst(node);

                expect(chain).to.deep.equal(expectedChain);
            });

            it('AST has a nested "MemberExpression" node', () => {
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
    });

    describe('buildObjectFromObjectExpression', () => {
        it('should build an object from an AST containing a nested "ObjectExpression" node', () => {
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

        it('should ignore unsupported node types', () => {
            const expectedObject = {
                SIGNAL: {
                    NOTIFY: 'notify'
                },
                LITERAL: true,
            };
            const script = `
            var EVENT = {
                SIGNAL: {
                    NOTIFY: 'notify'
                },
                OTHER: ['notify'],
                LITERAL: true,
            }`;
            const ast = espree.parse(script);
            const node = ast.body[0].declarations[0].init;
            const object = utils.buildObjectFromObjectExpression(node);

            expect(object).to.deep.equal(expectedObject);
        });
    });

    describe('getValueForPropertyAccessorChain', () => {
        it('should return the default value when value is unreachable', () => {
            const script = `
            var EVENT = {
                SIGNAL: {}
            }`;
            const ast = espree.parse(script);
            const node = ast.body[0].declarations[0].init;
            const container = {
                EVENT: node
            };
            const chain = ['EVENT', 'SIGNAL', 'NOTIFY'];
            const value = utils.getValueForPropertyAccessorChain(container, chain);

            expect(value).to.equal(utils.UNHANDLED_EVENT_NAME);
        });

        it('should return the default value when visiting an unsupported node', () => {
            const script = `
            var EVENT = {
                SIGNAL: ['notify']
            }`;
            const ast = espree.parse(script);
            const node = ast.body[0].declarations[0].init;
            const container = {
                EVENT: node
            };
            const chain = ['EVENT', 'SIGNAL', '0'];
            const value = utils.getValueForPropertyAccessorChain(container, chain);

            expect(value).to.equal(utils.UNHANDLED_EVENT_NAME);
        });

        it('should return the correct value when searching an object', () => {
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
