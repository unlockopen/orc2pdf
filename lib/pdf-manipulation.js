const { PDFName, PDFHexString } = require('pdf-lib');

// Insert the title page at the beginning of the PDF document (in-memory)
async function prependTitlePage(mainPdfDoc, titlePdfDoc) {
    const [titlePage] = await mainPdfDoc.copyPages(titlePdfDoc, [0]);
    mainPdfDoc.insertPage(0, titlePage);
    // Returns the modified mainPdfDoc for chaining
    return mainPdfDoc;
}

/**
 * Set page labels for a PDFDocument.
 * If labels is not provided, defaults to ['Title', '1', '2', ...] if a title page is detected,
 */
async function resetPageLabels(pdfDoc, labels) {
    const numPages = pdfDoc.getPageCount();
    // If no labels provided, use default: first page 'Title', rest numbered
    if (!labels) {
        // Heuristic: if the first page is likely a title page (e.g. has no text or is named 'Title')
        // For now, just use 'Title' if more than one page
        labels = numPages > 1
            ? ['Title', ...Array.from({ length: numPages - 1 }, (_, i) => `${i + 1}`)]
            : Array.from({ length: numPages }, (_, i) => `${i + 1}`);
    }
    const nums = [];
    labels.forEach((label, idx) => {
        nums.push(idx, { P: PDFHexString.fromText(label) });
    });
    const pageLabels = pdfDoc.context.obj({ Nums: nums });
    pdfDoc.catalog.set(PDFName.of('PageLabels'), pageLabels);
    return pdfDoc;
}

// Crop all pages to A4 size (in-memory)
async function cropPdfToA4(pdfDoc) {
    const a4Width = 210 * 2.83465;
    const a4Height = 297 * 2.83465;
    pdfDoc.getPages().forEach((page) => {
        const { width, height } = page.getSize();
        if (width > a4Width || height > a4Height) {
            const xOffset = (width - a4Width) / 2;
            const yOffset = (height - a4Height) / 2;
            page.setCropBox(xOffset, yOffset, a4Width, a4Height);
        }
        page.setMediaBox(0, 0, a4Width, a4Height);
        page.setBleedBox(0, 0, a4Width, a4Height);
        page.setTrimBox(0, 0, a4Width, a4Height);
        page.setArtBox(0, 0, a4Width, a4Height);
    });
    return pdfDoc;
}

module.exports = {
    prependTitlePage,
    resetPageLabels,
    cropPdfToA4
};
