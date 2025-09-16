# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

md2pdf is a generic, configurable Markdown to PDF conversion package with CLI support. It features a theme system, project initialization, and flexible configuration options for different document types and styling needs.

## Core Commands

### CLI Commands
```bash
# Convert a markdown file
md2pdf convert document.md

# Initialize new project  
md2pdf init my-project

# List available themes
md2pdf themes

# Development/testing
npm run test    # Convert test.md using CLI
npm run dev     # Use legacy generate-pdf.js script
```

### Legacy Command (for development)
```bash
node generate-pdf.js test.md
```

## Architecture

### CLI Layer
- **CLI Interface** (`bin/cli.js`): Commander-based CLI with convert, init, and themes commands
- **Main Library** (`lib/index.js`): Core API for PDF generation with configuration support
- **Project Init** (`lib/project-init.js`): Creates new project structure with samples

### Configuration System
- **Config Manager** (`lib/config-manager.js`): Loads project configs and resolves themes
- **Theme System**: `themes/` directory with built-in themes (default, minimal, academic)
- **Project Configs**: Support for `md2pdf.config.json`, `md2pdf.config.js`, `.md2pdf.json`

### Processing Pipeline
1. **Input Processing** (`lib/input-markdown-processor.js`): Parses frontmatter and processes markdown
2. **HTML Generation** (`lib/md-to-html.js`): Converts markdown with plugins (anchors, callouts, TOC)  
3. **HTML Processing** (`lib/html-DOM-processor.js`): Post-processes for legal excerpts and file links
4. **PDF Generation** (`lib/html-to-pdf.js`): Puppeteer-based PDF conversion
5. **PDF Manipulation** (`lib/pdf-manipulation.js`): Title pages, page labeling, A4 cropping

### Key Components
- **Theme System**: Each theme contains CSS, HTML templates, and configuration
- **Block Generators** (`lib/html-block-generators.js`): Theme-aware headers, footers, title pages
- **Author System**: YAML profiles with configurable directory structure
- **Legacy Support**: Original `generate-pdf.js` still available for development

### Special Features

- **JS Preprocessors**: Files with same name as markdown but `.js` extension are injected as scripts for DOM manipulation
- **Title Pages**: Enabled with `<!-- [[titlepage]] -->` comment in markdown
- **Table of Contents**: Generated with `<!-- [[toc]] -->` or `<!-- [[toc]][levels] -->`
- **Author Integration**: Frontmatter author references are expanded using YAML profiles
- **Legal Excerpts**: Special processing for blockquotes marked as legal content

### File Structure

- `lib/`: Core processing modules
- `assets/`: Templates, stylesheets, and static resources
- `data/authors/`: Author profile YAML files
- Generated files are placed in the same directory as the input markdown

## Development Notes

- Uses ES modules (`"type": "module"` in package.json)
- No build step required - runs directly with Node.js
- PDF generation requires a headless browser (Puppeteer)
- Authors can have profile pictures stored in `data/authors/pictures/`