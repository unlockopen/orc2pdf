import puppeteer from 'puppeteer';

/**
 * Store a single browser instance reference so that we can re-use it.
 */
let browserInstance = null;

/**
 * Launch the browser instance if it hasn't been launched yet.
 *
 * @returns {Promise<Browser>} - A promise that resolves to the browser instance.
 */
async function getBrowser() {
    if (!browserInstance) {
        browserInstance = await puppeteer.launch();
    }
    return browserInstance;
}

/**
 * Render HTML content to PDF using Puppeteer.
 *
 * @param {string} htmlContent - The HTML content to convert to PDF.
 * @param {string} baseUrl - The base URL for resolving relative paths in the HTML content.
 * @param {Object} pdfConfig - Configuration options for PDF generation.
 * @returns {Promise<{content: Buffer}>} - A promise that resolves to an object containing the PDF content as a Buffer.
 */
export const renderPDF = async (htmlContent, baseUrl, pdfConfig) => {
    const browser = await getBrowser();
    const page = await browser.newPage();

    // Set the HTML content
    await page.setContent(htmlContent, { waitUntil: 'networkidle0', baseUrl: baseUrl });

    // Generate PDF
    const pdfBuffer = await page.pdf(pdfConfig);

    await page.close();

    return { content: pdfBuffer };
};

/**
 * Close the Puppeteer browser instance.
 *
 * @returns {Promise<void>}
 */
export const closeBrowser = async () => {
    if (browserInstance) {
        await browserInstance.close();
        browserInstance = null;
    }
};
