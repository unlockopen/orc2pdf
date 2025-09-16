import { promises as fs } from 'fs';
import path from 'path';
import { tmpdir } from 'os';

/**
 * Create a temporary test directory
 */
export async function createTempDir(prefix = 'markdown-to-pdf-test-') {
  return await fs.mkdtemp(path.join(tmpdir(), prefix));
}

/**
 * Clean up temporary directory
 */
export async function cleanupTempDir(dir) {
  await fs.rm(dir, { recursive: true, force: true });
}

/**
 * Copy test fixture to target location
 */
export async function copyFixture(fixtureName, targetPath) {
  const fixturePath = path.resolve(`./tests/fixtures/${fixtureName}`);
  await fs.copyFile(fixturePath, targetPath);
}

/**
 * Create a temporary markdown file with content
 */
export async function createTempMarkdown(dir, filename, content) {
  const filePath = path.join(dir, filename);
  await fs.writeFile(filePath, content);
  return filePath;
}

/**
 * Check if a file exists
 */
export async function fileExists(filePath) {
  return await fs.access(filePath).then(() => true).catch(() => false);
}

/**
 * Read and parse JSON file
 */
export async function readJsonFile(filePath) {
  const content = await fs.readFile(filePath, 'utf8');
  return JSON.parse(content);
}

/**
 * Wait for a specified number of milliseconds
 */
export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}