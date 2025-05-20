const fs = require('fs');
const { PDFDocument, PDFName, PDFHexString } = require('pdf-lib');

// Insert the title page at the beginning of the PDF document
async function prependTitlePage(mainPdfPath, titlePdfPath, outputPdfPath) {
    const mainPdfBytes = fs.readFileSync(mainPdfPath);
    const titlePdfBytes = fs.readFileSync(titlePdfPath);

    const mainPdfDoc = await PDFDocument.load(mainPdfBytes);
    const titlePdfDoc = await PDFDocument.load(titlePdfBytes);

    const [titlePage] = await mainPdfDoc.copyPages(titlePdfDoc, [0]);
    mainPdfDoc.insertPage(0, titlePage);

    // At this point, all original annotations are preserved,
    // but internal link destinations may need to be updated.

    const pdfBytes = await mainPdfDoc.save();
    fs.writeFileSync(outputPdfPath, pdfBytes);
}

// Reset the page labels for the PDF document
async function setPageLabels(pdfPath, labels) {
    const pdfBytes = fs.readFileSync(pdfPath);
    const pdfDoc = await PDFDocument.load(pdfBytes);

    // Build the page labels dictionary
    const nums = [];
    labels.forEach((label, idx) => {
        nums.push(idx, { P: PDFHexString.fromText(label) });
    });

    const pageLabels = pdfDoc.context.obj({ Nums: nums });
    pdfDoc.catalog.set(PDFName.of('PageLabels'), pageLabels);

    const updatedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(pdfPath, updatedPdfBytes);
}

// Function to crop the PDF to A4 size
async function cropPdfToA4(outputPdf) {
    const pdfDoc = await PDFDocument.load(fs.readFileSync(outputPdf));
    const pages = pdfDoc.getPages();
    const a4Width = 210 * 2.83465; // Convert mm to points
    const a4Height = 297 * 2.83465; // Convert mm to points

    pages.forEach((page) => {
        const { width, height } = page.getSize();

        if (width > a4Width || height > a4Height) {
            // Center the crop box if the page is larger than A4
            const xOffset = (width - a4Width) / 2;
            const yOffset = (height - a4Height) / 2;
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

    // Save the cropped PDF back to disk (once)
    const croppedPdfBytes = await pdfDoc.save();
    fs.writeFileSync(outputPdf, croppedPdfBytes);

    console.log(`PDF cropped to A4 size: ${outputPdf}`);
}

// Export functions for CommonJS
module.exports = {
    prependTitlePage,
    setPageLabels,
    cropPdfToA4
};
