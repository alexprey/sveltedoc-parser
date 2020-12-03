const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('./../../../index');

describe('parse - Integration', () => {
    it('should correctly auto-detect svelte V2 component', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'basicV2.svelte'),
        }).then((doc) => {
            expect(doc, 'Document should exist').to.exist;
            // v3-parser converts component name to kebab-case
            expect(doc.name).to.equal('basic-v2');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('should correctly auto-detect svelte V3 component', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'basicV3.svelte'),
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            // v3-parser converts component name to PascalCase
            expect(doc.name).to.equal('BasicV3');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
