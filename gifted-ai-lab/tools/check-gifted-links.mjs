import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const repoDir = path.resolve(labDir, '..');
const failures = [];
const checks = [];

function record(ok, type, target, detail = '') {
  checks.push({ ok, type, target, detail });
  if (!ok) failures.push(`${type}: ${target}${detail ? ` (${detail})` : ''}`);
}

function walk(directory, extension) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const full = path.join(directory, entry.name);
    if (entry.isDirectory()) return walk(full, extension);
    return !extension || full.endsWith(extension) ? [full] : [];
  });
}

const offline = JSON.parse(fs.readFileSync(path.join(labDir, 'offline-manifest.json'), 'utf8'));
for (const asset of offline.assets) {
  let target = path.resolve(repoDir, asset.replace(/^\.\//, ''));
  if (asset.endsWith('/')) target = path.join(target, 'index.html');
  record(fs.existsSync(target), 'offline asset', asset);
}

for (const htmlPath of walk(labDir, '.html')) {
  const html = fs.readFileSync(htmlPath, 'utf8');
  for (const match of html.matchAll(/(?:href|src)=["']([^"']+)["']/g)) {
    const raw = match[1];
    if (/^(?:https?:|data:|mailto:|javascript:|#)/i.test(raw) || raw.includes('${')) continue;
    const clean = decodeURIComponent(raw.split(/[?#]/)[0]);
    if (!clean) continue;
    let target = path.resolve(path.dirname(htmlPath), clean);
    if (clean.endsWith('/')) target = path.join(target, 'index.html');
    record(fs.existsSync(target), 'internal link', path.relative(repoDir, htmlPath), raw);
  }
}

const weeks = ['03', '06', '09', '12', '15', '18', '21', '24', '27', '30'];
for (const code of weeks) {
  for (const file of ['index.html', 'lecture-slides.html', 'classroom-pack.html', 'student-task.html', 'teacher-pack.pdf', 'video.mp4', 'video-captions.srt']) {
    record(fs.existsSync(path.join(labDir, `week-${code}`, file)), 'week core', `week-${code}/${file}`);
  }
  record(fs.existsSync(path.join(labDir, 'youtube', `week-${code}`, 'transcript.json')), 'transcript', `week-${code}`);
  for (const file of ['depth-source.md', 'depth-infographic.png', 'depth-slides.pdf', 'depth-video.mp4', 'depth-video-captions.srt', 'depth-video-transcript.txt']) {
    const target = path.join(labDir, `week-${code}`, file);
    record(fs.existsSync(target) && fs.statSync(target).size > 0, 'depth resource', `week-${code}/${file}`);
  }
}

const depthArtifacts = JSON.parse(fs.readFileSync(path.join(labDir, 'notebook-depth-artifacts.json'), 'utf8'));
record(depthArtifacts.length === weeks.length, 'NotebookLM depth count', String(depthArtifacts.length));
for (const item of depthArtifacts) {
  record(Boolean(item.source_id && item.infographic_id && item.slides_id && item.video_delivery), 'NotebookLM depth metadata', `week-${String(item.week).padStart(2, '0')}`);
}

const verification = JSON.parse(fs.readFileSync(path.join(labDir, 'youtube', 'verification.json'), 'utf8'));
record(verification.length === 11, 'YouTube count', String(verification.length));
for (const item of verification) {
  record(item.privacy === 'public' && item.caption_status === 'serving' && item.has_cockpit_link && item.has_chapters, 'YouTube publish', item.slug);
}

const publicText = walk(labDir).filter((file) => /\.(?:html|js|css|md|json|txt|srt)$/i.test(file)).map((file) => fs.readFileSync(file, 'utf8')).join('\n');
for (const forbidden of ['新明國小', '黃凱陽']) record(!publicText.includes(forbidden), 'forbidden text', forbidden);

const report = {
  checked_at: new Date().toISOString(),
  total: checks.length,
  passed: checks.filter((item) => item.ok).length,
  failed: failures.length,
  failures,
};
fs.writeFileSync(path.join(labDir, 'health-report.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');
console.log(`Gifted lab health: ${report.passed}/${report.total} passed`);
if (failures.length) {
  console.error(failures.join('\n'));
  process.exit(1);
}
