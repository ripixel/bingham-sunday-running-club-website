/**
 * compute-results.cjs
 *
 * Utility functions for computing runner stats, result summaries,
 * and enriching participant data with computed values.
 */

/**
 * Parse time string (MM:SS or HH:MM:SS) to total seconds
 */
function parseTime(timeStr) {
  if (!timeStr) return 0;
  const parts = timeStr.split(':').map(Number);
  if (parts.length === 2) {
    // MM:SS
    return parts[0] * 60 + parts[1];
  } else if (parts.length === 3) {
    // HH:MM:SS
    return parts[0] * 3600 + parts[1] * 60 + parts[2];
  }
  return 0;
}

/**
 * Format seconds to MM:SS or HH:MM:SS
 */
function formatTime(totalSeconds) {
  if (!totalSeconds || totalSeconds <= 0) return '--:--';

  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = Math.floor(totalSeconds % 60);

  if (hours > 0) {
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }
  return `${minutes}:${seconds.toString().padStart(2, '0')}`;
}

/**
 * Calculate pace (min/km) from distance and time
 */
function calculatePace(distanceKm, timeSeconds) {
  if (!distanceKm || distanceKm <= 0 || !timeSeconds || timeSeconds <= 0) return '--:--';
  const paceSeconds = timeSeconds / distanceKm;
  const paceMinutes = Math.floor(paceSeconds / 60);
  const paceRemainder = Math.floor(paceSeconds % 60);
  return `${paceMinutes}:${paceRemainder.toString().padStart(2, '0')}`;
}

/**
 * Format route from loop counts to readable string
 */
function formatRoute(participant) {
  const parts = [];
  if (participant.smallLoops > 0) {
    parts.push(`${participant.smallLoops}x Small`);
  }
  if (participant.mediumLoops > 0) {
    parts.push(`${participant.mediumLoops}x Medium`);
  }
  if (participant.longLoops > 0) {
    parts.push(`${participant.longLoops}x Long`);
  }

  // If no loops specified (e.g., special event), return custom route or default
  if (parts.length === 0) {
    return participant.route || 'Other route';
  }

  return parts.join(', ');
}

/**
 * Format route with HTML for colored loops
 * Pink = Small, Green = Medium, Blue = Long, Orange = Other
 */
function formatRouteHtml(participant) {
  const parts = [];
  if (participant.smallLoops > 0) {
    parts.push(`<span class="route-small">${participant.smallLoops}x Small</span>`);
  }
  if (participant.mediumLoops > 0) {
    parts.push(`<span class="route-medium">${participant.mediumLoops}x Medium</span>`);
  }
  if (participant.longLoops > 0) {
    parts.push(`<span class="route-long">${participant.longLoops}x Long</span>`);
  }

  // If no standard loops, use route name or fallback, styled as "Other" (Orange)
  if (parts.length === 0) {
    const routeText = participant.route || 'Other route';
    return `<span class="route-other">${routeText}</span>`;
  }

  return parts.join(', ');
}

/**
 * Compute stats for a single result
 */
function computeResultStats(result) {
  const participants = result.participants || [];

  const totalAttendees = participants.length;
  const totalDistance = participants.reduce((sum, p) => sum + (p.distance || 0), 0);
  const totalTimeSeconds = participants.reduce((sum, p) => sum + parseTime(p.time), 0);
  const avgPace = calculatePace(totalDistance, totalTimeSeconds);

  return {
    totalAttendees,
    totalDistance: totalDistance.toFixed(1),
    totalTime: formatTime(totalTimeSeconds),
    avgPace
  };
}

/**
 * Enrich participants with runner profiles and computed values
 */
function enrichParticipants(participants, runners, allResults) {
  let anonymousCounter = 1;
  const colorClasses = ['pink', 'green', 'blue'];
  let colorIndex = 0;

  return (participants || []).map((p, index) => {
    const runner = runners[p.runner];
    const timeSeconds = parseTime(p.time);
    const pace = calculatePace(p.distance, timeSeconds);
    const route = formatRoute(p);
    const routeHtml = formatRouteHtml(p);

    // Handle anonymous runners
    let displayName = runner?.name || 'Guest';
    if (runner?.anonymous) {
      displayName = `Runner #${anonymousCounter++}`;
    }

    // Count total attendance for this runner
    const attendanceCount = countRunnerAttendance(p.runner, allResults);

    // Color cycling for linked runners
    const hasProfile = !!runner && p.runner !== 'guest';
    const colorClass = hasProfile ? colorClasses[colorIndex++ % colorClasses.length] : null;

    return {
      ...p,
      displayName,
      runnerProfile: runner,
      runnerId: p.runner,
      pace,
      route,
      routeHtml,
      attendanceCount,
      hasProfile,
      colorClass
    };
  });
}

/**
 * Count how many times a runner has participated
 */
function countRunnerAttendance(runnerId, allResults) {
  let count = 0;
  Object.values(allResults || {}).forEach(result => {
    (result.participants || []).forEach(p => {
      if (p.runner === runnerId) count++;
    });
  });
  return count;
}

/**
 * Compute stats for a runner across all results
 */
