import fs from 'fs';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItCallouts from 'markdown-it-callouts';
import markdownItToc from 'markdown-it-table-of-contents';

/**
 * Converts a Markdown file to HTML using markdown-it and plugins.
 * @param {string} mdContent - The Markdown content as a string.
 * @param {string} stylesheetPath - Path to a CSS file to include in the HTML.
 * @param {object} options - Options for markdown-it (e.g. { headerIDs: false }).
 * @param {Array} extensions - Additional markdown-it plugins.
 * @returns {Promise<string>} - The generated HTML string.
 */
async function mdToHtml(mdContent, stylesheetPath, options = {}, extensions = []) {
    const md = new MarkdownIt({
        html: true,
        linkify: true,
        typographer: true,
        langPrefix: 'hljs ',
        highlight: (code, language) => {
            const validLanguage = hljs.getLanguage(language) ? language : 'plaintext';
            return hljs.highlight(code, { language: validLanguage }).value;
        },
        ...options,
    });

    md.use(markdownItCallouts);

    // Add table of contents plugin
    md.use(markdownItToc, {
        includeLevel: [2, 3],
        containerClass: 'table-of-content',
        containerHeaderHtml: '<h2 id="table-of-content">Table of Contents</h2>',
    });

    if (options.headerIDs !== false) {
        md.use(markdownItAnchor, {
            permalink: false,
            slugify: (str) =>
                str
                    .toLowerCase()
                    .replace(/[\s]+/g, '-')
                    .replace(/[^\w-]/g, ''),
        });
    }

    // Apply any additional plugins/extensions
    if (Array.isArray(extensions)) {
        extensions.forEach((plugin) => {
            if (typeof plugin === 'function') {
                md.use(plugin);
            } else if (plugin && typeof plugin === 'object' && typeof plugin.plugin === 'function') {
                md.use(plugin.plugin, ...(plugin.options || []));
            } else if (plugin) {
                console.warn('⚠️ Skipping invalid markdown-it plugin:', plugin);
            }
        });
    }

    const htmlContent = md.render(mdContent);

    let stylesheetTag = '';
    if (stylesheetPath && fs.existsSync(stylesheetPath)) {
        stylesheetTag = `<link rel="stylesheet" href="${stylesheetPath}">`;
    }

    const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<title></title>
${stylesheetTag}
</head>
<body>
${htmlContent}
</body>
</html>`;

    return fullHtml;
}

export default mdToHtml;
