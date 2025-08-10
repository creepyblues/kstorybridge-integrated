import fs from 'fs';
import path from 'path';

function loadJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

function summarize(res) {
  if (!res || !res.data) return {};
  const d = res.data;
  return {
    title: d.title_name_kr || d.title_name_en || 'N/A',
    image: d.title_image || 'N/A',
    format: d.content_format || 'N/A',
    author: d.author || d.writer || 'N/A',
    genre: d.genre || 'N/A',
  };
}

function diffSummary(a, b) {
  const diffs = [];
  for (const key of ['title','image','format','author','genre']) {
    if (a[key] !== b[key]) diffs.push(`${key}: '${a[key]}' -> '${b[key]}'`);
  }
  return diffs;
}

async function run() {
  const [goldenDirArg, currentDirArg] = process.argv.slice(2);
  if (!goldenDirArg || !currentDirArg) {
    console.error('Usage: node backend/src/compareSnapshots.js <goldenDir> <currentRunDir>');
    process.exit(1);
  }
  const goldenDir = path.resolve(process.cwd(), goldenDirArg);
  const currentDir = path.resolve(process.cwd(), currentDirArg);

  const goldenFiles = fs.readdirSync(goldenDir).filter(f => f.endsWith('-result.json'));
  const currentFiles = fs.readdirSync(currentDir).filter(f => f.endsWith('-result.json'));

  // Build domain->file maps using filename pattern: <stamp>-<domain>-result.json
  const extractDomainKey = (file) => file.replace(/^[^-]+-/, '').replace(/-result\.json$/, '');
  const goldenMap = new Map(goldenFiles.map(f => [extractDomainKey(f), f]));
  const currentMap = new Map(currentFiles.map(f => [extractDomainKey(f), f]));

  let failures = 0;
  for (const [domainKey, g] of goldenMap.entries()) {
    const current = currentMap.get(domainKey);
    if (!current) { console.log(`⚠️ Missing current snapshot for ${g}`); failures++; continue; }

    const gJson = loadJson(path.join(goldenDir, g));
    const cJson = loadJson(path.join(currentDir, current));
    const gSum = summarize(gJson); const cSum = summarize(cJson);

    const diffs = diffSummary(gSum, cSum);
    const mustMatch = ['title','image','format'];
    const hardDiffs = diffs.filter(d => mustMatch.some(k => d.startsWith(`${k}:`)));

    if (hardDiffs.length > 0) {
      console.log(`❌ Regression for ${domainKey}:`);
      hardDiffs.forEach(d => console.log('  - ' + d));
      failures++;
    } else {
      console.log(`✅ OK for ${domainKey}`);
    }
  }

  if (failures > 0) {
    process.exit(2);
  }
}

run();
