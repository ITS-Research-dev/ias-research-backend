import { readdirSync, existsSync } from 'fs';
import { join } from 'path';

const EXCLUDED_FOLDERS = ['common', 'config', 'database', 'shared'];

function findModuleClass(folderPath: string, folderName: string): any | null {
  const moduleFileBase = join(folderPath, `${folderName}.module`);
  const exists = ['.ts', '.js'].some((ext) => existsSync(moduleFileBase + ext));
  if (!exists) return null;

  try {
    const imported = require(moduleFileBase);
    return Object.values(imported).find(
      (val: any) => typeof val === 'function' && val.name?.endsWith('Module'),
    ) || null;
  } catch (err) {
    console.error(`❌ Gagal load module dari folder "${folderName}":`, (err as Error).message);
    return null;
  }
}

export function autoLoadModules(baseDir: string): any[] {
  const modules: any[] = [];
  const entries = readdirSync(baseDir, { withFileTypes: true });

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    if (EXCLUDED_FOLDERS.includes(entry.name)) continue;

    const folderPath = join(baseDir, entry.name);

    if (entry.name === 'general') {
      // Masuk satu level lagi ke dalam general/*
      const subEntries = readdirSync(folderPath, { withFileTypes: true });
      for (const sub of subEntries) {
        if (!sub.isDirectory()) continue;
        const subFolderPath = join(folderPath, sub.name);
        const moduleClass = findModuleClass(subFolderPath, sub.name);
        if (moduleClass) modules.push(moduleClass);
        else console.warn(`⚠️  Tidak ditemukan class Module valid di: ${subFolderPath}`);
      }
      continue;
    }

    const moduleClass = findModuleClass(folderPath, entry.name);
    if (moduleClass) modules.push(moduleClass);
    else console.warn(`⚠️  Tidak ditemukan class Module valid di: ${folderPath}`);
  }

  return modules;
}