import fs from 'fs';
import path from 'path';
import { mdToPdf } from 'md-to-pdf';
import { PDFDocument } from 'pdf-lib';
import generateTitlePagePdf from './lib/title-page-generator.js';
import { prependTitlePage, resetPageLabels, cropPdfToA4 } from './lib/pdf-manipulation.js';
import { processInputMarkdown } from './lib/input-markdown-processor.js';
import mdToHtml from './lib/md-to-html.js';
import htmlToHtml from './lib/html-to-html.js';
import { getFooter, getHeader, injectAuthorsHtml } from './lib/html-block-generators.js';
import { inlineImagesAsBase64 } from './lib/picture-encoder.js';
import {
    MAIN_CONTENT_STYLESHEET,
} from './lib/config.js';
import { get } from 'http';

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

console.log(pageMetadata);

const header = getHeader(pageMetadata);
const footer = getFooter(pageMetadata);

// Define base PDF options
const pdfOptions = {
    displayHeaderFooter: true,
    headerTemplate: header,
    footerTemplate: footer,
    printBackground: true,
    preferCSSPageSize: true,
    scale: 1.0,
};

console.log(`📄 Starting PDF generation for ${pageMetadata.title || inputMd}`);
if (outputHtmlFlag) {
    console.log(`   - with HTML output: ${outputHtml}`);
}
if (pageMetadata.titlePage) {
    console.log('   - with title page generation');
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

        // 3. If JS preprocessor exists, append it as a <script> to the HTML
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

        // 4. If --html, write the HTML to disk before inlining images
        if (outputHtmlFlag) {
            htmlToHtml(htmlContent, outputHtml)
        }

        // 5. Inline images as base64
        //console.log('🖼️ Inlining images as base64...');
        htmlContent = inlineImagesAsBase64(htmlContent, path.dirname(inputMd));
        //console.log('✅ Images inlined.');


        // 6. Generate main content PDF from HTML
        //console.log('🖨️ Generating main content PDF from HTML...');
        const mainContentPdf = await mdToPdf(
            { content: htmlContent },
            {
                stylesheet: MAIN_CONTENT_STYLESHEET,
                pdf_options: pdfOptions,
                beforePrint: async (page) => {
                    await page.evaluate(() => new Promise((resolve) => {
                        if (document.readyState === 'complete') resolve();
                        else window.addEventListener('DOMContentLoaded', resolve);
                    }));
                },
            }
        );
        //console.log('✅ Main content PDF generated.');

        let mainPdfDoc = await PDFDocument.load(mainContentPdf.content);

        // Generate and prepend title page, then reset page numbers if needed
        if (pageMetadata.titlePage) {
            //console.log('📝 Generating title page PDF...');
            const titlePagePdfBuffer = await generateTitlePagePdf(pageMetadata, pdfOptions);
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
