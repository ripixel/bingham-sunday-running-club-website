import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Helper to load all JSON files from a directory
export function loadContentDir(dirName: string): Record<string, any> {
  const content: Record<string, any> = {};
  // Assuming content is in root/content, and this file is in root/utils
  const dirPath = path.resolve(__dirname, '..', 'content', dirName);

  if (fs.existsSync(dirPath)) {
    const files = fs.readdirSync(dirPath);
    files.forEach(file => {
      const ext = path.extname(file);
      const name = path.basename(file, ext);

      if (ext === '.json') {
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
          content[name] = data;
        } catch (e) {
          console.warn(`Error loading content ${dirName}/${file}:`, e);
        }
      } else if (ext === '.md') {
        try {
          const fileContent = fs.readFileSync(path.join(dirPath, file), 'utf8');
          // Parse frontmatter using js-yaml
          const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          if (match) {
            const frontmatter = match[1];
            const body = match[2];
            const data: any = yaml.load(frontmatter) || {};
            data.body = body.trim();
            content[name] = data;
          }
        } catch (e) {
          console.warn(`Error loading markdown content ${dirName}/${file}:`, e);
        }
      }
    });
  }
  return content;
}
