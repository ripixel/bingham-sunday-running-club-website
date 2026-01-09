import * as fs from 'fs';
import * as path from 'path';
import type { TaskContext, TaskDef } from 'skier/dist/types';

export const createGenerateSitemapTask = (siteUrl: string): TaskDef<{}, void> => ({
  name: 'generate-sitemap',
  config: {},
  run: async (_, { logger }) => {
    // Correct path relative to tasks/
    const publicDir = path.resolve(__dirname, '../public');

    // Find all HTML files
    const findHtmlFiles = (dir: string, files: string[] = []) => {
      if (!fs.existsSync(dir)) return files;

      const items = fs.readdirSync(dir);
      for (const item of items) {
        const fullPath = path.join(dir, item);
        const stat = fs.statSync(fullPath);
        if (stat.isDirectory()) {
          findHtmlFiles(fullPath, files);
        } else if (item.endsWith('.html')) {
          files.push(fullPath);
        }
      }
      return files;
    };

    const htmlFiles = findHtmlFiles(publicDir);

    // Filter out admin pages and generate sitemap entries
    const sitemapEntries = htmlFiles
      .map(file => file.replace(publicDir, '').replace(/\\/g, '/'))
      .filter(urlPath => !urlPath.includes('/admin/'))
      .map(urlPath => `<url><loc>${siteUrl}${urlPath}</loc></url>`)
      .join('\n    ');

    const xml = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n    ${sitemapEntries}\n</urlset>\n`;

    const outPath = path.join(publicDir, 'sitemap.xml');
    fs.writeFileSync(outPath, xml);
    logger.info(`Generated sitemap.xml (excluding admin pages)`);
  }
});
