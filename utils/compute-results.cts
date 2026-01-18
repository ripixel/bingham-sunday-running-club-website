// @ts-nocheck
/**
 * compute-results.cjs
 *
 * Utility functions for computing runner stats, result summaries,
 * and enriching participant data with computed values.
 */

/**
 * Parse time string (MM:SS or HH:MM:SS) to total seconds
 * Also handles YAML sexagesimal parsing where "28:01" becomes 1681 (28*60+1)
 */
function parseTime(timeStr) {
  if (!timeStr) return 0;

  // If it's already a number, YAML likely parsed it as sexagesimal (e.g., "28:01" -> 1681)
  // In this case, the number IS the total seconds
  if (typeof timeStr === 'number') {
    return timeStr;
  }

  // Otherwise, parse the string format
  const parts = String(timeStr).split(':').map(Number);
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
 * Count PBs earned in a race from enriched participants
 * Counts gold medals (🥇) for both distance and pace
 */
function countPBsEarned(enrichedParticipants) {
  let pbCount = 0;
  (enrichedParticipants || []).forEach(p => {
    if (p.distanceMedal === '🥇') pbCount++;
    if (p.paceMedal === '🥇') pbCount++;
  });
  return pbCount;
}

/**
 * Get a deterministic color class based on runner name
 */
function getColorForRunner(name) {
  const colorClasses = ['orange', 'pink', 'green', 'blue'];
  // Simple hash based on character codes
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return colorClasses[Math.abs(hash) % colorClasses.length];
}

/**
 * Enrich participants with runner profiles and computed values
 */
function enrichParticipants(participants, runners, allResults, currentResultDate) {
  let anonymousCounter = 1;

  return (participants || []).map((p, index) => {
    const runner = runners[p.runner];
    const timeSeconds = parseTime(p.time);
    const pace = calculatePace(p.distance, timeSeconds);
    const route = formatRoute(p);
    const routeHtml = formatRouteHtml(p);

    // Handle anonymous runners
    let displayName = runner?.name || p.guestName || 'Guest';
    const isGuest = p.runner === 'guest' || !runner;
    const isAnonymous = runner?.anonymous;

    if (isAnonymous) {
      displayName = `Runner #${anonymousCounter++}`;
    }

    // Count total attendance for this runner (up to and including this result)
    const attendanceCount = countRunnerAttendance(p.runner, allResults, runner, currentResultDate);

    // Deterministic color for linked runners - use from runner JSON or generate as fallback
    const hasProfile = !!runner && !isGuest;
    const colorClass = hasProfile ? (runner?.colorClass || getColorForRunner(displayName)) : 'orange';
    const firstInitial = displayName[0]?.toUpperCase() || '?';

    // Determine if this is in the top 3 performances (gold/silver/bronze)
    let distanceMedal = null;
    let paceMedal = null;

    if (hasProfile && currentResultDate) {
      // Get all previous runs for this runner (before current result)
      const previousRuns = [];
      const currentDate = new Date(currentResultDate);

      Object.entries(allResults || {}).forEach(([slug, result]) => {
        const resultDate = new Date(result.date);
        if (resultDate < currentDate) {
          (result.participants || []).forEach(participant => {
            if (participant.runner === p.runner) {
              const runTimeSeconds = parseTime(participant.time);
              const runPaceSeconds = runTimeSeconds / (participant.distance || 1);
              previousRuns.push({
                distance: participant.distance || 0,
                paceSeconds: runPaceSeconds
              });
            }
          });
        }
      });

      const currentPaceSeconds = timeSeconds / (p.distance || 1);

      // Rank distance (higher is better)
      const allDistances = [...previousRuns.map(r => r.distance), p.distance];
      const sortedDistances = [...new Set(allDistances)].sort((a, b) => b - a);
      const distanceRank = sortedDistances.indexOf(p.distance) + 1;

      if (distanceRank === 1) distanceMedal = '🥇';
      else if (distanceRank === 2) distanceMedal = '🥈';
      else if (distanceRank === 3) distanceMedal = '🥉';

      // Rank pace (lower is better = faster)
      const allPaces = [...previousRuns.map(r => r.paceSeconds), currentPaceSeconds];
      const sortedPaces = [...new Set(allPaces)].sort((a, b) => a - b);
      const paceRank = sortedPaces.indexOf(currentPaceSeconds) + 1;

      if (paceRank === 1) paceMedal = '🥇';
      else if (paceRank === 2) paceMedal = '🥈';
      else if (paceRank === 3) paceMedal = '🥉';
    }

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
      colorClass,
      firstInitial,
      isGuest,
      isAnonymous,
      distanceMedal,
      paceMedal,
      sortOrder: isGuest ? 2 : (isAnonymous ? 1 : 0)
    };
  }).sort((a, b) => {
    // Sort: regular runners first (alphabetically), then anonymous, then guests
    if (a.sortOrder !== b.sortOrder) return a.sortOrder - b.sortOrder;
    return a.displayName.localeCompare(b.displayName);
  });
}

