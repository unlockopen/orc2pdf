const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');
const matter = require('gray-matter');
const { PDFDocument, PDFName, PDFHexString, scale } = require('pdf-lib');
const { prependTitlePage, setPageLabels, cropPdfToA4 } = require('./lib/pdf-manipulation');

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

        if (titlePagePdfPath) {
            await prependTitlePage(mainContentPdfPath, titlePagePdfPath, outputPdf);
            // Set page labels: first page "Cover", rest "1", "2", ...
            const mainPdfBytes = fs.readFileSync(mainContentPdfPath);
            const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
            const numPages = mainPdfDoc.getPageCount();
            const labels = ['Title', ...Array.from({ length: numPages }, (_, i) => `${i + 1}`)];
            await setPageLabels(outputPdf, labels);

            console.log(`Combined PDF generated: ${outputPdf}`);
        } else {
            fs.renameSync(mainContentPdfPath, outputPdf);
            console.log(`PDF generated without title page: ${outputPdf}`);
        }

        // Crop the PDF to A4 size
        await cropPdfToA4(outputPdf);

        // Delete the intermediate files
        if (titlePagePdfPath) fs.unlinkSync(titlePagePdfPath);
        fs.unlinkSync(mainContentPdfPath);
        console.log('Intermediate files deleted.');
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
    }
})();
