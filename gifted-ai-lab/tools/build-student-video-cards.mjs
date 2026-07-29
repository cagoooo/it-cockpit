import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const sandbox = { window: {} };
for (const file of ['week-data.js', 'week-enrichment.js', 'week-depth-data.js', 'week-student-language.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(labDir, file), 'utf8'), sandbox);
}

const chromeCandidates = [
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('Chrome or Edge is required to render student video cards.');

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));
const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'gifted-student-card-'));

try {
  for (const item of sandbox.window.GIFTED_WEEKS) {
    const code = String(item.week).padStart(2, '0');
    const folder = path.join(labDir, `week-${code}`);
    const glossary = sandbox.window.GIFTED_GLOSSARY[item.week] || [];
    const htmlPath = path.join(folder, 'student-video-card.html');
    const outputPath = path.join(folder, 'student-video-card.png');
    const html = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}body{width:1280px;height:720px;margin:0;overflow:hidden;background:#f7f3e8;color:#15383c;font-family:"Microsoft JhengHei",sans-serif}main{height:100%;padding:40px 52px;display:grid;grid-template-rows:auto auto 1fr;gap:20px}.top{display:flex;justify-content:space-between;align-items:flex-start;gap:24px;border-bottom:4px solid #15383c;padding-bottom:18px}.week{color:#de5c46;font-size:20px;font-weight:900}.top h1{margin:5px 0 0;font-size:44px;line-height:1.15;letter-spacing:0}.badge{flex:0 0 auto;background:#f1bd45;padding:10px 16px;border-radius:6px;font-weight:900;font-size:22px}.goal{font-size:25px;line-height:1.45;margin:0}.content{display:grid;grid-template-columns:1fr 1.15fr;gap:18px}.panel{background:#fffdf8;border:1px solid #cbd6d2;border-radius:7px;padding:22px}.panel h2{margin:0 0 14px;color:#168277;font-size:25px;letter-spacing:0}.words{display:grid;gap:10px}.word{border-left:6px solid #3575a7;padding:9px 13px;background:#edf4f7}.word b{display:block;font-size:20px}.word span{display:block;font-size:18px;line-height:1.4}.steps{display:grid;gap:10px}.step{display:grid;grid-template-columns:44px 1fr;gap:12px;align-items:start;padding:9px 0;border-bottom:1px solid #dce3df;font-size:20px;line-height:1.4}.step:last-child{border-bottom:0}.step b{width:40px;height:40px;display:grid;place-items:center;border-radius:50%;background:#de5c46;color:#fff;font-size:20px}.footer{position:absolute;right:52px;bottom:18px;color:#526a6d;font-size:14px;font-weight:700}
</style></head><body><main><header class="top"><div><div class="week">WEEK ${code} · 石門智繪客</div><h1>${escapeHtml(item.title)}</h1></div><div class="badge">中年級好懂版</div></header><p class="goal">${escapeHtml(item.goal)}</p><div class="content"><section class="panel"><h2>難詞小幫手</h2><div class="words">${glossary.map(([term, meaning]) => `<div class="word"><b>${escapeHtml(term)}</b><span>${escapeHtml(meaning)}</span></div>`).join('')}</div></section><section class="panel"><h2>今天一步一步做</h2><div class="steps">${item.student.slice(0, 3).map((step, index) => `<div class="step"><b>${index + 1}</b><span>${escapeHtml(step)}</span></div>`).join('')}</div></section></div><div class="footer">黃凱揚老師｜桃園市龍潭區石門國民小學</div></main></body></html>`;
    fs.writeFileSync(htmlPath, html, 'utf8');
    const result = spawnSync(chrome, [
      '--headless=new', '--disable-gpu', '--hide-scrollbars', '--force-device-scale-factor=1',
      '--window-size=1280,720', `--user-data-dir=${tempProfile}`, `--screenshot=${outputPath}`,
      pathToFileURL(htmlPath).href,
    ], { encoding: 'utf8', stdio: 'pipe' });
    if (result.status !== 0 || !fs.existsSync(outputPath)) throw new Error(`Failed to render W${code}: ${result.stderr}`);
    console.log(`Built W${code} student video card.`);
  }
} finally {
  fs.rmSync(tempProfile, { recursive: true, force: true });
}
