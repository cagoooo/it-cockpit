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
const lessonVideoManifestPath = path.join(labDir, 'lesson-video-manifest.json');
record(fs.existsSync(lessonVideoManifestPath), 'lesson video manifest', 'lesson-video-manifest.json');
const lessonVideoManifest = fs.existsSync(lessonVideoManifestPath)
  ? JSON.parse(fs.readFileSync(lessonVideoManifestPath, 'utf8').replace(/^\uFEFF/, ''))
  : { items: {} };
record(Object.keys(lessonVideoManifest.items || {}).length === weeks.length && !('upload' in (lessonVideoManifest.items?.['3'] || {})), 'lesson video manifest scope', '10 weekly packages');
record(fs.existsSync(path.join(labDir, 'lesson-video-data.js')) && fs.existsSync(path.join(labDir, 'lesson-videos', 'notebooklm-mcp-run.json')), 'lesson video generated data', 'data and NotebookLM MCP record');
const annualIndex = fs.readFileSync(path.join(labDir, 'index.html'), 'utf8');
record(annualIndex.includes('visualCourseGrid') && annualIndex.includes('lesson-visual-strip'), 'visual course picker', 'index.html');
record(fs.readFileSync(path.join(labDir, 'week-cockpit.js'), 'utf8').includes('visual-learning-wall'), 'visual learning wall', 'week-cockpit.js');
for (const file of ['reports.html', 'reports.js', 'reports.css', 'sync-status.html', 'sync-status.js', 'sync-status.css', 'course-version-manifest.json', 'version-matrix.md', 'week-phase-six.js', 'week-phase-six.css', 'gifted-visual-system.css', 'picture-inquiry.js', 'teacher-sync.js', 'preflight.html', 'preflight.js', 'preflight.css', 'version.json', 'source-credits.html', 'source-attribution.js', 'source-attribution.css', 'day-of-ai-adaptations.js', 'day-of-ai-lessons.js', 'day-of-ai-lessons.css', 'resource-library.html', 'resource-library.js', 'resource-library.css', 'day-of-ai-resource-data.js']) {
  record(fs.existsSync(path.join(labDir, file)), 'phase six core', file);
}
const adaptationSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'day-of-ai-adaptations.js'), 'utf8'), adaptationSandbox);
const adaptations = adaptationSandbox.window.DAY_OF_AI_ADAPTATIONS || {};
const dayArtifacts = JSON.parse(fs.readFileSync(path.join(labDir, 'notebook-day-of-ai-artifacts.json'), 'utf8'));
record(dayArtifacts.length === 5 && dayArtifacts.every((item) => item.source_id && item.report_id && item.quiz_id && item.status === 'completed'), 'Day of AI NotebookLM artifacts', '5 weekly notebooks');
const resourceSandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'day-of-ai-resource-data.js'), 'utf8'), resourceSandbox);
const resources = resourceSandbox.window.DAY_OF_AI_RESOURCES || [];
const requiredResourceIds = [
  'course-folder', 'teacher-training-slides-folder', 'learning-assessment-folder', 'teacher-guide', 'quiz', 'vocabulary',
  'lesson-1-slides', 'lesson-1-sheet', 'lesson-1-practice', 'lesson-1-question-card',
  'aibo-video', 'waymo-video', 'google-maps', 'cwa-weather-app', 'chatgpt-observation', 'ai-five-big-ideas',
  'quickdraw-intro', 'quickdraw-play', 'quickdraw-data', 'quickdraw-bread-data', 'quickdraw-house-data', 'drawing-template',
  'lesson-2-slides', 'lesson-2-practice', 'lesson-2-question-card',
  'lesson-3-slides', 'lesson-3-practice', 'lesson-3-question-card', 'lesson-23-sheet',
  'lesson-4-slides', 'lesson-4-practice', 'lesson-4-question-card',
  'lesson-5-slides', 'lesson-5-practice', 'lesson-5-question-card', 'lesson-45-sheet',
  'algorithm-extension', 'terms',
];
record(resources.length === 38 && resourceSandbox.window.DAY_OF_AI_RESOURCE_META?.total === resources.length && requiredResourceIds.every((id) => resources.some((item) => item.id === id)), 'Day of AI resource library', '38 source links');
record(new Set(resources.map((item) => item.id)).size === resources.length && resources.every((item) => item.url.startsWith('https://') && item.weeks.length), 'Day of AI resource data', 'unique secure weekly links');
for (const week of [3, 6, 9, 12, 15]) {
  const item = adaptations[week];
  record(Boolean(item && item.scenarios?.length === 3 && item.steps?.length === 4 && item.prompts?.length === 3 && item.links?.length >= 2), 'Day of AI adaptation', `week-${String(week).padStart(2, '0')}`);
  record(fs.readFileSync(path.join(labDir, `week-${String(week).padStart(2, '0')}`, 'index.html'), 'utf8').includes('day-of-ai-lessons.js'), 'Day of AI cockpit', `week-${String(week).padStart(2, '0')}`);
}
const sourcePage = fs.readFileSync(path.join(labDir, 'source-credits.html'), 'utf8');
record(sourcePage.includes('CC BY-NC-SA 4.0') && sourcePage.includes('Day of AI') && sourcePage.includes('無官方合作、認證或背書'), 'source attribution', 'source-credits.html');
for (const code of ['03', '06', '09', '12', '15']) {
  for (const file of ['index.html', 'classroom-pack.html', 'student-task.html']) {
    record(fs.readFileSync(path.join(labDir, `week-${code}`, file), 'utf8').includes('source-attribution.js'), 'source attribution', `week-${code}/${file}`);
  }
}
for (const code of weeks) {
  for (const file of ['index.html', 'lecture-slides.html', 'classroom-pack.html', 'student-task.html', 'student-guide.md', 'student-warmup.md', 'student-review.md', 'teacher-pack.pdf', 'video.mp4', 'video-captions.srt']) {
    record(fs.existsSync(path.join(labDir, `week-${code}`, file)), 'week core', `week-${code}/${file}`);
  }
  record(fs.existsSync(path.join(labDir, 'youtube', `week-${code}`, 'transcript.json')), 'transcript', `week-${code}`);
  for (const file of ['depth-source.md', 'depth-infographic.png', 'depth-infographic.webp', 'depth-slides.pdf', 'depth-video.mp4', 'depth-video-captions.srt', 'depth-video-transcript.txt', 'student-video-card.html', 'student-video-card.png', 'student-video-card.webp']) {
    const target = path.join(labDir, `week-${code}`, file);
    record(fs.existsSync(target) && fs.statSync(target).size > 0, 'depth resource', `week-${code}/${file}`);
  }
  record(fs.existsSync(path.join(labDir, `week-${code}`, 'student-infographic.png')), 'student infographic PNG', `week-${code}`);
  record(fs.existsSync(path.join(labDir, `week-${code}`, 'student-infographic.webp')), 'student infographic WebP', `week-${code}`);
  const illustration = path.join(labDir, `week-${code}`, 'week-illustration.webp');
  record(fs.existsSync(illustration) && fs.statSync(illustration).size > 0, 'picture-book illustration', `week-${code}`);
  const lessonVideo = lessonVideoManifest.items?.[String(Number(code))];
  record(Boolean(lessonVideo && lessonVideo.format === '9:16' && lessonVideo.captions_burned_in === true && !lessonVideo.upload_checklist), 'lesson video metadata', `week-${code}`);
  for (const file of ['lesson-video.mp4', 'captions.srt', 'captions.vtt', 'captions.ass', 'cover.webp', 'transcript.txt', 'description.txt']) {
    const target = path.join(labDir, 'lesson-videos', `week-${code}`, file);
    record(fs.existsSync(target) && fs.statSync(target).size > 0, 'lesson video package', `week-${code}/${file}`);
  }
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
