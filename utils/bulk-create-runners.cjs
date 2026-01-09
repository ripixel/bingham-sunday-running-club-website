#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

const RUNNERS_DIR = path.join(__dirname, '../content/runners');

/**
 * Convert a name to a valid ID (lowercase, no spaces)
 */
function nameToId(name) {
  return name.toLowerCase().replace(/\s+/g, '-');
}

/**
 * Get all existing runner IDs
 */
function getExistingIds() {
  const files = fs.readdirSync(RUNNERS_DIR);
  const ids = new Set();

  files.forEach(file => {
    if (file.endsWith('.json') && file !== 'guest.json') {
      const content = JSON.parse(fs.readFileSync(path.join(RUNNERS_DIR, file), 'utf-8'));
      ids.add(content.id);
    }
  });

  return ids;
}

/**
 * Calculate join date based on events attended (assuming weekly runs)
 * @param {number} eventsAttended - Number of events the runner has attended
 * @returns {string} ISO date string (YYYY-MM-DD)
 */
function calculateJoinDate(eventsAttended) {
  const today = new Date();
  const weeksBack = eventsAttended;
  const joinDate = new Date(today);
  joinDate.setDate(today.getDate() - (weeksBack * 7));
  return joinDate.toISOString().split('T')[0];
}

/**
 * Create a runner profile JSON
 */
function createRunnerProfile(name, joinedDate = null, startingValues = null) {
  const id = nameToId(name);

  // Auto-calculate joinedDate if startingValues.eventsAttended is provided and no explicit date given
  let finalJoinedDate = joinedDate;
  if (!finalJoinedDate && startingValues?.eventsAttended) {
    finalJoinedDate = calculateJoinDate(startingValues.eventsAttended);
  } else if (!finalJoinedDate) {
    finalJoinedDate = new Date().toISOString().split('T')[0];
  }

  const profile = {
    id,
    name,
    anonymous: false,
    joinedDate: finalJoinedDate
  };

  // Add startingValues if provided
  if (startingValues && (startingValues.eventsAttended || startingValues.totalKm || startingValues.avgPace)) {
    profile.startingValues = {};

    if (startingValues.eventsAttended !== undefined) {
      profile.startingValues.eventsAttended = startingValues.eventsAttended;
    }
    if (startingValues.totalKm !== undefined) {
      profile.startingValues.totalKm = startingValues.totalKm;
    }
    if (startingValues.avgPace !== undefined) {
      profile.startingValues.avgPace = startingValues.avgPace;
    }
  }

  return profile;
}

/**
 * Parse CSV content into runner data
 * Expected format: name,events,km,pace
 * @param {string} csvContent - CSV file content
 * @returns {Array} Array of runner objects with name and startingValues
 */
function parseCSV(csvContent) {
  const lines = csvContent.trim().split('\n');
  const runners = [];

  // Check if first line is a header
  const firstLine = lines[0].toLowerCase();
  const hasHeader = firstLine.includes('name') || firstLine.includes('events') || firstLine.includes('km') || firstLine.includes('pace');
  const startIndex = hasHeader ? 1 : 0;

  for (let i = startIndex; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines

    const parts = line.split(',').map(p => p.trim());
    const name = parts[0];

    if (!name) continue; // Skip if no name

    const runner = { name };

    // Parse optional starting values
    if (parts.length > 1) {
      runner.startingValues = {};

      if (parts[1]) runner.startingValues.eventsAttended = parseInt(parts[1], 10);
      if (parts[2]) runner.startingValues.totalKm = parseFloat(parts[2]);
      if (parts[3]) runner.startingValues.avgPace = parts[3];
    }

    runners.push(runner);
  }

  return runners;
}

/**
 * Main function to bulk create runners from individual parameters
 */
function bulkCreateRunners(names, joinedDate, startingValues = null) {
  const existingIds = getExistingIds();
  const created = [];
  const skipped = [];

  names.forEach(name => {
    const id = nameToId(name);

    // Check for ID clash
    if (existingIds.has(id)) {
      skipped.push({ name, id, reason: 'ID already exists' });
      return;
    }

    // Create the profile
    const profile = createRunnerProfile(name, joinedDate, startingValues);
    const filename = path.join(RUNNERS_DIR, `${id}.json`);

    // Write to file
    fs.writeFileSync(filename, JSON.stringify(profile, null, 2) + '\n');

    created.push({ name, id, filename });
    existingIds.add(id); // Add to set to prevent duplicates in this batch
  });

  return { created, skipped };
}

/**
 * Bulk create runners from CSV data
 */