/**
 * Count how many times a runner has participated up to and including a specific date
 */
function countRunnerAttendance(runnerId, allResults, runner, currentResultDate) {
  let count = 0;

  // Add starting values if available
  if (runner?.startingValues?.eventsAttended) {
    count += runner.startingValues.eventsAttended;
  }

  // Parse the current result date for comparison
  const currentDate = currentResultDate ? new Date(currentResultDate) : null;

  // Count from actual results up to and including the current result date
  Object.values(allResults || {}).forEach(result => {
    // Only count results on or before the current result date
    if (currentDate && result.date) {
      const resultDate = new Date(result.date);
      if (resultDate > currentDate) return; // Skip future results
    }
    (result.participants || []).forEach(p => {
      if (p.runner === runnerId) count++;
    });
  });
  return count;
}

/**
 * Compute stats for a runner across all results
 */
function computeRunnerStats(runnerId, allResults, runner) {
  // Initialize with starting values if available
  let totalRuns = runner?.startingValues?.eventsAttended || 0;
  let totalDistance = runner?.startingValues?.totalKm || 0;

  const runHistory = [];

  // Sort results by date descending
  const sortedResults = Object.entries(allResults || {})
    .map(([slug, result]) => ({ slug, ...result, dateObj: new Date(result.date) }))
    .sort((a, b) => b.dateObj - a.dateObj);

  // Track actual race data separately
  let actualDistance = 0;
  let actualTimeSeconds = 0;

  sortedResults.forEach(result => {
    (result.participants || []).forEach(p => {
      if (p.runner === runnerId) {
        totalRuns++;
        const distance = p.distance || 0;
        const timeSeconds = parseTime(p.time);

        totalDistance += distance;
        actualDistance += distance;
        actualTimeSeconds += timeSeconds;

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
          // Format time - handle YAML sexagesimal parsing where "28:01" becomes number 1681
          time: typeof p.time === 'number' ? formatTime(p.time) : p.time,
          pace: calculatePace(p.distance, timeSeconds),
          route: formatRoute(p),
          routeHtml: formatRouteHtml(p)
        });
      }
    });
  });

  // Calculate average pace:
  // - If no actual results: use starting pace (if available)
  // - If actual results exist: calculate from actual data only
  let avgPace;
  if (runHistory.length === 0 && runner?.startingValues?.avgPace) {
    // No actual results - use starting pace
    avgPace = runner.startingValues.avgPace;
  } else if (runHistory.length > 0) {
    // Has actual results - calculate from actual data only
    avgPace = calculatePace(actualDistance, actualTimeSeconds);
  } else {
    avgPace = '--:--';
  }

  // Calculate total time for display
  // Note: This is only used for display purposes, not for pace calculation
  let totalTimeSeconds = actualTimeSeconds;
  if (runHistory.length === 0 && runner?.startingValues?.totalKm && runner?.startingValues?.avgPace) {
    // No actual results - calculate time from starting values for display
    const paceSeconds = parseTime(runner.startingValues.avgPace);
    totalTimeSeconds = paceSeconds * runner.startingValues.totalKm;
  }

  // Add top 3 performance tracking to run history
  // Process runs chronologically (oldest first) to track rankings
  const chronologicalHistory = [...runHistory].reverse();

  chronologicalHistory.forEach((run, index) => {
    const runTimeSeconds = parseTime(run.time);
    const runPaceSeconds = runTimeSeconds / (run.distance || 1);

    // Get all runs up to and including this one
    const runsUpToNow = chronologicalHistory.slice(0, index + 1);

    // Rank distance (higher is better)
    const distances = runsUpToNow.map(r => r.distance);
    const sortedDistances = [...new Set(distances)].sort((a, b) => b - a);
    const distanceRank = sortedDistances.indexOf(run.distance) + 1;

    if (distanceRank === 1) run.distanceMedal = '🥇';
    else if (distanceRank === 2) run.distanceMedal = '🥈';
    else if (distanceRank === 3) run.distanceMedal = '🥉';
    else run.distanceMedal = null;

    // Rank pace (lower is better = faster)
    const paces = runsUpToNow.map(r => {
      const t = parseTime(r.time);
      return t / (r.distance || 1);
    });
    const sortedPaces = [...new Set(paces)].sort((a, b) => a - b);
    const paceRank = sortedPaces.indexOf(runPaceSeconds) + 1;

    if (paceRank === 1) run.paceMedal = '🥇';
    else if (paceRank === 2) run.paceMedal = '🥈';
    else if (paceRank === 3) run.paceMedal = '🥉';
    else run.paceMedal = null;
  });

  // runHistory is already in descending order (newest first) since sortedResults is date-descending

  return {
    totalRuns,
    totalDistance: totalDistance.toFixed(1),
    totalTime: formatTime(totalTimeSeconds),
    avgPace,
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

  // Enrich participants and count PBs
  const enrichedParticipants = enrichParticipants(
    latest.participants,
    runners,
    results,
    latest.date
  );
  const pbsEarned = countPBsEarned(enrichedParticipants);

  return {
    ...latest,
    ...stats,
    pbsEarned,
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

  // First, initialize all runners with starting values
  Object.entries(runners || {}).forEach(([runnerId, runner]) => {
    if (runnerId === 'guest') return; // Skip guests
    if (runner.anonymous) return; // Skip anonymous runners
    if (!runner.startingValues) return; // Skip runners without starting values

    const startingRuns = runner.startingValues.eventsAttended || 0;
    const startingDistance = runner.startingValues.totalKm || 0;

    runnerStats[runnerId] = {
      id: runnerId,
      runner: runnerId,
      name: runner.name,
      photo: runner.photo,
      totalRuns: startingRuns,
      totalDistance: startingDistance,
      actualDistance: 0,
      actualTimeSeconds: 0,
      hasActualResults: false,
      startingPace: runner.startingValues.avgPace || null
    };
  });

  // Then, process actual race results
  Object.values(results || {}).forEach(result => {
    (result.participants || []).forEach(p => {
      const runnerId = p.runner;
      if (runnerId === 'guest') return; // Skip guests

      const runner = runners[runnerId];
      if (!runner || runner.anonymous) return; // Skip anonymous runners too

      if (!runnerStats[runnerId]) {
        // Initialize runner if not already in stats (no starting values)
        runnerStats[runnerId] = {
          id: runnerId,
          runner: runnerId,
          name: runner.name,
          photo: runner.photo,
          totalRuns: 0,
          totalDistance: 0,
          actualDistance: 0,
          actualTimeSeconds: 0,
          hasActualResults: false,
          startingPace: null,
          smallLoops: 0,
          mediumLoops: 0,
          longLoops: 0
        };
      }

      const distance = p.distance || 0;
      const timeSeconds = parseTime(p.time);

      runnerStats[runnerId].totalRuns++;
      runnerStats[runnerId].totalDistance += distance;
      runnerStats[runnerId].actualDistance += distance;
      runnerStats[runnerId].actualTimeSeconds += timeSeconds;
      runnerStats[runnerId].hasActualResults = true;
      runnerStats[runnerId].smallLoops += p.smallLoops || 0;
      runnerStats[runnerId].mediumLoops += p.mediumLoops || 0;
      runnerStats[runnerId].longLoops += p.longLoops || 0;
    });
  });

  // Convert to array and compute derived stats
  const statsArray = Object.values(runnerStats)
    .filter(s => s.totalRuns > 0 && s.totalDistance > 0)
    .map(s => {
      // Calculate average pace:
      // - If no actual results: use starting pace (if available)
      // - If actual results exist: calculate from actual data only
      let avgPaceSeconds;
      let avgPace;

      if (!s.hasActualResults && s.startingPace) {
        // No actual results - use starting pace
        avgPace = s.startingPace;
        avgPaceSeconds = parseTime(s.startingPace);
      } else if (s.hasActualResults && s.actualDistance > 0 && s.actualTimeSeconds > 0) {
        // Has actual results - calculate from actual data only
        avgPaceSeconds = s.actualTimeSeconds / s.actualDistance;
        avgPace = calculatePace(s.actualDistance, s.actualTimeSeconds);
      } else {
        // No valid data for pace calculation
        avgPaceSeconds = Infinity;
        avgPace = '--:--';
      }

      return {
        ...s,
        avgPaceSeconds,
        avgPace,
        totalDistanceFormatted: s.totalDistance.toFixed(1)
      };
    })
    .filter(s => s.avgPaceSeconds !== Infinity); // Filter out runners without valid pace

  if (statsArray.length === 0) {
    return { mostEvents: null, fastestPace: null, mostDistance: null };
  }

  // Sort by each metric to find tops
  const byRuns = [...statsArray].sort((a, b) => b.totalRuns - a.totalRuns);
  const byPace = [...statsArray].sort((a, b) => a.avgPaceSeconds - b.avgPaceSeconds); // Faster = lower
  const byDistance = [...statsArray].sort((a, b) => b.totalDistance - a.totalDistance);

  // Sort by loop types for loop champions
  const bySmallLoops = [...statsArray].filter(s => s.smallLoops > 0).sort((a, b) => b.smallLoops - a.smallLoops);
  const byMediumLoops = [...statsArray].filter(s => s.mediumLoops > 0).sort((a, b) => b.mediumLoops - a.mediumLoops);
  const byLongLoops = [...statsArray].filter(s => s.longLoops > 0).sort((a, b) => b.longLoops - a.longLoops);

  return {
    mostEvents: byRuns[0] ? {
      ...byRuns[0],
      stat: byRuns[0].totalRuns,
      label: 'events',
      icon: '🏃',
      color: 'pink',
      firstInitial: byRuns[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(byRuns[0].name || '')
    } : null,
    fastestPace: byPace[0] ? {
      ...byPace[0],
      stat: byPace[0].avgPace,
      label: 'avg pace',
      icon: '⚡',
      color: 'green',
      firstInitial: byPace[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(byPace[0].name || '')
    } : null,
    mostDistance: byDistance[0] ? {
      ...byDistance[0],
      stat: `${byDistance[0].totalDistanceFormatted}km`,
      label: 'total',
      icon: '📏',
      color: 'blue',
      firstInitial: byDistance[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(byDistance[0].name || '')
    } : null,
    mostSmallLoops: bySmallLoops[0] ? {
      ...bySmallLoops[0],
      stat: bySmallLoops[0].smallLoops,
      label: 'small loops',
      icon: '🩷',
      color: 'pink',
      firstInitial: bySmallLoops[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(bySmallLoops[0].name || '')
    } : null,
    mostMediumLoops: byMediumLoops[0] ? {
      ...byMediumLoops[0],
      stat: byMediumLoops[0].mediumLoops,
      label: 'medium loops',
      icon: '💚',
      color: 'green',
      firstInitial: byMediumLoops[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(byMediumLoops[0].name || '')
    } : null,
    mostLongLoops: byLongLoops[0] ? {
      ...byLongLoops[0],
      stat: byLongLoops[0].longLoops,
      label: 'long loops',
      icon: '💙',
      color: 'blue',
      firstInitial: byLongLoops[0].name?.[0]?.toUpperCase() || '?',
      colorClass: getColorForRunner(byLongLoops[0].name || '')
    } : null
  };
}

module.exports = {
  parseTime,
  formatTime,
  calculatePace,
  formatRoute,
  computeResultStats,
  countPBsEarned,
  enrichParticipants,
  computeRunnerStats,
  getLatestResult,
  getAllResultsSummary,
  computeLegends
};
