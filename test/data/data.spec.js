const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../index');

describe('Component data model', () => {
    it('Data model should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'data.plain.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data).to.be.exist;

            const properties = doc.data;

            expect(properties.length).to.be.equal(1);

            const property = properties[0];

            expect(property.name).to.be.equal('inlineTest');
            expect(property.visibility).to.be.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Description for data properties should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'data.description.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data).to.be.exist;

            const properties = doc.data;

            expect(properties.length).to.be.equal(1);

            const property = properties[0];

            expect(property.name).to.be.equal('inlineTest');
            expect(property.description).to.be.equal('Description for inline test property.');
            expect(property.visibility).to.be.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
