import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import type { TaskDef } from 'skier/dist/types';

// Import compute utilities
const computeResults = require('../utils/compute-results.cts');

interface GenerateResultPagesConfig {
  cacheHash: string;
}

export const createGenerateResultPagesTask = (
  cacheHash: string
): TaskDef<GenerateResultPagesConfig, void> => ({
  name: 'generate-result-pages',
  config: { cacheHash },
  run: async (config, ctx) => {
    const { logger, globals } = ctx;
    const content = globals.content as Record<string, any>;

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
        content.results,
        result.date
      );

      // Count PBs earned in this race
      const pbsEarned = computeResults.countPBsEarned(enrichedParticipants);

      const dateObj = new Date(result.date);

      const pageVars = {
        ...globals,
        result: {
          ...result,
          slug,
          dateObj,
          // Derive OG-optimized image path from mainPhoto
          ogPhoto: result.mainPhoto
            ? result.mainPhoto.replace(/^(.+)\/([^/]+)\.[^.]+$/, '$1/og/$2.jpg')
            : null,
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
        resultStats: {
          ...resultStats,
          pbsEarned
        },
        participants: enrichedParticipants,
        pageTitle: result.title,
        isResultPage: true,
        canonicalPath: `/results/${slug}/`,
        description: result.body || `${result.title} - ${dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} - Bingham Sunday Running Club`,
        cacheHash: config.cacheHash,
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
