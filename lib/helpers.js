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

function extractHtmlBlock(content, blockName) {
    let remainingContent = content;

    const blockStart = remainingContent.indexOf(`<${blockName}`);
    if (blockStart >= 0) {
        const blockEnd = remainingContent.indexOf(`</${blockName}>`, blockStart + blockName.length + 1);

        if (blockEnd >= 0) {
            const openTagEndIndex = remainingContent.indexOf('>', blockStart + blockName.length);

            const attributes = remainingContent.substr(blockStart + blockName.length + 1, openTagEndIndex - blockStart - blockName.length - 1);
            const innerBlockContent = remainingContent.substr(openTagEndIndex + 1, blockEnd - openTagEndIndex - 1);
            const offset = openTagEndIndex + 1;

            remainingContent = remainingContent.substr(0, blockStart) + remainingContent.substr(blockEnd + blockName.length + 3);

            return {
                remainingContent: remainingContent,
                block: {
                    offset: offset,
                    content: innerBlockContent,
                    attributes: attributes
                }
            };
        }
    }

    return {
        remainingContent: content,
        block: null
    }
}

function extractAllHtmlBlocks(content, blockName) {
    const blocks = [];

    let searchResult = extractHtmlBlock(content, blockName);
    if (searchResult.block) {
        blocks.push(searchResult.block);
    }
    // while (searchResult.block !== null) {
    //     blocks.push(searchResult.block);

    //     searchResult = extractHtmlBlock(searchResult.remainingContent, blockName);
    // }

    return {
        remainingContent: searchResult.remainingContent,
        blocks: blocks
    };
}

function parseFileStructureFromContent(fileContent) {
    const scriptBlocksSearchResult = extractAllHtmlBlocks(fileContent, 'script');
    const styleBlocksSearchResult = extractAllHtmlBlocks(scriptBlocksSearchResult.remainingContent, 'style');

    return {
        content: fileContent,
        template: styleBlocksSearchResult.remainingContent,
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
