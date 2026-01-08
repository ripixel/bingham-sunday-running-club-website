
/**
 * compute-runs.js
 *
 * Takes the raw content object (containing pages, events, etc.)
 * and returns { nextRun, eventsList } for use in templates.
 */

function getNextSunday(date) {
  const d = new Date(date);
  d.setDate(d.getDate() + (7 - d.getDay()) % 7);
  // If today is Sunday, move to next Sunday if it's already past run time?
  // For simplicity, let's say "upcoming" means from *now*.
  // If today is Sunday and it's 8am, today is the run.
  // If today is Sunday and it's 8pm, next Sunday is the run.
  // We'll set the time to 9:00 AM for the run.
  d.setHours(9, 0, 0, 0);

  // If the resulting date is in the past, add 7 days
  if (d < new Date()) {
    d.setDate(d.getDate() + 7);
  }
  return d;
}

function computeRuns(content) {
  const recurringRunDef = content.pages.about?.meeting || {
    when: "Every Sunday @ 9:00 AM",
    where: "Bingham Market Place",
    distance: "5-10km (your choice!)",
    after: "Brunch at a local café ☕"
  };

  const specialEvents = Object.values(content.events || {}).map(event => ({
    ...event,
    isSpecial: true,
    dateObj: new Date(event.date)
  }));

  // Generate next 12 Sundays
  const recurringRuns = [];
  let currentDate = new Date();

  // Start from next upcoming Sunday
  let nextSunday = getNextSunday(currentDate);

  for (let i = 0; i < 12; i++) {
    const runDate = new Date(nextSunday);
    runDate.setDate(nextSunday.getDate() + (i * 7));
    runDate.setHours(9, 0, 0, 0);

    recurringRuns.push({
      title: "Sunday Club Run",
      date: runDate.toISOString(),
      dateObj: runDate,
      location: recurringRunDef.where,
      distance: recurringRunDef.distance, // Explicit distance field
      body: `Join us for our regular Sunday run! ${recurringRunDef.distance}`, // Standardize body
      description: recurringRunDef.distance, // Keep for backward compat or specific UI use if needed
      isSpecial: false
    });
  }

  // Merge and Sort
  // We want to replace a recurring run with a special event if they are on the same day?
  // Or just show all?
  // Let's list all, but if dates match, maybe the special event takes precedence?
  // For now, let's just combine and sort by date.

  const allRuns = [...recurringRuns, ...specialEvents];

  // Filter out past runs (allow runs from today if they haven't happened yet? handled by generation logic mostly)
  // But special events might be old.
  const now = new Date();
  const upcomingRuns = allRuns.filter(run => run.dateObj > now);

  // Sort by date ascending
  upcomingRuns.sort((a, b) => a.dateObj - b.dateObj);

  // Next Run is the first one
  const nextRun = upcomingRuns[0];

  // Calendar is the list (let's say next 10 items)
  const eventsList = upcomingRuns.slice(0, 10).map(run => ({
    ...run,
    // Format date for display if needed here, or let Handlebars do it (better in Handlebars usually, but we might want pre-formatted strings)
    displayDate: run.dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
    displayTime: run.dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    // Color coding for calendar
    color: run.isSpecial ? "pink" : "blue"
  }));

  if (nextRun) {
    nextRun.displayDate = nextRun.dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' });
    nextRun.displayTime = nextRun.dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' });
  }

  return {
    nextRun,
    eventsList
  };
}

module.exports = { computeRuns };
