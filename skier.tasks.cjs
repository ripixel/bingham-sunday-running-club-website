// @ts-check
const {
  prepareOutputTask,
  bundleCssTask,
  copyStaticTask,
  setGlobalsTask,
  generatePagesTask,
  generateItemsTask,
  generateSitemapTask,
} = require('skier');
const fs = require('fs');
const path = require('path');

// Helper to load all JSON files from a directory
function loadContentDir(dirName) {
  const content = {};
  const dirPath = path.resolve(__dirname, 'content', dirName);

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
            const yaml = require('js-yaml');
            const data = yaml.load(frontmatter) || {};
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
  {
    run: async (_, { logger }) => {
      const adminDir = path.join(__dirname, 'public/admin');
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
  },

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
  {
    run: async (_, { logger }) => {
      const scriptsDir = path.join(__dirname, 'public/scripts');
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
  },

  // Make content globally available
  setGlobalsTask({
    values: {
      siteName: 'Bingham Sunday Running Club',
      siteUrl: 'https://binghamsundayrunningclub.co.uk/',
      year: new Date().getFullYear(),
      noindex: process.env.NODE_ENV === 'production' ? '' : '<meta name="robots" content="noindex">',
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
      legends: computeResults.computeLegends(content.results, content.runners),
    },
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
  {
    run: async (vars, { logger }) => {
      const Handlebars = require('handlebars');
      const runnersDir = path.join(__dirname, 'content/runners');
      const templatePath = path.join(__dirname, 'templates/runner.html');
      const partialsDir = path.join(__dirname, 'partials');
      const outDir = path.join(__dirname, 'public/runners');

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
      for (const [slug, runner] of runners) {
        if (slug === 'guest') continue; // Skip guest profile

        const runnerStats = computeResults.computeRunnerStats(slug, content.results);

        const pageVars = {
          ...vars,
          runner,
          runnerStats,
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
  },

  // Generate individual result detail pages
  {
    run: async (vars, { logger }) => {
      const Handlebars = require('handlebars');
      const resultsDir = path.join(__dirname, 'content/results');
      const templatePath = path.join(__dirname, 'templates/result.html');
      const partialsDir = path.join(__dirname, 'partials');
      const outDir = path.join(__dirname, 'public/results');

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
      for (const [slug, result] of results) {
        const resultStats = computeResults.computeResultStats(result);
        const enrichedParticipants = computeResults.enrichParticipants(
          result.participants,
          content.runners,
          content.results
        );
        const dateObj = new Date(result.date);

        const pageVars = {
          ...vars,
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
  },

  // Generate sitemap.xml (excluding admin pages)
  {
    run: async (_, { logger }) => {
      const siteUrl = 'https://binghamsundayrunningclub.co.uk';
      const publicDir = path.join(__dirname, 'public');

      // Find all HTML files
      const findHtmlFiles = (dir, files = []) => {
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
  },
];
