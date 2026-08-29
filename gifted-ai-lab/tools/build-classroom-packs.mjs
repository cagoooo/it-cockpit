import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const repoDir = path.resolve(labDir, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-student-language.js'), 'utf8'), sandbox);
const weeks = sandbox.window.GIFTED_WEEKS;
const youtube = JSON.parse(fs.readFileSync(path.join(labDir, 'youtube', 'manifest.json'), 'utf8'));
const playlistPath = path.join(labDir, 'youtube', 'playlist.json');
const playlist = fs.existsSync(playlistPath) ? JSON.parse(fs.readFileSync(playlistPath, 'utf8')) : {};

const offlineTasks = {
  3: '用十張生活工具卡，分成「AI」、「不是 AI」和「還不確定」；每張卡都寫下理由。',
  6: '用兩組紙卡當成 AI 學習的例子：先看三張猜規則，再加入不同例子，記下想法怎麼改變。',
  9: '比較不同房子、電話與麵包的畫法，圈出少了哪些情況，再設計不含姓名和照片的紀錄表。',
  12: '把早餐或借書寫成「放進什麼、怎麼做、得到什麼」，請另一人只照文字執行，圈出說不清楚的步驟。',
  15: '用方格紙設計人類機器人路線；一次只改一個錯誤，保留修改前後兩版和理由。',
  18: '用紙卡做回收分類小幫手，寫出如果／否則規則，加入兩個很難分的例子和「不確定」結果。',
  21: '先自己寫五個點子，再用「扮演誰、要做什麼、怎麼回答、不能做什麼、參考例子、如何檢查」六欄模擬 AI 回覆。',
  24: '把情況分成「可以、不可以、要看條件」，檢查來源、真假、私人資料和公平。',
  27: '用三格故事板畫出開始、操作、結果，只做一個最重要功能，完成紙上小作品測試。',
  30: '請別人在沒有提示下操作小作品，記下停頓、誤會和成功，再選兩個最重要的地方修改。',
};

const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
}[char]));

const timeToSeconds = (stamp) => stamp.split(':').reduce((total, value) => total * 60 + Number(value), 0);
const youtubeData = {
  playlistId: playlist.playlist_id || '',
  playlistUrl: playlist.playlist_url || '',
  items: Object.fromEntries(youtube.map((item) => [item.slug === 'annual' ? 'annual' : String(item.week), {
    slug: item.slug,
    week: item.week || null,
    title: item.title,
    videoId: item.video_id,
    watchUrl: item.watch_url,
    transcript: `youtube/${item.slug}/transcript.json`,
    chapters: item.chapters.map(([stamp, title]) => ({ stamp, seconds: timeToSeconds(stamp), title })),
  }])),
};
fs.writeFileSync(path.join(labDir, 'youtube-data.js'), `window.GIFTED_YOUTUBE = ${JSON.stringify(youtubeData, null, 2)};\n`, 'utf8');

