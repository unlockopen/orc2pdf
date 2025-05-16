const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');
const matter = require('gray-matter');
const { PDFDocument, PDFName, PDFHexString } = require('pdf-lib');


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
const jsFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');

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

// Check if the js preprocessor file exists
let jsContent = '';
if (fs.existsSync(jsFile)) {
    console.log(`JavaScript preprocessor found: ${jsFile}`);
    jsContent = fs.readFileSync(jsFile, 'utf8'); // Read the .js file content
} else {
    console.log(`No JavaScript preprocessor found for ${inputMd}`);
}

// Main function to handle the PDF generation process
(async () => {
    try {
        // Read the main Markdown file
        let markdownContent = fs.readFileSync(inputMd, 'utf8');

        // Append the JavaScript content to the Markdown file if it exists
        if (jsContent) {
            markdownContent += `\n\n<script>\n${jsContent}\n</script>`;
        }
        // Extract front matter
        const { data: frontMatter, content } = matter(markdownContent);

        // Read the header and footer templates
        let headerContent = fs.readFileSync(headerFile, 'utf8');
        let footerContent = fs.readFileSync(footerFile, 'utf8');

        // Inject variables from front matter into the main document, header, and footer
        markdownContent = injectVariables(content, frontMatter);
        headerContent = injectVariables(headerContent, frontMatter);
        footerContent = injectVariables(footerContent, frontMatter);

        // Function to preprocess Markdown content using a JavaScript preprocessor
        function preprocessMarkdown(markdownContent, frontMatter, jsFilePath) {
            if (fs.existsSync(jsFilePath)) {
                console.log(`JavaScript preprocessor found: ${jsFilePath}`);
                const jsPreprocessor = require(jsFilePath); // Load the JavaScript preprocessor
                if (typeof jsPreprocessor === 'function') {
                    return jsPreprocessor(markdownContent, frontMatter); // Apply the preprocessor
                } else {
                    console.warn(`JavaScript preprocessor ${jsFilePath} does not export a function.`);
                }
            } else {
                console.log(`No JavaScript preprocessor found for ${jsFilePath}`);
            }
            return markdownContent; // Return the original content if no preprocessor is found
        }

        // Check if the title page should include the header and footer
        const includeHeaderFooterOnTitlePage = frontMatter.titleHeaderFooter || false;

        // Create a title page if the title is provided in front matter
        let titlePagePdfPath = null;
        if (frontMatter.title) {
            const titlePage = `
<div id="title-page">
    <h1>${frontMatter.title}</h1>
    <h2>${frontMatter.subtitle || ''}</h2>
</div>
`;

            // Define pdf_options for the title page
            const titlePagePdfOptions = {
                dest: 'title-page.pdf',
                stylesheet: [titlePagestylesheetFile],
                pdf_options: {
                    printBackground: true,
                    preferCSSPageSize: true,
                    margin: 0,
                    scale: 1,
                },
            };

            // Include header and footer if specified in the front matter
            if (includeHeaderFooterOnTitlePage) {
                titlePagePdfOptions.pdf_options.headerTemplate = headerContent;
                titlePagePdfOptions.pdf_options.footerTemplate = removePageNumberFromFooter(footerContent);
            }

            // Generate the title page PDF
            titlePagePdfPath = 'title-page.pdf';
            await mdToPdf({ content: titlePage }, titlePagePdfOptions);
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
                    scale: 1,
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

        // Delete the intermediate files
        if (titlePagePdfPath) fs.unlinkSync(titlePagePdfPath);
        fs.unlinkSync(mainContentPdfPath);
        console.log('Intermediate files deleted.');
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
    }
})();
