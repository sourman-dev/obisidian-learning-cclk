/**
 * File Utilities
 */

import { App, TFile, TFolder } from "obsidian";

/**
 * Check if folder exists
 */
export async function folderExists(app: App, path: string): Promise<boolean> {
  const folder = app.vault.getAbstractFileByPath(path);
  return folder instanceof TFolder;
}

/**
 * Ensure folder exists (create if not)
 */
export async function ensureFolder(app: App, path: string): Promise<void> {
  if (!(await folderExists(app, path))) {
    await app.vault.createFolder(path);
  }
}

/**
 * Get all markdown files in folder
 */
export function getMarkdownFiles(app: App, folderPath: string): TFile[] {
  const folder = app.vault.getAbstractFileByPath(folderPath);
  if (!folder || !(folder instanceof TFolder)) return [];

  return folder.children.filter(
    (f): f is TFile => f instanceof TFile && f.extension === "md"
  );
}

/**
 * Safe JSON parse with fallback
 */
export function safeJsonParse<T>(content: string, fallback: T): T {
  try {
    return JSON.parse(content);
  } catch {
    return fallback;
  }
}
