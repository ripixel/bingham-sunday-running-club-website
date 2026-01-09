import * as fs from 'fs';
import * as path from 'path';
import type { TaskDef } from 'skier/dist/types';

export const createHashAdminAssetsTask = (cacheHash: string): TaskDef<{}, void> => ({
  name: 'hash-admin-assets',
  config: {},
  run: async (_, { logger }) => {
    // Assuming file structure: tasks/hash-admin-assets.ts -> root/tasks
    const adminDir = path.resolve(__dirname, '../public/admin');
    const previewsJsPath = path.join(adminDir, 'cms-previews.js');
    const adminHtmlPath = path.join(adminDir, 'index.html');

    if (fs.existsSync(previewsJsPath)) {
      // 1. Update generated CSS link in cms-previews.js
      let jsContent = fs.readFileSync(previewsJsPath, 'utf8');
      jsContent = jsContent.replace('/styles.min.css', `/styles.min.${cacheHash}.css`);

      // 2. Write to new hashed filename
      const hashedJsName = `cms-previews.${cacheHash}.js`;
      fs.writeFileSync(path.join(adminDir, hashedJsName), jsContent);

      // 3. Delete original (optional, but cleaner)
      fs.unlinkSync(previewsJsPath);
      logger.info(`Processed admin/cms-previews.js -> ${hashedJsName}`);

      // 4. Update index.html to point to new JS
      if (fs.existsSync(adminHtmlPath)) {
        let htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
        htmlContent = htmlContent.replace('/admin/cms-previews.js', `/admin/${hashedJsName}`);
        fs.writeFileSync(adminHtmlPath, htmlContent);
        logger.info('Updated admin/index.html reference');
      }
    }
  }
});
