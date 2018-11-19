const path = require('path');
const chai = require('chai');
const expect = chai.expect;

const fs = require('fs');

const parser = require('../../index');

describe('Overall', () => {
    it('Component should be parsed with all features', (done) => {
        parser.parse({
            filename: path.resolve(__dirname, 'main.svelte'),
            ignoredVisibilities: []
        }).then((doc) => {
            expect(doc, 'Document should be provided').to.exist;

            // Remove function body expressions
            [
                ...doc.methods,
                ...doc.actions,
                ...doc.transitions,
                ...doc.data
            ].forEach(m => {
                if (m.value && m.value.type) {
                    delete m.value;
                }
            });

            // fs.writeFileSync(path.resolve(__dirname, 'overall.main.doc.json'), JSON.stringify(doc, null, 4));

            const expectedDoc = JSON.parse(fs.readFileSync(path.resolve(__dirname, 'overall.main.doc.json')));

            expect(doc).to.deep.equal(expectedDoc);

            done();
        }).catch(e => {
            done(e);
        });
    });
});
