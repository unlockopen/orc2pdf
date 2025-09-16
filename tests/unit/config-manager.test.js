import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { loadConfig, resolveTheme } from '../../lib/config-manager.js';

describe('Config Manager', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'markdown-to-pdf-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('loadConfig', () => {
    it('should return default config when no config file exists', async () => {
      const config = await loadConfig(tempDir);
      
      expect(config).toMatchObject({
        theme: 'default',
        titlePage: true,
        authors: {
          directory: path.resolve(tempDir, 'data/authors'),
          template: expect.stringContaining('assets/templates/author.yaml')
        },
        pdfOptions: {
          displayHeaderFooter: true,
          printBackground: true,
          preferCSSPageSize: true,
          scale: 1.0
        }
      });
    });

    it('should load JSON config file', async () => {
      const configPath = path.join(tempDir, 'markdown-to-pdf.config.json');
      const testConfig = {
        theme: 'minimal',
        titlePage: false,
        authors: {
          directory: 'custom/authors'
        }
      };
      
      await fs.writeFile(configPath, JSON.stringify(testConfig));
      const config = await loadConfig(tempDir);
      
      expect(config.theme).toBe('minimal');
      expect(config.titlePage).toBe(false);
      expect(config.authors.directory).toBe(path.resolve(tempDir, 'custom/authors'));
    });

    it('should load config from package.json', async () => {
      const packagePath = path.join(tempDir, 'package.json');
      const packageJson = {
        name: 'test-project',
        'markdown-to-pdf': {
          theme: 'academic',
          titlePage: true
        }
      };
      
      await fs.writeFile(packagePath, JSON.stringify(packageJson));
      const config = await loadConfig(tempDir);
      
      expect(config.theme).toBe('academic');
      expect(config.titlePage).toBe(true);
    });

    it('should prioritize explicit config file over package.json', async () => {
      const configPath = path.join(tempDir, 'markdown-to-pdf.config.json');
      const packagePath = path.join(tempDir, 'package.json');
      
      await fs.writeFile(configPath, JSON.stringify({ theme: 'minimal' }));
      await fs.writeFile(packagePath, JSON.stringify({ 
        'markdown-to-pdf': { theme: 'academic' } 
      }));
      
      const config = await loadConfig(tempDir);
      expect(config.theme).toBe('minimal');
    });

    it('should handle invalid JSON gracefully', async () => {
      const configPath = path.join(tempDir, 'markdown-to-pdf.config.json');
      await fs.writeFile(configPath, '{ invalid json }');
      
      const config = await loadConfig(tempDir);
      expect(config.theme).toBe('default'); // Should fall back to default
    });
  });

  describe('resolveTheme', () => {
    it('should return default theme when nonexistent theme requested', async () => {
      const theme = await resolveTheme('nonexistent');
      
      // Should fall back to default theme since it exists
      expect(theme.name).toBe('default');
      expect(theme.headerTemplate).toContain('header.html');
      expect(theme.footerTemplate).toContain('footer.html');
      expect(theme.mainContentStylesheet).toContain('main-content.css');
      expect(theme.pdfOptions).toBeDefined();
    });

    it('should load built-in theme if it exists', async () => {
      // Test with default theme that should exist
      const theme = await resolveTheme('default');
      
      expect(theme.name).toBe('default');
      expect(theme.path).toContain('themes/default');
    });
  });
});