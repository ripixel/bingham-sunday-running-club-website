import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import type { TaskDef } from 'skier/dist/types';

export const createGenerateRunnerPagesTask = (
  content: Record<string, any>,
  globalValues: Record<string, any>,
  cacheHash: string,
  computeResults: any
): TaskDef<{}, void> => ({
  name: 'generate-runner-pages',
  config: {},
  run: async (config, { logger }) => {
    // Correct paths relative to tasks/
    const runnersDir = path.resolve(__dirname, '../content/runners');
    const templatePath = path.resolve(__dirname, '../templates/runner.html');
    const partialsDir = path.resolve(__dirname, '../partials');
    const outDir = path.resolve(__dirname, '../public/runners');

    // Skip if template doesn't exist yet
    if (!fs.existsSync(templatePath)) {
      logger.info('Runner template not found, skipping runner page generation');
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

    // Generate a page for each runner (except guest)
    const runners = Object.entries(content.runners || {});
    for (const [slug, runner] of runners as [string, any][]) {
      if (slug === 'guest') continue; // Skip guest profile

      const runnerStats = computeResults.computeRunnerStats(slug, content.results, runner);
      const clubRecords = globalValues.clubRecordsMap ? globalValues.clubRecordsMap[slug] : [];

      const pageVars = {
        ...globalValues,
        ...config,
        runner,
        runnerStats,
        clubRecords,
        pageTitle: runner.name,
        isRunnerPage: true,
        cacheHash,
        content,
      };

      const html = template(pageVars);
      const outPath = path.join(outDir, slug, 'index.html');
      fs.mkdirSync(path.dirname(outPath), { recursive: true });
      fs.writeFileSync(outPath, html);
      logger.info(`Generated runner page: ${slug}`);
    }
  }
});
