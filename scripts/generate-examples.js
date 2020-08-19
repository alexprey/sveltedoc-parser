const glob = require('glob');
const path = require('path');
const fs = require('fs');

const parser = require('../index');

function getFileName(input) {
    const basename = path.basename(input);
    const dotIndex = basename.lastIndexOf('.');

    if (dotIndex > 0) {
        return basename.substring(0, dotIndex);
    }

    return basename;
}

function processSvelteFile(svelteFilePath) {
    return new Promise(resolve => {
        parser.parse({
            version: 3,
            filename: svelteFilePath,
            ignoredVisibilities: []
        }).then(doc => {
            const targetFilePath = path.join(path.dirname(svelteFilePath), `${getFileName(svelteFilePath)}.json`);

            fs.writeFile(
                targetFilePath,
                JSON.stringify(doc, undefined, 4),
                (err) => {
                    if (err) {
                        console.log(`[Error] ${svelteFilePath} (${err.message})`);
                        resolve({ err, svelteFilePath });

                        return;
                    }

                    console.log('[Done]', svelteFilePath);
                    resolve({ svelteFilePath });
                });
        }).catch(err => {
            console.log(`[Error] ${svelteFilePath} (${err.message})`);
            resolve({ err, svelteFilePath });
        });
    });
}

glob('./examples/**/*.svelte', (err, files) => {
    if (err) {
        throw err;
    }

    const promises = files.map(svelteFilePath => {
        return processSvelteFile(svelteFilePath);
    });

    Promise.all(promises)
        .then(errors => {
            if (errors) {
                errors.forEach(({ err, svelteFilePath }) => {
                    if (err) {
                        console.error(`\nError at file processing "${svelteFilePath}":`, err);
                    }
                });
            }

            process.exit(errors.filter(({ err }) => err).length);
        });
});
