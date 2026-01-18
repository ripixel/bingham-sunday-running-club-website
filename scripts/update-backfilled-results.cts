/**
 * Script to update backfilled run results with realistic loop counts and times
 * based on the 2026-01-18 race data.
 *
 * Algorithm:
 * 1. Read each runner's loops from 2026-01-18.json (their "current" performance)
 * 2. For backfilled results, give them one less loop of their smallest loop type
 * 3. Calculate a slightly slower pace (10-20 seconds more per km)
 * 4. Calculate new time based on new distance and slower pace
 * 5. Also add Alex to the 2026-01-04 result using same rules
 */

import * as fs from 'fs';
import * as path from 'path';
import * as yaml from 'js-yaml';

// Constants
const APPROACH_DISTANCE = 0.55;
const SMALL_LOOP = 0.8;
const MEDIUM_LOOP = 1.0;
const LONG_LOOP = 1.2;

// Files to update (backfilled results that have the back-filled note)
const BACKFILLED_DATES = [
  '2025-09-07', '2025-09-14', '2025-09-21', '2025-09-28',
  '2025-10-05', '2025-10-12', '2025-10-19', '2025-10-26',
  '2025-11-02', '2025-11-09', '2025-11-16', '2025-11-23', '2025-11-30',
  '2025-12-07', '2025-12-14', '2025-12-21', '2025-12-28',
  '2026-01-04', '2026-01-11'
];

interface RunnerLoops {
  smallLoops: number;
  mediumLoops: number;
  longLoops: number;
  time: string;
}

interface Participant {
  runner: string;
  distance: number;
  smallLoops: number;
  mediumLoops: number;
  longLoops: number;
  time: string;
  guestName?: string;
}

interface ParsedResult {
  frontmatter: Record<string, unknown>;
  body: string;
}

// Parse time string to seconds
// Coerce to string first - YAML may interpret unquoted times (e.g., 25:10) as sexagesimal numbers
function timeToSeconds(time: string | number): number {
  const timeStr = String(time);
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 3) {
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return parts[0] * 60 + parts[1];
}

// Convert seconds to time string (mm:ss format)
function secondsToTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.round(totalSeconds % 60);
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

// Calculate distance from loops
function calculateDistance(small: number, medium: number, long: number): number {
  const totalLoops = small + medium + long;
  if (totalLoops === 0) return 0;
  const loopDistance = small * SMALL_LOOP + medium * MEDIUM_LOOP + long * LONG_LOOP;
  return APPROACH_DISTANCE + loopDistance;
}

// Calculate pace in seconds per km
function calculatePace(time: string, distance: number): number {
  const seconds = timeToSeconds(time);
  return seconds / distance;
}

// Reduce loops by removing smallest loop type
function reduceLoops(loops: RunnerLoops): { small: number; medium: number; long: number } {
  let { smallLoops: small, mediumLoops: medium, longLoops: long } = loops;

  // Remove one loop of the smallest type available
  if (small > 0) {
    small--;
  } else if (medium > 0) {
    medium--;
  } else if (long > 0) {
    long--;
  }

  return { small, medium, long };
}

// Parse a markdown result file
function parseResultFile(content: string): ParsedResult {
  const match = content.match(/^---\n([\s\S]*?)\n---\n?([\s\S]*)$/);
  if (!match) {
    throw new Error('Invalid markdown format');
  }
  const frontmatter = yaml.load(match[1]) as Record<string, unknown>;
  const body = match[2];
  return { frontmatter, body };
}

// Serialize back to markdown
function serializeResult(frontmatter: Record<string, unknown>, body: string): string {
  const yamlContent = yaml.dump(frontmatter);
  return `---\n${yamlContent}---\n${body}`;
}

