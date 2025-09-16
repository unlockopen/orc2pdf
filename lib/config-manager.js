import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const PACKAGE_ROOT = path.resolve(__dirname, '..');

const DEFAULT_CONFIG = {
    theme: 'default',
    titlePage: true,
    authors: {
        directory: 'data/authors',
        template: 'assets/templates/author.yaml'
    },
    pdfOptions: {
        displayHeaderFooter: true,
        printBackground: true,
        preferCSSPageSize: true,
        scale: 1.0,
    }
};

export async function loadConfig(projectDir, configPath = null) {
    const config = { ...DEFAULT_CONFIG };
    
    // Try to find config file
    const possibleConfigs = [
        configPath,
        path.join(projectDir, 'md2pdf.config.js'),
        path.join(projectDir, 'md2pdf.config.json'),
        path.join(projectDir, '.md2pdf.json'),
        path.join(projectDir, 'package.json') // Look for md2pdf section
    ].filter(Boolean);
    
    for (const configFile of possibleConfigs) {
        if (fs.existsSync(configFile)) {
            try {
                let loadedConfig;
                
                if (configFile.endsWith('.js')) {
                    const module = await import(`file://${path.resolve(configFile)}`);
                    loadedConfig = module.default || module;
                } else if (configFile.endsWith('package.json')) {
                    const packageJson = JSON.parse(fs.readFileSync(configFile, 'utf8'));
                    loadedConfig = packageJson.md2pdf || {};
                } else {
                    const content = fs.readFileSync(configFile, 'utf8');
                    loadedConfig = JSON.parse(content);
                }
                
                Object.assign(config, loadedConfig);
                break;
            } catch (error) {
                console.warn(`Warning: Failed to load config from ${configFile}: ${error.message}`);
            }
        }
    }
    
    // Resolve relative paths
    config.authors.directory = path.resolve(projectDir, config.authors.directory);
    if (config.authors.template && !path.isAbsolute(config.authors.template)) {
        config.authors.template = path.resolve(projectDir, config.authors.template);
    }
    
    return config;
}

export async function resolveTheme(themeName) {
    // Built-in themes
    const builtInThemePath = path.join(PACKAGE_ROOT, 'themes', themeName);
    if (fs.existsSync(builtInThemePath)) {
        return loadTheme(builtInThemePath, themeName);
    }
    
    // Local theme in current directory
    const localThemePath = path.join(process.cwd(), 'themes', themeName);
    if (fs.existsSync(localThemePath)) {
        return loadTheme(localThemePath, themeName);
    }
    
    // Fall back to default theme
    const defaultThemePath = path.join(PACKAGE_ROOT, 'themes', 'default');
    if (fs.existsSync(defaultThemePath)) {
        return loadTheme(defaultThemePath, 'default');
    }
    
    // Use legacy assets if no themes found
    return {
        name: 'legacy',
        path: path.join(PACKAGE_ROOT, 'assets'),
        headerTemplate: path.join(PACKAGE_ROOT, 'assets', 'header.html'),
        footerTemplate: path.join(PACKAGE_ROOT, 'assets', 'footer.html'),
        titlePageTemplate: path.join(PACKAGE_ROOT, 'assets', 'title-page.html'),
        mainContentStylesheet: path.join(PACKAGE_ROOT, 'assets', 'main-content.css'),
        titlePageStylesheet: path.join(PACKAGE_ROOT, 'assets', 'title-page.css'),
        pdfOptions: DEFAULT_CONFIG.pdfOptions
    };
}

function loadTheme(themePath, themeName) {
    const themeConfigPath = path.join(themePath, 'theme.json');
    let themeConfig = {};
    
    if (fs.existsSync(themeConfigPath)) {
        try {
            themeConfig = JSON.parse(fs.readFileSync(themeConfigPath, 'utf8'));
        } catch (error) {
            console.warn(`Warning: Invalid theme config in ${themeConfigPath}: ${error.message}`);
        }
    }
    
    return {
        name: themeName,
        path: themePath,
        headerTemplate: path.join(themePath, 'header.html'),
        footerTemplate: path.join(themePath, 'footer.html'),
        titlePageTemplate: path.join(themePath, 'title-page.html'),
        mainContentStylesheet: path.join(themePath, 'main-content.css'),
        titlePageStylesheet: path.join(themePath, 'title-page.css'),
        pdfOptions: { ...DEFAULT_CONFIG.pdfOptions, ...themeConfig.pdfOptions },
        ...themeConfig
    };
}