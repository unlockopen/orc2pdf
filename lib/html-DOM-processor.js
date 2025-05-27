import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import { PROJECT_ROOT, SERVER_CONFIG } from './config.js'; // or ASSETS_DIR, depending on your structure

/**
 * HTML post-processing utilities for:
 *  - Inlining images as base64 data URIs in <img> tags.
 *  - Processing legal excerpt comments and marking following blockquotes.
 *
 * Exports:
 *   - inlineImagesAsBase64(html, baseDir): Returns HTML with local images inlined as base64.
 *   - processLegalExcerpts(html): Adds a 'legal-excerpt' class to blockquotes following <!-- [[legal]] --> comments.
 *
 * JSDoc format is used for IDE support and documentation generation.
 */

function inlineImagesAsBase64(html, baseDir = PROJECT_ROOT) {
    const $ = load(html);

    $('img').each((_, img) => {
        let src = $(img).attr('src');
        if (!src || src.startsWith('data:') || src.startsWith('http')) return;

        const imgPath = path.isAbsolute(src) ? src : path.resolve(baseDir, src);

        if (fs.existsSync(imgPath)) {
            const ext = path.extname(imgPath).slice(1).toLowerCase();
            const mime = ext === 'svg' ? 'image/svg+xml' : `image/${ext}`;
            const data = fs.readFileSync(imgPath);
            const base64 = data.toString('base64');
            const dataUri = `data:${mime};base64,${base64}`;
            $(img).attr('src', dataUri);
        } else {
            console.warn(`⚠️ Image not found: ${imgPath}`);
        }
    });

    return $.html();
}

function processLegalExcerpts(html) {
    const $ = load(html);
    const legalExcerpts = [];

    // Find all <!-- [[legal]] --> comments (make sure we have the exact match for the [[legal]] tag)
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
    // <a href="">
    $('a[href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.match(/^(https?:|data:|#)/)) {
            $(el).attr('href', filePathToUrl(href));
        }
    });

    // <img src="">
    $('img[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.match(/^(https?:|data:|#)/)) {
            $(el).attr('src', filePathToUrl(src));
        }
    });

    // <script src="">
    $('script[src]').each((_, el) => {
        const src = $(el).attr('src');
        if (src && !src.match(/^(https?:|data:|#)/)) {
            $(el).attr('src', filePathToUrl(src));
        }
    });

    // <link rel="stylesheet" href="">
    $('link[rel="stylesheet"][href]').each((_, el) => {
        const href = $(el).attr('href');
        if (href && !href.match(/^(https?:|data:|#)/)) {
            $(el).attr('href', filePathToUrl(href));
        }
    });

    return $.html();
}


export { inlineImagesAsBase64, processLegalExcerpts, transformFileLinksToUrls };
