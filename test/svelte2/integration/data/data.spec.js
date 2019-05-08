const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc - Component data model', () => {
    it('Data model should be parsed', (done) => {
        parser.parse({
            version: 2,
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
            version: 2,
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

    it('Type of data property should be parsed from JSDoc', (done) => {
        parser.parse({
            version: 2,
            filename: path.resolve(__dirname, 'data.typeFromDescription.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data).to.be.exist;

            const properties = doc.data;

            expect(properties.length).to.be.equal(2);

            const firstProperty = properties.find(p => p.name === 'inlineTest');

            expect(firstProperty.name).to.be.equal('inlineTest');
            expect(firstProperty.type).to.be.exist;
            expect(firstProperty.type).to.be.deep.equal({
                'kind': 'type',
                'text': 'string',
                'type': 'string'
            });
            expect(firstProperty.visibility).to.be.equal('public');

            const secondProperty = properties.find(p => p.name === 'kind');

            expect(secondProperty.name).to.be.equal('kind');
            expect(secondProperty.type).to.be.exist;
            expect(secondProperty.type).to.be.deep.equal({
                'kind': 'union',
                'text': '\'white\'|\'black\'',
                'type': [
                    {
                        'kind': 'const',
                        'text': '\'white\'',
                        'type': 'string',
                        'value': 'white'
                    },
                    {
                        'kind': 'const',
                        'text': '\'black\'',
                        'type': 'string',
                        'value': 'black'
                    },
                ]
            });
            expect(secondProperty.visibility).to.be.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Type of data property should be parsed from JSDoc', (done) => {
        parser.parse({
            version: 2,
            filename: path.resolve(__dirname, 'data.typeFromValue.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.data).to.be.exist;

            const properties = doc.data;

            expect(properties.length).to.be.equal(4);

            const validatePropertyType = (propertyName, expectedType) => {
                const property = properties.find(p => p.name === propertyName);
                
                expect(property, `Data property "${propertyName}" should be exist`).to.be.exist;
                expect(property.type, `Type property for "${propertyName}" should be exist`).to.be.exist;
                expect(property.type, `Type property for "${propertyName}" should be parsed`).to.be.deep.equal({
                    'kind': 'type',
                    'text': expectedType,
                    'type': expectedType
                });
            };

            validatePropertyType('string', 'string');
            validatePropertyType('number', 'number');
            validatePropertyType('emptyArray', 'Array<any>');
            validatePropertyType('emptyObject', 'any');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
