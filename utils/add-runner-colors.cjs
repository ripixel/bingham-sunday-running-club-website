/**
 * Script to add colorClass to runner JSON files.
 * Generates a deterministic color if not already present.
 */

const fs = require('fs');
const path = require('path');

const RUNNERS_DIR = path.join(__dirname, '../content/runners');
const COLOR_CLASSES = ['orange', 'pink', 'green', 'blue'];

function getColorForRunner(name) {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = ((hash << 5) - hash) + name.charCodeAt(i);
    hash = hash & hash;
  }
  return COLOR_CLASSES[Math.abs(hash) % COLOR_CLASSES.length];
}

function addColorToRunners() {
  const files = fs.readdirSync(RUNNERS_DIR).filter(f => f.endsWith('.json'));

  files.forEach(file => {
    const filePath = path.join(RUNNERS_DIR, file);
    const runner = JSON.parse(fs.readFileSync(filePath, 'utf8'));

    // Skip if already has colorClass
    if (runner.colorClass) {
      console.log(`✓ ${file} already has colorClass: ${runner.colorClass}`);
      return;
    }

    // Generate color based on runner name
    const color = getColorForRunner(runner.name || runner.id);
    runner.colorClass = color;

    // Write back with sorted keys for consistency
    fs.writeFileSync(filePath, JSON.stringify(runner, null, 2) + '\n');
    console.log(`✓ ${file} added colorClass: ${color}`);
  });

  console.log('\nDone! All runners now have colorClass defined.');
}

addColorToRunners();
