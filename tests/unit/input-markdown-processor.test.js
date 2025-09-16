import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';
import { processInputMarkdown } from '../../lib/input-markdown-processor.js';

describe('Input Markdown Processor', () => {
  let tempDir;
  
  beforeEach(async () => {
    tempDir = await fs.mkdtemp(path.join(tmpdir(), 'markdown-to-pdf-test-'));
  });
  
  afterEach(async () => {
    await fs.rm(tempDir, { recursive: true, force: true });
  });

  it('should process basic markdown with frontmatter', async () => {
    const markdownContent = `---
title: Test Document
version: 1.0
authors: John Doe <john@example.com>
---

# Test Document

This is a test document with some content.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata).toMatchObject({
      title: 'Test Document',
      version: 1.0,
      authors: expect.arrayContaining([
        expect.objectContaining({
          name: 'John Doe',
          email: 'john@example.com'
        })
      ])
    });
    
    expect(result.markdown).toContain('# Test Document');
    expect(result.markdown).not.toContain('---'); // Frontmatter should be removed
  });

  it('should handle title with subtitle split by colon', async () => {
    const markdownContent = `---
version: 1.0
---

# Main Title: Subtitle Here

Content goes here.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.title).toBe('Main Title');
    expect(result.pageMetadata.subtitle).toBe('Subtitle Here');
  });

  it('should handle title with subtitle split by dash', async () => {
    const markdownContent = `---
version: 1.0
---

# Main Title - Subtitle Here

Content goes here.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.title).toBe('Main Title');
    expect(result.pageMetadata.subtitle).toBe('Subtitle Here');
  });

  it('should detect title page marker', async () => {
    const markdownContent = `---
title: Test
---

<!-- [[titlepage]] -->

# Test Document

Content here.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.titlePage).toBe(true);
  });

  it('should process TOC tags with default levels', async () => {
    const markdownContent = `---
title: Test
---

# Test Document

<!-- [[toc]] -->

## Section 1
### Subsection 1.1

## Section 2`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.markdown).toContain('[[toc]]');
    expect(result.markdown).not.toContain('<!-- [[toc]] -->');
  });

  it('should process TOC tags with custom levels', async () => {
    const markdownContent = `---
title: Test
---

# Test Document

<!-- [[toc]][2,3,4] -->

## Section 1`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.tableOfContent).toEqual([2, 3, 4]);
    expect(result.markdown).toContain('[[toc]]');
  });

  it('should not process TOC tags inside code blocks', async () => {
    const markdownContent = `---
title: Test
---

# Test Document

\`\`\`markdown
<!-- [[toc]] -->
\`\`\`

Regular content.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    // TOC tag inside code block should remain unchanged
    expect(result.markdown).toContain('<!-- [[toc]] -->');
  });

  it('should handle missing frontmatter gracefully', async () => {
    const markdownContent = `# Test Document

This document has no frontmatter.`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.title).toBe('Test Document');
    expect(result.messages.warnings).toHaveProperty('❌ No frontmatter block found.');
  });

  it('should handle invalid YAML frontmatter', async () => {
    const markdownContent = `---
invalid: yaml: content: here
---

# Test Document`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.messages.warnings).toHaveProperty('❌ Invalid YAML frontmatter.');
  });

  it('should parse multiple authors', async () => {
    const markdownContent = `---
title: Test
authors: John Doe <john@example.com>, Jane Smith <jane@example.com>
---

# Test Document`;

    const filePath = path.join(tempDir, 'test.md');
    await fs.writeFile(filePath, markdownContent);
    
    const result = processInputMarkdown(filePath);
    
    expect(result.pageMetadata.authors).toHaveLength(2);
    expect(result.pageMetadata.authors[0]).toMatchObject({
      name: 'John Doe',
      email: 'john@example.com'
    });
    expect(result.pageMetadata.authors[1]).toMatchObject({
      name: 'Jane Smith',
      email: 'jane@example.com'
    });
  });
});