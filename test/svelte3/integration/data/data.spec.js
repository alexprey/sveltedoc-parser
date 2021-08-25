const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Props', () => {
    it('Private data should be parsed with comment and additional metadata', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.private.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document events should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const prop = doc.data[0];

            expect(prop.name).to.equal('variableWithDefault');
            expect(prop.visibility).to.equal('private');
            expect(prop.static).to.be.false;

            expect(prop.description).to.equal('The variable comment.');

            expect(prop.type).to.exist;
            expect(prop.type).to.eql({ kind: 'type', text: 'string', type: 'string' });

            expect(prop.locations, 'Code location for data item should be included').to.be.exist;
            expect(prop.locations.length).to.be.equal(1);

            const location = prop.locations[0];

            expect(location, 'Location should be correct identified').is.deep.equals({ start: 84, end: 103 });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Public data should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.public.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(2);
            const variableItem = doc.data.find(item => item.name === 'variable');

            expect(variableItem).to.be.not.null;
            expect(variableItem.visibility).to.equal('public');
            expect(variableItem.static).to.be.false;
            expect(variableItem.description).to.be.null;
            expect(variableItem.type).to.eql({ kind: 'type', text: 'string', type: 'string' });
            expect(variableItem.defaultValue).to.equal('hello');

            const variableWithCommentItem = doc.data.find(item => item.name === 'propertyWithComment');

            expect(variableWithCommentItem).to.be.not.null;
            expect(variableWithCommentItem.visibility).to.equal('public');
            expect(variableWithCommentItem.static).to.be.false;
            expect(variableWithCommentItem.description).to.be.equal('The property comment.');
            expect(variableWithCommentItem.type).to.eql({ kind: 'type', type: 'string', text: 'string' });
            expect(variableWithCommentItem.defaultValue).to.equal(undefined);
            expect(variableWithCommentItem.keywords).to.be.exist;
            expect(variableWithCommentItem.keywords.length).to.equal(1);

            const keyword = variableWithCommentItem.keywords[0];

            expect(keyword.name).to.equal('type');
            expect(keyword.description).to.equal('{string}');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Static data should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.static.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document events should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const prop = doc.data[0];

            expect(prop.name).to.equal('staticVariable');
            expect(prop.static).to.be.true;

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Multiple data declarations should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.multiple.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document events should be parsed').to.exist;

            expect(doc.data.length).to.equal(3);

            expect(doc.data[0].name).to.equal('a');
            expect(doc.data[0].visibility).to.equal('private');

            expect(doc.data[1].name).to.equal('b');
            expect(doc.data[1].visibility).to.equal('private');

            expect(doc.data[2].name).to.equal('c');
            expect(doc.data[2].visibility).to.equal('private');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Object pattern prop declaration should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.objectPattern.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document events should be parsed').to.exist;

            expect(doc.data.length).to.equal(3);

            expect(doc.data[0].name).to.equal('a');
            expect(doc.data[0].visibility).to.equal('private');

            expect(doc.data[1].name).to.equal('b');
            expect(doc.data[1].visibility).to.equal('private');

            expect(doc.data[2].name).to.equal('c');
            expect(doc.data[2].visibility).to.equal('private');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Imported default data should be parsed with comment', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.import.default.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const prop = doc.data[0];

            expect(prop.name).to.equal('x');
            expect(prop.originalName).to.equal('x');
            expect(prop.importPath).to.equal('./importable.js');
            expect(prop.visibility).to.equal('private');
            expect(prop.static).to.be.false;

            expect(prop.description).to.equal('The import comment.');

            expect(prop.type).to.eql({ kind: 'type', type: 'any', text: 'any' });

            expect(prop.locations, 'Code location should be parsed').to.be.exist;
            expect(prop.locations[0]).is.deep.equals({ start: 63, end: 64 });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Imported default data with aliace should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.import.aliace.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(1);
            const prop = doc.data[0];

            expect(prop.name).to.equal('altY');
            expect(prop.originalName).to.equal('y');
            expect(prop.importPath).to.equal('./importable.js');
            expect(prop.visibility).to.equal('private');
            expect(prop.static).to.be.false;

            expect(prop.type).to.eql({ kind: 'type', type: 'any', text: 'any' });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Imported many data should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.import.many.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(2);

            const prop1 = doc.data[0];

            expect(prop1.name).to.equal('y');
            expect(prop1.visibility).to.equal('private');
            expect(prop1.static).to.be.false;
            expect(prop1.type).to.eql({ kind: 'type', type: 'any', text: 'any' });

            expect(prop1.locations, 'Code location should be parsed').to.be.exist;
            expect(prop1.locations[0]).is.deep.equals({ start: 64, end: 65 });

            const prop2 = doc.data[1];

            expect(prop2.name).to.equal('z');
            expect(prop2.visibility).to.equal('private');
            expect(prop2.static).to.be.false;
            expect(prop2.type).to.eql({ kind: 'type', type: 'any', text: 'any' });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Export object statement with multiple variables should be parsed as public props', done => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.export.many.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(3);

            const prop1 = doc.data.find(d => d.name === 'a');

            expect(prop1.name).to.equal('a');
            expect(prop1.visibility).to.equal('public');
            expect(prop1.static).to.be.false;
            expect(prop1.description).to.be.equal('The `a` variable description');
            expect(prop1.type).to.eql({ kind: 'type', type: 'number', text: 'number' });

            expect(prop1.locations, 'Code location should be parsed').to.be.exist;
            expect(prop1.locations[0]).is.deep.equals({ start: 56, end: 57 });
            expect(prop1.locations[1]).is.deep.equals({ start: 157, end: 158 });

            const prop2 = doc.data.find(d => d.name === 'b');

            expect(prop2.name).to.equal('b');
            expect(prop2.visibility).to.equal('public');
            expect(prop2.static).to.be.false;
            expect(prop2.description).to.be.equal('The `b` variable description');
            expect(prop2.type).to.eql({ kind: 'type', type: 'string', text: 'string' });

            const prop3 = doc.data.find(d => d.name === 'c');

            expect(prop3.name).to.equal('c');
            expect(prop3.visibility).to.equal('public');
            expect(prop3.static).to.be.false;
            expect(prop3.description).to.be.equal('The `c` variable description');
            expect(prop3.type).to.eql({ kind: 'type', type: 'string', text: 'string' });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Export object statement with variable and aliace for that should be parsed as public prop', done => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'data.export.aliace.svelte'),
            features: ['data'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data, 'Document data should be parsed').to.exist;

            expect(doc.data.length).to.equal(2);

            const prop = doc.data.find(d => d.name === 'class');

            expect(prop).to.exist;
            expect(prop.name, 'Aliace name must be exposed instead of original name').to.equal('class');
            expect(prop.localName, 'Local name must be stored').to.equal('classes');
            expect(prop.visibility).to.equal('public');
            expect(prop.static).to.be.false;
            expect(prop.description).to.be.equal('Description for variable that must be exported later');
            expect(prop.type).to.eql({ kind: 'type', type: 'Array<string>', text: 'Array<string>' });

            expect(prop.locations, 'Code location should be parsed').to.be.exist;
            expect(prop.locations[0]).is.deep.equals({ start: 181, end: 186 });

            const localProp = doc.data.find(d => d.name === 'classes');

            expect(localProp, 'Local prop definition also must be provided').to.exist;

            done();
        }).catch(e => {
            done(e);
        });
    });
});
