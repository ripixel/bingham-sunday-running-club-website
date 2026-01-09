/**
 * process-staging.cjs
 *
 * Pre-build script to process staged run results from the race-tracker app.
 * verify:
 * - Reads content/staging/runs/*.json
 * - Matches with content/events (special events)
 * - Queries weather via Open-Meteo
 * - Generates content/results/YYYY-MM-DD.md
 */

const fs = require('fs');
const path = require('path');
// We need to handle potential missing js-yaml if it's not in root node_modules
// But standard-version and skier usually pull it in.
// If this fails, we might need to install it.
let yaml;
try {
  yaml = require('js-yaml');
} catch (e) {
  // If not found, we can try to find where it is or just fail gracefully
  // (assuming user will install it if needed, but it should be there for skier)
  console.log("Attempting to resolve js-yaml...");
  try {
    yaml = require(require.resolve('js-yaml', { paths: [process.cwd()] }));
  } catch (e2) {
    console.error("js-yaml not found. Please run 'npm install js-yaml --save-dev'");
    process.exit(1);
  }
}

const { getWeather } = require('./get-weather.cjs');

const STAGING_DIR = path.join(process.cwd(), 'content/staging/runs');
const RESULTS_DIR = path.join(process.cwd(), 'content/results');
const EVENTS_DIR = path.join(process.cwd(), 'content/events');
const RECURRING_SETTINGS_PATH = path.join(process.cwd(), 'content/settings/recurring-run.json');

// Ensure directories exist
if (!fs.existsSync(STAGING_DIR)) {
  fs.mkdirSync(STAGING_DIR, { recursive: true });
}
if (!fs.existsSync(RESULTS_DIR)) {
  fs.mkdirSync(RESULTS_DIR, { recursive: true });
}

// Helper: load recurring run settings
function loadRecurringSettings() {
  if (fs.existsSync(RECURRING_SETTINGS_PATH)) {
    return JSON.parse(fs.readFileSync(RECURRING_SETTINGS_PATH, 'utf8'));
  }
  // Fallback defaults
  return {
    title: "☕ Sunday Run & Breakfast",
    defaultLocation: "Bingham Market Place",
    description: "Our regular Sunday morning run followed by breakfast at Gilt Cafe",
    loopDistances: { small: 0.8, medium: 1.0, long: 1.2 }
  };
}

// Helper: load all special events content (to match dates)
function loadSpecialEvents() {
  const events = [];
  if (!fs.existsSync(EVENTS_DIR)) return events;

  const files = fs.readdirSync(EVENTS_DIR).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(EVENTS_DIR, file), 'utf8');
    // Simple frontmatter parse
    // We assume frontmatter starts/ends with ---
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      try {
        const data = yaml.load(match[1]);
        if (data.date) {
          events.push({
            ...data,
            dateObj: new Date(data.date),
            fileSlug: file.replace('.md', ''),
            body: raw.replace(match[0], '').trim() // Content body
          });
        }
      } catch (e) {
        console.warn(`Failed to parse event ${file}:`, e.message);
      }
    }
  }
  return events;
}

async function processStaging() {
  console.log("⚙️  Processing staged runs...");

  const stagedFiles = fs.readdirSync(STAGING_DIR).filter(f => f.endsWith('.json'));
  if (stagedFiles.length === 0) {
    console.log("✨ No staged runs found.");
    return;
  }

  const recurringSettings = loadRecurringSettings();
  const specialEvents = loadSpecialEvents();

  let processedCount = 0;

  for (const file of stagedFiles) {
    const dateStr = file.replace('.json', ''); // YYYY-MM-DD
    const resultPath = path.join(RESULTS_DIR, `${dateStr}.md`);
    const stagedPath = path.join(STAGING_DIR, file);

    // Skip if result already exists?
    // User might want to re-process if they delete the result file.
    // But if result file exists (and maybe edited via CMS), we shouldn't overwrite blindly.
    if (fs.existsSync(resultPath)) {
      console.log(`⏭️  Skipping ${dateStr} - result file already exists.`);
      continue;
    }

    try {
      const stagedData = JSON.parse(fs.readFileSync(stagedPath, 'utf8'));
      const resultDate = new Date(stagedData.date);

      // 1. Find matching special event
      const matchingEvent = specialEvents.find(e => {
        return e.dateObj.getFullYear() === resultDate.getFullYear() &&
          e.dateObj.getMonth() === resultDate.getMonth() &&
          e.dateObj.getDate() === resultDate.getDate();
      });

      // 2. Fetch Weather
      console.log(`🌦️  Fetching weather for ${dateStr}...`);
      const weather = await getWeather(resultDate);

      // 3. Calculate Distances & Enrich Participants
      const loops = recurringSettings.loopDistances || { small: 0.8, medium: 1.0, long: 1.2 };

      const participants = (stagedData.participants || []).map(p => {
        let distance = p.distance;
        if (distance === undefined || distance === null) {
          // Calculate from loops
          distance = (p.smallLoops * loops.small) +
            (p.mediumLoops * loops.medium) +
            (p.longLoops * loops.long);
        }

        return {
          runner: p.runner,
          distance: parseFloat(distance.toFixed(1)),
          smallLoops: p.smallLoops || 0,
          mediumLoops: p.mediumLoops || 0,
          longLoops: p.longLoops || 0,
          time: p.time
        };
      });

      // 4. Build Frontmatter
      const frontmatter = {
        date: stagedData.date, // Keep original ISO string
        title: stagedData.title || (matchingEvent ? matchingEvent.title : recurringSettings.title), // Manual override > Event > Default
        eventTitle: matchingEvent ? matchingEvent.title : recurringSettings.title,
        eventDescription: matchingEvent ? matchingEvent.body : recurringSettings.description,

        location: matchingEvent ? (matchingEvent.location || recurringSettings.defaultLocation) : recurringSettings.defaultLocation,
        mainPhoto: stagedData.mainPhoto || '',
        weather: weather || '',
        isSpecialEvent: !!matchingEvent,
        participants: participants
      };

      // 5. Write Result File
      const yamlContent = yaml.dump(frontmatter);

      // Use staged body (Race Report) or empty string
      const bodyContent = stagedData.body ? `\n${stagedData.body}\n` : '';
      const fileContent = `---\n${yamlContent}---\n${bodyContent}`;

      fs.writeFileSync(resultPath, fileContent);
      console.log(`✅ Generated result: ${resultPath}`);
      processedCount++;

    } catch (err) {
      console.error(`❌ Failed to process ${file}:`, err);
    }
  }

  console.log(`🎉 Finished processing. Generated ${processedCount} new results.`);
}

// Run
processStaging().catch(console.error);
