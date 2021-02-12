const chai = require('chai');
const expect = chai.expect;

const helpers = require('../../../lib/helpers');

describe('Helpers parser module tests', () => {
    describe('helpers.extractHtmlBlock', () => {
        it('When html block exists should be provide a correct result', () => {
            const content = `
<p>Some content here</p>
<script>
let variable = 1;
</script>
`;

            const result = helpers.extractHtmlBlock(content, 'script');

            expect(result).is.exist;
            const block = result.block;

            expect(block).is.exist;
            expect(block.content).is.eq('\nlet variable = 1;\n');
            expect(block.offset).is.eq(34);
            expect(block.outerPosition).is.exist;
            expect(block.outerPosition.start).is.eq(26);
            expect(block.outerPosition.end).is.eq(62);
            expect(block.attributes).is.empty;
        });

        it('When html block have attribute, should be correct extracted', () => {
            const content = `
<p>Some content here</p>
<script scope="module">
let variable = 1;
</script>
`;

            const result = helpers.extractHtmlBlock(content, 'script');

            expect(result).is.exist;
            const block = result.block;

            expect(block).is.exist;
            expect(block.attributes).is.eq(' scope="module"');
        });

        it('When startIndex are specified, should be skip first content and provide the next item', () => {
            const content = `
<p>Some content here</p>
<script>
let variable = 1;
</script>
<script>
let variable = 2;
</script>
            `;

            const result = helpers.extractHtmlBlock(content, 'script', 62);

            expect(result).is.exist;
            const block = result.block;

            expect(block).is.exist;
            expect(block.content).is.eq('\nlet variable = 2;\n');
            expect(block.offset).is.eq(71);
            expect(block.outerPosition).is.exist;
            expect(block.outerPosition.start).is.eq(63);
            expect(block.outerPosition.end).is.eq(99);
            expect(block.attributes).is.empty;
        });
    });

    describe('helpers.extractAllHtmlBlocks', () => {
        it('Extract one script block', () => {
            const content = `
<p>Some content here</p>
<script>
let variable = 1;
</script>
            `;
            const result = helpers.extractAllHtmlBlocks(content, 'script');

            expect(result).is.exist;
            expect(result.blocks).is.exist;
            expect(result.blocks.length).is.eq(1);

            const block = result.blocks[0];

            expect(block).is.exist;
            expect(block.offset).is.eq(34);
            expect(block.content).is.eq('\nlet variable = 1;\n');
            expect(block.attributes).is.empty;
        });

        it('Extract two script blocks', () => {
            const content = `
<p>Some content here</p>
<script>
let variable = 1;
</script>
<script>
let variable = 2;
</script>
            `;
            const result = helpers.extractAllHtmlBlocks(content, 'script');

            expect(result).is.exist;
            expect(result.blocks).is.exist;
            expect(result.blocks.length).is.eq(2);

            let block = result.blocks[0];

            expect(block).is.exist;
            expect(block.offset).is.eq(34);
            expect(block.content).is.eq('\nlet variable = 1;\n');
            expect(block.attributes).is.empty;

            block = result.blocks[1];
            expect(block).is.exist;
            expect(block.offset).is.eq(71);
            expect(block.content).is.eq('\nlet variable = 2;\n');
            expect(block.attributes).is.empty;
        });

        // TODO Re-enable for following issue: https://github.com/alexprey/sveltedoc-parser/issues/58
        xit('When html block contains complex markup with escaping and string usages should provide a correct result', () => {
            const content = `
<script>
export let items = [];
</script>
<Panel title="Basic tabs" shadow={true}>
  <Tabs bind:items={items}/>
  <br><br>
  <strong>Active tab:</strong> {activeTab1[0].title}
  <br>
  <br>

  <Code>
    {@html highlight(
      '<script> \n' +
      '   const items = [ \n' + 
      '     { title: "Tab 1", active: true }, \n' +
      '     { title: "Tab 2", active: false }, \n' +
      '     { title: "Tab 3", active: false }, \n' +
      '     { title: "Tab 4", active: false }, \n' +
      '   ]; \n' +
      '</script> \n\n' +
      '<Tabs bind:items={items} />')}
  </Code>
</Panel>
            `;

            const result = helpers.extractAllHtmlBlocks(content, 'script');

            expect(result).is.exist;
            expect(result.blocks).is.exist;
            expect(result.blocks.length).is.eq(1);

            const block = result.blocks[0];

            expect(block).is.exist;
            expect(block.offset).is.eq(9);
            expect(block.content).is.eq('\nexport let items = [];\n');
            expect(block.attributes).is.empty;
        });
    });
});
