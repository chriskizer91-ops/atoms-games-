// Loads the game's data files in Node (they are plain browser scripts that fill window.CC).
import fs from 'node:fs';
import vm from 'node:vm';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const here = path.dirname(fileURLToPath(import.meta.url));
export const SRC = path.join(here, '..', 'src');

export function loadData() {
  const ctx = { window: {} };
  vm.createContext(ctx);
  for (const f of ['10-data-types.js', '11-data-moves.js', '12-data-creatures.js', '13-data-lore.js', '13b-family-creatures.js']) {
    vm.runInContext(fs.readFileSync(path.join(SRC, 'js', f), 'utf8'), ctx, { filename: f });
  }
  return ctx.window.CC;
}
