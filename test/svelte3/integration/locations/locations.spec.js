const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

function assertDataItemLocation(dataItem, expectedLocationStart, expectedLocationEnd) {
    expect(dataItem.locations, `Code location for data item should be included for "${dataItem.name}"`).to.be.exist;
    expect(dataItem.locations.length, `Code location for data item have values for "${dataItem.name}"`).to.be.equal(1);
    const location = dataItem.locations[0];
    expect(location, `Location should be correct identified for "${dataItem.name}"`).is.deep.equals({ start: expectedLocationStart, end: expectedLocationEnd });
}

describe('SvelteDoc v3 - Locations', () => {
    it('Locations for multiple scripts should be found correct', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'locations.multiscripts.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document events should be parsed').to.exist;

            const static = doc.data.find(p => p.name === 'staticVariable');
            expect(static, '"staticVariable" should be presented in data items of the doc').to.exist;
            expect(static.static).to.be.true;
            assertDataItemLocation(static, 79, 93);

            const local = doc.data.find(p => p.name === 'variable');
            expect(local, '"variable" should be presented in data items of the doc').to.exist;
            expect(local.static).to.be.false;
            assertDataItemLocation(local, 127, 135);

            done();
        }).catch(e => {
            done(e);
        });
    });
});