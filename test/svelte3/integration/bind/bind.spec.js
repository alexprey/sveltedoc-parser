const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Bind', () => {
    it('Bind simple definition should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'bind.simple.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const item = doc.data[0];

            expect(item, 'Bind item should be a valid entity').to.exist;
            expect(item.name).to.equal('totalCost');
            expect(item.visibility).to.equal('private');
            expect(item.bind, 'Bind information should be presented').to.exist;
            expect(item.bind.source).to.equal('ShopingCart');
            expect(item.bind.property).to.equal('totalCost');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Bind named definition should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'bind.named.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const item = doc.data[0];

            expect(item, 'Bind item should be a valid entity').to.exist;
            expect(item.name).to.equal('cost');
            expect(item.visibility).to.equal('private');
            expect(item.bind, 'Bind information should be presented').to.exist;
            expect(item.bind.source).to.equal('ShopingCart');
            expect(item.bind.property).to.equal('totalCost');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Bind declared definition should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'bind.declared.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const item = doc.data[0];

            expect(item, 'Bind item should be a valid entity').to.exist;
            expect(item.name).to.equal('totalCost');
            expect(item.visibility).to.equal('private');
            expect(item.bind, 'Bind information should be presented').to.exist;
            expect(item.bind.source).to.equal('ShopingCart');
            expect(item.bind.property).to.equal('totalCost');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Bind declared and exported definition should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'bind.exported.svelte'),
            features: ['data', 'description'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const item = doc.data[0];

            expect(item, 'Bind item should be a valid entity').to.exist;
            expect(item.name).to.equal('totalCost');
            expect(item.visibility).to.equal('public');
            expect(item.description).to.equal('The comment of public binded property.');
            expect(item.bind, 'Bind information should be presented').to.exist;
            expect(item.bind.source).to.equal('ShopingCart');
            expect(item.bind.property).to.equal('totalCost');

            done();
        }).catch(e => {
            done(e);
        });
    });
});