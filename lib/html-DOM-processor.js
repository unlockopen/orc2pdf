import path from 'path';
import { load } from 'cheerio';
import { SERVER_CONFIG } from './config.js';

/**
 * HTML post-processing utilities:
 *  - processLegalExcerpts(html): Adds a 'legal-excerpt' class to blockquotes following <!-- [[legal]] --> comments.
 *  - transformFileLinksToUrls(html, serverConfig): Converts local file links (a[href], img[src], script[src], link[rel="stylesheet"][href])
 *    to absolute URLs using the provided server configuration.
 *
 * All functions return the processed HTML as a string.
 */

/**
 * Adds a 'legal-excerpt' class to blockquotes that immediately follow a <!-- [[legal]] --> comment.
 * @param {string} html - The HTML string to process.
 * @returns {string} - The processed HTML with 'legal-excerpt' classes added.
 */
function processLegalExcerpts(html) {
    const $ = load(html);
    const legalExcerpts = [];

    // Find all <!-- [[legal]] --> comments and add class to the next blockquote
    $('*').contents().each(function (i, el) {
        if (el.type === 'comment' && el.data.trim() === '[[legal]]') {
            // Find the next blockquote sibling
            let next = el.next;
            while (next && (next.type === 'text' && !next.data.trim())) {
                next = next.next;
            }
            if (next && next.name === 'blockquote') {
                $(next).addClass('legal-excerpt');
                legalExcerpts.push($.html(next));
            }
        }
    });

    return $.html();
}

/**
 * Converts all local file links (a[href], img[src], script[src], link[rel="stylesheet"][href])
 * to absolute URLs using the provided serverConfig ({ basedir, baseUrl }).
 * Only rewrites links that are local files (not starting with http, https, data, or #).
 *
 * @param {string} html - The HTML string to process.
 * @param {object} serverConfig - The server config ({ basedir, baseUrl }).
 * @returns {string} - The HTML with local file links converted to URLs.
 */
function transformFileLinksToUrls(html, serverConfig = SERVER_CONFIG) {
    const $ = load(html);
    const baseDir = serverConfig.basedir;
    const baseUrl = serverConfig.baseUrl;

    // Helper to convert a local file path to a URL
    function filePathToUrl(filePath) {
        const absPath = path.isAbsolute(filePath) ? filePath : path.resolve(baseDir, filePath);
        let relPath = path.relative(baseDir, absPath).split(path.sep).join('/');
        relPath = relPath.split('/').map(encodeURIComponent).join('/');
        return `${baseUrl}/${relPath}`;
    }

    // Update <a href="">
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.match(/^(https?:|data:|#)/)) {
            $(el).attr('href', filePathToUrl(href));
        }
    });

    // Update <img src="">
    $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.match(/^(https?:|data:|#)/)) {
            $(el).attr('src', filePathToUrl(src));
        }
    });

    // Update <script src="">
    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.match(/^(https?:|data:|#)/)) {
            $(el).attr('src', filePathToUrl(src));
        }
    });

    // Update <link rel="stylesheet" href="">
    $('link[rel="stylesheet"][href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.match(/^(https?:|data:|#)/)) {
            $(el).attr('href', filePathToUrl(href));
        }
    });

    return $.html();
}

export { processLegalExcerpts, transformFileLinksToUrls };
