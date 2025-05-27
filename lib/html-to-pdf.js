import { serveDirectory, closeServer } from './serve-content.js';
import { SERVER_CONFIG, PDF_CONFIG } from './config.js';
import { renderPDF, closeBrowser } from './render-pdf.js';
import fs from 'fs';

/**
 * Generate a PDF from HTML content.
 *
 * @param {string} htmlContent - The HTML content to convert to PDF.
 * @param {string} outputPdfPath - The path where the PDF will be saved.
 * @returns {Promise<void>}
 */
export const generatePdfFromHtml = async (htmlContent, outputPdfPath) => {
    outputPdfPath = 'output.pdf';
    let server;
    try {
        // Serve the directory
        server = await serveDirectory(SERVER_CONFIG);

        // Generate PDF
        const pdfOutput = await renderPDF(htmlContent, SERVER_CONFIG.baseUrl, PDF_CONFIG);
        if (!pdfOutput || !pdfOutput.content) {
            throw new Error('PDF generation failed: No content returned.');
        }
        fs.writeFileSync(outputPdfPath, pdfOutput.content);
        console.log(`PDF generated successfully: ${outputPdfPath}`);
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
    } finally {
        // Close the server and browser
        if (server) {
            await closeServer(server);
        }
        await closeBrowser();
    }
};
