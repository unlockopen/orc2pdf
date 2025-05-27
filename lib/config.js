import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, '..');

// All paths below are absolute, built from PROJECT_ROOT
export const DATA_DIR = 'data';
export const AUTHORS_DIR = path.join(DATA_DIR, 'authors');
export const AUTHOR_PICS_DIR = path.join(AUTHORS_DIR, 'pictures');
export const ASSETS_DIR = 'assets';
export const TEMPLATES_DIR = path.join(ASSETS_DIR, 'templates');

export const AUTHOR_TEMPLATE_FILE = path.join(TEMPLATES_DIR, 'author.yaml');
export const HEADER_FILE = path.join(ASSETS_DIR, 'header.html');
export const FOOTER_FILE = path.join(ASSETS_DIR, 'footer.html');
export const MAIN_CONTENT_STYLESHEET = path.join(ASSETS_DIR, 'main-content.css');
export const TITLE_PAGE_STYLESHEET = path.join(ASSETS_DIR, 'title-page.css');

const port = 8089; // Use environment variable or default to 8089

export const SERVER_CONFIG = {
    basedir: PROJECT_ROOT,
    port: port,
    baseUrl: `http://localhost:${port}`
};

export const PDF_CONFIG = {
    devtools: false,
    as_html: false,
    pdf_options: {
        displayHeaderFooter: true,
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1.0,
    }
};
