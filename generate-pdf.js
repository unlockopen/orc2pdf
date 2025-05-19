const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');
const matter = require('gray-matter');
const { PDFDocument, PDFName, PDFHexString, scale } = require('pdf-lib');

// Get the input Markdown file from command-line arguments
const inputMd = process.argv[2];
const outputHtmlFlag = process.argv.includes('--html'); // Check if the --html flag is passed

if (!inputMd) {
    console.error('Error: Please provide the input Markdown file as an argument.');
    console.error('Usage: node generate-pdf.js <input-md-file> [--html]');
    process.exit(1);
}

// Determine the output file names
const outputPdf = path.basename(inputMd, path.extname(inputMd)) + '.pdf';
const outputHtml = path.basename(inputMd, path.extname(inputMd)) + '.html';

// File paths (adjusted to be relative to the script's directory)
const headerFile = path.resolve(__dirname, 'assets/header.html');
const footerFile = path.resolve(__dirname, 'assets/footer.html');
const mainContentStylesheetFile = path.resolve(__dirname, 'assets/main-content.css');
const titlePagestylesheetFile = path.resolve(__dirname, 'assets/title-page.css');
const jsPreprocessorFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');
let pageMetadata = {};

// Function to inject variables from front matter into the content
function injectVariables(content, variables) {
    return content.replace(/{{(\w+)}}/g, (match, variable) => {
        return variables[variable] || match;
    });
}

// Function to remove the page number from the footer for the title page
function removePageNumberFromFooter(footerContent) {
    return footerContent.replace('class="pageNumber"', '');
}

