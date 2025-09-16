import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

export function initProject(projectName, options = {}) {
    const projectPath = path.resolve(projectName);
    const themeName = options.theme || 'default';
    
    // Create project directory
    if (!fs.existsSync(projectPath)) {
        fs.mkdirSync(projectPath, { recursive: true });
    }
    
    // Create directory structure
    const dirs = [
        'docs',
        'data/authors',
        'data/authors/pictures',
        'assets/templates',
        'themes'
    ];
    
    dirs.forEach(dir => {
        const fullPath = path.join(projectPath, dir);
        if (!fs.existsSync(fullPath)) {
            fs.mkdirSync(fullPath, { recursive: true });
        }
    });
    
    // Create config file
    const config = {
        theme: themeName,
        titlePage: true,
        authors: {
            directory: 'data/authors',
            template: 'assets/templates/author.yaml'
        },
        pdfOptions: {
            displayHeaderFooter: true,
            printBackground: true,
            preferCSSPageSize: true,
            scale: 1.0
        }
    };
    
    fs.writeFileSync(
        path.join(projectPath, 'md2pdf.config.json'),
        JSON.stringify(config, null, 2)
    );
    
    // Copy template files from the package
    const templateFiles = [
        { src: 'assets/templates/author.yaml', dest: 'assets/templates/author.yaml' },
        { src: 'test.md', dest: 'docs/example.md' },
        { src: 'test.js', dest: 'docs/example.js' }
    ];
    
    templateFiles.forEach(({ src, dest }) => {
        const srcPath = path.join(PACKAGE_ROOT, src);
        const destPath = path.join(projectPath, dest);
        
        if (fs.existsSync(srcPath)) {
            fs.copyFileSync(srcPath, destPath);
        }
    });
    
    // Create sample author file
    const sampleAuthor = `name: John Doe
email: john.doe@example.com
bio: |
  Software developer and technical writer with expertise in 
  documentation systems and PDF generation.
website: https://johndoe.dev
picture: pictures/john_doe.jpg
`;
    
    fs.writeFileSync(
        path.join(projectPath, 'data/authors/john_doe_example.com.yaml'),
        sampleAuthor
    );
    
    // Create README
    const readme = `# ${projectName}

This project was initialized with md2pdf.

## Getting Started

1. Edit your markdown files in the \`docs/\` directory
2. Configure authors in \`data/authors/\`
3. Customize the theme in \`md2pdf.config.json\`

## Commands

Generate PDF from markdown:
\`\`\`bash
md2pdf convert docs/example.md
\`\`\`

Generate with custom output:
\`\`\`bash
md2pdf convert docs/example.md -o output/my-document.pdf
\`\`\`

Generate with HTML output:
\`\`\`bash
md2pdf convert docs/example.md --html
\`\`\`

## Project Structure

- \`docs/\` - Your markdown documents
- \`data/authors/\` - Author profile YAML files  
- \`assets/templates/\` - Template files
- \`themes/\` - Custom theme files
- \`md2pdf.config.json\` - Project configuration
`;
    
    fs.writeFileSync(path.join(projectPath, 'README.md'), readme);
    
    return projectPath;
}