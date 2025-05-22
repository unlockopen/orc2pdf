import { mdToPdf } from 'md-to-pdf';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
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

export default generateTitlePagePdf;
