import { mdToPdf } from 'md-to-pdf';

/**
 * Processes an HTML string with md-to-pdf and writes the resulting HTML to disk.
 * This ensures any DOM modifications (e.g., scripts, plugins) are included.
 * @param {string} htmlContent - The HTML string to process.
 * @param {string} outputHtml - The path to write the processed HTML file.
 * @returns {Promise<void>}
 */
async function generateHtmlFromHtml(htmlContent, pageMetadata, outputHtml) {
    const result = await mdToPdf(
        { content: htmlContent },
        {
            body_class: pageMetadata.status || '',
            dest: outputHtml,
            as_html: true,
        }
    );
    // md-to-pdf writes the file, but you can also access result.content if needed
    console.log('✅ HTML output written to disk.');
}

export default generateHtmlFromHtml;
