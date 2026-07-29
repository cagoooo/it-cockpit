import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
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
for (const file of ['reports.html', 'reports.js', 'reports.css', 'sync-status.html', 'sync-status.js', 'sync-status.css', 'course-version-manifest.json', 'version-matrix.md', 'week-phase-six.js', 'week-phase-six.css']) {
  record(fs.existsSync(path.join(labDir, file)), 'phase six core', file);
}
for (const code of weeks) {
  for (const file of ['index.html', 'lecture-slides.html', 'classroom-pack.html', 'student-task.html', 'student-guide.md', 'student-warmup.md', 'student-review.md', 'teacher-pack.pdf', 'video.mp4', 'video-captions.srt']) {
    record(fs.existsSync(path.join(labDir, `week-${code}`, file)), 'week core', `week-${code}/${file}`);
  }
  record(fs.existsSync(path.join(labDir, 'youtube', `week-${code}`, 'transcript.json')), 'transcript', `week-${code}`);
  for (const file of ['depth-source.md', 'depth-infographic.png', 'depth-slides.pdf', 'depth-video.mp4', 'depth-video-captions.srt', 'depth-video-transcript.txt', 'student-video-card.html', 'student-video-card.png']) {
    const target = path.join(labDir, `week-${code}`, file);
    record(fs.existsSync(target) && fs.statSync(target).size > 0, 'depth resource', `week-${code}/${file}`);
  }
  record(fs.existsSync(path.join(labDir, `week-${code}`, 'student-infographic.png')), 'student infographic', `week-${code}`);
}

const studentSandbox = { window: {} };
for (const file of ['week-data.js', 'week-enrichment.js', 'week-depth-data.js', 'week-student-language.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(labDir, file), 'utf8'), studentSandbox);
}
const studentText = JSON.stringify({
  weeks: studentSandbox.window.GIFTED_WEEKS,
  enrichment: studentSandbox.window.GIFTED_ENRICHMENT,
  depth: studentSandbox.window.GIFTED_DEPTH,
});
for (const hardTerm of ['表徵與推理', '利害關係人', '控制變因', '可解釋性', '資料最小化', '最小可行原型', '改版優先矩陣', '操作型定義', '壓力測試', '迭代', '辯證', '研究者｜', '進階｜', '基礎｜']) {
  record(!studentText.includes(hardTerm), 'student language', hardTerm);
}
record((studentSandbox.window.GIFTED_WEEKS || []).every((item) => item.goal.length <= 55), 'student language', 'short weekly goals');

const depthArtifacts = JSON.parse(fs.readFileSync(path.join(labDir, 'notebook-depth-artifacts.json'), 'utf8'));
record(depthArtifacts.length === weeks.length, 'NotebookLM depth count', String(depthArtifacts.length));
for (const item of depthArtifacts) {
  record(Boolean(item.source_id && item.infographic_id && item.slides_id && item.video_delivery), 'NotebookLM depth metadata', `week-${String(item.week).padStart(2, '0')}`);
}

const studentSources = JSON.parse(fs.readFileSync(path.join(labDir, 'notebook-student-sources.json'), 'utf8'));
record(studentSources.length === weeks.length, 'NotebookLM student source count', String(studentSources.length));
for (const item of studentSources) {
  record(Boolean(item.notebook_id && item.student_source_id && item.infographic_id && item.infographic_status === 'completed'), 'NotebookLM student source', `week-${String(item.week).padStart(2, '0')}`);
}

const versionManifest = JSON.parse(fs.readFileSync(path.join(labDir, 'course-version-manifest.json'), 'utf8'));
record(versionManifest.weeks?.length === weeks.length, 'course version week count', String(versionManifest.weeks?.length || 0));
record(versionManifest.formal_plan?.teacher === '黃凱揚老師' && versionManifest.formal_plan?.sessions === 20, 'course version formal plan', 'teacher and sessions');
for (const item of versionManifest.weeks || []) record(item.status === 'ready', 'course version status', `week-${String(item.week).padStart(2, '0')}`);

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
