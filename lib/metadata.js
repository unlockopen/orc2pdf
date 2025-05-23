import fs from 'fs';
import yaml from 'js-yaml';
import {
    AUTHORS_DIR,
    AUTHOR_TEMPLATE_FILE,
    METADATA_TEMPLATE_FILE,
    AUTHOR_PICS_DIR,
    ASSETS_DIR
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

function authorPicUrl(authorID) {
    // Create the base picture url from the authorID.
    const authorPicPath = `${AUTHOR_PICS_DIR}/${authorID}`;
    // Check if a picture exsists with either .jpg or .png extension
    if (fs.existsSync(`${authorPicPath}.jpg`)) {
        return `${authorPicPath}.jpg`;
    } else if (fs.existsSync(`${authorPicPath}.png`)) {
        return `${authorPicPath}.png`;
    } else {
        // If no picture exists, return a default image and log a warning
        console.warn(`⚠️ Author picture not found for ${authorID}. Using default image.`);
        return null;
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
            let authorContent = fs.readFileSync(authorFilePath, 'utf8');
            authorContent = yaml.load(authorContent);
            authorContent.picture_url = authorPicUrl(authorId);
            authorData.push(authorContent);
        } else {
            missingAuthors.push({ email, authorFilePath });
            // Inject the email into the template before saving
            const authorYaml = templateAuthorContent.replace(/{{\s*email\s*}}/g, email).replace(/{{\s*authorId\s*}}/g, authorId);
            fs.writeFileSync(authorFilePath, authorYaml);
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