function computeRunnerStats(runnerId, allResults) {
  let totalRuns = 0;
  let totalDistance = 0;
  let totalTimeSeconds = 0;
  const runHistory = [];

  // Sort results by date descending
  const sortedResults = Object.entries(allResults || {})
    .map(([slug, result]) => ({ slug, ...result, dateObj: new Date(result.date) }))
    .sort((a, b) => b.dateObj - a.dateObj);

  sortedResults.forEach(result => {
    (result.participants || []).forEach(p => {
      if (p.runner === runnerId) {
        totalRuns++;
        totalDistance += p.distance || 0;
        totalTimeSeconds += parseTime(p.time);

        runHistory.push({
          date: result.date,
          displayDate: result.dateObj.toLocaleDateString('en-GB', {
            day: 'numeric',
            month: 'short',
            year: 'numeric'
          }),
          title: result.title || result.eventTitle || 'Sunday Run',
          slug: result.slug,
          distance: p.distance,
          time: p.time,
          pace: calculatePace(p.distance, parseTime(p.time)),
          route: formatRoute(p),
          routeHtml: formatRouteHtml(p)
        });
      }
    });
  });

  return {
    totalRuns,
    totalDistance: totalDistance.toFixed(1),
    totalTime: formatTime(totalTimeSeconds),
    avgPace: calculatePace(totalDistance, totalTimeSeconds),
    runHistory
  };
}

/**
 * Get the latest result with enriched data
 */
function getLatestResult(results, runners) {
  const sortedResults = Object.entries(results || {})
    .map(([slug, result]) => ({ slug, ...result, dateObj: new Date(result.date) }))
    .sort((a, b) => b.dateObj - a.dateObj);

  if (sortedResults.length === 0) return null;

  const latest = sortedResults[0];
  const stats = computeResultStats(latest);

  return {
    ...latest,
    ...stats,
    displayDate: latest.dateObj.toLocaleDateString('en-GB', {
      weekday: 'long',
      day: 'numeric',
      month: 'long'
    }),
    link: `/results/${latest.slug}/`
  };
}

/**
 * Get all results summaries for archive page
 */
function getAllResultsSummary(results, runners) {
  const colorClasses = ['pink', 'green', 'blue'];

  return Object.entries(results || {})
    .map(([slug, result]) => {
      const dateObj = new Date(result.date);
      const stats = computeResultStats(result);

      return {
        slug,
        ...result,
        title: result.title || result.eventTitle || 'Sunday Run',
        ...stats,
        dateObj,
        displayDate: dateObj.toLocaleDateString('en-GB', {
          weekday: 'short',
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        link: `/results/${slug}/`
      };
    })
    .sort((a, b) => b.dateObj - a.dateObj)
    .map((result, index) => ({
      ...result,
      colorClass: colorClasses[index % colorClasses.length]
    }));
}

/**
 * Compute BSRC Legends - top runners by various metrics
 */
function computeLegends(results, runners) {
  // Build stats for each runner (excluding guest)
  const runnerStats = {};

  Object.values(results || {}).forEach(result => {
    (result.participants || []).forEach(p => {
      const runnerId = p.runner;
      if (runnerId === 'guest') return; // Skip guests

      const runner = runners[runnerId];
      if (!runner || runner.anonymous) return; // Skip anonymous runners too

      if (!runnerStats[runnerId]) {
        runnerStats[runnerId] = {
          id: runnerId,
          name: runner.name,
          photo: runner.photo,
          totalRuns: 0,
          totalDistance: 0,
          totalTimeSeconds: 0
        };
      }

      runnerStats[runnerId].totalRuns++;
      runnerStats[runnerId].totalDistance += p.distance || 0;
      runnerStats[runnerId].totalTimeSeconds += parseTime(p.time);
    });
  });

  // Convert to array and compute derived stats
  const statsArray = Object.values(runnerStats)
    .filter(s => s.totalRuns > 0 && s.totalDistance > 0 && s.totalTimeSeconds > 0)
    .map(s => ({
      ...s,
      avgPaceSeconds: s.totalTimeSeconds / s.totalDistance,
      avgPace: calculatePace(s.totalDistance, s.totalTimeSeconds),
      totalDistanceFormatted: s.totalDistance.toFixed(1)
    }));

  if (statsArray.length === 0) {
    return { mostEvents: null, fastestPace: null, mostDistance: null };
  }

  // Sort by each metric to find tops
  const byRuns = [...statsArray].sort((a, b) => b.totalRuns - a.totalRuns);
  const byPace = [...statsArray].sort((a, b) => a.avgPaceSeconds - b.avgPaceSeconds); // Faster = lower
  const byDistance = [...statsArray].sort((a, b) => b.totalDistance - a.totalDistance);

  return {
    mostEvents: byRuns[0] ? {
      ...byRuns[0],
      stat: byRuns[0].totalRuns,
      label: 'events',
      icon: '🏃',
      color: 'pink'
    } : null,
    fastestPace: byPace[0] ? {
      ...byPace[0],
      stat: byPace[0].avgPace,
      label: 'avg pace',
      icon: '⚡',
      color: 'green'
    } : null,
    mostDistance: byDistance[0] ? {
      ...byDistance[0],
      stat: `${byDistance[0].totalDistanceFormatted}km`,
      label: 'total',
      icon: '📏',
      color: 'blue'
    } : null
  };
}

module.exports = {
  parseTime,
  formatTime,
  calculatePace,
  formatRoute,
  computeResultStats,
  enrichParticipants,
  computeRunnerStats,
  getLatestResult,
  getAllResultsSummary,
  computeLegends
};
