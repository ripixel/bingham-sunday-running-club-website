// @ts-nocheck

/**
 * Compute club-wide statistics from results and runners data
 */

/**
 * Calculate club statistics
 * @param {Object} results - Results content object
 * @param {Object} runners - Runners content object
 * @returns {Object} Club statistics
 */
function computeClubStats(results, runners) {
  const allResults = Object.values(results || {});
  const allRunners = Object.keys(runners || {}).filter(key => key !== 'guest');

  // Total events - include starting events from all runners
  let totalStartingEvents = 0;
  let totalStartingDistance = 0;
  Object.values(runners || {}).forEach(runner => {
    if (runner.startingValues) {
      totalStartingEvents += runner.startingValues.eventsAttended || 0;
      totalStartingDistance += runner.startingValues.totalKm || 0;
    }
  });

  const totalEvents = allResults.length;

  // Unique runners count
  const uniqueRunners = new Set();
  let totalDistance = totalStartingDistance;
  let totalParticipants = 0;

  // Runner stats accumulator - initialize with starting values
  const runnerStats = {};

  // Initialize runners with their starting values
  Object.entries(runners || {}).forEach(([runnerId, runner]) => {
    if (runnerId !== 'guest') {
      const startingValues = runner.startingValues || {};
      const name = runner.name || runnerId;
      runnerStats[runnerId] = {
        slug: runnerId,
        events: startingValues.eventsAttended || 0,
        totalDistance: startingValues.totalKm || 0,
        totalTimeSeconds: 0,
        name: name,
        photo: runner.photo || null,
        firstInitial: name[0]?.toUpperCase() || '?',
        colorClass: runner.colorClass || 'orange'
      };
      if (startingValues.eventsAttended > 0) {
        uniqueRunners.add(runnerId);
      }
    }
  });

  allResults.forEach(result => {
    const participants = result.participants || [];
    totalParticipants += participants.length;

    participants.forEach(participant => {
      const runnerId = participant.runner || participant.name?.toLowerCase();
      if (runnerId && runnerId !== 'guest') {
        uniqueRunners.add(runnerId);

        if (!runnerStats[runnerId]) {
          const runner = runners[runnerId];
          const name = runner?.name || runnerId;
          runnerStats[runnerId] = {
            slug: runnerId,
            events: 0,
            totalDistance: 0,
            totalTimeSeconds: 0,
            name: name,
            photo: runner?.photo || null,
            firstInitial: name[0]?.toUpperCase() || '?',
            colorClass: runner?.colorClass || 'orange'
          };
        }

        runnerStats[runnerId].events++;

        const distance = parseFloat(participant.distance) || 0;
        runnerStats[runnerId].totalDistance += distance;
        totalDistance += distance;

        // Parse time to seconds for pace calculation
        if (participant.time) {
          const timeParts = participant.time.split(':').map(Number);
          let seconds = 0;
          if (timeParts.length === 3) {
            seconds = timeParts[0] * 3600 + timeParts[1] * 60 + timeParts[2];
          } else if (timeParts.length === 2) {
            seconds = timeParts[0] * 60 + timeParts[1];
          }
          runnerStats[runnerId].totalTimeSeconds += seconds;
        }
      }
    });
  });

  // Calculate average pace for each runner
  Object.values(runnerStats).forEach(runner => {
    if (runner.totalDistance > 0 && runner.totalTimeSeconds > 0) {
      const paceSeconds = runner.totalTimeSeconds / runner.totalDistance;
      const paceMinutes = Math.floor(paceSeconds / 60);
      const paceRemSeconds = Math.round(paceSeconds % 60);
      runner.avgPace = `${paceMinutes}:${paceRemSeconds.toString().padStart(2, '0')}`;
      runner.avgPaceSeconds = paceSeconds;
    } else {
      runner.avgPace = '-';
      runner.avgPaceSeconds = Infinity;
    }
  });

  // Top 10 by events
  const topByEvents = Object.values(runnerStats)
    .filter(r => r.events > 0)
    .sort((a, b) => b.events - a.events)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.events }));

  // Top 10 by distance
  const topByDistance = Object.values(runnerStats)
    .filter(r => r.totalDistance > 0)
    .sort((a, b) => b.totalDistance - a.totalDistance)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.totalDistance.toFixed(1) }));

  // Top 10 by pace (fastest, excluding those with no pace data)
  const topByPace = Object.values(runnerStats)
    .filter(r => r.avgPaceSeconds !== Infinity && r.events >= 3) // Minimum 3 events for pace leaderboard
    .sort((a, b) => a.avgPaceSeconds - b.avgPaceSeconds)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.avgPace }));

  // Compute loop leaderboards
  const loopStats = {};

  // Initialize runners from runners object
  Object.entries(runners || {}).forEach(([runnerId, runner]) => {
    if (runnerId !== 'guest') {
      const name = runner.name || runnerId;
      loopStats[runnerId] = {
        slug: runnerId,
        name: name,
        photo: runner.photo || null,
        firstInitial: name[0]?.toUpperCase() || '?',
        colorClass: runner.colorClass || 'orange',
        smallLoops: 0,
        mediumLoops: 0,
        longLoops: 0
      };
    }
  });

  // Accumulate loop counts from all results
  allResults.forEach(result => {
    const participants = result.participants || [];
    participants.forEach(participant => {
      const runnerId = participant.runner || participant.name?.toLowerCase();
      if (runnerId && runnerId !== 'guest' && loopStats[runnerId]) {
        loopStats[runnerId].smallLoops += participant.smallLoops || 0;
        loopStats[runnerId].mediumLoops += participant.mediumLoops || 0;
        loopStats[runnerId].longLoops += participant.longLoops || 0;
      }
    });
  });

  // Top 10 by small loops
  const topBySmallLoops = Object.values(loopStats)
    .filter(r => r.smallLoops > 0)
    .sort((a, b) => b.smallLoops - a.smallLoops)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.smallLoops }));

  // Top 10 by medium loops
  const topByMediumLoops = Object.values(loopStats)
    .filter(r => r.mediumLoops > 0)
    .sort((a, b) => b.mediumLoops - a.mediumLoops)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.mediumLoops }));

  // Top 10 by long loops
  const topByLongLoops = Object.values(loopStats)
    .filter(r => r.longLoops > 0)
    .sort((a, b) => b.longLoops - a.longLoops)
    .slice(0, 10)
    .map((r, i) => ({ ...r, rank: i + 1, stat: r.longLoops }));

  // Average attendance
  const avgAttendance = totalEvents > 0 ? Math.round(totalParticipants / totalEvents) : 0;

  return {
    totalEvents: totalEvents + totalStartingEvents,
    totalRunners: uniqueRunners.size,
    totalDistance: totalDistance.toFixed(0),
    avgAttendance,
    topByEvents,
    topByDistance,
    topByPace,
    topBySmallLoops,
    topByMediumLoops,
    topByLongLoops
  };
}

