const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');
const { PDFDocument } = require('pdf-lib');
const generateTitlePagePdf = require('./lib/title-page-generator');
const { prependTitlePage, resetPageLabels, cropPdfToA4 } = require('./lib/pdf-manipulation');
const { extractMetadata, injectVariables } = require('./lib/metadata');

const inputMd = process.argv[2];
const outputHtmlFlag = process.argv.includes('--html'); // Default to false if not specified
const titlePageFlag = !process.argv.includes('--no-title-page'); // Default to true if not specified

if (!inputMd) {
    console.error('Error: Please provide the input Markdown file as an argument.');
    process.exit(1);
}

const outputPdf = path.basename(inputMd, path.extname(inputMd)) + '.pdf';
const outputHtml = path.basename(inputMd, path.extname(inputMd)) + '.html';

const headerFile = path.resolve(__dirname, 'assets/header.html');
const footerFile = path.resolve(__dirname, 'assets/footer.html');
const mainContentStylesheetFile = path.resolve(__dirname, 'assets/main-content.css');
const jsPreprocessorFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');

let markdownContent = fs.readFileSync(inputMd, 'utf8');
let headerContent = fs.readFileSync(headerFile, 'utf8');
let footerContent = fs.readFileSync(footerFile, 'utf8');

const pageMetadata = extractMetadata(markdownContent);

// Define base PDF options
const pdfOptions = {
    displayHeaderFooter: true,
    headerTemplate: injectVariables(headerContent, pageMetadata),
    footerTemplate: injectVariables(footerContent, pageMetadata),
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1.0,
};


(async () => {
    try {
        if (fs.existsSync(jsPreprocessorFile)) {
            const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
            markdownContent += `\n\n<script>\n${jsContent}\n</script>`;
        }

        // Generate HTML if requested
        if (outputHtmlFlag) {
            const generateHtml = require('./lib/html-generator');
            await generateHtml(inputMd, mainContentStylesheetFile, outputHtml);
        }

        // Generate main content PDF in memory
        const mainContentPdf = await mdToPdf(
            { content: markdownContent },
            {
                stylesheet: [mainContentStylesheetFile],
                pdf_options: pdfOptions,
                beforePrint: async (page) => {
                    await page.evaluate(() => new Promise((resolve) => {
                        if (document.readyState === 'complete') resolve();
                        else window.addEventListener('DOMContentLoaded', resolve);
                    }));
                },
            }
        );

        let mainPdfDoc = await PDFDocument.load(mainContentPdf.content);

        // Generate and prepend title page, then reset page numbers if needed
        if (titlePageFlag && pageMetadata.title) {
            const titlePagePdfBuffer = await generateTitlePagePdf(pageMetadata, pdfOptions);
            const titlePdfDoc = await PDFDocument.load(titlePagePdfBuffer);
            mainPdfDoc = await prependTitlePage(mainPdfDoc, titlePdfDoc);

            // Reset page labels
            mainPdfDoc = await resetPageLabels(mainPdfDoc);
        }

        // Crop all pages to A4 in memory
        mainPdfDoc = await cropPdfToA4(mainPdfDoc);

        // Save final PDF to disk
        const finalPdfBytes = await mainPdfDoc.save();
        fs.writeFileSync(outputPdf, finalPdfBytes);
        console.log(`PDF generated: ${outputPdf}`);
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
    }
})();
