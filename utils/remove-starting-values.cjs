#!/usr/bin/env node
// @ts-check

/**
 * Remove startingValues from runner JSON files
 * (since historical events are now tracked as actual results)
 */

const fs = require('fs');
const path = require('path');

const runnersDir = path.join(__dirname, '../content/runners');

const files = fs.readdirSync(runnersDir).filter(f => f.endsWith('.json'));

for (const file of files) {
  const filePath = path.join(runnersDir, file);
  const data = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

  if (data.startingValues) {
    console.log(`Removing startingValues from ${file}`);
    delete data.startingValues;
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
  }
}

console.log('Done!');
