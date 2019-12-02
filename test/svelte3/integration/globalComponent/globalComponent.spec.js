const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe.only('SvelteDoc v3 - Global component', () => {
    it('Global component data should be parsed with HTML comment', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'globalComponent.markup.svelte'),
            features: ['description', 'keywords'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.description, 'Document description should be parsed').to.exist;
            expect(doc.keywords, 'Document keywords should be parsed').to.exist;

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Global component data should be parsed with JS comment', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'globalComponent.script.svelte'),
            features: ['description', 'keywords'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.description, 'Document description should be parsed').to.exist;
            expect(doc.keywords, 'Document keywords should be parsed').to.exist;

            expect(doc.keywordsdescription, 'Document description text').to.equal('sasda');
            done();
        }).catch(e => {
            done(e);
        });
    });
  });