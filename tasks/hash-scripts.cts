import * as fs from 'fs';
import * as path from 'path';
import type { TaskDef } from 'skier/dist/types';

export const createHashScriptsTask = (cacheHash: string): TaskDef<{}, void> => ({
  name: 'hash-scripts',
  config: {},
  run: async (_, { logger }) => {
    const scriptsDir = path.resolve(__dirname, '../public/scripts');
    if (fs.existsSync(scriptsDir)) {
      const files = fs.readdirSync(scriptsDir);
      files.forEach(file => {
        if (file.endsWith('.js')) {
          const oldPath = path.join(scriptsDir, file);
          const newName = file.replace('.js', `.${cacheHash}.js`);
          const newPath = path.join(scriptsDir, newName);
          fs.renameSync(oldPath, newPath);
          logger.info(`Renamed ${file} to ${newName}`);
        }
      });
    }
  }
});
