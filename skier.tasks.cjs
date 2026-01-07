// @ts-check
const {
  prepareOutputTask,
  bundleCssTask,
  copyStaticTask,
  setGlobalsTask,
  generatePagesTask,
  generateSitemapTask,
} = require('skier');

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

  // Copy static assets (images, fonts, etc.)
  copyStaticTask({
    from: './assets/images',
    to: './public/images',
  }),

  // Copy admin folder for Decap CMS
  copyStaticTask({
    from: './admin',
    to: './public/admin',
  }),

  // Copy content folder for CMS data
  copyStaticTask({
    from: './content',
    to: './public/content',
  }),

  // Copy root assets (favicon, config, etc)
  copyStaticTask({
    from: './assets/root',
    to: './public',
  }),

  // Set global variables
  setGlobalsTask({
    values: {
      siteName: 'Bingham Sunday Running Club',
      siteUrl: 'https://binghamsundayrunningclub.co.uk/',
      year: new Date().getFullYear(),
      noindex:
        process.env.NODE_ENV === 'production'
          ? ''
          : '<meta name="robots" content="noindex">',
    },
  }),

  // Generate HTML pages
  generatePagesTask({
    pagesDir: './pages',
    partialsDir: './partials',
    outDir: './public',
    additionalVarsFn: ({ currentPage, ...vars }) => ({
      page: currentPage === 'index' ? 'home' : currentPage,
      isHome: currentPage === 'index',
      isAbout: currentPage === 'about',
      isContact: currentPage === 'contact',
      description: (() => {
        switch (currentPage) {
          case 'index':
            return "Bingham Sunday Running Club - No pace, no pressure, just good vibes. We meet every Sunday, rain or shine, and always end with breakfast!";
          case 'about':
            return "Learn about our friendly running club. All paces welcome, from walkers to speedsters!";
          case 'contact':
            return "Get in touch with Bingham Sunday Running Club.";
          default:
            return vars.description || '';
        }
      })(),
    }),
  }),

  // Generate sitemap.xml
  generateSitemapTask({
    outDir: './public',
    scanDir: './public',
    siteUrl: 'https://binghamsundayrunningclub.co.uk',
  }),
];
