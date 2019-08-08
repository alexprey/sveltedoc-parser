const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Events', () => {
    it('Markup events with modificators should be parsed', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.modificators.svelte'),
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

            expect(event.modificators).to.eql([
                'once', 'preventDefault'
            ]);

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Propogated events in markup should be parsed', (done) => {
        parser.parse({
            version: 3,
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

    it('Dispatch event from code should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.default.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from code method should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.insideMethod.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(2);
            const event1 = doc.events[0];

            expect(event1, 'Event should be a valid entity').to.exist;
            expect(event1.name).to.equal('notify');
            expect(event1.visibility).to.equal('public');

            const event2 = doc.events[1];

            expect(event2, 'Event should be a valid entity').to.exist;
            expect(event2.name).to.equal('notify2');
            expect(event2.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from code with custom dispatcher name should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.custom.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from code with custom dispatcher name and custom constructor should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.customConstructor.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
