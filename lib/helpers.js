const fs = require('fs');
const path = require('path');

function loadFileStructureFromOptions(options) {
    if (options.structure) {
        return options.structure;
    }

    if (options.fileContent) {
        return parseFileStructureFromContent(options.fileContent);
    }

    if (options.filename) {
        if (path.extname(options.filename) === '.js') {
            return {
                template: '',
                scripts: [{
                    content: fs.readFileSync(options.filename, options.encoding),
                    attributes: '',
                    offset: 0
                }],
                styles: []
            };
        } else {
            const buffer = fs.readFileSync(options.filename, options.encoding);
            return parseFileStructureFromContent(buffer.toString());
        }
    }

    throw new Error('Can not load source from options, because nothing is not provided');
}

function extractHtmlBlock(content, blockName, searchStartIndex) {
    const blockOuterStartIndex = content.indexOf(`<${blockName}`, searchStartIndex);
    if (blockOuterStartIndex >= 0) {
        const blockInnerEndIndex = content.indexOf(`</${blockName}>`, blockOuterStartIndex + blockName.length + 1);

        if (blockInnerEndIndex >= 0) {
            const openTagEndIndex = content.indexOf('>', blockOuterStartIndex + blockName.length);

            const attributes = content.substr(blockOuterStartIndex + blockName.length + 1, openTagEndIndex - blockOuterStartIndex - blockName.length - 1);
            const innerBlockContent = content.substr(openTagEndIndex + 1, blockInnerEndIndex - openTagEndIndex - 1);
            const offset = openTagEndIndex + 1;

            const blockOuterEndIndex = blockInnerEndIndex + blockName.length + 3;

            return {
                block: {
                    offset: offset,
                    outerPosition: {
                        start: blockOuterStartIndex,
                        end: blockOuterEndIndex
                    },
                    content: innerBlockContent,
                    attributes: attributes
                }
            };
        }
    }

    return {
        block: null
    };
}

function extractAllHtmlBlocks(content, blockName) {
    const blocks = [];

    let searchResult = extractHtmlBlock(content, blockName);
    while (searchResult.block) {
        blocks.push(searchResult.block);

        const searchStartIndex = searchResult.block.outerPosition.end;
        searchResult = extractHtmlBlock(content, blockName, searchStartIndex);
    }

    return {
        blocks: blocks
    };
}

function parseFileStructureFromContent(fileContent) {
    const scriptBlocksSearchResult = extractAllHtmlBlocks(fileContent, 'script');
    const styleBlocksSearchResult = extractAllHtmlBlocks(fileContent, 'style');

    return {
        content: fileContent,
        template: fileContent,
        scripts: scriptBlocksSearchResult.blocks,
        styles: styleBlocksSearchResult.blocks
    }
}

module.exports = {
    loadFileStructureFromOptions,
    extractHtmlBlock,
    extractAllHtmlBlocks,
    parseFileStructureFromContent
};
