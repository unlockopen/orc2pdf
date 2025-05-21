const fs = require('fs');
const { mdToPdf } = require('md-to-pdf');

async function generateHtml(inputMd, stylesheetFile, outputHtml) {
    const markdownContent = fs.readFileSync(inputMd, 'utf8');
    await mdToPdf(
        { content: markdownContent },
        {
            dest: outputHtml,
            stylesheet: [stylesheetFile],
            as_html: true,
        }
    );
    console.log(`HTML output generated: ${outputHtml}`);
}

module.exports = generateHtml;