function bulkCreateRunnersFromCSV(csvFilePath) {
  const csvContent = fs.readFileSync(csvFilePath, 'utf-8');
  const runners = parseCSV(csvContent);

  const existingIds = getExistingIds();
  const created = [];
  const skipped = [];

  runners.forEach(({ name, startingValues }) => {
    const id = nameToId(name);

    // Check for ID clash
    if (existingIds.has(id)) {
      skipped.push({ name, id, reason: 'ID already exists' });
      return;
    }

    // Create the profile (joinedDate will be auto-calculated if events are provided)
    const profile = createRunnerProfile(name, null, startingValues);
    const filename = path.join(RUNNERS_DIR, `${id}.json`);

    // Write to file
    fs.writeFileSync(filename, JSON.stringify(profile, null, 2) + '\n');

    created.push({ name, id, filename });
    existingIds.add(id); // Add to set to prevent duplicates in this batch
  });

  return { created, skipped };
}

// CLI Interface
if (require.main === module) {
  const args = process.argv.slice(2);

  if (args.length === 0 || args.includes('--help') || args.includes('-h')) {
    console.log(`
Usage:
  node bulk-create-runners.cjs [options] <name1> <name2> <name3> ...
  node bulk-create-runners.cjs --csv <file.csv>

Options:
  --csv <file.csv>              Import runners from CSV file
                                CSV format: name,events,km,pace
                                Header row is optional
  --joined-date <YYYY-MM-DD>    Set the joinedDate for all runners (optional)
                                If not provided and --events is set, will auto-calculate
                                by going back (events * 1 week) from today
  --events <number>             Set starting eventsAttended for all runners
  --km <number>                 Set starting totalKm for all runners
  --pace <MM:SS>                Set starting avgPace for all runners (format: "5:30")
  --help, -h                    Show this help message

Examples:
  # Import from CSV
  node bulk-create-runners.cjs --csv runners.csv

  # Basic usage
  node bulk-create-runners.cjs "Alice Smith" "Bob Jones" "Charlie Brown"

  # With joined date
  node bulk-create-runners.cjs --joined-date 2025-01-01 "Alice" "Bob" "Charlie"

  # With starting values (join date auto-calculated from events: 10 weeks back)
  node bulk-create-runners.cjs --events 10 --km 52.0 --pace "5:30" "Dean" "James"

  # Override auto-calculated join date with explicit date
  node bulk-create-runners.cjs --joined-date 2024-06-01 --events 25 --km 130.5 --pace "5:15" "Alice"

CSV Example:
  name,events,km,pace
  Alice Smith,15,78.5,5:30
  Bob Jones,10,52.0,5:45
  Charlie Brown,25,130.5,5:15
`);
    process.exit(0);
  }

  let joinedDate = null; // Will be auto-calculated if events are provided
  let names = [];
  let startingValues = null;
  let csvFile = null;

  // Parse arguments
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--csv') {
      csvFile = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === '--joined-date') {
      joinedDate = args[i + 1];
      i++; // Skip next arg
    } else if (args[i] === '--events') {
      if (!startingValues) startingValues = {};
      startingValues.eventsAttended = parseInt(args[i + 1], 10);
      i++; // Skip next arg
    } else if (args[i] === '--km') {
      if (!startingValues) startingValues = {};
      startingValues.totalKm = parseFloat(args[i + 1]);
      i++; // Skip next arg
    } else if (args[i] === '--pace') {
      if (!startingValues) startingValues = {};
      startingValues.avgPace = args[i + 1];
      i++; // Skip next arg
    } else {
      names.push(args[i]);
    }
  }

  let created, skipped;

  // Handle CSV import
  if (csvFile) {
    if (!fs.existsSync(csvFile)) {
      console.error(`Error: CSV file not found: ${csvFile}`);
      process.exit(1);
    }

    console.log(`Importing runners from CSV: ${csvFile}\n`);
    ({ created, skipped } = bulkCreateRunnersFromCSV(csvFile));
  } else {
    // Handle individual names
    if (names.length === 0) {
      console.error('Error: No names provided');
      process.exit(1);
    }

    console.log(`Creating ${names.length} runner profile(s)...\n`);
    ({ created, skipped } = bulkCreateRunners(names, joinedDate, startingValues));
  }

  // Report results
  if (created.length > 0) {
    console.log('✅ Successfully created:');
    created.forEach(({ name, id, filename }) => {
      console.log(`  - ${name} (${id}) → ${path.basename(filename)}`);
    });
    console.log();
  }

  if (skipped.length > 0) {
    console.log('⚠️  Skipped:');
    skipped.forEach(({ name, id, reason }) => {
      console.log(`  - ${name} (${id}): ${reason}`);
    });
    console.log();
  }

  console.log(`Summary: ${created.length} created, ${skipped.length} skipped`);
}

module.exports = {
  bulkCreateRunners,
  bulkCreateRunnersFromCSV,
  createRunnerProfile,
  nameToId,
  calculateJoinDate,
  parseCSV
};
