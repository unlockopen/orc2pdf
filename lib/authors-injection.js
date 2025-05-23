/**
 * Generates HTML blocks for each author in fileMetadata.authors.
 * @param {object} fileMetadata - The metadata object containing an 'authors' array.
 * @returns {string} - HTML string with all author blocks.
 */

function injectAuthorsHtml(fileMetadata, mdContent) {
    const authorsHtml = generateAuthorsHtml(fileMetadata);
    return mdContent.replace("<!-- [[authors]] -->", authorsHtml);
}

function pictureHtml(authorData) {
    if (authorData.picture_url) {
        return `<img src="${authorData.picture_url}" alt="${authorData.name}" class="author-photo" />`;
    } else {
        // Return a default image svg if no picture is found
        return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="feather feather-user author-photo"><path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4z"/><path d="M12 14c-5.33 0-8 2.67-8 8v2h16v-2c0-5.33-2.67-8-8-8z"/></svg>`;
    }
}

function generateAuthorsHtml(fileMetadata) {
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
export { injectAuthorsHtml };
