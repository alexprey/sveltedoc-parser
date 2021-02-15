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

    it('Propogated events in markup should be parsed even it was before handled', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.handleAndPropogate.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            const event = doc.events.find(e => e.name === 'click');

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
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            expect(doc.events.length).to.equal(1);
            const event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            expect(event.locations, 'Code location should be included').to.be.exist;
            expect(event.locations.length).to.be.equal(1);

            const location = event.locations[0];

            expect(location, 'Location should be correct identified').is.deep.equals({ start: 126, end: 134 });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from markup expression should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.dispatcher.default.svelte'),
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

    it('Dispatch event from markup with anon function expression should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.dispatcher.default.function.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            const event1 = doc.events.find(e => e.name === 'notify');

            expect(event1, 'Event should be a valid entity').to.exist;
            expect(event1.name).to.equal('notify');
            expect(event1.visibility).to.equal('public');

            const event2 = doc.events.find(e => e.name === 'notify2');

            expect(event2, 'Event should be a valid entity').to.exist;
            expect(event2.name).to.equal('notify2');
            expect(event2.visibility).to.equal('public');

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

            const event1 = doc.events.find(e => e.name === 'notify');

            expect(event1, 'Event from regular function must be parsed').to.exist;
            expect(event1.name).to.equal('notify');
            expect(event1.visibility).to.equal('public');

            const event2 = doc.events.find(e => e.name === 'notify2');

            expect(event2, 'Event from arrow function must be parsed').to.exist;
            expect(event2.name).to.equal('notify2');
            expect(event2.visibility).to.equal('public');

            const event3 = doc.events.find(e => e.name === 'notify3');

            expect(event3, 'Event from exported function must be parsed').to.exist;
            expect(event3.name).to.equal('notify3');
            expect(event3.visibility).to.equal('public');

            const event4 = doc.events.find(e => e.name === 'notify4');

            expect(event4, 'Event from exported arrow function must be parsed').to.exist;
            expect(event4.name).to.equal('notify4');
            expect(event4.visibility).to.equal('public');

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

    it('Dispatch event from markup expression with custom dispatcher name should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.dispatcher.custom.svelte'),
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

    it('Dispatch event from markup expression with custom dispatcher name and custom constructor should be found', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.markup.dispatcher.customConstructor.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            const event1 = doc.events.find(e => e.name === 'notify');

            expect(event1, 'Event should be a valid entity').to.exist;
            expect(event1.name).to.equal('notify');
            expect(event1.visibility).to.equal('public');

            const event2 = doc.events.find(e => e.name === 'notify2');

            expect(event2, 'Event should be a valid entity').to.exist;
            expect(event2.name).to.equal('notify2');
            expect(event2.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from external callback', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.externalCallback.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;

            const event = doc.events.find(e => e.name === 'change');

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('change');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from code should be found when using an identifier from object', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.identifier.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;
            expect(doc.events.length).to.equal(4);

            let event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            event = doc.events[1];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('plain-notify');
            expect(event.visibility).to.equal('public');

            event = doc.events[2];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('exported-notify');
            expect(event.visibility).to.equal('public');

            event = doc.events[3];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('exported-plain-notify');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Dispatch event from code should be found when using an identifier with bracket notation', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.arrayIdentifier.svelte'),
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

    xit('Dispatch event from code should be found when using an identifier from imported object', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'event.dispatcher.importedIdentifier.svelte'),
            features: ['events'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.events, 'Document events should be parsed').to.exist;
            expect(doc.events.length).to.equal(2);

            let event = doc.events[0];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('notify');
            expect(event.visibility).to.equal('public');

            event = doc.events[1];

            expect(event, 'Event should be a valid entity').to.exist;
            expect(event.name).to.equal('plain-notify');
            expect(event.visibility).to.equal('public');

            done();
        }).catch(e => {
            done(e);
        });
    });
});
