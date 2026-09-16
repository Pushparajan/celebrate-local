import { mkdir, writeFile, readFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import path from 'node:path';

export async function ensureDir(dir) {
  if (!existsSync(dir)) await mkdir(dir, { recursive: true });
}

export async function writeJSON(filePath, data) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export async function readJSON(filePath) {
  return JSON.parse(await readFile(filePath, 'utf-8'));
}

export async function writeText(filePath, text) {
  await ensureDir(path.dirname(filePath));
  await writeFile(filePath, text, 'utf-8');
}

/** Turns a URL path into a filesystem-safe slug used for output filenames. */
export function slugify(urlPath) {
  const clean = urlPath.replace(/\/$/, '') || '/index';
  return clean.replace(/^\//, '').replace(/[^a-z0-9/_-]+/gi, '-').replace(/\//g, '__') || 'index';
}
