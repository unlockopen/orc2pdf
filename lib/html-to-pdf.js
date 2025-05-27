import { serveDirectory, closeServer } from './serve-content.js';
import { SERVER_CONFIG, PDF_CONFIG } from './config.js';
import { renderPDF, closeBrowser } from './render-pdf.js';

/**
 * Generate a PDF buffer from HTML content.
 *
 * @param {string} htmlContent - The HTML content to convert to PDF.
 * @returns {Promise<Buffer>} - The generated PDF as a Buffer.
 */
export const generatePdfFromHtml = async (htmlContent, pdfOptions) => {
    let server;
    try {
        // Serve the directory
        server = await serveDirectory(SERVER_CONFIG);

        // Generate PDF
        const pdfOutput = await renderPDF(htmlContent, SERVER_CONFIG.baseUrl, pdfOptions);
        if (!pdfOutput || !pdfOutput.content) {
            throw new Error('PDF generation failed: No content returned.');
        }
        return pdfOutput.content;
    } catch (error) {
        console.error('Error during PDF generation:', error.message);
        throw error;
    } finally {
        // Close the server and browser
        if (server) {
            await closeServer(server);
        }
        await closeBrowser();
    }
};
