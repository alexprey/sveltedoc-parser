const fs = require('fs');
const path = require('path');

const Parser = require('./lib/parser');

const DEFAULT_ENCODING = 'utf8';
const DEFAULT_IGNORED_VISIBILITIES = ['protected', 'private'];

function parseOptions(options) {
    if (!options || (!options.filename && !options.fileContent)) {
        throw new Error('One of options.filename or options.filecontent is required');
    }

    options.encoding = options.encoding || DEFAULT_ENCODING;
    options.ignoredVisibilities = options.ignoredVisibilities || DEFAULT_IGNORED_VISIBILITIES;
}

module.exports.parse = (options) => new Promise((resolve, reject) => {
    try {
        parseOptions(options);

        if (!options.source) {
            if (options.filename) {
                if (path.extname(options.filename) === '.js') {
                    options.source = {
                        template: '',
                        script: fs.readFileSync(options.filename, options.encoding)
                    };
                } else {
                    options.source = loadSourceFromFileContent(
                        fs.readFileSync(options.filename, options.encoding));
                }
            } else {
                options.source = loadSourceFromFileContent(options.fileContent);
            }
        }

        const component = {};
        const parser = new Parser(options);

        parser.features.forEach((feature) => {
            switch (feature) {
                case 'name':
                case 'description':
                    component[feature] = null;
                    parser.on(feature, (value) => (component[feature] = value));
                    break;

                case 'keywords':
                    component[feature] = [];
                    parser.on(feature, (value) => (component[feature] = value));
                    break;

                default:
                    component[feature] = [];

                    const eventName = Parser.getEventName(feature);

                    parser.on(eventName, (value) => {
                        const itemIndex = component[feature].findIndex(item => item.name === value.name);

                        if (itemIndex < 0) {
                            component[feature].push(value);
                        } else {
                            component[feature][itemIndex] = value;
                        }
                    });
            }
        });

        parser.on('end', () => {
            parser.features.forEach((feature) => {
                if (component[feature] instanceof Array) {
                    component[feature] = component[feature].filter((item) => {
                        return !options.ignoredVisibilities.includes(item.visibility);
                    });
                }
            });

            resolve(component);
        });

        parser.on('failure', (error) => {
            reject(error);
        });

        parser.walk();
    } catch (error) {
        reject(error);
    }
});

function extractContentFromHtmlBlock(content, blockName) {
    let leftContent = content;
    let innerBlockContent = '';
    let attributes = '';
    let offset = 0;

    const blockStart = leftContent.indexOf(`<${blockName}`);

    if (blockStart >= 0) {
        const blockEnd = leftContent.indexOf(`</${blockName}>`, blockStart + blockName.length + 1);

        if (blockEnd >= 0) {
            const openTagEndIndex = leftContent.indexOf('>', blockStart + blockName.length);

            attributes = leftContent.substr(blockStart + blockName.length + 1, openTagEndIndex - blockStart - blockName.length - 1);
            innerBlockContent = leftContent.substr(openTagEndIndex + 1, blockEnd - openTagEndIndex - 1);
            offset = openTagEndIndex + 1;

            leftContent = leftContent.substr(0, blockStart) + leftContent.substr(blockEnd + blockName.length + 3);
        }
    }

    return {
        leftContent: leftContent,
        innerContent: innerBlockContent,
        attributes: attributes,
        offset: offset
    };
}

function loadSourceFromFileContent(fileContent) {
    const script = extractContentFromHtmlBlock(fileContent, 'script');
    const style = extractContentFromHtmlBlock(script.leftContent, 'style');

    return {
        template: style.leftContent,
        script: script.innerContent,
        scriptOffset: script.offset,
        style: style.innerContent,
        styleOffset: style.offset
    };
}