const sharedStyle = `
:root{--ink:#15383c;--teal:#168277;--coral:#de5c46;--yellow:#f1bd45;--paper:#f5f1e8;--line:#cbd6d2;--white:#fff}*{box-sizing:border-box}body{margin:0;background:var(--paper);color:var(--ink);font-family:"Noto Sans TC","Microsoft JhengHei",sans-serif;line-height:1.65}main{width:min(960px,calc(100% - 28px));margin:24px auto 60px}.top{display:flex;justify-content:space-between;gap:16px;align-items:center;padding-bottom:16px;border-bottom:4px solid var(--ink)}h1{font-size:clamp(1.65rem,3vw,2.45rem);margin:5px 0;letter-spacing:0}.code{font:700 13px monospace;color:var(--coral)}.actions{display:flex;gap:8px;flex-wrap:wrap}.btn{display:inline-flex;align-items:center;min-height:44px;padding:9px 14px;border:1px solid var(--ink);border-radius:5px;background:var(--white);color:var(--ink);font-weight:800;text-decoration:none;cursor:pointer}.btn.primary{background:var(--ink);color:#fff}.band{margin:22px 0;padding:18px 0;border-top:1px solid var(--line)}h2{font-size:1.25rem;margin:0 0 12px;letter-spacing:0}.grid{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}.cell{padding:13px;border-left:5px solid var(--teal);background:var(--white)}.cell b{display:block;margin-bottom:5px}.checklist{display:grid;gap:7px}.checklist label{display:flex;gap:10px;align-items:flex-start;padding:11px;background:var(--white);border:1px solid var(--line)}input[type=checkbox]{width:20px;height:20px;flex:0 0 20px}.timeline{width:100%;border-collapse:collapse;background:#fff}.timeline th,.timeline td{padding:9px;border:1px solid var(--line);text-align:left;vertical-align:top}.normal{border-left-color:var(--teal)}.offline{border-left-color:var(--coral)}ol{padding-left:24px}.answer{width:100%;min-height:88px;border:1px solid var(--line);background:#fff;padding:10px;font:inherit}.privacy{border-left:5px solid var(--coral);background:#fff;padding:12px 15px}.footer{margin-top:30px;padding-top:14px;border-top:1px solid var(--line);font-size:.9rem}.save-state{font-weight:800;color:var(--teal)}@media(max-width:720px){.top{align-items:flex-start;flex-direction:column}.grid{grid-template-columns:1fr}.actions{width:100%}.btn{flex:1;justify-content:center}.timeline{font-size:.9rem}}@media print{body{background:#fff}main{width:100%;margin:0}.actions,.no-print{display:none!important}.band{break-inside:avoid}.answer{min-height:110px}.footer{font-size:10pt}}
`;
const imageFallbackScript = '<script src="../../assets/webp-fallback.js" defer></script>';

function persistenceScript(storageKey) {
  return `<script>(()=>{const key=${JSON.stringify(storageKey)};const fields=[...document.querySelectorAll('[data-save]')];let state={};try{state=JSON.parse(localStorage.getItem(key)||'{}')}catch{}fields.forEach((field,index)=>{const id=field.dataset.save||String(index);if(field.type==='checkbox')field.checked=Boolean(state[id]);else field.value=state[id]||'';field.addEventListener('input',()=>{state[id]=field.type==='checkbox'?field.checked:field.value;localStorage.setItem(key,JSON.stringify(state));document.querySelector('.save-state').textContent='已保存在本機';});});document.querySelector('[data-print]').onclick=()=>print();})();</script>`;
}

