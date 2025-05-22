import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

export const PROJECT_ROOT = path.resolve(__dirname, '..');
export const DATA_DIR = path.join(PROJECT_ROOT, 'data');
export const AUTHORS_DIR = path.join(DATA_DIR, 'authors');
export const ASSETS_DIR = path.join(PROJECT_ROOT, 'assets');
export const TEMPLATES_DIR = path.join(ASSETS_DIR, 'templates');

export const AUTHOR_TEMPLATE_FILE = path.join(TEMPLATES_DIR, 'author.yaml');
export const METADATA_TEMPLATE_FILE = path.join(TEMPLATES_DIR, 'metadata.yaml');
export const HEADER_FILE = path.join(ASSETS_DIR, 'header.html');
export const FOOTER_FILE = path.join(ASSETS_DIR, 'footer.html');
export const MAIN_CONTENT_STYLESHEET = path.join(ASSETS_DIR, 'main-content.css');
export const TITLE_PAGE_STYLESHEET = path.join(ASSETS_DIR, 'title-page.css');