function main() {
  const projectRoot = path.resolve(__dirname, '..');
  const stagingPath = path.join(projectRoot, 'content/staging/runs/2026-01-18.json');
  const resultsDir = path.join(projectRoot, 'content/results');

  // Load the 2026-01-18 staging data as our "current" reference
  const currentData = JSON.parse(fs.readFileSync(stagingPath, 'utf8'));

  // Build map of runner -> their current loops and pace
  const runnerData = new Map<string, { loops: RunnerLoops; pace: number; reducedLoops: { small: number; medium: number; long: number }; slowerPace: number }>();

  for (const p of currentData.participants) {
    if (p.runner === 'guest') continue; // Skip guests

    const distance = calculateDistance(p.smallLoops || 0, p.mediumLoops || 0, p.longLoops || 0);
    const pace = calculatePace(p.time, distance);
    const reducedLoops = reduceLoops(p);

    // Add 10-15 seconds to pace (random variation)
    const paceIncrease = 10 + Math.random() * 10;
    const slowerPace = pace + paceIncrease;

    runnerData.set(p.runner, {
      loops: {
        smallLoops: p.smallLoops || 0,
        mediumLoops: p.mediumLoops || 0,
        longLoops: p.longLoops || 0,
        time: p.time
      },
      pace,
      reducedLoops,
      slowerPace
    });

    console.log(`${p.runner}: Current ${distance.toFixed(2)}km in ${p.time} (${(pace / 60).toFixed(2)} min/km)`);
    const newDist = calculateDistance(reducedLoops.small, reducedLoops.medium, reducedLoops.long);
    const newTime = newDist * slowerPace;
    console.log(`  -> Backfill: ${newDist.toFixed(2)}km in ${secondsToTime(newTime)} (${(slowerPace / 60).toFixed(2)} min/km)`);
  }

  console.log('\n--- Processing backfilled results ---\n');

  // Process each backfilled result
  for (const dateStr of BACKFILLED_DATES) {
    const resultPath = path.join(resultsDir, `${dateStr}.md`);

    if (!fs.existsSync(resultPath)) {
      console.log(`Skipping ${dateStr} - file not found`);
      continue;
    }

    const content = fs.readFileSync(resultPath, 'utf8');
    const { frontmatter, body } = parseResultFile(content);

    const participants = frontmatter.participants as Participant[];
    let updated = false;

    // Update each participant that we have data for
    for (const participant of participants) {
      const data = runnerData.get(participant.runner);
      if (!data) continue;

      // Apply reduced loops
      participant.smallLoops = data.reducedLoops.small;
      participant.mediumLoops = data.reducedLoops.medium;
      participant.longLoops = data.reducedLoops.long;

      // Calculate new distance and time
      const newDistance = calculateDistance(
        data.reducedLoops.small,
        data.reducedLoops.medium,
        data.reducedLoops.long
      );
      participant.distance = parseFloat(newDistance.toFixed(1));

      const newTimeSeconds = newDistance * data.slowerPace;
      participant.time = secondsToTime(newTimeSeconds);

      updated = true;
    }

    // Special case: Add Alex to 2026-01-04 if not already present
    if (dateStr === '2026-01-04') {
      const alexExists = participants.some(p => p.runner === 'alex');
      if (!alexExists) {
        const alexData = runnerData.get('alex');
        if (alexData) {
          const newDistance = calculateDistance(
            alexData.reducedLoops.small,
            alexData.reducedLoops.medium,
            alexData.reducedLoops.long
          );
          const newTimeSeconds = newDistance * alexData.slowerPace;

          participants.push({
            runner: 'alex',
            distance: parseFloat(newDistance.toFixed(1)),
            smallLoops: alexData.reducedLoops.small,
            mediumLoops: alexData.reducedLoops.medium,
            longLoops: alexData.reducedLoops.long,
            time: secondsToTime(newTimeSeconds)
          });

          console.log(`Added Alex to ${dateStr}`);
          updated = true;
        }
      }
    }

    if (updated) {
      // Remove the backfilled note from the body if present
      let newBody = body.replace(/\n?Note: This (is a historical record back-filled|run is back-filled).*\n?/, '\n');

      // Write back the updated file
      const newContent = serializeResult(frontmatter, newBody);
      fs.writeFileSync(resultPath, newContent);
      console.log(`Updated ${dateStr}`);
    }
  }

  console.log('\nDone!');
}

main();
