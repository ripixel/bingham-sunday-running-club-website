import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';
import type { TaskDef } from 'skier/dist/types';

// Types
interface Participant {
  runner: string;
  distance?: number;
  smallLoops?: number;
  mediumLoops?: number;
  longLoops?: number;
  time: string;
}

interface StagedRun {
  date: string;
  title?: string;
  mainPhoto?: string;
  body?: string;
  participants: Participant[];
}

interface RecurringSettings {
  title: string;
  description: string;
  defaultLocation: string;
  loopDistances: {
    approach?: number;
    small: number;
    medium: number;
    long: number;
  };
}

interface SpecialEvent {
  title: string;
  date: string;
  dateObj: Date;
  location?: string;
  body: string;
  fileSlug: string;
}

// Weather emoji map
const weatherEmojis: Record<number, string> = {
  0: '☀️ Clear',
  1: '🌤️ Mainly Clear',
  2: '⛅ Partly Cloudy',
  3: '☁️ Overcast',
  45: '🌫️ Foggy',
  48: '🌫️ Rime Fog',
  51: '🌧️ Light Drizzle',
  53: '🌧️ Drizzle',
  55: '🌧️ Heavy Drizzle',
  56: '🌧️ Freezing Drizzle',
  61: '🌧️ Light Rain',
  63: '🌧️ Rain',
  65: '🌧️ Heavy Rain',
  66: '🌧️ Freezing Rain',
  71: '🌨️ Light Snow',
  73: '🌨️ Snow',
  75: '🌨️ Heavy Snow',
  80: '🌧️ Showers',
  81: '🌧️ Heavy Showers',
  85: '🌨️ Snow Showers',
  95: '⛈️ Thunderstorm',
};

