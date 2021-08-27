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
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.methods, 'Document methods should be parsed').to.exist;

            expect(doc.methods.length).to.equal(1);
            const method = doc.methods[0];

            expect(method.name).to.equal('privateMethod');
            expect(method.visibility).to.equal('private');
            expect(method.static).to.be.false;

            expect(method.params, 'Method arguments should be parsed').to.exist;
            expect(method.params.length).to.equal(2);
            expect(method.params[0].name).to.equal('param1');
            expect(method.params[1].name).to.equal('param2');

            expect(method.description).to.equal('The method comment.');

            expect(method.return, 'Method return keyword should be parsed').to.exist;
            expect(method.return.type).to.exist;
            expect(method.return.type.type).to.equal('number');
            expect(method.return.description).to.equal('return value description');

            expect(method.locations, 'Code location should be included').to.be.exist;
            expect(method.locations.length).to.be.equal(1);

            const location = method.locations[0];

            expect(location, 'Location should be correct identified').is.deep.equals({ start: 117, end: 130 });

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
            expect(method.description).to.equal('The method comment.');

            // @param keywords
            expect(method.params, 'Method arguments should be parsed').to.exist;
            expect(method.params.length).to.equal(2);

            const param0 = method.params[0];

            expect(param0.name).to.equal('param1');
            expect(param0.description).to.equal('the first parameter');
            expect(param0.optional).to.be.false;

            const param1 = method.params[1];

            expect(param1.name).to.equal('param2');
            expect(param1.description).to.equal('the second parameter');
            expect(param1.optional).to.be.true;

            // @returns keyword
            expect(method.return, 'Method return keyword should be parsed').to.exist;
            expect(method.return.type).to.exist;
            expect(method.return.type.type).to.equal('number');
            expect(method.return.description).to.equal('return value description');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Method argument types should be inferred from assignment patterns, and enhanced with additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'method.typeInference.svelte'),
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
            expect(method.description).to.equal('The method comment.');

            // @param keywords
            expect(method.params, 'Method arguments should be parsed').to.exist;
            expect(method.params.length).to.equal(6);

            const param0 = method.params[0];

            expect(param0.name).to.equal('param1');
            expect(param0.description).to.equal('the first parameter');
            expect(param0.type.type).to.equal('string');
            expect(param0.defaultValue).to.be.undefined;
            expect(param0.optional).to.be.false;

            const param1 = method.params[1];

            expect(param1.name).to.equal('param2');
            expect(param1.description).to.equal('the second parameter');
            expect(param1.type.type).to.equal('boolean');
            expect(param1.defaultValue).to.equal('false');
            expect(param1.optional).to.be.true;

            const param2 = method.params[2];

            expect(param2.name).to.equal('param3');
            expect(param2.description).to.equal('the third parameter of type number');
            expect(param2.type.type).to.equal('number');
            expect(param2.defaultValue).to.equal('1');
            expect(param2.optional).to.be.true;

            const param3 = method.params[3];

            expect(param3.name).to.equal('param4');
            expect(param3.description).to.be.undefined;
            expect(param3.type.type).to.equal('array');
            expect(param3.defaultValue).to.be.undefined;
            expect(param3.optional).to.be.true;

            const param4 = method.params[4];

            expect(param4.name).to.equal('param5');
            expect(param4.description).to.be.undefined;
            expect(param4.type.type).to.equal('object');
            expect(param4.defaultValue).to.be.undefined;
            expect(param4.optional).to.be.true;

            const param5 = method.params[5];

            expect(param5.name).to.equal('param6');
            expect(param5.description).to.be.undefined;
            expect(param5.type.type).to.equal('boolean');
            expect(param5.defaultValue).to.equal('true');
            expect(param5.optional).to.be.true;

            // @returns keyword
            expect(method.return, 'Method return keyword should be parsed').to.exist;
            expect(method.return.type).to.exist;
            expect(method.return.type.type).to.equal('number');
            expect(method.return.description).to.equal('return value description');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
