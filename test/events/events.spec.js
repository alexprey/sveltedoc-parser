const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../index');

describe('Events', () => {
    it('Fired events in markup should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'event.markup.fire.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('click');
            expect(event.visibility).to.equal('public');
            expect(event.parent).to.be.null;
            expect(event.description).to.equal('Event fired when user clicked on button.');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Fired events in component methods should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'event.method.fire.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('click');
            expect(event.visibility).to.equal('public');
            expect(event.parent).to.be.null;
            expect(event.description).to.equal('Event fired when user clicked on button.');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Fired events with identifier event name in component methods should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'event.method.fire.identifier.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('click');
            expect(event.visibility).to.equal('public');
            expect(event.parent).to.be.null;
            expect(event.description).to.equal('Event fired when user clicked on button.');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Propogated events in markup should be parsed', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'event.markup.propogate.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('click');
            expect(event.visibility).to.equal('public');
            expect(event.parent).to.be.equal('button');
            expect(event.description).to.equal('Event fired when user clicked on button.');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
