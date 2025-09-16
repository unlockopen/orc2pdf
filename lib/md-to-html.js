import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import MarkdownIt from 'markdown-it';
import hljs from 'highlight.js';
import markdownItAnchor from 'markdown-it-anchor';
import markdownItCallouts from 'markdown-it-callouts';
import markdownItToc from 'markdown-it-table-of-contents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const FALLBACK_TEMPLATE_PATH = path.join(__dirname, '..', 'assets', 'main-content.html');

/**
 * Converts Markdown content to a complete HTML page using markdown-it and various plugins.
 *
 * - Supports syntax highlighting, anchors, callouts, and table of contents.
 * - Injects the rendered HTML into a template file with placeholders for title, stylesheet, and content.
 *
 * @param {string} mdContent - The Markdown content to convert.
 * @param {string} stylesheetPath - Path to a CSS file to include in the HTML via a <link> tag.
 * @param {object} pageMetadata - Metadata for the page (e.g. { title, status }).
 * @param {object} options - Options for markdown-it (e.g. { headerIDs: false }).
 * @param {Array} extensions - Additional markdown-it plugins.
 * @returns {Promise<string>} - The generated HTML page as a string.
 */
async function mdToHtml(mdContent, stylesheetPath, pageMetadata = {}, options = {}, extensions = [], templatePath = null) {
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
        includeLevel: pageMetadata.tableOfContent || [2, 3],
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
    let stylesheet = '';

    if (stylesheetPath && fs.existsSync(stylesheetPath)) {
        stylesheet = `<link rel="stylesheet" href="${stylesheetPath}">`;
    }

    // Read and fill the template
    const actualTemplatePath = templatePath || FALLBACK_TEMPLATE_PATH;
    if (!fs.existsSync(actualTemplatePath)) {
        throw new Error(`Template file not found: ${actualTemplatePath}`);
    }
    let template = fs.readFileSync(actualTemplatePath, 'utf8');
    template = template
        .replace('{{title}}', pageMetadata.title || '')
        .replace('{{stylesheetTag}}', stylesheet)
        .replace('{{content}}', htmlContent)
        .replace('{{status}}', pageMetadata.status || 'published');

    return template;
}

export default mdToHtml;