for (const item of weeks) {
  const code = String(item.week).padStart(2, '0');
  const weekDir = path.join(labDir, `week-${code}`);
  const safetyChecks = [
    '教材、對 AI 說的話和作品中，沒有真實姓名、臉部、帳號、電話或能認出一個人的資料。',
    '若使用 AI，已先自行思考，且只輸入完成任務必要的非個資內容。',
    'AI 的答案已用可靠資料再確認，並記下哪些採用、修改或不用。',
    '任何公開成果都已由教師確認；原始作品與觀察紀錄維持私人。',
  ];
  const pack = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>W${code} 一鍵上課包｜石門智繪客</title><style>${sharedStyle}</style>${imageFallbackScript}</head><body><main>
  <header class="top"><div><div class="code">WEEK ${code} · ${escapeHtml(item.date)} · 90 MIN</div><h1>${escapeHtml(item.title)}</h1><p>黃凱揚老師｜桃園市龍潭區石門國民小學</p></div><div class="actions"><a class="btn" href="index.html">回駕駛艙</a><button class="btn primary" data-print>列印上課包</button></div></header>
  <section class="band"><h2>30 秒開課入口</h2><div class="grid"><a class="cell" href="lecture-slides.html"><b>課堂簡報</b>12 張互動投影</a><a class="cell" href="student-task.html"><b>學生任務單</b>可填寫與列印</a><a class="cell" href="teacher-pack.pdf"><b>直式教師詳案</b>90 分鐘完整流程</a></div></section>
  <section class="band"><h2>課前檢查</h2><div class="checklist">${['電腦或 iPad 已充電並可投影。','已開啟本週簡報與駕駛艙。','紙本任務單、色筆或便利貼已備妥。','站內教材可開啟；外部 AI 或 NotebookLM 失效時改走離線流程。',...safetyChecks].map((text,index)=>`<label><input type="checkbox" data-save="check-${index}"><span>${escapeHtml(text)}</span></label>`).join('')}</div><p class="save-state" aria-live="polite">勾選狀態只保存在本機</p></section>
  <section class="band"><h2>90 分鐘流程</h2><table class="timeline"><thead><tr><th>時間</th><th>活動</th><th>教師提醒</th></tr></thead><tbody>${item.timeline.map((row)=>`<tr><td>${escapeHtml(row[0])}</td><td>${escapeHtml(row[1])}</td><td>${escapeHtml(row[2])}</td></tr>`).join('')}</tbody></table></section>
  <section class="band"><h2>正常與離線雙軌</h2><div class="grid"><div class="cell normal"><b>正常教學</b>使用週次駕駛艙、互動簡報、NotebookLM 與站內影片完成探究。</div><div class="cell offline"><b>無網路／無 AI</b>${escapeHtml(offlineTasks[item.week])}</div><div class="cell"><b>本週證據</b>${escapeHtml(item.output)}</div></div></section>
  <section class="band"><h2>課後銜接</h2><textarea class="answer" data-save="after" aria-label="課後銜接紀錄" placeholder="最有力的推理、需要補強的地方、下次要延續的線索"></textarea></section>
  <footer class="footer">本頁不會上傳學生資料；所有勾選與紀錄只保存在目前瀏覽器。</footer>
  </main>${persistenceScript(`gifted-pack-${code}`)}${[3, 6, 9, 12, 15].includes(item.week) ? '<script src="../source-attribution.js?v=20260729-day-of-ai-v1"></script>' : ''}</body></html>`;

  const task = `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>W${code} 學生任務單｜石門智繪客</title><style>${sharedStyle}</style>${imageFallbackScript}</head><body><main>
  <header class="top"><div><div class="code">WEEK ${code} · STUDENT MISSION</div><h1>${escapeHtml(item.title)}</h1><p>${escapeHtml(item.goal)}</p></div><div class="actions"><a class="btn" href="index.html">回駕駛艙</a><button class="btn primary" data-print>列印任務單</button></div></header>
  <section class="band"><h2>本週任務</h2><ol>${item.student.map((step)=>`<li>${escapeHtml(step)}</li>`).join('')}</ol></section>
  <section class="band"><h2>我的第一版想法</h2><textarea class="answer" data-save="first" aria-label="第一版想法"></textarea></section>
  <section class="band"><h2>我看到的測試結果與修改</h2><textarea class="answer" data-save="evidence" aria-label="測試結果與修改"></textarea></section>
  <section class="band"><h2>我和 AI 怎麼分工</h2><div class="privacy"><b>不要填入姓名、照片、帳號、電話或其他私人資料。</b></div><div class="grid"><label class="cell"><b>我先想到什麼</b><textarea class="answer" data-save="human"></textarea></label><label class="cell"><b>AI 幫了什麼</b><textarea class="answer" data-save="ai"></textarea></label><label class="cell"><b>我怎麼確認和選擇</b><textarea class="answer" data-save="verify"></textarea></label></div></section>
  <section class="band"><h2>離線替代任務</h2><p>${escapeHtml(offlineTasks[item.week])}</p></section>
  <section class="band"><h2>完成前安全檢查</h2><div class="checklist">${safetyChecks.map((text,index)=>`<label><input type="checkbox" data-save="safe-${index}"><span>${escapeHtml(text)}</span></label>`).join('')}</div><p class="save-state" aria-live="polite">內容只保存在本機</p></section>
  <footer class="footer">課程設計：黃凱揚老師｜桃園市龍潭區石門國民小學</footer>
  </main>${persistenceScript(`gifted-task-${code}`)}${[3, 6, 9, 12, 15].includes(item.week) ? '<script src="../source-attribution.js?v=20260729-day-of-ai-v1"></script>' : ''}</body></html>`;
  fs.writeFileSync(path.join(weekDir, 'classroom-pack.html'), pack, 'utf8');
  fs.writeFileSync(path.join(weekDir, 'student-task.html'), task, 'utf8');
}

const offlineAssets = [
  './', './index.html', './gifted-ai-lab/', './gifted-ai-lab/index.html', './gifted-ai-lab/offline.html',
  './assets/webp-fallback.js',
  './gifted-ai-lab/week-data.js', './gifted-ai-lab/week-enrichment.js', './gifted-ai-lab/week-student-language.js', './gifted-ai-lab/week-cockpit.js',
  './gifted-ai-lab/week-depth-data.js', './gifted-ai-lab/week-learning-depth.js', './gifted-ai-lab/week-learning-depth.css',
  './gifted-ai-lab/week-phase-six.js', './gifted-ai-lab/week-phase-six.css',
  './gifted-ai-lab/gifted-visual-system.css', './gifted-ai-lab/picture-inquiry.js', './gifted-ai-lab/teacher-sync.js',
  './gifted-ai-lab/source-credits.html', './gifted-ai-lab/source-attribution.js', './gifted-ai-lab/source-attribution.css',
  './gifted-ai-lab/day-of-ai-adaptations.js', './gifted-ai-lab/day-of-ai-lessons.js', './gifted-ai-lab/day-of-ai-lessons.css',
  './gifted-ai-lab/notebook-day-of-ai-artifacts.json',
  './gifted-ai-lab/resource-library.html', './gifted-ai-lab/resource-library.js', './gifted-ai-lab/resource-library.css', './gifted-ai-lab/day-of-ai-resource-data.js',
  './gifted-ai-lab/preflight.html', './gifted-ai-lab/preflight.js', './gifted-ai-lab/preflight.css', './gifted-ai-lab/version.json',
  './gifted-ai-lab/picture-book-artifacts.json',
  './gifted-ai-lab/week-cockpit.css', './gifted-ai-lab/week-cockpit-rich.css',
  './gifted-ai-lab/week-slides.js', './gifted-ai-lab/week-slides.css', './gifted-ai-lab/week-slides-rich.css',
  './gifted-ai-lab/classroom-integrations.js', './gifted-ai-lab/classroom-integrations.css',
  './gifted-ai-lab/youtube-data.js', './gifted-ai-lab/transcripts.html', './gifted-ai-lab/transcript-search.js',
  './gifted-ai-lab/reports.html', './gifted-ai-lab/reports.js', './gifted-ai-lab/reports.css',
  './gifted-ai-lab/sync-status.html', './gifted-ai-lab/sync-status.js', './gifted-ai-lab/sync-status.css', './gifted-ai-lab/course-version-manifest.json', './gifted-ai-lab/version-matrix.md',
  './gifted-ai-lab/transcript-search.css', './gifted-ai-lab/site.webmanifest', './gifted-ai-lab/lecture-slides.html',
  './gifted-ai-lab/materials/teacher-guide.pdf', './gifted-ai-lab/materials/student-workbook.pdf',
  './gifted-ai-lab/youtube/annual/transcript.json', './gifted-ai-lab/assets/gifted-lab-cover.png', './gifted-ai-lab/assets/gifted-lab-cover.webp',
  './gifted-ai-lab/assets/gifted-favicon-192.png', './gifted-ai-lab/assets/gifted-favicon-32.png',
];
for (const item of weeks) {
  const code = String(item.week).padStart(2, '0');
  const base = `./gifted-ai-lab/week-${code}/`;
  offlineAssets.push(base, `${base}index.html`, `${base}lecture-slides.html`, `${base}classroom-pack.html`, `${base}student-task.html`, `${base}student-guide.md`, `${base}student-warmup.md`, `${base}student-review.md`, `${base}student-video-card.html`, `${base}video-captions.srt`, `${base}depth-source.md`, `${base}depth-video-captions.srt`, `${base}depth-video-transcript.txt`, `${base}teacher-pack.pdf`, `./gifted-ai-lab/youtube/week-${code}/transcript.json`);
  for (const image of ['student-video-card.png', 'student-video-card.webp', 'student-infographic.png', 'student-infographic.webp']) {
    if (fs.existsSync(path.join(labDir, `week-${code}`, image))) offlineAssets.push(`${base}${image}`);
  }
  if (fs.existsSync(path.join(labDir, `week-${code}`, 'week-illustration.webp'))) offlineAssets.push(`${base}week-illustration.webp`);
}
fs.writeFileSync(path.join(labDir, 'offline-manifest.json'), `${JSON.stringify({ version: '2026-08-29-webp-v1', assets: offlineAssets }, null, 2)}\n`, 'utf8');
console.log(`Built ${weeks.length} classroom packs, ${weeks.length} task sheets, YouTube data and offline manifest.`);
