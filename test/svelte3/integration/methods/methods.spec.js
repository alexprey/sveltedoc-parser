const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Methods', () => {
    it('Private method should be parsed with comment and additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'method.private.svelte'),
            features: ['methods'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.methods, 'Document methods should be parsed').to.exist;

            expect(doc.methods.length).to.equal(1);
            const method = doc.methods[0];
            expect(method.name).to.equal('privateMethod');
            expect(method.visibility).to.equal('private');
            expect(method.static).to.be.false;

            expect(method.args, 'Method arguments should be parsed').to.exist;
            expect(method.args.length).to.equal(2);
            expect(method.args[0].name).to.equal('param1');
            expect(method.args[1].name).to.equal('param2');

            expect(method.description).to.equal('The method comment.');
            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Public method should be parsed with comment and additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'method.public.svelte'),
            features: ['methods', 'description'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.methods, 'Document methods should be parsed').to.exist;

            expect(doc.methods.length).to.equal(1);
            const method = doc.methods[0];
            expect(method.name).to.equal('publicMethod');
            expect(method.visibility).to.equal('public');
            expect(method.static).to.be.false;
            expect(method.description).to.be.equal('The method comment.');

            expect(method.args, 'Method arguments should be parsed').to.exist;
            expect(method.args.length).to.equal(2);
            expect(method.args[0].name).to.equal('param1');
            expect(method.args[1].name).to.equal('param2');

            done();
        }).catch(e => {
            done(e);
        });
    });
});