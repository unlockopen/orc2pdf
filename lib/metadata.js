import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

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
        // Create a metadata file from the template in assets/templates/metadata.yaml
        const templateMetadataFile = path.resolve(path.dirname(metadataFilePath), 'assets/templates/metadata.yaml');
        const templateMetadataContent = fs.readFileSync(templateMetadataFile, 'utf8');
        fs.writeFileSync(metadataFilePath, templateMetadataContent);
        console.log(`   - Created metadata file: ${metadataFilePath}`);
        console.log(`   - Please fill in the metadata fields before generating the PDF.`);
        process.exit(1);
    }
}

function getAuthorData(pageMetadata) {
    const missingAuthors = [];
    const authorData = [];
    const authorsDir = path.resolve(path.dirname(metadataFilePath), 'data/authors');
    const templateAuthorFile = path.resolve(path.dirname(metadataFilePath), 'assets/templates/author.yaml');
    const templateAuthorContent = fs.readFileSync(templateAuthorFile, 'utf8');

    pageMetadata.authors.forEach((email) => {
        // Use the email address directly, sanitized for filename
        const authorId = String(email).replace(/[@\s]/g, '_');
        const authorFilePath = path.join(authorsDir, `${authorId}.yaml`);
        if (fs.existsSync(authorFilePath)) {
            const authorContent = fs.readFileSync(authorFilePath, 'utf8');
            authorData.push(yaml.load(authorContent));
        } else {
            missingAuthors.push({ email, authorFilePath });
            fs.writeFileSync(authorFilePath, templateAuthorContent);
        }
    });

    if (missingAuthors.length > 0) {
        missingAuthors.forEach(({ author, authorFilePath }) => {
            console.warn(`⚠️ Author metadata file not found for ${JSON.stringify(author)}.`);
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
