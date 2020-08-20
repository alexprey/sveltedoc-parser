const utils = require('../../../lib/utils');
const { expect } = require('chai');

describe('"utils.js" module', () => {
    describe('"buildCamelCase" method', () => {
        it('when input is already camel cased then should return same value', done => {
            const result = utils.buildCamelCase('CamelCasedTestMethodName12');

            expect(result).be.equal('CamelCasedTestMethodName12');
            done();
        });

        it('when spaces used in name then should remove them and make next char uppercased', done => {
            const result = utils.buildCamelCase('Spaces In the name');

            expect(result).be.equal('SpacesInTheName');
            done();
        });

        it('when first letter is lowercased then should be changed to upper case', done => {
            const result = utils.buildCamelCase('lowercasedFirstLetter');

            expect(result).be.equal('LowercasedFirstLetter');
            done();
        });

        it('when illegal chars in name then should remove then and make next char uppercased', done => {
            const result = utils.buildCamelCase('Illegal-chars-In-the-name');

            expect(result).to.be.equal('IllegalCharsInTheName');
            done();
        });
    });
});
