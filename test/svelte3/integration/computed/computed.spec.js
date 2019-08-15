const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Computed', () => {
    it('Private computed without let should be parsed with comment and additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'computed.expression.svelte'),
            features: ['computed'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.computed, 'Document computed should be parsed').to.exist;

            expect(doc.computed.length).to.equal(1);
            const prop = doc.computed[0];
            expect(prop.name).to.equal('area');
            expect(prop.visibility).to.equal('private');
            expect(prop.static).to.be.false;

            expect(prop.description).to.equal('The area of rectangle.');

            expect(prop.type).to.exist;
            expect(prop.type).to.eql({ kind: 'type', text: 'number', type: 'number' });

            expect(prop.locations, 'Code location should be included').to.be.exist;
            expect(prop.locations.length).to.be.equal(1);

            const location = prop.locations[0];
            expect(location, 'Location should be correct identified').is.deep.equals({ start: 132, end: 136 });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Private computed should be parsed with comment and additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'computed.declaration.svelte'),
            features: ['computed'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.computed, 'Document computed should be parsed').to.exist;

            expect(doc.computed.length).to.equal(1);
            const prop = doc.computed[0];
            expect(prop.name).to.equal('area');
            expect(prop.visibility).to.equal('private');
            expect(prop.static).to.be.false;

            expect(prop.description).to.equal('The area of rectangle.');

            expect(prop.type).to.exist;
            expect(prop.type).to.eql({ kind: 'type', text: 'number', type: 'number' });

            done();
        }).catch(e => {
            done(e);
        });
    });
});
