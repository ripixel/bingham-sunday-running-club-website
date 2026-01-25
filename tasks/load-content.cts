/**
 * load-content.cts
 *
 * Task to load all content and compute global values AFTER process-staging
 * has run, ensuring newly generated results are included.
 *
 * Returns values that get merged into Skier globals for downstream tasks.
 */
import type { TaskDef, SkierGlobals } from 'skier/dist/types';

// Import content loader and compute utilities using require (for .cts files)
const { loadContentDir } = require('../utils/content-loader.cts');
const { computeClubRecords } = require('../utils/club-records.cts');
const computeResults = require('../utils/compute-results.cts');
const { computeClubStats, computeRunnersWithStats } = require('../utils/compute-stats.cts');
const computeRuns = require('../utils/compute-runs.cts');

// Helper function for consistent color assignment based on runner name
function getColorForRunner(name: string): string {
  const colorClasses = ['orange', 'pink', 'green', 'blue'];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return colorClasses[Math.abs(hash) % colorClasses.length];
}

interface LoadContentConfig {
  cacheHash: string;
}

export const createLoadContentTask = (cacheHash: string): TaskDef<LoadContentConfig, SkierGlobals> => ({
  name: 'load-content',
  title: 'Load content and compute global values',
  config: { cacheHash },
  run: async (config, { logger }) => {
    logger.info('Loading content after staging processing...');

    // Load all content fresh (after process-staging has potentially created new files)
    const content = {
      pages: loadContentDir('pages'),
      settings: loadContentDir('settings'),
      events: loadContentDir('events'),
      merch: loadContentDir('merch'),
      runners: loadContentDir('runners'),
      results: loadContentDir('results'),
    };

    logger.info(`Loaded ${Object.keys(content.results || {}).length} results`);

    // Pre-compute Legends and Records
    const legends = computeResults.computeLegends(content.results, content.runners);
    const records = content.pages.home?.pbs?.records || [];
    const clubRecordsMap = computeClubRecords(records, content.runners, legends);

    // Build global values - these will be merged into Skier globals
    const globalValues: SkierGlobals = {
      siteName: 'Bingham Sunday Running Club',
      siteUrl: 'https://binghamsundayrunningclub.co.uk/',
      year: new Date().getFullYear(),
      cacheHash: config.cacheHash,

      // Inject all content into global scope
      content: content,
      // Shortcuts for settings
      settings: content.settings || {},

      // Dynamic Run Data
      ...computeRuns.computeRuns(content),

      // Results Data
      latestResult: computeResults.getLatestResult(content.results, content.runners),
      allResultsSummary: computeResults.getAllResultsSummary(content.results, content.runners),
      allRunners: content.runners,

      // BSRC Legends for Wall of Fame
      legends: legends,

      // Club Records (enriched)
      clubRecordsMap: clubRecordsMap,

      // Enriched PB records for homepage (with photos and initials)
      enrichedPbRecords: (content.pages.home?.pbs?.records || []).map((r: any) => {
        const runner = content.runners[r.runner];
        const name = r.name || runner?.name || 'Unknown';
        return {
          ...r,
          photo: runner?.photo || null,
          name: name,
          firstInitial: name[0]?.toUpperCase() || '?',
          colorClass: runner?.colorClass || getColorForRunner(name)
        };
      }),

      // Club Stats for stats page
      clubStats: computeClubStats(content.results, content.runners),

      // Runners with stats for directory page
      runnersWithStats: computeRunnersWithStats(content.results, content.runners, clubRecordsMap),
    };

    logger.info('Content loaded and globals computed successfully');

    // Return values to be merged into globals
    return globalValues;
  }
});
