// @ts-check
const {
  prepareOutputTask,
  bundleCssTask,
  copyStaticTask,
  setGlobalsTask,
  generatePagesTask,
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
      if (path.extname(file) === '.json') {
        const name = path.basename(file, '.json');
        try {
          const data = JSON.parse(fs.readFileSync(path.join(dirPath, file), 'utf8'));
          content[name] = data;
        } catch (e) {
          console.warn(`Error loading content ${dirName}/${file}:`, e);
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
  merch: loadContentDir('merch'), // If we add separate files for merch later
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
    output: 'styles.min.css',
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

  // Make content globally available
  setGlobalsTask({
    values: {
      siteName: 'Bingham Sunday Running Club',
      siteUrl: 'https://binghamsundayrunningclub.co.uk/',
      year: new Date().getFullYear(),
      noindex: process.env.NODE_ENV === 'production' ? '' : '<meta name="robots" content="noindex">',

      // Inject all content into global scope
      content: content,
      // Shortcuts for settings
      settings: content.settings || {},
    },
  }),

  // Generate HTML pages
  generatePagesTask({
    pagesDir: './pages',
    partialsDir: './partials',
    outDir: './public',
    additionalVarsFn: ({ currentPage, ...vars }) => {
      const pageName = currentPage === 'index' ? 'home' : currentPage;

      return {
        pageTitle: pageName.charAt(0).toUpperCase() + pageName.slice(1),
        isHome: currentPage === 'index',
        isAbout: currentPage === 'about',
        isContact: currentPage === 'contact',
        description: (() => {
          switch (currentPage) {
            case 'index':
              return "Bingham Sunday Running Club - No pace, no pressure, just good vibes.";
            case 'about':
              return "Learn about our friendly running club. All paces welcome.";
            case 'contact':
              return "Get in touch with Bingham Sunday Running Club.";
            default:
              return vars.description || '';
          }
        })(),
      };
    },
  }),

  // Generate sitemap.xml
  generateSitemapTask({
    outDir: './public',
    scanDir: './public',
    siteUrl: 'https://binghamsundayrunningclub.co.uk',
  }),
];
