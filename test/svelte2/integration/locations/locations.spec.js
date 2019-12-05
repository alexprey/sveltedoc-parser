const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc - Source locations', () => {
    it('Source locations for component data properties should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['data'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.data.length).is.equals(1);
            const property = doc.data[0];

            expect(property.loc).is.deep.equals({
                start: 166,
                end: 176
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component methods should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['methods'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.methods.length).is.equals(1);
            const method = doc.methods[0];

            expect(method.loc).is.deep.equals({
                start: 221,
                end: 226
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component refs should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['refs'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.refs.length).is.equals(1);
            const ref = doc.refs[0];

            expect(ref.loc).is.deep.equals({
                start: 4,
                end: 15
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component slots should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['slots'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.slots.length).is.equals(1);
            const slot = doc.slots[0];

            expect(slot.loc).is.deep.equals({
                start: 64,
                end: 81
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component events should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.events.length).is.equals(3);
            const markupPropogatedEvent = doc.events.find(e => e.name === "mousemove");
            expect(markupPropogatedEvent).is.not.empty;
            expect(markupPropogatedEvent.loc).is.deep.equals({
                start: 44,
                end: 58
            });

            const codeEvent = doc.events.find(e => e.name === "codeEvent");
            expect(codeEvent).is.not.empty;
            expect(codeEvent.loc).is.deep.equals({
                start: 287,
                end: 298
            });

            const markupEvent = doc.events.find(e => e.name === "markupEvent");
            expect(markupEvent).is.not.empty;
            expect(markupEvent.loc).is.deep.equals({
                start: 15,
                end: 44
            });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Source locations for component helpers should be extracted', (done) => {
        parser.parse({
            version: 2,
            includeSourceLocations: true,
            filename: path.resolve(__dirname, 'main.svelte'),
            features: ['helpers'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc.helpers.length).is.equals(2);
            const firstHelper = doc.helpers.find(h => h.name === 'window');
            const secondHelper = doc.helpers.find(h => h.name === 'helperFunc');

            expect(firstHelper.loc).is.deep.equals({
                start: 341,
                end: 347
            });

            expect(secondHelper.loc).is.deep.equals({
                start: 357,
                end: 367
            });

            done();
        }).catch(e => {
            done(e);
        });
    });
});
