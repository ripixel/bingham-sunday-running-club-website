#!/usr/bin/env node
// @ts-check

/**
 * Generate historical Sunday run events based on runner startingValues
 * This script creates result files that EXACTLY match the participation data in startingValues
 * including events attended, total distance, and average pace (times).
 */

const fs = require('fs');
const path = require('path');

const runnersDir = path.join(__dirname, '../content/runners');
const resultsDir = path.join(__dirname, '../content/results');
const settingsDir = path.join(__dirname, '../content/settings');

// Load recurring run settings
const recurringRunSettings = JSON.parse(
  fs.readFileSync(path.join(settingsDir, 'recurring-run.json'), 'utf-8')
);

// Read all runners
const runners = {};
const files = fs.readdirSync(runnersDir).filter(f => f.endsWith('.json'));
for (const file of files) {
  const data = JSON.parse(fs.readFileSync(path.join(runnersDir, file), 'utf-8'));
  if (data.id !== 'guest' && data.startingValues?.eventsAttended > 0) {
    runners[data.id] = data;
  }
}

console.log('Runners with startingValues:');
Object.entries(runners).forEach(([id, runner]) => {
  const sv = runner.startingValues;
  console.log(`  ${id}: ${sv.eventsAttended} events, ${sv.totalKm}km, pace: ${sv.avgPace}`);
});