// Main function to handle the PDF generation process
(async () => {
    try {
        // Read the main Markdown file
        let markdownContent = fs.readFileSync(inputMd, 'utf8');

        // Append the JavaScript content to the Markdown file if it exists
        if (fs.existsSync(jsPreprocessorFile)) {
            const jsContent = fs.readFileSync(jsPreprocessorFile, 'utf8');
            markdownContent += `\n\n<script>\n${jsContent}\n</script>`;
            console.log(`JavaScript preprocessor file found: ${jsPreprocessorFile}`);
            console.log(`JavaScript content appended to Markdown file.`);
        }

        // Extract title, subtitle and version from the raw Markdown content
        // Extract the first H1 header as the title
        const Title = markdownContent.match(/^\s*#\s+(.+)/m);
        if (Title && Title[1]) {
            const [title, subtitle] = Title[1].split(':').map((str) => str.trim());
            pageMetadata['title'] = title || '';
            pageMetadata['subtitle'] = subtitle || '';
        } else {
            console.error('Error: No valid H1 header found in the Markdown content.');
            pageMetadata['title'] = '';
            pageMetadata['subtitle'] = '';
        }

        // Extract the first H3 header as the version
        const versionMatch = markdownContent.match(/^\s*###\s*(.+)/m);
        pageMetadata['version'] = versionMatch ? versionMatch[1].trim() : '';

        // Read the header and footer templates
        let headerContent = fs.readFileSync(headerFile, 'utf8');
        let footerContent = fs.readFileSync(footerFile, 'utf8');

        // Inject variables into the header and footer
        headerContent = injectVariables(headerContent, pageMetadata);
        footerContent = injectVariables(footerContent, pageMetadata);

        // Generate the title page Markdown if the title is provided in front matter
        let titlePagePdfPath = null;
        if (pageMetadata.title) {
            const titlePageMarkdown = `
# ${pageMetadata.title}:

## ${pageMetadata.subtitle || ''}
`;

            // Define pdf_options for the title page
            const titlePagePdfOptions = {
                dest: 'title-page.pdf',
                stylesheet: [titlePagestylesheetFile],
                pdf_options: {
                    printBackground: true,
                    preferCSSPageSize: true,
                    scale: 1.0,
                },
            };

            // Include header and footer
            titlePagePdfOptions.pdf_options.headerTemplate = headerContent;
            titlePagePdfOptions.pdf_options.footerTemplate = removePageNumberFromFooter(footerContent);

            // Generate the title page PDF
            titlePagePdfPath = 'title-page.pdf';
            await mdToPdf({ content: titlePageMarkdown }, titlePagePdfOptions);
            console.log(`Title page PDF generated: ${titlePagePdfPath}`);
        }

        // Generate HTML file using md-to-pdf if --html flag is passed
        if (outputHtmlFlag) {
            (async () => {
                try {
                    const html = await mdToPdf(
                        { content: markdownContent },
                        {
                            dest: outputHtml, // Output the HTML file
                            stylesheet: [mainContentStylesheetFile], // Add the stylesheet here
                            as_html: true,
                        }
                    );
                    if (html) {
                        console.log(`HTML output generated: ${outputHtml}`);
                    }
                } catch (error) {
                    console.error('Error generating HTML:', error.message);
                }
            })();
        }

        // Generate the main content PDF
        const mainContentPdfPath = 'main-content.pdf';

        await mdToPdf(
            { content: markdownContent },
            {
                dest: mainContentPdfPath,
                stylesheet: [mainContentStylesheetFile],
                pdf_options: {
                    displayHeaderFooter: true,
                    headerTemplate: headerContent,
                    footerTemplate: footerContent,
                    printBackground: true,
                    preferCSSPageSize: true,
                    scale: 1.0,
                },
                beforePrint: async (page) => {
                    // Wait for the DOMContentLoaded event to ensure the script is executed
                    await page.evaluate(() => {
                        return new Promise((resolve) => {
                            if (document.readyState === 'complete') {
                                resolve();
                            } else {
                                window.addEventListener('DOMContentLoaded', resolve);
                            }
                        });
                    });
                    console.log('JavaScript executed before generating the PDF.');
                },
            }
        );
        console.log(`Main content PDF generated: ${mainContentPdfPath}`);

        // Combine the title page PDF and the main content PDF
        if (titlePagePdfPath) {
            const titlePagePdfBytes = fs.readFileSync(titlePagePdfPath);
            const mainContentPdfBytes = fs.readFileSync(mainContentPdfPath);

            const titlePagePdfDoc = await PDFDocument.load(titlePagePdfBytes);
            const mainContentPdfDoc = await PDFDocument.load(mainContentPdfBytes);

            const combinedPdfDoc = await PDFDocument.create();

            const titlePagePages = await combinedPdfDoc.copyPages(titlePagePdfDoc, [0]);
            const mainContentPages = await combinedPdfDoc.copyPages(mainContentPdfDoc, mainContentPdfDoc.getPageIndices());

            for (const page of titlePagePages) {
                combinedPdfDoc.addPage(page);
            }

            for (const page of mainContentPages) {
                combinedPdfDoc.addPage(page);
            }

            // Define the page labels for the combined PDF
            const pageLabels = combinedPdfDoc.context.obj({
                Nums: [
                    0, { P: PDFHexString.fromText('Cover') }, // Custom label for the title page
                    1, { S: 'D' },
                ]
            });

            combinedPdfDoc.catalog.set(PDFName.of('PageLabels'), pageLabels);

            const combinedPdfBytes = await combinedPdfDoc.save();
            fs.writeFileSync(outputPdf, combinedPdfBytes);
            console.log(`Combined PDF generated: ${outputPdf}`);
        } else {
            // If no title page, just rename the main content PDF to the output PDF
            fs.renameSync(mainContentPdfPath, outputPdf);
            console.log(`PDF generated without title page: ${outputPdf}`);
        }

        // Use PDF-lib to crop the pdf to a perfect A4 size and save a cropped version
        const pdfDoc = await PDFDocument.load(fs.readFileSync(outputPdf));
        const pages = pdfDoc.getPages();
        pages.forEach((page) => {
            // Crop the page to 210mm x 297mm precisely
            const { width, height } = page.getSize();
            const a4Width = 210 * 2.83465; // Convert mm to points
            const a4Height = 297 * 2.83465; // Convert mm to points

            if (width > a4Width || height > a4Height) {
                // Set the crop box to start at the top-left corner (0, 0)
                const xOffset = 0; // Keep the left edge intact
                const yOffset = (height - a4Height) / 2; // Keep the top edge intact
                page.setCropBox(xOffset, yOffset, a4Width, a4Height);
            } else {
                console.log(`Page already fits A4 size: ${width}x${height}`);
            }

            // Set all boxes to A4 size
            page.setMediaBox(0, 0, a4Width, a4Height);
            page.setBleedBox(0, 0, a4Width, a4Height);
            page.setTrimBox(0, 0, a4Width, a4Height);
            page.setArtBox(0, 0, a4Width, a4Height);
        });

        // Save the cropped PDF over the original file
        const pdfBytes = await pdfDoc.save();
        fs.writeFileSync(outputPdf, pdfBytes);
        console.log(`Cropped PDF saved over the original file: ${outputPdf}`);

        // Delete the intermediate files
        if (titlePagePdfPath) fs.unlinkSync(titlePagePdfPath);
        fs.unlinkSync(mainContentPdfPath);
        console.log('Intermediate files deleted.');
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
    }
})();
