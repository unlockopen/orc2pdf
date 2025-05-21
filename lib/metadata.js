const fs = require('fs');

function extractMetadata(markdownContent) {
    const metadata = {};
    const Title = markdownContent.match(/^\s*#\s+(.+)/m);
    if (Title && Title[1]) {
        const [title, subtitle] = Title[1].split(':').map((str) => str.trim());
        metadata['title'] = title || '';
        metadata['subtitle'] = subtitle || '';
    } else {
        metadata['title'] = '';
        metadata['subtitle'] = '';
    }
    const versionMatch = markdownContent.match(/^\s*###\s*(.+)/m);
    metadata['version'] = versionMatch ? versionMatch[1].trim() : '';
    return metadata;
}

function injectVariables(content, variables) {
    return content.replace(/{{(\w+)}}/g, (match, variable) => variables[variable] || match);
}

module.exports = {
    extractMetadata,
    injectVariables,
};
