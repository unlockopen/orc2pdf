const { mdToPdf } = require('md-to-pdf');

async function generateTitlePagePdf({ title, subtitle, headerContent, footerContent, stylesheetFile }) {
    const titlePageMarkdown = `# ${title}\n\n## ${subtitle || ''}\n`;
    const pdf = await mdToPdf(
        { content: titlePageMarkdown },
        {
            stylesheet: [stylesheetFile],
            pdf_options: {
                printBackground: true,
                preferCSSPageSize: true,
                scale: 1.0,
                headerTemplate: headerContent,
                footerTemplate: footerContent.replace('class="pageNumber"', '')
            },
        }
    );
    return pdf.content; // Uint8Array buffer
}

module.exports = generateTitlePagePdf;