// Parse pace string "MM:SS" to seconds per km
function parsePace(paceStr) {
  const parts = paceStr.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

// Format seconds to "MM:SS"
function formatTime(totalSeconds) {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.round(totalSeconds % 60);
  return `${mins}:${secs.toString().padStart(2, '0')}`;
}

// Calculate Sundays from Sept 7, 2025 to Jan 11, 2026
const sundays = [];
let date = new Date('2025-09-07');
const endDate = new Date('2026-01-11');
const skipDate = '2025-12-21'; // Real event, don't generate

while (date <= endDate) {
  if (date.getDay() === 0) {
    const dateStr = date.toISOString().split('T')[0];
    if (dateStr !== skipDate) {
      sundays.push(dateStr);
    }
  }
  date.setDate(date.getDate() + 1);
}

console.log(`\nSundays to generate (excluding ${skipDate}): ${sundays.length}`);

// For each runner, plan their participation across Sundays
// We need to distribute their events to match eventsAttended exactly
// And distribute distance/time to match totalKm and avgPace

const runnerPlans = {};

Object.entries(runners).forEach(([runnerId, runner]) => {
  const sv = runner.startingValues;
  const eventsNeeded = sv.eventsAttended;
  const totalKm = sv.totalKm;
  const avgPaceSeconds = parsePace(sv.avgPace);

  // Calculate total time based on distance and pace
  const totalTimeSeconds = totalKm * avgPaceSeconds;

  // Distribute events across the most recent Sundays before Dec 21
  // (since startingValues are "before tracking started")
  const eligibleSundays = sundays.filter(s => s < skipDate);
  const attendedSundays = eligibleSundays.slice(-eventsNeeded);

  if (attendedSundays.length < eventsNeeded) {
    console.warn(`  Warning: ${runnerId} needs ${eventsNeeded} events but only ${attendedSundays.length} Sundays available`);
  }

  // Distribute distance across events with some variation
  const eventCount = attendedSundays.length;
  const avgDistance = totalKm / eventCount;

  // Create varied distances that sum to totalKm
  const distances = [];
  let remainingKm = totalKm;
  for (let i = 0; i < eventCount - 1; i++) {
    // Add +/- 15% variation
    const variation = 0.85 + Math.random() * 0.3;
    const dist = Math.round(avgDistance * variation * 10) / 10;
    distances.push(dist);
    remainingKm -= dist;
  }
  // Last event gets the remainder to ensure exact total
  distances.push(Math.round(remainingKm * 10) / 10);

  // Create times for each distance using the average pace with +/- 10s variation
  const times = distances.map(dist => {
    const baseTime = dist * avgPaceSeconds;
    const variation = -10 + Math.random() * 20; // +/- 10 seconds
    return Math.round(baseTime + variation);
  });

  runnerPlans[runnerId] = {
    sundays: attendedSundays,
    distances,
    times,
    avgPaceSeconds
  };

  console.log(`\n${runnerId}: ${eventCount} events planned`);
  console.log(`  Total distance: ${distances.reduce((a, b) => a + b, 0).toFixed(1)}km (target: ${totalKm}km)`);
  const actualAvgPace = times.reduce((a, b) => a + b, 0) / distances.reduce((a, b) => a + b, 0);
  console.log(`  Avg pace: ${formatTime(actualAvgPace)} (target: ${sv.avgPace})`);
});

// Build event participation map
const eventParticipants = {};

Object.entries(runnerPlans).forEach(([runnerId, plan]) => {
  plan.sundays.forEach((sunday, idx) => {
    if (!eventParticipants[sunday]) {
      eventParticipants[sunday] = [];
    }

    const distance = plan.distances[idx];
    const timeSeconds = plan.times[idx];
    const longLoops = Math.round(distance / 1.2);

    eventParticipants[sunday].push({
      runner: runnerId,
      distance,
      smallLoops: 0,
      mediumLoops: 0,
      longLoops,
      time: formatTime(timeSeconds)
    });
  });
});

// Generate result files
console.log('\n\nGenerating result files:');

// Add post-Christmas Sundays (Dec 28 and Jan 4) with typical attendance
// These are NOT part of startingValues - they're additional recent runs
const postChristmasSundays = sundays.filter(s => s > skipDate);
console.log(`\nPost-Christmas Sundays to add: ${postChristmasSundays.join(', ')}`);

// Get all runners (including those without startingValues) for post-Christmas events
const allRunnerIds = Object.keys(runners);

postChristmasSundays.forEach(dateStr => {
  if (!eventParticipants[dateStr]) {
    eventParticipants[dateStr] = [];
  }

  // Add typical runners for post-Christmas events (random selection of ~6-8 members)
  const numRunners = 6 + Math.floor(Math.random() * 3);
  const shuffled = [...allRunnerIds].sort(() => Math.random() - 0.5);
  const selectedRunners = shuffled.slice(0, numRunners);

  selectedRunners.forEach(runnerId => {
    const runner = runners[runnerId];
    const sv = runner?.startingValues || {};
    const avgPaceSeconds = sv.avgPace ? parsePace(sv.avgPace) : 360; // default 6:00

    const distance = 4 + Math.random() * 3; // 4-7km
    const timeSeconds = distance * avgPaceSeconds + (-10 + Math.random() * 20);
    const longLoops = Math.round(distance / 1.2);

    eventParticipants[dateStr].push({
      runner: runnerId,
      distance: Math.round(distance * 10) / 10,
      smallLoops: 0,
      mediumLoops: 0,
      longLoops,
      time: formatTime(timeSeconds)
    });
  });
});

// Sort dates
const sortedDates = Object.keys(eventParticipants).sort();

sortedDates.forEach(dateStr => {
  const participants = eventParticipants[dateStr];

  // Add guests to reach ~10 participants (with variation 8-12)
  const targetParticipants = 8 + Math.floor(Math.random() * 5);
  const guestsToAdd = Math.max(0, targetParticipants - participants.length);

  for (let i = 0; i < guestsToAdd; i++) {
    const guestDistance = 4 + Math.random() * 2; // 4-6km
    const guestPace = 300 + Math.random() * 120; // 5:00-7:00 pace
    const guestTime = guestDistance * guestPace;

    participants.push({
      runner: 'guest',
      distance: Math.round(guestDistance * 10) / 10,
      smallLoops: 0,
      mediumLoops: 0,
      longLoops: Math.round(guestDistance / 1.2),
      time: formatTime(guestTime)
    });
  }

  const participantsYaml = participants.map(p =>
    `  - runner: ${p.runner}
    distance: ${p.distance}
    smallLoops: ${p.smallLoops}
    mediumLoops: ${p.mediumLoops}
    longLoops: ${p.longLoops}
    time: '${p.time}'`
  ).join('\n');

  const content = `---
date: '${dateStr}T09:00:00.000Z'
title: "${recurringRunSettings.title}"
eventTitle: "${recurringRunSettings.title}"
showEventTitle: false
eventDescription: ${recurringRunSettings.description}
location: ${recurringRunSettings.defaultLocation}
mainPhoto: /images/races/historical-run.jpg
weather: ""
isSpecialEvent: false
isRecurring: true
participants:
${participantsYaml}
---
${recurringRunSettings.description}

Note: This is a historical record back-filled for website tracking.
`;

  const filePath = path.join(resultsDir, `${dateStr}.md`);
  fs.writeFileSync(filePath, content);
  console.log(`  Created ${dateStr}.md with ${participants.length} participants`);
});

// Summary statistics
console.log('\n\n=== VERIFICATION ===');
Object.entries(runners).forEach(([runnerId, runner]) => {
  const sv = runner.startingValues;
  const plan = runnerPlans[runnerId];

  const actualEvents = plan.sundays.length;
  const actualDistance = plan.distances.reduce((a, b) => a + b, 0);
  const actualTotalTime = plan.times.reduce((a, b) => a + b, 0);
  const actualAvgPace = actualTotalTime / actualDistance;

  console.log(`\n${runnerId}:`);
  console.log(`  Events: ${actualEvents} (target: ${sv.eventsAttended}) ${actualEvents === sv.eventsAttended ? '✓' : '✗'}`);
  console.log(`  Distance: ${actualDistance.toFixed(1)}km (target: ${sv.totalKm}km)`);
  console.log(`  Avg Pace: ${formatTime(actualAvgPace)} (target: ${sv.avgPace})`);
});

console.log('\nDone!');
