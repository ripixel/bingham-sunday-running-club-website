import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import type { TaskDef } from 'skier/dist/types';

export const createGenerateResultPagesTask = (
  content: Record<string, any>,
  globalValues: Record<string, any>,
  cacheHash: string,
  computeResults: any
): TaskDef<{}, void> => ({
  name: 'generate-result-pages',
  config: {},
  run: async (config, { logger }) => {
    // Correct paths relative to tasks/
    const templatePath = path.resolve(__dirname, '../templates/result.html');
    const partialsDir = path.resolve(__dirname, '../partials');
    const outDir = path.resolve(__dirname, '../public/results');

    // Skip if template doesn't exist yet
    if (!fs.existsSync(templatePath)) {
      logger.info('Result template not found, skipping result page generation');
      return;
    }

    // Register partials
    if (fs.existsSync(partialsDir)) {
      fs.readdirSync(partialsDir).forEach(file => {
        if (file.endsWith('.html')) {
          const name = path.basename(file, '.html');
          const partialContent = fs.readFileSync(path.join(partialsDir, file), 'utf8');
          Handlebars.registerPartial(name, partialContent);
        }
      });
    }

    // Load template
    const templateContent = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateContent);

    // Generate a page for each result
    const results = Object.entries(content.results || {});
    for (const [slug, result] of results as [string, any][]) {
      const resultStats = computeResults.computeResultStats(result);
      const enrichedParticipants = computeResults.enrichParticipants(
        result.participants,
        content.runners,
        content.results
      );
      const dateObj = new Date(result.date);

      const pageVars = {
        ...globalValues,
        ...config,
        result: {
          ...result,
          slug,
          dateObj,
          displayDate: dateObj.toLocaleDateString('en-GB', {
            weekday: 'long',
            day: 'numeric',
            month: 'long',
            year: 'numeric'
          }),
          displayTime: dateObj.toLocaleTimeString('en-GB', {
            hour: '2-digit',
            minute: '2-digit'
          }),
        },
        resultStats,
        participants: enrichedParticipants,
        pageTitle: result.title,
        isResultPage: true,
        cacheHash,
        content,
      };

      const html = template(pageVars);
      const outPath = path.join(outDir, slug, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      logger.info(`Generated result page: ${slug}`);
    }
  }
});
