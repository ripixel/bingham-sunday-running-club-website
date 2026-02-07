// @ts-check
// Use createRequire for .cts/.cjs files (ts-node handles .cts via require)
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

// Register ts-node for .cts file support
require('ts-node').register();

import {
  prepareOutputTask,
  bundleCssTask,
  copyStaticTask,
  generatePagesTask,
  generateSitemapTask,
} from 'skier';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM equivalent of __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import TS tasks
const { createFetchSpotifyPlaylistTask } = require('./tasks/fetch-spotify-playlist.cts');
const { createProcessStagingTask } = require('./tasks/process-staging.cts');
const { createLoadContentTask } = require('./tasks/load-content.cts');
const { createHashAdminAssetsTask } = require('./tasks/hash-admin-assets.cts');
const { createHashScriptsTask } = require('./tasks/hash-scripts.cts');
const { createGenerateRunnerPagesTask } = require('./tasks/generate-runner-pages.cts');
const { createGenerateResultPagesTask } = require('./tasks/generate-result-pages.cts');


// Generate a hash for cache busting (using timestamp)
const cacheHash = Date.now().toString(36);

export const tasks = [
  // Pre-build: Fetch Spotify playlist
  createFetchSpotifyPlaylistTask(),

  // Pre-build: Process staged runs (generates new result files)
  createProcessStagingTask(),

  // Load content AFTER staging processing (ensures new results are included)
  createLoadContentTask(cacheHash),

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
        isStats: currentPage === 'stats',
        isRunners: currentPage === 'runners',
        is404: currentPage === '404',
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
            case 'stats':
              return "Club statistics and leaderboards - Bingham Sunday Running Club. See our runners' achievements and club records.";
            case 'runners':
              return "Meet our runners - Bingham Sunday Running Club. The legends who lace up every Sunday.";
            case '404':
              return "Page not found - Bingham Sunday Running Club.";
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
            case 'stats':
              return baseKeywords + ', club statistics, leaderboards, fastest runners, most distance';
            case 'runners':
              return baseKeywords + ', club members, runners, running community';
            default:
              return baseKeywords;
          }
        })(),
        noindex: currentPage === '404' ? '<meta name="robots" content="noindex">' : '',
      };
    },
  }),

  // Generate individual runner profile pages
  createGenerateRunnerPagesTask(cacheHash),

  // Generate individual result detail pages
  createGenerateResultPagesTask(cacheHash),

  // Generate sitemap.xml
  generateSitemapTask({
    scanDir: './public',
    outDir: './public',
    siteUrl: 'https://binghamsundayrunningclub.co.uk',
    excludes: ['admin/**'],
  }),
];
