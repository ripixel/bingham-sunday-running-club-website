
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
  // Use the new CMS settings for recurring runs
  // Fallback to about page location if settings missing (migration safety)
  const recurringSettings = content.settings['recurring-run'] || {
    title: "☕ Sunday Run & Breakfast",
    defaultLocation: content.pages.about?.location?.meeting?.where || "Bingham Market Place",
    description: "Join us for our regular Sunday run! Do as many laps as you want—there is no minimum! Breakfast and coffee at Gilt afterwards.",
    loopDistances: { small: 0.8, medium: 1.0, long: 1.2 } // Fallback defaults
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
  const nextSunday = getNextSunday(currentDate);

  for (let i = 0; i < 21; i++) {
    const runDate = new Date(nextSunday);
    runDate.setDate(nextSunday.getDate() + (i * 7));
    runDate.setHours(9, 0, 0, 0);

    // Check for "clash" with special events
    // A clash is a special event on the same Sunday that starts before 10:00 AM
    const hasClash = specialEvents.some(event => {
      const isSameDay = event.dateObj.getFullYear() === runDate.getFullYear() &&
        event.dateObj.getMonth() === runDate.getMonth() &&
        event.dateObj.getDate() === runDate.getDate();
      const isBefore10AM = event.dateObj.getHours() < 10;
      return isSameDay && isBefore10AM;
    });

    if (hasClash) {
      continue; // Skip the regular Sunday run if there's a clash
    }

    recurringRuns.push({
      title: recurringSettings.title,
      date: runDate.toISOString(),
      dateObj: runDate,
      location: recurringSettings.defaultLocation,
      // distance: recurringRunDef.distance, // Removed explicit distance as it's variable
      body: recurringSettings.description,
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
  // Calendar is the list (let's say next 10 items)
  let specialEventIndex = 0;

  const eventsList = upcomingRuns.slice(0, 21).map(run => {
    let color = 'blue';

    if (run.isSpecial) {
      const colors = ['pink', 'green'];
      color = colors[specialEventIndex % colors.length];
      specialEventIndex++;
    }

    return {
      ...run,
      // Format date for display if needed here, or let Handlebars do it (better in Handlebars usually, but we might want pre-formatted strings)
      displayDate: run.dateObj.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long' }),
      displayTime: run.dateObj.toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
      // Color coding for calendar
      color
    };
  });

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
