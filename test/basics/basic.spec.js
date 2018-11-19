const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../index');

describe('Basics', () => {
    it('Component name should be extracted', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'basic.description.svelte'),
            features: ['name'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.name).to.be.equal('basic.description');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Component description should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'basic.description.svelte'),
            features: ['description'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.description).to.be.equal('The awesome svelte component description.');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
