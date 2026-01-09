// @ts-check
require('ts-node').register();

const {
  prepareOutputTask,
  bundleCssTask,
  copyStaticTask,
  setGlobalsTask,
  generatePagesTask,
} = require('skier');
const path = require('path');

// Import TS helpers
const { loadContentDir } = require('./utils/content-loader.cts');
const { computeClubRecords } = require('./utils/club-records.cts');

// Import TS tasks
const { createHashAdminAssetsTask } = require('./tasks/hash-admin-assets.cts');
const { createHashScriptsTask } = require('./tasks/hash-scripts.cts');
const { createGenerateRunnerPagesTask } = require('./tasks/generate-runner-pages.cts');
const { createGenerateResultPagesTask } = require('./tasks/generate-result-pages.cts');
const { createGenerateSitemapTask } = require('./tasks/generate-sitemap.cts');

// Load content upfront
const content = {
  pages: loadContentDir('pages'),
  settings: loadContentDir('settings'),
  events: loadContentDir('events'),
  merch: loadContentDir('merch'),
  runners: loadContentDir('runners'),
  results: loadContentDir('results'),
};

// Import results computation utilities
const computeResults = require('./utils/compute-results.cjs');

// Generate a hash for cache busting (using timestamp)
const cacheHash = Date.now().toString(36);

// Pre-compute Legends and Records
const legends = computeResults.computeLegends(content.results, content.runners);
const records = content.pages.home?.pbs?.records || [];
const clubRecordsMap = computeClubRecords(records, content.runners, legends);

// Define global values to share across tasks
const globalValues = {
  siteName: 'Bingham Sunday Running Club',
  siteUrl: 'https://binghamsundayrunningclub.co.uk/',
  year: new Date().getFullYear(),
  cacheHash: cacheHash,

  // Inject all content into global scope
  content: content,
  // Shortcuts for settings
  settings: content.settings || {},

  // Dynamic Run Data
  ...require('./utils/compute-runs.cjs').computeRuns(content),

  // Results Data
  latestResult: computeResults.getLatestResult(content.results, content.runners),
  allResultsSummary: computeResults.getAllResultsSummary(content.results, content.runners),
  allRunners: content.runners,

  // BSRC Legends for Wall of Fame
  legends: legends,

  // Club Records (enriched)
  clubRecordsMap: clubRecordsMap,
};

exports.tasks = [
  // Clean & Create output directory
  prepareOutputTask({
    outDir: './public',
  }),

  // Bundle and minify CSS
  bundleCssTask({
    from: './assets/styles',
    to: './public',
    output: `styles.min.${cacheHash}.css`,
    minify: true,
  }),

  // Copy static assets
  copyStaticTask({
    from: './assets/images',
    to: './public/images',
  }),

  // Copy admin folder
  copyStaticTask({
    from: './admin',
    to: './public/admin',
  }),

  // Hash admin assets
  createHashAdminAssetsTask(cacheHash),

  // Copy content folder
  copyStaticTask({
    from: './content',
    to: './public/content',
  }),

  // Copy root assets
  copyStaticTask({
    from: './assets/root',
    to: './public',
  }),

  // Copy scripts
  copyStaticTask({
    from: './assets/scripts',
    to: './public/scripts',
  }),

  // Hash scripts
  createHashScriptsTask(cacheHash),

  // Make content globally available
  setGlobalsTask({
    values: globalValues,
  }),

  // Generate HTML pages
  generatePagesTask({
    pagesDir: './pages',
    partialsDir: './partials',
    outDir: './public',
    additionalVarsFn: ({ currentPage, ...vars }) => {
      const pageName = currentPage === 'index' ? 'home' : currentPage;

      // Generate canonical path
      const canonicalPath = currentPage === 'index' ? '/' : `/${currentPage}`;

      return {
        pageTitle: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        isHome: currentPage === 'index',
        isEvents: currentPage === 'events',
        isAbout: currentPage === 'about',
        isContact: currentPage === 'contact',
        isResults: currentPage === 'results',
        canonicalPath: canonicalPath,
        description: (() => {
          switch (currentPage) {
            case 'index':
              return "Bingham Sunday Running Club - A free, friendly running group in Bingham, Nottinghamshire. All paces welcome. No membership, just good vibes every Sunday morning.";
            case 'about':
              return "About Bingham Sunday Running Club - A welcoming community running group in Nottinghamshire. All abilities welcome, from complete beginners to experienced runners.";
            case 'contact':
              return "Contact Bingham Sunday Running Club - Join our friendly running community in Bingham, Nottinghamshire. Find us on Strava and Instagram.";
            case 'events':
              return "Upcoming runs and events - Bingham Sunday Running Club. Weekly Sunday morning runs and special events in Nottinghamshire.";
            case 'results':
              return "Race results and club records - Bingham Sunday Running Club. Celebrating our runners' achievements.";
            default:
              return vars.description || 'Bingham Sunday Running Club - Free, friendly running in Nottinghamshire.';
          }
        })(),
        keywords: (() => {
          const baseKeywords = 'running club, Bingham, Nottinghamshire, Sunday running, free running club, community running, beginner friendly, all paces welcome';
          switch (currentPage) {
            case 'index':
              return baseKeywords + ', social running, jogging group, run together';
            case 'about':
              return baseKeywords + ', about us, running routes, club values, inclusive running';
            case 'contact':
              return baseKeywords + ', join running club, find us, Strava club, running community';
            case 'events':
              return baseKeywords + ', running events, parkrun, race calendar, Sunday runs, group runs';
            case 'results':
              return baseKeywords + ', race results, personal bests, club records, race times';
            default:
              return baseKeywords;
          }
        })(),
      };
    },
  }),

  // Generate individual runner profile pages
  createGenerateRunnerPagesTask(content, globalValues, cacheHash, computeResults),

  // Generate individual result detail pages
  createGenerateResultPagesTask(content, globalValues, cacheHash, computeResults),

  // Generate sitemap.xml (excluding admin pages)
  createGenerateSitemapTask('https://binghamsundayrunningclub.co.uk'),
];
