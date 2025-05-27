/**
 * Generates HTML blocks for different sections of a document.
 */
import {
    FOOTER_FILE,
    HEADER_FILE,
    TITLE_PAGE_STYLESHEET
} from './config.js';
import fs from 'fs';

export function injectAuthorsHtml(fileMetadata, markdown) {
    if (!fileMetadata.authorData || !Array.isArray(fileMetadata.authorData)) {
        return markdown;
    }

    // Generate the authors block
    const authorsBlock = generateAuthorsBlock(fileMetadata);

    // Inject the authors block into the markdown
    return markdown.replace(/<!--\s*\[\[\s*authors\s*\]\]\s*-->/i, authorsBlock);
}

export function getFooter(fileMetadata) {

    // Read the footer file
    const footerContent = fs.readFileSync(FOOTER_FILE, 'utf8');

    // Collect metadata items if they exist
    const items = [];
    if (fileMetadata.title) items.push(`<span>${fileMetadata.title}</span>`);
    if (fileMetadata.version) items.push(`<span>${fileMetadata.version}</span>`);
    if (fileMetadata.date) items.push(`<span>${fileMetadata.date}</span>`);
    if (fileMetadata.license) items.push(`<span>${fileMetadata.license}</span>`);

    // Join with separator
    const footerBlock = items.join(' <span aria-hidden="true">•</span> ');

    return footerContent.replace('<!-- footerVariables -->', footerBlock);

}

export function getHeader() {
    // Read the header file
    const headerContent = fs.readFileSync(HEADER_FILE, 'utf8');

    return headerContent;
}

export function getTitlePage(pageMetadata) {
    // Generate the title page HTML content
    const title = pageMetadata['title'] || '';
    const subtitle = pageMetadata['subtitle'] || '';
    const htmlContent = `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="utf-8">
            <title>${title}</title>
            <link rel="stylesheet" href="${TITLE_PAGE_STYLESHEET}">
        </head>
        <body>
            <div class="title-page">
                <h1>${title}</h1>
                ${subtitle ? `<h2>${subtitle}</h2>` : ''}
            </div>
        </body>
        </html>
    `;

    return htmlContent;
}



// --- Helper functions ---

function pictureHtml(authorData) {
    if (authorData.picture_url) {
        return `<img src="${authorData.picture_url}" alt="${authorData.name}" class="author-photo" />`;
    } else {
        // Return a default image svg if no picture is found
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user author-photo"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M12 14c-5.33 0-8 2.67-8 8v2h16v-2c0-5.33-2.67-8-8-8z"/></svg>`;
    }
}

function generateAuthorsBlock(fileMetadata) {
    if (!fileMetadata.authorData || !Array.isArray(fileMetadata.authorData)) return '';
    const authorsBlocks = fileMetadata.authorData
        .map((author) => {
            const authorData = fileMetadata.authorData.find((data) => data.email === author.email);
            if (!authorData) return '';
            return (
                `<div class="author-block">
${pictureHtml(authorData)}
<div>
<h4>${authorData.name}</h4>
<p>${authorData.bio}</p>
<p><a href="mailto:${author.email}">${author.email}</a></p>
</div></div>`
            );
        })
        .join('\n');
    return `\n## About the authors\n${authorsBlocks}`;
}
