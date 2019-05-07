const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

xdescribe('SvelteDoc - Store', () => {
    it('Reading store properties in markup should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'store.get.markup.svelte'),
            features: ['store'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.store, 'Store information should be provided').to.exist;
            expect(storeDoc.length).to.equal(1);

            const storeProperty = storeDoc[0];
            
            expect(storeProperty).to.exist;
            expect(storeProperty.name).to.equal('ApplicationName');
            expect(storeProperty.read).is.true;
            expect(storeProperty.write).is.false;

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Changing store properties in markup should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'store.set.markup.svelte'),
            features: ['store'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.store, 'Store information should be provided').to.exist;
            expect(storeDoc.length).to.equal(1);

            const storeProperty = storeDoc[0];
            
            expect(storeProperty).to.exist;
            expect(storeProperty.name).to.equal('ApplicationName');
            expect(storeProperty.read).is.false;
            expect(storeProperty.write).is.true;

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Reading & changing store properties in markup should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'store.set.markup.svelte'),
            features: ['store'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.store, 'Store information should be provided').to.exist;
            expect(storeDoc.length).to.equal(1);

            const storeProperty = storeDoc[0];
            
            expect(storeProperty).to.exist;
            expect(storeProperty.name).to.equal('ApplicationName');
            expect(storeProperty.read).is.true;
            expect(storeProperty.write).is.true;

            done();
        }).catch(e => {
            done(e);
        });
    });
});
