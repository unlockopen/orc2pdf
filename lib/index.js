import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { PDFDocument } from 'pdf-lib';
import { loadConfig, resolveTheme } from './config-manager.js';
import { processInputMarkdown } from './input-markdown-processor.js';
import mdToHtml from './md-to-html.js';
import { getFooter, getHeader, getTitlePage, injectAuthorsHtml } from './html-block-generators.js';
import { processLegalExcerpts, transformFileLinksToUrls } from './html-DOM-processor.js';
import { generatePdfFromHtml } from './html-to-pdf.js';
import { prependTitlePage, resetPageLabels, cropPdfToA4 } from './pdf-manipulation.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export async function generatePdf(inputFile, options = {}) {
    // Resolve paths
    const inputPath = path.resolve(inputFile);
    const inputDir = path.dirname(inputPath);
    const baseName = path.basename(inputPath, path.extname(inputPath));
    
    const outputPath = options.output || path.join(inputDir, `${baseName}.pdf`);
    const htmlPath = options.html ? path.join(inputDir, `${baseName}.html`) : null;
    
    // Load configuration
    const config = await loadConfig(inputDir, options.config);
    const theme = await resolveTheme(options.theme || config.theme || 'default');
    
    // Process input markdown
    const { markdown, pageMetadata, messages } = processInputMarkdown(inputPath, config);
    
    // Display warnings and errors
    if (Object.keys(messages.warnings).length > 0) {
        console.warn('⚠️ Warnings:');
        for (const [warning, infoArr] of Object.entries(messages.warnings)) {
            console.warn(`   - ${warning}`);
            infoArr.forEach(info => console.warn(`     ${info}`));
        }
    }
    
    if (Object.keys(messages.errors).length > 0) {
        console.error('❌ Errors found in metadata:');
        for (const [error, infoArr] of Object.entries(messages.errors)) {
            console.error(`   - ${error}`);
            infoArr.forEach(info => console.error(`     ${info}`));
        }
        throw new Error('Metadata validation failed');
    }
    
    // Build PDF options
    const header = getHeader(pageMetadata, theme);
    const footer = getFooter(pageMetadata, theme);
    
    const mainPdfOptions = {
        ...theme.pdfOptions,
        headerTemplate: header,
        footerTemplate: footer,
    };
    
    const titlePagePdfOptions = {
        ...theme.pdfOptions,
        headerTemplate: header,
        footerTemplate: footer.replace('class="pageNumber"', ''),
    };
    
    // Process markdown content
    let processedMarkdown = injectAuthorsHtml(pageMetadata, markdown, config);
    let htmlContent = await mdToHtml(processedMarkdown, theme.mainContentStylesheet, pageMetadata);
    
    // Process HTML
    htmlContent = processLegalExcerpts(htmlContent);
    
    // Inject JS preprocessor if exists
    const jsPreprocessorFile = path.join(inputDir, `${baseName}.js`);
    if (fs.existsSync(jsPreprocessorFile)) {
        const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
        if (htmlContent.includes('</body>')) {
            htmlContent = htmlContent.replace(
                '</body>',
                `<script>\n${jsContent}\n</script>\n</body>`
            );
        } else {
            htmlContent += `\n<script>\n${jsContent}\n</script>`;
        }
    }
    
    // Save HTML if requested
    if (htmlPath) {
        fs.writeFileSync(htmlPath, htmlContent);
    }
    
    // Convert file links to URLs
    htmlContent = transformFileLinksToUrls(htmlContent);
    
    // Generate main PDF
    const newPdf = await generatePdfFromHtml(htmlContent, mainPdfOptions);
    let mainPdfDoc = await PDFDocument.load(newPdf);
    
    // Add title page if enabled
    const shouldAddTitlePage = options.titlePage !== false && 
        (pageMetadata.titlePage || config.titlePage !== false);
    
    if (shouldAddTitlePage) {
        let titlePageHtml = getTitlePage(pageMetadata, theme);
        titlePageHtml = transformFileLinksToUrls(titlePageHtml);
        const titlePagePdfBuffer = await generatePdfFromHtml(titlePageHtml, titlePagePdfOptions);
        const titlePdfDoc = await PDFDocument.load(titlePagePdfBuffer);
        mainPdfDoc = await prependTitlePage(mainPdfDoc, titlePdfDoc);
        mainPdfDoc = await resetPageLabels(mainPdfDoc);
    }
    
    // Crop to A4
    mainPdfDoc = await cropPdfToA4(mainPdfDoc);
    
    // Save PDF
    const finalPdfBytes = await mainPdfDoc.save();
    fs.writeFileSync(outputPath, finalPdfBytes);
    
    return {
        outputPath,
        htmlPath,
        config,
        theme: theme.name
    };
}