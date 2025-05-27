import fs from 'fs';
import path from 'path';
import { PDFDocument } from 'pdf-lib';
import { prependTitlePage, resetPageLabels, cropPdfToA4 } from './lib/pdf-manipulation.js';
import { processInputMarkdown } from './lib/input-markdown-processor.js';
import mdToHtml from './lib/md-to-html.js';
import { getFooter, getHeader, getTitlePage, injectAuthorsHtml } from './lib/html-block-generators.js';
import { processLegalExcerpts, transformFileLinksToUrls } from './lib/html-DOM-processor.js';
import { MAIN_CONTENT_STYLESHEET, PDF_CONFIG } from './lib/config.js';
import { generatePdfFromHtml } from './lib/html-to-pdf.js';

const inputMd = process.argv[2];
const outputHtmlFlag = process.argv.includes('--html');

if (!inputMd) {
    console.error('❌ Error: Please provide the input Markdown file as an argument.');
    process.exit(1);
}

const outputPdf = path.basename(inputMd, path.extname(inputMd)) + '.pdf';
const outputHtml = path.basename(inputMd, path.extname(inputMd)) + '.html';

const jsPreprocessorFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');

// Parse the input Markdown file and extract metadata and messages
let { markdown, pageMetadata, messages } = processInputMarkdown(inputMd);

const header = getHeader(pageMetadata);
const footer = getFooter(pageMetadata);

// Build PDF options for main content and title page, including header and footer
const mainPdfOptions = {
    ...PDF_CONFIG.pdf_options,
    headerTemplate: header,
    footerTemplate: footer,
};

const titlePagePdfOptions = {
    ...PDF_CONFIG.pdf_options,
    headerTemplate: header,
    footerTemplate: footer.replace('class="pageNumber"', ''),
};

// Log the start of PDF generation and options
console.log(`📄 Starting PDF generation for \x1b[32m${pageMetadata.title || inputMd}\x1b[0m`);
if (outputHtmlFlag) {
    console.log(`   - with HTML output: ${outputHtml}`);
}
if (pageMetadata.titlePage) {
    console.log('   - with title page');
}
// Display any warnings from metadata processing
if (Object.keys(messages.warnings).length > 0) {
    console.warn('⚠️ Warnings:');
    for (const [warning, infoArr] of Object.entries(messages.warnings)) {
        console.warn(`   - ${warning}`);
        infoArr.forEach(info => console.warn(`     ${info}`));
    }
}

// Display errors and exit if any are found in metadata
if (Object.keys(messages.errors).length > 0) {
    console.error('❌ Errors found in metadata:');
    for (const [error, infoArr] of Object.entries(messages.errors)) {
        console.error(`   - ${error}`);
        infoArr.forEach(info => console.error(`     ${info}`));
    }
    process.exit(1);
}

(async () => {
    try {
        // Inject author information into the Markdown content
        markdown = injectAuthorsHtml(pageMetadata, markdown);

        // Convert Markdown to HTML using plugins and styles
        let htmlContent = await mdToHtml(markdown, MAIN_CONTENT_STYLESHEET, pageMetadata);

        // Process legal excerpt comments and mark blockquotes
        htmlContent = processLegalExcerpts(htmlContent);

        // If a JS preprocessor file exists, inject it as a <script> tag in the HTML
        if (fs.existsSync(jsPreprocessorFile)) {
            const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
            // Insert before </body> if present, else append at the end
            if (htmlContent.includes('</body>')) {
                htmlContent = htmlContent.replace(
                    '</body>',
                    `<script>\n${jsContent}\n</script>\n</body>`
                );
            } else {
                htmlContent += `\n<script>\n${jsContent}\n</script>`;
            }
        }

        // If --html flag is set, write the HTML to disk before further processing
        if (outputHtmlFlag) {
            fs.writeFileSync(outputHtml, htmlContent);
        }

        // Convert all local file links in the HTML to absolute URLs
        htmlContent = transformFileLinksToUrls(htmlContent);

        // Generate the main PDF from the processed HTML content
        const newPdf = await generatePdfFromHtml(htmlContent, mainPdfOptions);

        let mainPdfDoc = await PDFDocument.load(newPdf);

        // If a title page is requested, generate it, prepend, and reset page numbers
        if (pageMetadata.titlePage) {
            let titlePageHtml = getTitlePage(pageMetadata);
            titlePageHtml = transformFileLinksToUrls(titlePageHtml);
            const titlePagePdfBuffer = await generatePdfFromHtml(titlePageHtml, titlePagePdfOptions);
            const titlePdfDoc = await PDFDocument.load(titlePagePdfBuffer);
            mainPdfDoc = await prependTitlePage(mainPdfDoc, titlePdfDoc);
            mainPdfDoc = await resetPageLabels(mainPdfDoc);
        }

        // Crop all pages to A4 size in memory
        mainPdfDoc = await cropPdfToA4(mainPdfDoc);

        // Save the final PDF to disk
        const finalPdfBytes = await mainPdfDoc.save();
        fs.writeFileSync(outputPdf, finalPdfBytes);
        console.log(`✅ PDF generated successfully: ${outputPdf}`);
    } catch (error) {
        console.error('❌ Error during PDF generation:', error.message);
    }
})();