async function getWeather(date: Date): Promise<string | null> {
  const lat = 52.95;
  const lon = -0.95;
  const dateStr = date.toISOString().split('T')[0];

  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&daily=weathercode,temperature_2m_max,temperature_2m_min&start_date=${dateStr}&end_date=${dateStr}&timezone=Europe%2FLondon`;

  try {
    const response = await fetch(url);
    if (!response.ok) return null;

    const data = await response.json();
    const code = data.daily?.weathercode?.[0];
    const maxTemp = data.daily?.temperature_2m_max?.[0];

    if (code === undefined || maxTemp === undefined) return null;

    const emojiDesc = weatherEmojis[code] || '🌤️';
    return `${emojiDesc} ${Math.round(maxTemp)}°C`;
  } catch {
    return null;
  }
}

function loadRecurringSettings(projectRoot: string): RecurringSettings {
  const settingsPath = path.join(projectRoot, 'content/settings/recurring-run.json');
  if (!fs.existsSync(settingsPath)) {
    throw new Error(`Missing recurring-run settings file: ${settingsPath}`);
  }
  return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
}

function loadSpecialEvents(projectRoot: string): SpecialEvent[] {
  const eventsDir = path.join(projectRoot, 'content/events');
  const events: SpecialEvent[] = [];

  if (!fs.existsSync(eventsDir)) return events;

  const files = fs.readdirSync(eventsDir).filter(f => f.endsWith('.md'));
  for (const file of files) {
    const raw = fs.readFileSync(path.join(eventsDir, file), 'utf8');
    const match = raw.match(/^---\n([\s\S]*?)\n---/);
    if (match) {
      try {
        const data = yaml.load(match[1]) as Record<string, unknown>;
        if (data.date) {
          events.push({
            title: data.title as string,
            date: data.date as string,
            dateObj: new Date(data.date as string),
            location: data.location as string | undefined,
            body: raw.replace(match[0], '').trim(),
            fileSlug: file.replace('.md', ''),
          });
        }
      } catch {
        // Skip invalid events
      }
    }
  }
  return events;
}

export const createProcessStagingTask = (): TaskDef<{}, void> => ({
  name: 'process-staging',
  config: {},
  run: async (_, { logger }) => {
    const projectRoot = process.cwd();
    const stagingDir = path.join(projectRoot, 'content/staging/runs');
    const resultsDir = path.join(projectRoot, 'content/results');

    // Ensure directories exist
    if (!fs.existsSync(stagingDir)) {
      fs.mkdirSync(stagingDir, { recursive: true });
    }
    if (!fs.existsSync(resultsDir)) {
      fs.mkdirSync(resultsDir, { recursive: true });
    }

    const stagedFiles = fs.readdirSync(stagingDir).filter(f => f.endsWith('.json'));
    if (stagedFiles.length === 0) {
      logger.info('No staged runs found');
      return;
    }

    const recurringSettings = loadRecurringSettings(projectRoot);
    const specialEvents = loadSpecialEvents(projectRoot);
    let processedCount = 0;

    for (const file of stagedFiles) {
      const dateStr = file.replace('.json', '');
      const resultPath = path.join(resultsDir, `${dateStr}.md`);
      const stagedPath = path.join(stagingDir, file);

      if (fs.existsSync(resultPath)) {
        logger.info(`Skipping ${dateStr} - result file already exists`);
        continue;
      }

      try {
        const stagedData: StagedRun = JSON.parse(fs.readFileSync(stagedPath, 'utf8'));
        const resultDate = new Date(stagedData.date);

        // Find matching special event
        const matchingEvent = specialEvents.find(e =>
          e.dateObj.getFullYear() === resultDate.getFullYear() &&
          e.dateObj.getMonth() === resultDate.getMonth() &&
          e.dateObj.getDate() === resultDate.getDate()
        );

        // Fetch weather
        let weather = '';
        try {
          logger.info(`Fetching weather for ${dateStr}...`);
          weather = await getWeather(resultDate) || '';
        } catch (err) {
          logger.warn(`Failed to fetch weather for ${dateStr}: ${(err as Error).message}`);
        }

        // Calculate distances
        const loops = recurringSettings.loopDistances;
        const participants = stagedData.participants.map(p => {
          let distance = p.distance;
          if (distance === undefined || distance === null) {
            const totalLoops = (p.smallLoops || 0) + (p.mediumLoops || 0) + (p.longLoops || 0);
            const loopDistance = (p.smallLoops || 0) * loops.small +
              (p.mediumLoops || 0) * loops.medium +
              (p.longLoops || 0) * loops.long;
            // Add approach distance only if there are any loops
            distance = totalLoops > 0 ? (loops.approach || 0) + loopDistance : loopDistance;
          }

          return {
            runner: p.runner,
            distance: parseFloat(distance.toFixed(1)),
            smallLoops: p.smallLoops || 0,
            mediumLoops: p.mediumLoops || 0,
            longLoops: p.longLoops || 0,
            time: p.time,
          };
        });

        // Build frontmatter
        const title = stagedData.title || (matchingEvent ? matchingEvent.title : recurringSettings.title);
        const eventTitle = matchingEvent ? matchingEvent.title : recurringSettings.title;

        const frontmatter = {
          date: stagedData.date,
          title,
          eventTitle,
          showEventTitle: title !== eventTitle,
          eventDescription: matchingEvent ? matchingEvent.body : recurringSettings.description,
          location: matchingEvent?.location || recurringSettings.defaultLocation,
          mainPhoto: stagedData.mainPhoto || '',
          weather: weather || '',
          isSpecialEvent: !!matchingEvent,
          participants,
        };

        // Write result file
        const yamlContent = yaml.dump(frontmatter);
        const trimmedBody = stagedData.body?.trim() || '';
        const bodyContent = trimmedBody ? `\n${trimmedBody}\n` : '';
        const fileContent = `---\n${yamlContent}---\n${bodyContent}`;

        fs.writeFileSync(resultPath, fileContent);
        logger.info(`Generated result: ${dateStr}`);
        processedCount++;
      } catch (err) {
        logger.error(`Failed to process ${file}: ${(err as Error).message}`);
      }
    }

    logger.info(`Finished processing. Generated ${processedCount} new results.`);

    // Cleanup: keep only the most recent staging file (by date in filename)
    if (stagedFiles.length > 1) {
      const sortedFiles = [...stagedFiles].sort((a, b) => {
        // Sort by date descending (most recent first)
        const dateA = a.replace('.json', '');
        const dateB = b.replace('.json', '');
        return dateB.localeCompare(dateA);
      });

      const filesToDelete = sortedFiles.slice(1); // Keep first (most recent), delete rest
      for (const file of filesToDelete) {
        const filePath = path.join(stagingDir, file);
        fs.unlinkSync(filePath);
        logger.info(`Cleaned up staging file: ${file}`);
      }
    }
  }
});
