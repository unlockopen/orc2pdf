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
    console.error('❌ Error: Please provide the input Markdown file as an argument.');
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
        if (fs.existsSync(jsPreprocessorFile)) {
            console.log('🔧 Found JS preprocessor file, injecting into Markdown...');
            const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
            markdownContent += `\n\n<script>\n${jsContent}\n</script>`;
        }

        // Generate HTML if requested
        if (outputHtmlFlag) {
            console.log('🌐 Generating HTML output...');
            const generateHtml = require('./lib/html-generator');
            await generateHtml(inputMd, mainContentStylesheetFile, outputHtml);
            console.log('✅ HTML output generated.');
        }

        // Generate main content PDF in memory
        console.log('🖨️ Generating main content PDF...');
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
        console.log('✅ Main content PDF generated.');

        let mainPdfDoc = await PDFDocument.load(mainContentPdf.content);

        // Generate and prepend title page, then reset page numbers if needed
        if (titlePageFlag && pageMetadata.title) {
            console.log('📝 Generating title page PDF...');
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
