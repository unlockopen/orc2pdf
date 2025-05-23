import fs from 'fs';
import path from 'path';
import { load } from 'cheerio';
import { PROJECT_ROOT } from './config.js'; // or ASSETS_DIR, depending on your structure

/**
 * Replaces all <img> src attributes in HTML with base64-encoded data URIs.
 * @param {string} html - The HTML content as a string.
 * @param {string} [baseDir] - The base directory to resolve relative image paths.
 * @returns {string} - The HTML with images inlined as base64.
 **/

export function inlineImagesAsBase64(html, baseDir = PROJECT_ROOT) {
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

export function processLegalExcerpts(html) {
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
