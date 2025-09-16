import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { PDFDocument } from 'pdf-lib';
import { generatePdf } from '../../lib/index.js';

describe('PDF Generation E2E Tests', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'markdown-to-pdf-e2e-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should generate valid PDF from simple markdown', async () => {
    // Copy fixture to temp directory
    const sourceFile = path.resolve('./tests/fixtures/simple.md');
    const targetFile = path.join(tempDir, 'simple.md');
    await fs.copyFile(sourceFile, targetFile);
    
    const result = await generatePdf(targetFile);
    
    expect(result.outputPath).toContain('simple.pdf');
    
    // Verify PDF is valid by loading it
    const pdfBuffer = await fs.readFile(result.outputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
    expect(pdfDoc.getTitle()).toContain('Simple Test Document');
  });

  it('should generate PDF with title page when requested', async () => {
    const sourceFile = path.resolve('./tests/fixtures/with-title-page.md');
    const targetFile = path.join(tempDir, 'with-title-page.md');
    await fs.copyFile(sourceFile, targetFile);
    
    const result = await generatePdf(targetFile);
    
    // Load and inspect PDF
    const pdfBuffer = await fs.readFile(result.outputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    
    // Should have multiple pages (title page + content)
    expect(pdfDoc.getPageCount()).toBeGreaterThan(1);
    expect(pdfDoc.getTitle()).toContain('Document with Title Page');
  });

  it('should generate HTML when requested', async () => {
    const sourceFile = path.resolve('./tests/fixtures/simple.md');
    const targetFile = path.join(tempDir, 'simple.md');
    await fs.copyFile(sourceFile, targetFile);
    
    const result = await generatePdf(targetFile, { html: true });
    
    expect(result.htmlPath).toBeDefined();
    
    // Verify HTML was created and contains expected content
    const htmlContent = await fs.readFile(result.htmlPath, 'utf8');
    expect(htmlContent).toContain('<h1');
    expect(htmlContent).toContain('Simple Test Document');
    expect(htmlContent).toContain('<code>console.log');
  });

  it('should handle custom themes', async () => {
    const sourceFile = path.resolve('./tests/fixtures/simple.md');
    const targetFile = path.join(tempDir, 'simple.md');
    await fs.copyFile(sourceFile, targetFile);
    
    const result = await generatePdf(targetFile, { theme: 'minimal' });
    
    expect(result.theme).toBe('minimal');
    
    // Verify PDF was still generated
    const pdfExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
    expect(pdfExists).toBe(true);
  });

  it('should respect custom output path', async () => {
    const sourceFile = path.resolve('./tests/fixtures/simple.md');
    const targetFile = path.join(tempDir, 'simple.md');
    const customOutput = path.join(tempDir, 'custom-name.pdf');
    await fs.copyFile(sourceFile, targetFile);
    
    const result = await generatePdf(targetFile, { output: customOutput });
    
    expect(result.outputPath).toBe(customOutput);
    
    const pdfExists = await fs.access(customOutput).then(() => true).catch(() => false);
    expect(pdfExists).toBe(true);
  });

  it('should handle markdown with special characters', async () => {
    const specialContent = `---
title: Test with Special Characters
version: 1.0
authors: Test Author <test@example.com>
---

# Test Document with Special Characters

This document tests special characters and symbols:

- Quotes: "smart quotes" and 'apostrophes'
- Symbols: © ® ™ § ¶ † ‡ • … – —
- Math: ∞ ± × ÷ ≈ ≠ ≤ ≥
- Currency: $ € £ ¥ ₹

## Code with Special Characters

\`\`\`javascript
const message = "Hello, 世界! 🌍";
console.log(\`Price: €1,234.56\`);
\`\`\`

> **Note**: Testing blockquotes with émojis 🎉
`;

    const targetFile = path.join(tempDir, 'special.md');
    await fs.writeFile(targetFile, specialContent);
    
    const result = await generatePdf(targetFile);
    
    // Should generate without errors
    const pdfExists = await fs.access(result.outputPath).then(() => true).catch(() => false);
    expect(pdfExists).toBe(true);
    
    // Verify PDF is valid
    const pdfBuffer = await fs.readFile(result.outputPath);
    const pdfDoc = await PDFDocument.load(pdfBuffer);
    expect(pdfDoc.getPageCount()).toBeGreaterThan(0);
  });

  it('should handle error conditions gracefully', async () => {
    // Test with invalid markdown file
    const invalidFile = path.join(tempDir, 'nonexistent.md');
    
    await expect(generatePdf(invalidFile)).rejects.toThrow();
  });
});