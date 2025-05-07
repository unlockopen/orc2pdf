const fs = require('fs');
const path = require('path');
const { mdToPdf } = require('md-to-pdf');

// Get the input Markdown file from command-line arguments
const inputMd = process.argv[2];
if (!inputMd) {
    console.error('Error: Please provide the input Markdown file as an argument.');
    console.error('Usage: node generate-pdf.js <input-md-file>');
    process.exit(1);
}

// Determine the output PDF file name based on the input file
const outputPdf = path.basename(inputMd, path.extname(inputMd)) + '.pdf';

// File paths (adjusted to be relative to the script's directory)
const headerFile = path.resolve(__dirname, 'assets/header.html');
const footerFile = path.resolve(__dirname, 'assets/footer.html');
const stylesheetFile = path.resolve(__dirname, 'assets/style.css');
const jsFile = path.join(path.dirname(inputMd), path.basename(inputMd, path.extname(inputMd)) + '.js');

// Check if the js preprocessor file exists
if (fs.existsSync(jsFile)) {
    console.log(`JavaScript preprocessor found: ${jsFile}`);
    jsContent = fs.readFileSync(jsFile, 'utf8'); // Read the .js file content
} else {
    console.log(`No JavaScript preprocessor found for ${inputMd}`);
}

// Read the main Markdown file
let markdownContent = fs.readFileSync(inputMd, 'utf8');

// Append the JavaScript content to the Markdown file if it exists
if (jsContent) {
    markdownContent += `\n\n<script>\n${jsContent}\n</script>`;
}

// Read the header and footer templates
const headerContent = fs.readFileSync(headerFile, 'utf8');
const footerContent = fs.readFileSync(footerFile, 'utf8');

// Define the pdf_options block
const pdfOptionsBlock = `pdf_options:
  format: a4
  margin: 30mm 20mm
  printBackground: true
  headerTemplate: |
    ${headerContent.replace(/\n/g, '\n    ')}
  footerTemplate: |
    ${footerContent.replace(/\n/g, '\n    ')}`;

// Check if the Markdown file has a front matter block
const frontMatterRegex = /^---\n([\s\S]*?)\n---/;
let finalContent;

if (frontMatterRegex.test(markdownContent)) {
    // Extract the front matter
    const frontMatterMatch = markdownContent.match(frontMatterRegex);
    const frontMatter = frontMatterMatch[1];

    // Check if pdf_options already exists
    if (!frontMatter.includes('pdf_options:')) {
        // Inject pdf_options into the front matter
        const updatedFrontMatter = `${frontMatter}\n${pdfOptionsBlock}`;
        finalContent = markdownContent.replace(frontMatterRegex, `---\n${updatedFrontMatter}\n---`);
    } else {
        // Keep the original content if pdf_options already exists
        finalContent = markdownContent;
    }
} else {
    // If no front matter exists, add one with pdf_options
    finalContent = `---\n${pdfOptionsBlock}\n---\n\n${markdownContent}`;
}

// Generate the PDF using the md-to-pdf programmatic API
(async () => {
    try {
        const pdf = await mdToPdf(
            { content: finalContent },
            {
                dest: outputPdf,
                stylesheet: [stylesheetFile], // Add the stylesheet here
            }
        );
        if (pdf) {
            console.log(`PDF generated: ${outputPdf}`);
        }
    } catch (error) {
        console.error('Error generating PDF:', error.message);
    }
})();
