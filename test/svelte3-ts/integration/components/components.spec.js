const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const parser = require('../../../../index');

describe('SvelteDoc v3 - Components', () => {
    it('Import with upper case default should be parsed as component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'components.import.svelte'),
            features: ['components'],
            includeSourceLocations: true,
            ignoredVisibilities: []
        }).then((doc) => {
            // Document
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.components, 'Document components should be parsed').to.exist;
            expect(doc.components.length).to.equal(1);

            // Component
            const component = doc.components[0];

            expect(component.name).to.equal('Nested');
            expect(component.importPath).to.equal('./components.nested.svelte');
            expect(component.visibility).to.equal('private');
            expect(component.description).to.equal('The nested component.');
            expect(component.locations, 'Code location should be included').to.be.exist;
            expect(component.locations.length).to.equal(1);

            // Location
            const location = component.locations[0];

            expect(location, 'Location should be correctly identified').is.deep.equal({ start: 53, end: 59 });

            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Import with upper case in aliace by default should not be parsed as component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'components.import.aliace.svelte'),
            features: ['components'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.components, 'Document components should be parsed').to.exist;

            expect(doc.components.length).to.equal(0);
            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Import with upper case not default should not be parsed as component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'components.notdefault.svelte'),
            features: ['components'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.components, 'Document components should be parsed').to.exist;

            expect(doc.components.length).to.equal(0);
            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Import with lowercase case default should not be parsed as component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'components.lowercase.svelte'),
            features: ['components'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.components, 'Document components should be parsed').to.exist;

            expect(doc.components.length).to.equal(0);
            done();
        }).catch(e => {
            done(e);
        });
    });

    it('Import with start and alias should not be parsed as component', (done) => {
        parser.parse({
            version: 3,
            filename: path.resolve(__dirname, 'components.importStar.svelte'),
            features: ['components'],
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;
            expect(doc.components, 'Document components should be parsed').to.exist;

            expect(doc.components.length).to.equal(0);
            done();
        }).catch(e => {
            done(e);
        });
    });
});
