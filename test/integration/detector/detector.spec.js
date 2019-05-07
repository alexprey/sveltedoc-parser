const path = require('path');
const fs = require('fs');
const chai = require('chai');
const expect = chai.expect;

const detector = require('./../../../lib/detector');

describe('SvelteDoc file version detector', () => {
    it('Empty file detected with undefined version', () => {
        const version = detector.detectVersionFromOptions({
            filename: path.join(__dirname, 'empty.svelte')
        });

        expect(version).is.undefined;
    });

    describe('Svelte V2 files check', () => {
        const folderPath = path.resolve(__dirname, 'v2');
        const files = fs.readdirSync(folderPath);
        files
            .filter(file => file.endsWith('.svelte'))
            .forEach(file => {
                it('Svelte V2 file: ' + file, () => {
                    const version = detector.detectVersionFromOptions({
                        filename: path.join(folderPath, file)
                    });

                    expect(version).is.equal(detector.SVELTE_VERSION_2);
                });
            });
    });

    describe('Svelte V3 files check', () => {
        const folderPath = path.resolve(__dirname + '/v3');
        const files = fs.readdirSync(folderPath);
        files
            .filter(file => file.endsWith('.svelte'))
            .forEach(file => {
                it('Svelte V3 file: ' + file, () => {
                    const version = detector.detectVersionFromOptions({
                        filename: path.join(folderPath, file)
                    });

                    expect(version).is.equal(detector.SVELTE_VERSION_3);
                });
            });
    });
});