/**
 * Compute runner stats for directory page
 * @param {Object} results - Results content
 * @param {Object} runners - Runners content
 * @param {Object} clubRecordsMap - Map of club records by runner
 * @returns {Array} Array of runner objects with stats
 */
function computeRunnersWithStats(results, runners, clubRecordsMap) {
  const runnerStats = {};

  // Accumulate data from results
  const allResults = Object.values(results || {});
  allResults.forEach(result => {
    const participants = result.participants || [];
    participants.forEach(participant => {
      const runnerId = participant.runner || participant.name?.toLowerCase();
      if (runnerId && runnerId !== 'guest') {
        if (!runnerStats[runnerId]) {
          runnerStats[runnerId] = {
            totalRuns: 0,
            totalDistance: 0
          };
        }
        runnerStats[runnerId].totalRuns++;
        runnerStats[runnerId].totalDistance += parseFloat(participant.distance) || 0;
      }
    });
  });

  // Build runner list
  return Object.entries(runners || {})
    .filter(([slug]) => slug !== 'guest')
    .map(([slug, runner]) => {
      const resultStats = runnerStats[slug] || { totalRuns: 0, totalDistance: 0 };
      const startingValues = runner.startingValues || {};
      const records = clubRecordsMap?.[slug] || [];

      // Add starting values to result stats
      const totalRuns = resultStats.totalRuns + (startingValues.eventsAttended || 0);
      const totalDistance = resultStats.totalDistance + (startingValues.totalKm || 0);

      return {
        slug,
        name: runner.name,
        photo: runner.photo,
        firstInitial: runner.name?.[0]?.toUpperCase() || '?',
        colorClass: runner.colorClass || 'orange',
        totalRuns,
        totalDistance: totalDistance.toFixed(1),
        clubRecordsCount: records.length,
        recordsLabel: records.length === 1 ? 'record' : 'records'
      };
    })
    .sort((a, b) => a.name.localeCompare(b.name)); // Sort alphabetically
}

module.exports = {
  computeClubStats,
  computeRunnersWithStats
};
