export interface RecordItem {
  runner: string;
  photo?: string;
  distance?: string;
  time?: string;
  value?: string;
  icon?: string;
  [key: string]: any;
}

export function computeClubRecords(
  manualRecords: RecordItem[],
  runners: Record<string, any>,
  legends: Record<string, any>
): Record<string, RecordItem[]> {
  const heldBy: Record<string, RecordItem[]> = {};

  // 1. Enrich Manual Records (All-Time PBs)
  manualRecords.forEach(r => {
    if (r.runner && runners[r.runner]) {
      r.photo = runners[r.runner].photo;
      if (!heldBy[r.runner]) heldBy[r.runner] = [];
      heldBy[r.runner].push(r);
    }
  });

  // 2. Add Legends as Records
  Object.entries(legends).forEach(([key, item]) => {
    // Legends returns single object per key (item is the object), not array
    if (item && item.runner && runners[item.runner]) {

      // Enrich with photo if missing (though compute-results might have it)
      if (!item.photo) item.photo = runners[item.runner].photo;

      if (!heldBy[item.runner]) heldBy[item.runner] = [];

      let title = "Legend";
      // Use icon from legend definition or default to trophy
      let icon = item.icon || "🏆";
      let val = "";

      if (key === 'mostEvents') { title = "Most Events"; val = `${item.totalRuns} runs`; }
      if (key === 'mostDistance') { title = "Most Distance"; val = `${item.totalDistanceFormatted}km`; }
      if (key === 'fastestPace') { title = "Fastest Pace"; val = item.avgPace || item.pace; }
      if (key === 'mostSmallLoops') { title = "Loop Legend"; val = `${item.stat} Small Loops`; }
      if (key === 'mostMediumLoops') { title = "Loop Legend"; val = `${item.stat} Medium Loops`; }
      if (key === 'mostLongLoops') { title = "Loop Legend"; val = `${item.stat} Long Loops`; }

      heldBy[item.runner].push({ distance: title, time: val, icon: icon, runner: item.runner });
    }
  });

  return heldBy;
}
