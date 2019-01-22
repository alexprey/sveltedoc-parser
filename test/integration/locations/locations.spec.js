const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../index');

describe('SvelteDoc - Source locations', () => {
    it('Source locations for component data properties should be extracted', (done) => {
        parser.parse({
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.data.length).is.equals(1);
            const property = doc.data[0];

            expect(property.loc).is.deep.equals({
                start: 120,
                end: 130
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component methods should be extracted', (done) => {
        parser.parse({
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['methods'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.methods.length).is.equals(1);
            const method = doc.methods[0];

            expect(method.loc).is.deep.equals({
                start: 179,
                end: 184
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component events should be extracted', (done) => {
        parser.parse({
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.events.length).is.equals(2);
            const codeEvent = doc.events.find(e => e.name === "codeEvent");
            expect(codeEvent).is.not.null;
            expect(codeEvent.loc).is.deep.equals({
                start: 247,
                end: 258
            });

            const markupEvent = doc.events.find(e => e.name === "markupEvent");
            expect(markupEvent).is.not.null;
            expect(markupEvent.loc).is.deep.equals({
                start: 0,
                end: 35
            });

            done();
        }).catch(e => {
            done(e);
        });
    });
});
