import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import { PDFDocument } from 'pdf-lib';
import generateTitlePagePdf from './lib/title-page-generator.js';
import { prependTitlePage, resetPageLabels, cropPdfToA4 } from './lib/pdf-manipulation.js';
import { getFileMetadata, injectVariables } from './lib/metadata.js';
import mdToHtml from './lib/md-to-html.js';
import htmlToHtml from './lib/html-to-html.js';

const inputMd = process.argv[2];
const outputHtmlFlag = process.argv.includes('--html');
const titlePageFlag = !process.argv.includes('--no-title-page');

if (!inputMd) {
    console.error('❌ Error: Please provide the input Markdown file as an argument.');
    process.exit(1);
}

const outputPdf = path.basename(inputMd, path.extname(inputMd)) + '.pdf';
const outputHtml = path.basename(inputMd, path.extname(inputMd)) + '.html';

import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const headerFile = path.resolve(__dirname, 'assets/header.html');
const footerFile = path.resolve(__dirname, 'assets/footer.html');
const mainContentStylesheetFile = path.resolve(__dirname, 'assets/main-content.css');
const jsPreprocessorFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');
const metadataFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.yaml');

let markdownContent = fs.readFileSync(inputMd, 'utf8');
let headerContent = fs.readFileSync(headerFile, 'utf8');
let footerContent = fs.readFileSync(footerFile, 'utf8');

// Get metadata from the yaml file or create it if it doesn't exist
getFileMetadata(metadataFile);

// Define base PDF options
const pdfOptions = {
    displayHeaderFooter: true,
    headerTemplate: injectVariables(headerContent, pageMetadata),
    footerTemplate: injectVariables(footerContent, pageMetadata),
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1.0,
};

console.log('📄 Starting PDF generation process...');
console.log(`   - Input Markdown: ${inputMd}`);
console.log(`   - Output PDF: ${outputPdf}`);
if (outputHtmlFlag) {
    console.log(`   - Output HTML: ${outputHtml}`);
}
if (titlePageFlag && pageMetadata.title) {
    console.log('   - Title page will be included.');
} else {
    console.log('   - Title page will NOT be included.');
}

(async () => {
    try {
        // 1. Always generate HTML from Markdown (new way, with plugins)
        console.log('🌐 Generating HTML from Markdown...');
        let htmlContent = await mdToHtml(inputMd, mainContentStylesheetFile);

        // 2. If JS preprocessor exists, append it as a <script> to the HTML
        if (fs.existsSync(jsPreprocessorFile)) {
            console.log('🔧 Found JS preprocessor file, injecting into HTML...');
            const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
            // Insert before </body> if present, else append
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace(
                    '</body>',
                    `<script>\n${jsContent}\n</script>\n</body>`
                );
            } else {
                htmlContent += `\n<script>\n${jsContent}\n</script>`;
            }
        }

        // 3. If --html, write the HTML to disk
        if (outputHtmlFlag) {
            htmlToHtml(htmlContent, outputHtml)
        }

        // 4. Generate main content PDF from HTML
        console.log('🖨️ Generating main content PDF from HTML...');
        const mainContentPdf = await mdToPdf(
            { content: htmlContent },
            {
                stylesheet: mainContentStylesheetFile,
                pdf_options: pdfOptions,
                beforePrint: async (page) => {
                    await page.evaluate(() => new Promise((resolve) => {
                        if (document.readyState === 'complete') resolve();
                        else window.addEventListener('DOMContentLoaded', resolve);
                    }));
                },
            }
        );
        console.log('✅ Main content PDF generated.');

        let mainPdfDoc = await PDFDocument.load(mainContentPdf.content);

        // Generate and prepend title page, then reset page numbers if needed
        if (titlePageFlag && pageMetadata.title) {
            console.log('📝 Generating title page PDF...');
            // You may want to update generateTitlePagePdf to accept HTML as well, or keep using Markdown for the title page.
            const titlePagePdfBuffer = await generateTitlePagePdf(pageMetadata, pdfOptions);
            const titlePdfDoc = await PDFDocument.load(titlePagePdfBuffer);
            mainPdfDoc = await prependTitlePage(mainPdfDoc, titlePdfDoc);
            console.log('✅ Title page prepended.');

            // Reset page labels
            mainPdfDoc = await resetPageLabels(mainPdfDoc);
            console.log('🔢 Page labels set.');
        }

        // Crop all pages to A4 in memory
        console.log('✂️ Cropping all pages to A4...');
        mainPdfDoc = await cropPdfToA4(mainPdfDoc);
        console.log('✅ Cropping complete.');

        // Save final PDF to disk
        const finalPdfBytes = await mainPdfDoc.save();
        fs.writeFileSync(outputPdf, finalPdfBytes);
        console.log(`🎉 PDF generated successfully: ${outputPdf}`);
    } catch (error) {
        console.error('❌ Error during PDF generation:', error.message);
    }
})();
