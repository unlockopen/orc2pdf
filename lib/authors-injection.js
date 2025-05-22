/**
 * Generates HTML blocks for each author in fileMetadata.authors.
 * @param {object} fileMetadata - The metadata object containing an 'authors' array.
 * @returns {string} - HTML string with all author blocks.
 */

function injectAuthorsHtml(fileMetadata, mdContent) {
    const authorsHtml = generateAuthorsHtml(fileMetadata);
    return mdContent.replace("<!-- [[authors]] -->", authorsHtml);
}

function generateAuthorsHtml(fileMetadata) {
    if (!fileMetadata.authorData || !Array.isArray(fileMetadata.authorData)) return '';
    const authorsBlocks = fileMetadata.authorData
        .map((author) => {
            const authorData = fileMetadata.authorData.find((data) => data.email === author.email);
            if (!authorData) return '';
            return (
                `<div class="author-block">
<h4>${authorData.name}</h4>
<p>${authorData.bio}</p>
<p><a href="mailto:${author.email}">${author.email}</a></p>
<img src="${authorData.photo}" alt="${authorData.name}" class="author-photo" />
</div>`
            );
        })
        .join('\n');
    return `\n## Authors\n${authorsBlocks}`;
}
export { injectAuthorsHtml };
