import fs from 'node:fs/promises';
import path from 'node:path';

export async function ensureDir(dir: string): Promise<void> {
  await fs.mkdir(dir, { recursive: true });
}

export async function pathExists(filePath: string): Promise<boolean> {
  try {
    await fs.access(filePath);
    return true;
  } catch {
    return false;
  }
}

export async function readJson<T>(filePath: string): Promise<T | null> {
  try {
    const raw = await fs.readFile(filePath, 'utf-8');
    if (!raw.trim()) return null;
    return JSON.parse(raw) as T;
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'ENOENT'
    ) {
      return null;
    }
    throw err;
  }
}

export async function writeJsonAtomic(
  filePath: string,
  data: unknown
): Promise<void> {
  const dir = path.dirname(filePath);
  await ensureDir(dir);
  const tmpPath = `${filePath}.${process.pid}.${Date.now()}.tmp`;
  const json = JSON.stringify(data, null, 2);
  await fs.writeFile(tmpPath, json, 'utf-8');
  await fs.rename(tmpPath, filePath);
}

export async function deleteFile(filePath: string): Promise<void> {
  try {
    await fs.unlink(filePath);
  } catch (err: unknown) {
    if (
      typeof err === 'object' &&
      err !== null &&
      'code' in err &&
      (err as { code: string }).code === 'ENOENT'
    ) {
      return;
    }
    throw err;
  }
}
