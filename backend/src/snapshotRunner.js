import fs from 'fs';
import path from 'path';

async function run() {
  const svc = (await import('./services/scraperService.js')).default;
  const urls = process.argv.slice(2);
  if (urls.length === 0) {
    console.error('Usage: node backend/src/snapshotRunner.js <url1> <url2> ...');
    process.exit(1);
  }

  const outDir = path.resolve(process.cwd(), 'backend', 'snapshots');
  const ts = new Date();
  const stamp = ts.toISOString().replace(/[-:T]/g, '').slice(0, 15);
  if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

  for (const url of urls) {
    const domain = new URL(url).hostname.replace(/^www\./, '').replace(/[^a-z0-9.]/gi, '_');
    const base = `${stamp}-${domain}`;
    try {
      const res = await svc.scrapeTitle(url);
      const jsonPath = path.join(outDir, `${base}-result.json`);
      const logPath = path.join(outDir, `${base}-logs.txt`);
      fs.writeFileSync(jsonPath, JSON.stringify(res, null, 2));
      fs.writeFileSync(logPath, (res.logs || []).join('\n'));
      console.log(`✅ Wrote ${path.relative(process.cwd(), jsonPath)} and ${path.relative(process.cwd(), logPath)}`);
    } catch (e) {
      const errPath = path.join(outDir, `${base}-error.txt`);
      fs.writeFileSync(errPath, String(e && e.message ? e.message : e));
      console.log(`❌ Failed ${url} -> ${path.relative(process.cwd(), errPath)}`);
    }
  }
}

run();
