import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import { execSync } from 'child_process';
import path from 'path';
import { tmpdir } from 'os';

describe('CLI Integration Tests', () => {
  let tempDir;
  const cliPath = path.resolve('./bin/cli.js');
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'markdown-to-pdf-cli-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  describe('convert command', () => {
    it('should convert simple markdown to PDF', async () => {
      // Copy test fixture
      const sourceFile = path.resolve('./tests/fixtures/simple.md');
      const targetFile = path.join(tempDir, 'simple.md');
      await fs.copyFile(sourceFile, targetFile);
      
      // Run CLI
      const output = execSync(`node ${cliPath} convert ${targetFile}`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('✅ PDF generated successfully');
      
      // Check PDF was created
      const pdfPath = path.join(tempDir, 'simple.pdf');
      const pdfExists = await fs.access(pdfPath).then(() => true).catch(() => false);
      expect(pdfExists).toBe(true);
      
      // Check PDF has reasonable size (not empty)
      const stats = await fs.stat(pdfPath);
      expect(stats.size).toBeGreaterThan(1000); // At least 1KB
    });

    it('should generate both PDF and HTML when --html flag is used', async () => {
      const sourceFile = path.resolve('./tests/fixtures/simple.md');
      const targetFile = path.join(tempDir, 'simple.md');
      await fs.copyFile(sourceFile, targetFile);
      
      const output = execSync(`node ${cliPath} convert ${targetFile} --html`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('✅ PDF generated successfully');
      expect(output).toContain('📄 HTML also saved');
      
      // Check both files exist
      const pdfExists = await fs.access(path.join(tempDir, 'simple.pdf'))
        .then(() => true).catch(() => false);
      const htmlExists = await fs.access(path.join(tempDir, 'simple.html'))
        .then(() => true).catch(() => false);
      
      expect(pdfExists).toBe(true);
      expect(htmlExists).toBe(true);
    });

    it('should respect custom output path', async () => {
      const sourceFile = path.resolve('./tests/fixtures/simple.md');
      const targetFile = path.join(tempDir, 'simple.md');
      const outputPath = path.join(tempDir, 'custom-output.pdf');
      await fs.copyFile(sourceFile, targetFile);
      
      const output = execSync(`node ${cliPath} convert ${targetFile} -o ${outputPath}`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('custom-output.pdf');
      
      const pdfExists = await fs.access(outputPath).then(() => true).catch(() => false);
      expect(pdfExists).toBe(true);
    });

    it('should handle minimal theme', async () => {
      const sourceFile = path.resolve('./tests/fixtures/simple.md');
      const targetFile = path.join(tempDir, 'simple.md');
      await fs.copyFile(sourceFile, targetFile);
      
      const output = execSync(`node ${cliPath} convert ${targetFile} --theme minimal`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('✅ PDF generated successfully');
    });

    it('should show error for non-existent file', () => {
      const nonExistentFile = path.join(tempDir, 'does-not-exist.md');
      
      expect(() => {
        execSync(`node ${cliPath} convert ${nonExistentFile}`, {
          cwd: tempDir,
          encoding: 'utf8'
        });
      }).toThrow();
    });
  });

  describe('init command', () => {
    it('should initialize new project', async () => {
      const projectName = 'test-project';
      const projectPath = path.join(tempDir, projectName);
      
      const output = execSync(`node ${cliPath} init ${projectName}`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('✅ Project initialized');
      expect(output).toContain('📁 Structure created');
      
      // Check project structure was created
      const configExists = await fs.access(path.join(projectPath, 'markdown-to-pdf.config.json'))
        .then(() => true).catch(() => false);
      const readmeExists = await fs.access(path.join(projectPath, 'README.md'))
        .then(() => true).catch(() => false);
      const docsExists = await fs.access(path.join(projectPath, 'docs'))
        .then(() => true).catch(() => false);
      
      expect(configExists).toBe(true);
      expect(readmeExists).toBe(true);
      expect(docsExists).toBe(true);
    });

    it('should initialize project with custom theme', async () => {
      const projectName = 'themed-project';
      
      const output = execSync(`node ${cliPath} init ${projectName} --theme minimal`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('✅ Project initialized');
      
      // Check config has the right theme
      const configPath = path.join(tempDir, projectName, 'markdown-to-pdf.config.json');
      const configContent = await fs.readFile(configPath, 'utf8');
      const config = JSON.parse(configContent);
      
      expect(config.theme).toBe('minimal');
    });
  });

  describe('themes command', () => {
    it('should list available themes', () => {
      const output = execSync(`node ${cliPath} themes`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('Available themes:');
      expect(output).toContain('default');
      expect(output).toContain('minimal');
    });
  });

  describe('help command', () => {
    it('should display help information', () => {
      const output = execSync(`node ${cliPath} --help`, {
        cwd: tempDir,
        encoding: 'utf8'
      });
      
      expect(output).toContain('markdown-to-pdf');
      expect(output).toContain('convert');
      expect(output).toContain('init');
      expect(output).toContain('themes');
    });
  });
});