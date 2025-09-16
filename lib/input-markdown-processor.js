import fs from 'fs';
import yaml from 'js-yaml';

export function processInputMarkdown(inputFilePath, config = {}) {
    const messages = { errors: {}, warnings: {}, info: [] };
    let markdown = fs.readFileSync(inputFilePath, 'utf8');

    // Extract frontmatter (YAML between --- ... ---)
    const frontmatterMatch = markdown.match(/^---\s*([\s\S]*?)\s*---/);
    let pageMetadata = {};
    if (frontmatterMatch) {
        try {
            pageMetadata = yaml.load(frontmatterMatch[1]);
        } catch (e) {
            messages.warnings['❌ Invalid YAML frontmatter.'] = [e.message];
        }
    } else {
        messages.warnings['❌ No frontmatter block found.'] = [];
    }

    // Parse authors field into array of { name, email }
    if (pageMetadata.authors) {
        pageMetadata.authors = parseAuthors(pageMetadata.authors, messages);
    } else {
        addWarning(messages, '⚠️ No authors were declared in the metadata, the "about the authors" page will not be generated.');
    }

    // Get more metadata from the rest of the file :
    // - title : the first h1, if it contains a colon or a dash, split it into title and subtitle
    // - subtitle : the rest of the h1
    const firstH1 = markdown.match(/^(?:#\s+)(.*)/m);
    if (firstH1) {
        const titleParts = firstH1[1].split(/[:\-]/);
        pageMetadata.title = titleParts[0].trim();
        if (titleParts.length > 1) {
            pageMetadata.subtitle = titleParts.slice(1).join(':').trim();
        }
    }

    // Replace the first h1 with a block of h1 and h2, but keep it in markdown
    if (firstH1) {
        const title = pageMetadata.title;
        const subtitle = pageMetadata.subtitle;
        let replacement = `# ${title}`;
        if (subtitle) {
            replacement += `\n\n<!-- omit from toc -->\n## ${subtitle}`;
        }
        markdown = markdown.replace(firstH1[0], replacement);
    }

    // Detect title page marker
    pageMetadata.titlePage = markdown.includes('<!-- [[titlepage]] -->');

    // Validate and enrich author data
    getAuthorData(pageMetadata, messages);

    // Remove frontmatter from markdown
    markdown = removeFrontmatter(markdown);

    // Process the TOC tag : <!-- [[toc]][2,3,4] -->
    // If <!-- [[toc]] --> we just remove the comments and the parser will generate
    // the default with heading levels 2 and 3. If <!-- [[toc]][#levels] --> we save
    // the levels in the metadata.
    // Process the TOC tag : <!-- [[toc]][2,3,4] -->
    // If <!-- [[toc]] --> we just remove the comments and the parser will generate
    // the default with heading levels 2 and 3. If <!-- [[toc]][#levels] --> we save
    // the levels in the metadata.
    // Only process TOC tags that are NOT inside code blocks
    let tocMatch;
    const codeBlockRegex = /```[\s\S]*?```/g;
    let codeBlocks = [];
    let match;

    // Find all code blocks and store their ranges
    while ((match = codeBlockRegex.exec(markdown)) !== null) {
        codeBlocks.push({ start: match.index, end: codeBlockRegex.lastIndex });
    }

    // Find TOC tag matches
    const tocTagRegex = /<!-- \[\[toc\]\](\[\d(,\d)*\])? -->/g;
    while ((tocMatch = tocTagRegex.exec(markdown)) !== null) {
        const tocIndex = tocMatch.index;
        // Check if this TOC tag is inside any code block
        const inCodeBlock = codeBlocks.some(
            block => tocIndex >= block.start && tocIndex < block.end
        );
        if (!inCodeBlock) {
            if (tocMatch[1]) {
                const levels = tocMatch[1].replace(/[\[\]]/g, '').split(',').map(Number);
                pageMetadata.tableOfContent = levels;
            }
            markdown = markdown.slice(0, tocMatch.index) + '[[toc]]' + markdown.slice(tocTagRegex.lastIndex);
            // Adjust regex lastIndex due to replacement
            tocTagRegex.lastIndex = tocMatch.index + '[[toc]]'.length;
        }
    }

    return { markdown, pageMetadata, messages };
}

// --- Helper functions ---

function parseAuthors(authorsField, messages) {
    let authorsArr = Array.isArray(authorsField) ? authorsField : authorsField.split(',');
    return authorsArr.map(str => {
        const match = str.match(/^(.*?)<([^>]+)>$/);
        if (match) {
            return { name: match[1].trim(), email: match[2].trim() };
        } else {
            addWarning(messages, `⚠️ Author entry "${str.trim()}" is not in "Name <email>" format.`);
            return { name: str.trim(), email: '' };
        }
    });
}

function addError(messages, error, info = []) {
    if (!messages.errors[error]) messages.errors[error] = [];
    messages.errors[error].push(...info);
}

function addWarning(messages, warning, info = []) {
    if (!messages.warnings[warning]) messages.warnings[warning] = [];
    messages.warnings[warning].push(...info);
}

function authorPicUrl(authorID) {
    const authorPicPath = `${AUTHOR_PICS_DIR}/${authorID}`;
    if (fs.existsSync(`${authorPicPath}.jpg`)) {
        return `${authorPicPath}.jpg`;
    } else if (fs.existsSync(`${authorPicPath}.png`)) {
        return `${authorPicPath}.png`;
    } else {
        return null;
    }
}

function getAuthorData(pageMetadata, messages) {
    if (!pageMetadata || !Array.isArray(pageMetadata.authors)) {
        addWarning(messages, '⚠️ No authors were declared in the metadata, the "about the authors" page will not be generated.');
        return;
    }

    const missingAuthors = [];
    const authorData = [];
    const templateAuthorContent = fs.readFileSync(AUTHOR_TEMPLATE_FILE, 'utf8');

    pageMetadata.authors.forEach(({ name, email }) => {
        if (!name) {
            addError(messages, `❌ Author "${email}" is missing a "name".`);
        }
        if (!email) {
            addError(messages, `❌ Author "${name}" is missing an "email".`);
        }
        const authorId = String(email).replace(/[@\s]/g, '_');
        const authorFilePath = `${AUTHORS_DIR}/${authorId}.yaml`;
        if (fs.existsSync(authorFilePath)) {
            let authorContent = fs.readFileSync(authorFilePath, 'utf8');
            authorContent = yaml.load(authorContent);

            // Validate author fields
            if (!authorContent.bio || !authorContent.bio.trim()) {
                addError(messages, `❌ Author "${email}" is missing a "bio".`);
            }

            authorContent.picture_url = authorPicUrl(authorId);
            authorContent.name = name;
            authorContent.email = email;
            authorData.push(authorContent);
        } else {
            missingAuthors.push({ email, authorFilePath });
            const authorYaml = templateAuthorContent.replace(/{{\s*email\s*}}/g, email).replace(/{{\s*authorId\s*}}/g, authorId);
            fs.writeFileSync(authorFilePath, authorYaml);
        }
    });

    if (missingAuthors.length > 0) {
        missingAuthors.forEach(({ email, authorFilePath }) => {
            addWarning(messages, `⚠️ Author metadata file not found for ${JSON.stringify(email)}.`, [
                `   - Created author metadata file: ${authorFilePath}`
            ]);
        });
        addWarning(messages, `   - Please fill in the metadata fields before generating the PDF.`);
    }

    pageMetadata.authorData = authorData;
}

function removeFrontmatter(markdown) {
    return markdown.replace(/^---\s*([\s\S]*?)\s*---/m, '');
}

