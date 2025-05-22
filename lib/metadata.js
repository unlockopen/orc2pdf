import fs from 'fs';
import yaml from 'js-yaml';
import {
    AUTHORS_DIR,
    AUTHOR_TEMPLATE_FILE,
    METADATA_TEMPLATE_FILE
} from './config.js';

export function getFileMetadata(metadataFilePath) {
    if (fs.existsSync(metadataFilePath)) {
        const metadataContent = fs.readFileSync(metadataFilePath, 'utf8');
        const pageMetadata = yaml.load(metadataContent);
        if (!pageMetadata.authors || !Array.isArray(pageMetadata.authors)) {
            console.warn(`⚠️ No authors found in metadata file.`);
            return pageMetadata;
        } else {
            getAuthorData(pageMetadata);
            return pageMetadata;
        }
    } else {
        console.warn(`⚠️ Metadata file not found.`);
        const templateMetadataContent = fs.readFileSync(METADATA_TEMPLATE_FILE, 'utf8');
        fs.writeFileSync(metadataFilePath, templateMetadataContent);
        console.log(`   - Created metadata file: ${metadataFilePath}`);
        console.log(`   - Please fill in the metadata fields before generating the PDF.`);
        process.exit(1);
    }
}

function getAuthorData(pageMetadata) {
    const missingAuthors = [];
    const authorData = [];
    const templateAuthorContent = fs.readFileSync(AUTHOR_TEMPLATE_FILE, 'utf8');

    pageMetadata.authors.forEach((email) => {
        const authorId = String(email).replace(/[@\s]/g, '_');
        const authorFilePath = `${AUTHORS_DIR}/${authorId}.yaml`;
        if (fs.existsSync(authorFilePath)) {
            const authorContent = fs.readFileSync(authorFilePath, 'utf8');
            authorData.push(yaml.load(authorContent));
        } else {
            missingAuthors.push({ email, authorFilePath });
            fs.writeFileSync(authorFilePath, templateAuthorContent);
        }
    });

    if (missingAuthors.length > 0) {
        missingAuthors.forEach(({ email, authorFilePath }) => {
            console.warn(`⚠️ Author metadata file not found for ${JSON.stringify(email)}.`);
            console.log(`   - Created author metadata file: ${authorFilePath}`);
        });
        console.log(`   - Please fill in the metadata fields before generating the PDF.`);
        process.exit(1);
    }

    pageMetadata.authorData = authorData;
}

export function injectVariables(content, variables) {
    return content.replace(/{{(\w+)}}/g, (match, variable) => variables[variable] || match);
}
