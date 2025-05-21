const { mdToPdf } = require('md-to-pdf');
const path = require('path');
const titlePagestylesheetFile = path.resolve(__dirname, '../assets/title-page.css');

async function generateTitlePagePdf(pageMetadata, pdfOptions) {
    // Generate the title page content
    const titlePageMarkdown = `# ${pageMetadata['title']}\n\n## ${pageMetadata['subtitle'] || ''}\n`;
    // Modify the footer from the pdfOptions
    pdfOptions.footerTemplate = pdfOptions.footerTemplate.replace('class="pageNumber"', '');
    const pdf = await mdToPdf(
        { content: titlePageMarkdown },
        {
            stylesheet: [titlePagestylesheetFile],
            pdf_options: pdfOptions,
        }
    );
    return pdf.content; // Uint8Array buffer
}

module.exports = generateTitlePagePdf;
