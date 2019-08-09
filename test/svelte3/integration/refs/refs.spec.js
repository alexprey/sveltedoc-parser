const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Refs', () => {
    it('Ref to non declared variable', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'ref.simple.svelte'),
            features: ['refs'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.refs, 'Document refs should be parsed').to.exist;

            expect(doc.refs.length).to.equal(1);
            const ref = doc.refs[0];

            expect(ref, 'Ref should be a valid entity').to.exist;
            expect(ref.name).to.equal('header');
            expect(ref.parent).to.equal('div');
            expect(ref.visibility).to.equal('private');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Ref to declared variable', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'ref.declared.svelte'),
            features: ['refs'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.refs, 'Document refs should be parsed').to.exist;

            expect(doc.refs.length).to.equal(1);
            const ref = doc.refs[0];

            expect(ref, 'Ref should be a valid entity').to.exist;
            expect(ref.name).to.equal('header');
            expect(ref.parent).to.equal('div');
            expect(ref.visibility).to.equal('private');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Ref to component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'ref.component.svelte'),
            features: ['refs'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.refs, 'Document refs should be parsed').to.exist;

            expect(doc.refs.length).to.equal(1);
            const ref = doc.refs[0];

            expect(ref, 'Ref should be a valid entity').to.exist;
            expect(ref.name).to.equal('cart');
            expect(ref.parent).to.equal('ShopingCart');
            expect(ref.visibility).to.equal('private');

            done();
        }).catch(e => {
            done(e);
        });
    });
});