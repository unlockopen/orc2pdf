# markdown-to-pdf

A flexible Markdown to PDF converter with support for custom themes, title pages, and author management.

## Installation

```bash
npm install -g markdown-to-pdf
```

Or use directly without installation:
```bash
npx markdown-to-pdf convert document.md
```

## Quick Start

### Convert a single file
```bash
markdown-to-pdf convert document.md
```

### Initialize a new project
```bash
markdown-to-pdf init my-docs
cd my-docs
markdown-to-pdf convert docs/example.md
```

## CLI Commands

### `convert <file>`
Convert a Markdown file to PDF

**Options:**
- `-o, --output <file>` - Output PDF file path
- `-t, --theme <name>` - Theme to use (default: 'default')
- `-c, --config <file>` - Configuration file path
- `--html` - Also output intermediate HTML file
- `--no-title-page` - Skip title page generation

**Examples:**
```bash
markdown-to-pdf convert document.md
markdown-to-pdf convert document.md -o output/final.pdf
markdown-to-pdf convert document.md --theme minimal --html
```

### `init [name]`
Initialize a new markdown-to-pdf project with sample files

**Options:**
- `-t, --theme <name>` - Theme to use (default: 'default')

### `themes`
List available themes

## Configuration

Projects can be configured using:
- `markdown-to-pdf.config.json` (recommended)
- `markdown-to-pdf.config.js`
- `.markdown-to-pdf.json`
- `package.json` (in `markdown-to-pdf` section)

**Example configuration:**
```json
{
  "theme": "default",
  "titlePage": true,
  "authors": {
    "directory": "data/authors",
    "template": "assets/templates/author.yaml"
  },
  "pdfOptions": {
    "displayHeaderFooter": true,
    "printBackground": true,
    "scale": 1.0
  }
}
```

## Features

- **Custom Themes**: Built-in themes (default, minimal, academic) with support for custom themes
- **Title Pages**: Automatic title page generation with metadata
- **Author Management**: YAML-based author profiles with pictures
- **Table of Contents**: Automatic TOC generation with `<!-- [[toc]] -->`
- **Syntax Highlighting**: Code blocks with highlight.js
- **Custom CSS**: Theme-based styling with CSS customization
- **JS Preprocessing**: Custom DOM manipulation with `.js` files
- **Markdown Extensions**: Callouts, anchors, and more

## Themes

### Built-in Themes
- **default**: Professional styling with headers/footers
- **minimal**: Clean, minimal design without headers
- **academic**: Academic paper formatting (coming soon)

### Custom Themes
Create a `themes/mytheme/` directory with:
- `theme.json` - Theme configuration
- `main-content.css` - Main document styles  
- `title-page.css` - Title page styles
- `header.html` - Header template
- `footer.html` - Footer template
