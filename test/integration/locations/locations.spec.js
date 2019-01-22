const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../index');

describe('SvelteDoc - Source locations', () => {
    it('Source locations for component data properties should be extracted', (done) => {
        parser.parse({
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['data', 'methods'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.data.length).is.equals(1);
            const property = doc.data[0];

            expect(property.loc).is.deep.equals({
                start: 89,
                end: 99
            });

            done();
        }).catch(e => {
            done(e);
        });
    });
});
