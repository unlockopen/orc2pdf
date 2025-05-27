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

// Get metadata from the yaml file or create it if it doesn't exist
let { markdown, pageMetadata, messages } = processInputMarkdown(inputMd);

const header = getHeader(pageMetadata);
const footer = getFooter(pageMetadata);

// Add footer and header to the default PDF options
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

console.log(`📄 Starting PDF generation for \x1b[32m${pageMetadata.title || inputMd}\x1b[0m`);
if (outputHtmlFlag) {
    console.log(`   - with HTML output: ${outputHtml}`);
}
if (pageMetadata.titlePage) {
    console.log('   - with title page');
}
// Display warnings
if (Object.keys(messages.warnings).length > 0) {
    console.warn('⚠️ Warnings:');
    for (const [warning, infoArr] of Object.entries(messages.warnings)) {
        console.warn(`   - ${warning}`);
        infoArr.forEach(info => console.warn(`     ${info}`));
    }
}

// Display errors and exit if any
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
        // 1. Read the Markdown file and inject authors HTML
        //console.log('📖 Reading Markdown file and injecting authors HTML...');
        markdown = injectAuthorsHtml(pageMetadata, markdown);

        // 2. Always generate HTML from Markdown (new way, with plugins)
        //console.log('🌐 Generating HTML from Markdown...');
        let htmlContent = await mdToHtml(markdown, MAIN_CONTENT_STYLESHEET, pageMetadata);

        // 3. Process legal excerpts and add them to the HTML
        htmlContent = processLegalExcerpts(htmlContent);

        // 4. If JS preprocessor exists, append it as a <script> to the HTML
        if (fs.existsSync(jsPreprocessorFile)) {
            //console.log('🔧 Found JS preprocessor file, injecting into HTML...');
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

        // 5. If --html, write the HTML to disk before inlining images
        if (outputHtmlFlag) {
            fs.writeFileSync(outputHtml, htmlContent);
        }

        // 6. Transform relative file links to absolute URLs
        htmlContent = transformFileLinksToUrls(htmlContent);

        // 7. Generate PDF from the main HTML content
        const newPdf = await generatePdfFromHtml(htmlContent, mainPdfOptions);

        let mainPdfDoc = await PDFDocument.load(newPdf);

        // 8 Generate title page, prepend, then reset page numbers if needed
        if (pageMetadata.titlePage) {
            //console.log('📝 Generating title page PDF...');
            let titlePageHtml = getTitlePage(pageMetadata);
            titlePageHtml = transformFileLinksToUrls(titlePageHtml);
            const titlePagePdfBuffer = await generatePdfFromHtml(titlePageHtml, titlePagePdfOptions);
            const titlePdfDoc = await PDFDocument.load(titlePagePdfBuffer);
            mainPdfDoc = await prependTitlePage(mainPdfDoc, titlePdfDoc);
            //console.log('✅ Title page prepended.');

            // Reset page labels
            mainPdfDoc = await resetPageLabels(mainPdfDoc);
            //console.log('🔢 Page labels set.');
        }

        // Crop all pages to A4 in memory
        //console.log('✂️ Cropping all pages to A4...');
        mainPdfDoc = await cropPdfToA4(mainPdfDoc);
        //console.log('✅ Cropping complete.');

        // Save final PDF to disk
        const finalPdfBytes = await mainPdfDoc.save();
        fs.writeFileSync(outputPdf, finalPdfBytes);
        console.log(`✅ PDF generated successfully: ${outputPdf}`);
    } catch (error) {
        console.error('❌ Error during PDF generation:', error.message);
    }
})();
