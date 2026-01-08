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
          // Simple frontmatter parser
          const match = fileContent.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
          if (match) {
            const frontmatter = match[1];
            const body = match[2];
            const data = {};

            // Basic YAML-like parsing for top-level keys
            frontmatter.split('\n').forEach(line => {
              const colonIndex = line.indexOf(':');
              if (colonIndex > 0) {
                const key = line.slice(0, colonIndex).trim();
                let value = line.slice(colonIndex + 1).trim();
                // Remove quotes if present
                if (value.startsWith('"') && value.endsWith('"')) value = value.slice(1, -1);
                data[key] = value;
              }
            });

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
  merch: loadContentDir('merch'), // If we add separate files for merch later
};

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
    run: async () => {
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
        console.log(`Processed admin/cms-previews.js -> ${hashedJsName}`);

        // 4. Update index.html to point to new JS
        if (fs.existsSync(adminHtmlPath)) {
          let htmlContent = fs.readFileSync(adminHtmlPath, 'utf8');
          htmlContent = htmlContent.replace('/admin/cms-previews.js', `/admin/${hashedJsName}`);
          fs.writeFileSync(adminHtmlPath, htmlContent);
          console.log('Updated admin/index.html reference');
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
    run: async () => {
      const scriptsDir = path.join(__dirname, 'public/scripts');
      if (fs.existsSync(scriptsDir)) {
        const files = fs.readdirSync(scriptsDir);
        files.forEach(file => {
          if (file.endsWith('.js')) {
            const oldPath = path.join(scriptsDir, file);
            const newName = file.replace('.js', `.${cacheHash}.js`);
            const newPath = path.join(scriptsDir, newName);
            fs.renameSync(oldPath, newPath);
            console.log(`Renamed ${file} to ${newName}`);
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
        isEvents: currentPage === 'events',
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
