import crypto from 'node:crypto';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const outputRoot = path.join(labDir, 'shorts-k');
const repoDir = path.resolve(labDir, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-data.js'), 'utf8'), sandbox);
const weeks = sandbox.window.GIFTED_WEEKS;
const readJson = (filePath) => JSON.parse(fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, ''));
const studentSources = readJson(path.join(labDir, 'notebook-student-sources.json'));
const depthArtifacts = readJson(path.join(labDir, 'notebook-depth-artifacts.json'));
const notebooks = readJson(path.join(labDir, 'notebooks.json'));

const scripts = {
  3: {
    title: 'AI 小偵探：工具真的會自己想嗎？',
    scenes: [
      ['先猜一猜', '會自己開的門，真的會自己想事情嗎？先猜猜看！'],
      ['看一個例子', '自動門感應到有人就打開，通常是照固定規則做。影片推薦會看你以前常看的內容，猜猜你可能喜歡什麼。'],
      ['跟著做', '找一個生活中會自己動的工具，說說它是照規則做，還是會從很多例子慢慢調整。'],
      ['小任務', '用「我看到什麼、我猜什麼、證據在哪裡」說一次。拍照前先問老師，不放姓名、臉和電話。'],
    ],
    note: '以自動門、影片推薦與掃地機器人做對照，讓學生先分辨固定規則和會從例子調整的工具。',
  },
  6: {
    title: '畫圖猜猜看：電腦怎麼找到線索？',
    scenes: [
      ['先猜一猜', '你只畫幾筆，電腦為什麼有時候猜得到？它真的看懂你的畫嗎？'],
      ['看一個例子', '電腦先看很多張圖，再找常常一起出現的線索。遇到新圖時，它用這些線索猜一猜。'],
      ['注意猜錯', '如果例子太少，或每個人畫法都不一樣，電腦就可能猜錯。猜錯不是秘密，是提醒我們再找線索。'],
      ['小任務', '畫一隻奇怪的魚，記下電腦猜什麼。再說說：哪一筆線讓它這樣猜？'],
    ],
    note: '把資料、找規律、預測改成「看很多例子、找線索、猜新圖」，保留資料不完整會猜錯的重點。',
  },
  9: {
    title: '資料照妖鏡：少了誰，答案會變嗎？',
    scenes: [
      ['先想一想', '如果電腦把你的貓咪猜成別的動物，你會怎麼辦？先別急著怪電腦。'],
      ['看一個例子', '可能是它以前看的例子不夠多，只有一種畫法，所以遇到新畫法就容易猜錯。'],
      ['把資料補好', '我們可以加入不同的人、不同的畫法和不同的情況。資料比較完整，猜測才比較不容易漏掉誰。'],
      ['小任務', '看一張資料表，問自己：「少了哪一種情況？」也要刪掉姓名、臉和電話等不需要的資料。'],
    ],
    note: '以代表性與隱私為主軸，讓學生用「少了哪一種情況」理解資料不完整可能造成不公平。',
  },
  12: {
    title: '教機器人排拖鞋：一步一步才不會亂',
    scenes: [
      ['先猜一猜', '只跟機器人說「把拖鞋排整齊」，它真的知道要怎麼做嗎？'],
      ['說清楚三件事', '先說要放進什麼，再說要怎麼做，最後說會得到什麼。這樣機器人才比較跟得上。'],
      ['生活小例子', '像整理書包：放進物品、照類別分開、得到一個好找的書包。每一步都要能真的照著做。'],
      ['小任務', '請寫出整理鞋子或早餐的三個步驟，再請別人只照你的文字做。哪一步最不清楚？'],
    ],
    note: '將輸入、處理、輸出改寫成「放進什麼、怎麼做、得到什麼」，並用生活流程練習清楚步驟。',
  },
  15: {
    title: '抓錯大師：改一點，再試一次',
    scenes: [
      ['先玩一玩', '為什麼同一句話，機器人常常做錯？因為它只會照你說的話做。'],
      ['說得更清楚', '不要只說「往前走」。可以說往哪裡、走幾格、什麼時候停，機器人才比較不會迷路。'],
      ['找到第一個錯', '先猜結果，再實際試。找到第一個錯的地方，只改一個地方，再試一次。'],
      ['小任務', '設計一條方格路線，請同學當機器人。記下哪裡卡住，說說你改了什麼。'],
    ],
    note: '把除錯循環說成「先猜、試試看、找第一個錯、改一點、再試一次」，避免一次改太多。',
  },
  18: {
    title: 'Scratch 分類小幫手：遇到難題先說不確定',
    scenes: [
      ['先看一看', '房間裡的玩具混在一起，Scratch 可以幫我們分一分嗎？'],
      ['寫一個規則', '如果玩具是紅色，就放進紅色盒子；否則就放進另一個盒子。這就是讓程式做選擇。'],
      ['故意放難題', '紅藍各一半的玩具要放哪裡？好的小幫手可以說「我不確定」，不要硬猜。'],
      ['小任務', '做一個分類小幫手，放入一個很難分的例子，看看你的規則會不會卡住。'],
    ],
    note: '以 Scratch 如果／否則和邊界例子為核心，加入「不確定」出口，讓孩子知道不是每題都要硬選。',
  },
  21: {
    title: 'AI 聽得懂嗎？把話說完整',
    scenes: [
      ['先試一句話', '只說「拿筆」，朋友知道你要哪一支嗎？AI 也可能猜錯喔！'],
      ['加上小線索', '可以說藍色的筆、拿三支、放在桌上。任務、數量和位置越清楚，回答越好檢查。'],
      ['先想再問', '先自己想一個點子，再請 AI 幫忙換方法或補充。AI 說得很像真的，也要自己確認。'],
      ['小任務', '寫一個讓 AI 聽得懂的問題，請它用三個步驟回答，再圈出你願意採用的地方。'],
    ],
    note: '將提示詞拆成孩子能操作的任務、線索與回答方式，並保留「先自己想、再檢查 AI」的分工。',
  },
  24: {
    title: '安全 AI 小隊長：能做不一定要做',
    scenes: [
      ['先停一下', 'AI 好像什麼都能做，但每件事都適合交給它嗎？先按下安全小按鈕。'],
      ['四個小問題', '這個答案從哪裡來？是真的嗎？需要放私人資料嗎？會不會只照顧到一部分人？'],
      ['把題目變小', '不要一開始就想解決所有問題。先選一個人、一次情況和一個看得見的結果。'],
      ['小任務', '把「讓大家都開心」改成一個可以試的小問題。記得不放姓名、照片或帳號。'],
    ],
    note: '用來源、真假、隱私、公平四個生活化問題，帶學生把大夢想縮成今天能測試的小題目。',
  },
  27: {
    title: '先做小作品：小小版本也能測試',
    scenes: [
      ['先想像', '你想蓋一座超大的城堡，但今天不用一次蓋完。先做一個小小版本來試。'],
      ['留下最重要的', '先畫一個畫面，或先做一個最重要的功能。其他想法先放在旁邊，不會消失。'],
      ['請別人試試', '不要只自己看作品。請同學操作一次，觀察他在哪裡停下來或看不懂。'],
      ['小任務', '畫三格故事板：開始、操作、結果。做完後問自己：「哪一格最需要改？」'],
    ],
    note: '把最小可行原型改成「先做一個小小版本來試」，用故事板與一次真實操作找出核心問題。',
  },
  30: {
    title: '作品偵探：看別人怎麼用，再改一次',
    scenes: [
      ['不要只猜', '作品看起來很漂亮，不代表大家都會用。請看一個人真的操作一次。'],
      ['記下線索', '他在哪裡停很久？哪個按鈕按錯？哪一句話看不懂？這些都是作品告訴你的線索。'],
      ['先改最重要的', '一次挑一個最影響使用的地方修改，再請別人試一次，看看有沒有變好。'],
      ['小任務', '說出修改前、修改後和一個證據，也要誠實說出作品現在還做不到什麼。'],
    ],
    note: '以觀察、修改、再測試為主軸，讓學生用實際證據說明作品變好，而不是只說「我覺得」。',
  },
};

const requested = new Set(process.argv.slice(2).filter((value) => /^\d+$/.test(value)).map((value) => Number(value)));
const selectedWeeks = requested.size ? weeks.filter((week) => requested.has(week.week)) : weeks;
const chromeCandidates = [
  'C:/Program Files (x86)/Google/Chrome/Application/chrome.exe',
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
];
const chrome = chromeCandidates.find((candidate) => fs.existsSync(candidate));
if (!chrome) throw new Error('找不到 Chrome 或 Edge，無法產生直式影片畫面。');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gifted-shorts-k-'));
const tempProfile = fs.mkdtempSync(path.join(os.tmpdir(), 'gifted-shorts-k-profile-'));
const siteBase = 'https://cagoooo.github.io/it-cockpit/gifted-ai-lab';

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options });
  if (result.status !== 0) throw new Error(`${command} 執行失敗：\n${result.stderr || result.stdout}`);
  return result;
}

function capture(command, args, options = {}) {
  return run(command, args, options).stdout.trim();
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
}

function escapeAss(value) {
  return String(value).replace(/\\/g, '／').replace(/[{}]/g, '').replace(/\r?\n/g, '\\N');
}

function secondsFromSrt(value) {
  const [hours, minutes, rest] = value.replace(',', '.').split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(rest);
}

function srtTime(seconds) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const wholeSeconds = Math.floor((milliseconds % 60000) / 1000);
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')},${String(milliseconds % 1000).padStart(3, '0')}`;
}

function clock(seconds) {
  const whole = Math.max(0, Math.floor(seconds));
  return `${Math.floor(whole / 60)}:${String(whole % 60).padStart(2, '0')}`;
}

function parseSrt(filePath) {
  const source = fs.readFileSync(filePath, 'utf8').replace(/^\uFEFF/, '').trim();
  if (!source) return [];
  return source.split(/\r?\n\r?\n/).flatMap((block) => {
    const lines = block.split(/\r?\n/);
    const timingIndex = lines.findIndex((line) => line.includes('-->'));
    if (timingIndex < 0) return [];
    const [start, end] = lines[timingIndex].split(/\s+-->\s+/);
    const text = lines.slice(timingIndex + 1).join(' ').trim();
    return text ? [{ start, end, text }] : [];
  });
}

function mergeSrt(cueGroups) {
  let offset = 0;
  const merged = [];
  for (const group of cueGroups) {
    for (const cue of group.cues) {
      merged.push({
        start: secondsFromSrt(cue.start) + offset,
        end: secondsFromSrt(cue.end) + offset,
        text: cue.text,
      });
    }
    offset += group.duration;
  }
  for (let index = 0; index < merged.length - 1; index += 1) {
    if (merged[index].end >= merged[index + 1].start) merged[index].end = Math.max(merged[index].start + 0.05, merged[index + 1].start - 0.01);
  }
  return `${merged.map((cue, index) => `${index + 1}\n${srtTime(cue.start)} --> ${srtTime(cue.end)}\n${cue.text}`).join('\n\n')}\n`;
}

function writeVttFromSrt(srtPath, vttPath) {
  const source = fs.readFileSync(srtPath, 'utf8').replace(/^\uFEFF/, '').replace(/(\d{2}:\d{2}:\d{2}),(\d{3})/g, '$1.$2');
  fs.writeFileSync(vttPath, `WEBVTT\n\n${source}`, 'utf8');
}

function karaokeText(text, durationSeconds) {
  const words = [...new Intl.Segmenter('zh-TW', { granularity: 'word' }).segment(text)]
    .map((item) => item.segment).filter(Boolean);
  const units = words.map((word) => Math.max(1, [...word].length));
  const totalUnits = units.reduce((sum, value) => sum + value, 0) || 1;
  const totalCentiseconds = Math.max(words.length, Math.round(durationSeconds * 100));
  let remaining = totalCentiseconds;
  return words.map((word, index) => {
    const value = index === words.length - 1 ? remaining : Math.max(1, Math.round((totalCentiseconds * units[index]) / totalUnits));
    remaining -= value;
    return `{\\kf${Math.max(1, value)}}${escapeAss(word)}`;
  }).join('');
}

function writeVerticalAss(srtPath, assPath) {
  const cues = parseSrt(srtPath);
  for (let index = 0; index < cues.length - 1; index += 1) {
    const nextStart = secondsFromSrt(cues[index + 1].start);
    if (secondsFromSrt(cues[index].end) >= nextStart) cues[index].end = srtTime(nextStart - 0.01);
  }
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1080
PlayResY: 1920
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Dynamic,Microsoft JhengHei,58,&H0000D9A2,&H00FFFFFF,&H0015383C,&HCCFFFDF8,-1,0,0,0,100,100,0,0,3,3,1,2,70,70,130,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
  const events = cues.map((cue) => {
    const duration = Math.max(0.2, secondsFromSrt(cue.end) - secondsFromSrt(cue.start));
    return `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Dynamic,,0,0,0,,{\\fad(100,120)\\fscx94\\fscy94\\t(0,180,\\fscx100\\fscy100)}${karaokeText(cue.text, duration)}`;
  });
  fs.writeFileSync(assPath, `${header}\n${events.join('\n')}\n`, 'utf8');
}

function assTime(value) {
  const seconds = secondsFromSrt(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const whole = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function renderScene(htmlPath, outputPath) {
  const result = run(chrome, [
    '--headless=new', '--disable-gpu', '--hide-scrollbars', '--allow-file-access-from-files',
    '--force-device-scale-factor=1', '--window-size=1080,1920', `--user-data-dir=${tempProfile}`,
    `--screenshot=${outputPath}`, pathToFileURL(htmlPath).href,
  ]);
  if (!fs.existsSync(outputPath)) throw new Error(`無法產生畫面：${result.stderr || htmlPath}`);
}

function findAsset(folder, names) {
  return names.map((name) => path.join(folder, name)).find((filePath) => fs.existsSync(filePath));
}

function sceneHtml({ week, code, title, tag, text, imagePath }) {
  const imageUrl = pathToFileURL(imagePath).href;
  return `<!doctype html><html lang="zh-Hant-TW"><head><meta charset="utf-8"><style>
*{box-sizing:border-box}html,body{width:1080px;height:1920px;margin:0;overflow:hidden}body{background:#f7f3e8;color:#15383c;font-family:"Microsoft JhengHei","Noto Sans TC",sans-serif}main{height:100%;padding:58px 60px 48px;display:grid;grid-template-rows:auto 900px 1fr auto;gap:28px}.top{display:flex;justify-content:space-between;gap:20px;align-items:start;border-bottom:5px solid #15383c;padding-bottom:22px}.brand{font-size:25px;font-weight:900;color:#de5c46}.code{font:700 21px monospace;color:#168277}.top h1{font-size:47px;line-height:1.18;margin:10px 0 0;letter-spacing:0}.badge{padding:12px 17px;background:#f1bd45;border:2px solid #b98418;border-radius:8px;font-size:23px;font-weight:900;white-space:nowrap}.visual{display:grid;place-items:center;padding:25px;background:#fffdf8;border:2px solid #cbd6d2;border-radius:18px;box-shadow:10px 10px 0 #15383c12}.visual img{display:block;width:100%;height:100%;object-fit:contain;border-radius:10px}.message{align-self:center;padding:30px 34px;border-left:10px solid #168277;background:#fffdf8;border-top:1px solid #cbd6d2;border-right:1px solid #cbd6d2;border-bottom:1px solid #cbd6d2;border-radius:8px}.tag{display:inline-block;margin-bottom:18px;padding:8px 15px;background:#e8f5f1;color:#168277;border-radius:6px;font-size:29px;font-weight:900}.message p{margin:0;font-size:52px;line-height:1.4;font-weight:900;letter-spacing:0}.footer{font-size:19px;color:#526a6d;font-weight:700}
</style></head><body><main><header class="top"><div><div class="brand">石門智繪客 · W${code}</div><h1>${escapeHtml(title)}</h1></div><div class="badge">給三年級</div></header><div class="visual"><img src="${imageUrl}" alt=""></div><section class="message"><div class="tag">${escapeHtml(tag)}</div><p>${escapeHtml(text)}</p></section><div class="footer">黃凱揚老師｜桃園市龍潭區石門國民小學</div></main></body></html>`;
}

function preserveUpload(item, previous) {
  return previous?.upload || {
    status: 'ready_for_manual_upload',
    privacy: 'unlisted',
    channel: 'ShortsK',
    video_id: '',
    watch_url: '',
  };
}

function loadPreviousManifest() {
  const manifestPath = path.join(labDir, 'shorts-k-manifest.json');
  return fs.existsSync(manifestPath) ? readJson(manifestPath) : { items: {} };
}

function sourceRecord(week) {
  const student = studentSources.find((item) => item.week === week) || {};
  const depth = depthArtifacts.find((item) => item.week === week) || {};
  const notebook = notebooks.find((item) => item.week === week) || {};
  return {
    notebook_id: student.notebook_id || notebook.notebook_id || '',
    notebook_url: notebook.notebook_url || '',
    student_source_id: student.student_source_id || '',
    infographic_id: student.infographic_id || '',
    depth_source_id: depth.source_id || '',
    depth_slides_id: depth.slides_id || '',
    existing_video_artifact_ids: depth.notebooklm_video_jobs || (depth.notebooklm_video_id ? [depth.notebooklm_video_id] : [notebook.video_id].filter(Boolean)),
  };
}

function writeDataFiles(manifest, mcpRun) {
  fs.writeFileSync(path.join(labDir, 'shorts-k-manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(outputRoot, 'notebooklm-mcp-run.json'), `${JSON.stringify(mcpRun, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(labDir, 'shorts-k-data.js'), `window.GIFTED_SHORTS_K = ${JSON.stringify(manifest, null, 2)};\n`, 'utf8');
}

const previous = loadPreviousManifest();
const manifest = {
  schema_version: 1,
  generated_at: new Date().toISOString(),
  channel: 'ShortsK',
  privacy_default: 'unlisted',
  workflow: 'manual_upload_only',
  course_url: `${siteBase}/`,
  description: '十支給國小三年級看的直式課前小影片：每支先猜一猜，再看生活例子，最後完成一個小任務。',
  items: { ...previous.items },
};
const mcpRun = {
  generated_at: manifest.generated_at,
  tool: 'NotebookLM MCP',
  query_status: 'completed',
  query_purpose: '依每週 NotebookLM 來源，整理成國小三年級聽得懂的生活化短片腳本；保留查證、隱私與不確定性提醒。',
  source_policy: '只把 NotebookLM 來源整理成引導語，不把 AI 產生的說法當成唯一答案；課堂仍由教師帶學生觀察與查證。',
  weeks: {},
};

try {
  for (const item of selectedWeeks) {
    const code = String(item.week).padStart(2, '0');
    const plan = scripts[item.week];
    if (!plan) throw new Error(`W${code} 缺少短片腳本。`);
    const folder = path.join(labDir, `week-${code}`);
    const outDir = path.join(outputRoot, `week-${code}`);
    fs.mkdirSync(outDir, { recursive: true });
    const scenePaths = [];
    const cueGroups = [];
    let totalDuration = 0;
    const assetNames = [
      ['week-illustration.webp', 'week-illustration.png'],
      ['student-infographic.webp', 'student-infographic.png'],
      ['student-video-card.webp', 'student-video-card.png'],
      ['depth-infographic.webp', 'depth-infographic.png'],
    ];
    for (let index = 0; index < plan.scenes.length; index += 1) {
      const [tag, text] = plan.scenes[index];
      const imagePath = findAsset(folder, assetNames[index % assetNames.length]);
      if (!imagePath) throw new Error(`W${code} 找不到場景圖片。`);
      const htmlPath = path.join(tempDir, `w${code}-scene-${index + 1}.html`);
      const pngPath = path.join(tempDir, `w${code}-scene-${index + 1}.png`);
      fs.writeFileSync(htmlPath, sceneHtml({ week: item.week, code, title: plan.title, tag, text, imagePath }), 'utf8');
      renderScene(htmlPath, pngPath);
      scenePaths.push(pngPath);
      const audioPath = path.join(tempDir, `w${code}-scene-${index + 1}.mp3`);
      const srtPath = path.join(tempDir, `w${code}-scene-${index + 1}.srt`);
      run('python', ['-m', 'edge_tts', '--voice', 'zh-TW-YunJheNeural', '--rate=-4%', '--text', text, '--write-media', audioPath, '--write-subtitles', srtPath]);
      const audioDuration = Number(capture('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'default=nw=1:nk=1', audioPath]));
      if (!Number.isFinite(audioDuration) || audioDuration <= 0) throw new Error(`W${code} 第 ${index + 1} 段音訊長度無效。`);
      const duration = audioDuration + 0.25;
      const segmentPath = path.join(tempDir, `w${code}-segment-${index + 1}.mp4`);
      run('ffmpeg', [
        '-y', '-v', 'error', '-loop', '1', '-i', pngPath, '-i', audioPath,
        '-vf', 'scale=1080:1920,format=yuv420p', '-r', '30', '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '23',
        '-c:a', 'aac', '-b:a', '128k', '-t', String(duration), segmentPath,
      ]);
      cueGroups.push({ cues: parseSrt(srtPath), duration });
      totalDuration += duration;
      console.log(`W${code} 場景 ${index + 1}/${plan.scenes.length} 完成。`);
    }
    const concatPath = path.join(tempDir, `w${code}-concat.txt`);
    fs.writeFileSync(concatPath, scenePaths.map((_, index) => `file '${path.join(tempDir, `w${code}-segment-${index + 1}.mp4`).replace(/\\/g, '/').replace(/'/g, "'\\''")}'`).join('\n') + '\n', 'utf8');
    const srtOut = path.join(outDir, 'captions.srt');
    fs.writeFileSync(srtOut, mergeSrt(cueGroups), 'utf8');
    const vttOut = path.join(outDir, 'captions.vtt');
    writeVttFromSrt(srtOut, vttOut);
    const assOut = path.join(outDir, 'captions.ass');
    writeVerticalAss(srtOut, assOut);
    const outputPath = path.join(outDir, 'short.mp4');
    run('ffmpeg', [
      '-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', concatPath,
      '-map', '0:v:0', '-map', '0:a:0',
      '-vf', "ass=captions.ass:fontsdir='C\\:/Windows/Fonts',format=yuv420p", '-r', '30',
      '-c:v', 'libx264', '-preset', 'veryfast', '-crf', '23', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', outputPath,
    ], { cwd: outDir });
    const coverPath = path.join(outDir, 'cover.webp');
    run('ffmpeg', ['-y', '-v', 'error', '-i', scenePaths[0], '-vf', 'scale=720:-2', '-c:v', 'libwebp', '-quality', '82', '-frames:v', '1', coverPath]);
    const transcript = plan.scenes.map(([tag, text], index) => `${index + 1}. ${tag}\n${text}`).join('\n\n');
    const transcriptPath = path.join(outDir, 'transcript.txt');
    fs.writeFileSync(transcriptPath, `W${code}｜${plan.title}\n\n${transcript}\n\n聲音：zh-TW-YunJheNeural\n字幕：繁體中文動態字幕，另附 SRT。\n`, 'utf8');
    const source = sourceRecord(item.week);
    const chapters = plan.scenes.reduce((result, scene, index) => {
      const start = index === 0 ? 0 : result[index - 1].end;
      const end = start + cueGroups[index].duration;
      result.push({ stamp: clock(start), title: scene[0], start_seconds: Math.round(start * 100) / 100, end });
      return result;
    }, []).map((chapter) => ({ stamp: chapter.stamp, title: chapter.title, start_seconds: chapter.start_seconds }));
    const descriptionPath = path.join(outDir, 'description.txt');
    fs.writeFileSync(descriptionPath, [
      `${plan.title}｜W${code}｜石門智繪客`,
      '',
      `給國小三年級小朋友的課前小影片：${plan.note}`,
      '看完後，請帶著自己的猜想進教室，再完成影片最後的小任務。',
      '',
      '章節：',
      ...chapters.map((chapter) => `${chapter.stamp} ${chapter.title}`),
      '',
      `課程駕駛艙：${siteBase}/week-${code}/#media`,
      `本週 NotebookLM：${source.notebook_url}`,
      '',
      '#Shorts #石門智繪客 #AI素養 #創造力資優',
      '本片為教師備課與課前引導素材，未放入學生姓名、臉部、帳號或聯絡方式。',
    ].join('\n') + '\n', 'utf8');
    const checklistPath = path.join(outDir, 'upload-checklist.md');
    fs.writeFileSync(checklistPath, `# W${code} ShortsK 手動上傳清單\n\n- 影片：\`short.mp4\`（直式 9:16，已燒錄動態字幕）\n- 字幕：\`captions.srt\`（上傳後請再檢查時間與繁體中文）\n- 站內字幕：\`captions.vtt\`（給駕駛艙播放器使用）\n- 標題：${plan.title}｜W${code}｜石門智繪客\n- 說明：\`description.txt\`\n- 頻道：ShortsK\n- 可見度：**不公開**\n- 上傳後：將 YouTube 影片網址與 video ID 填入 \`gifted-ai-lab/shorts-k-manifest.json\` 的 \`items.${item.week}.upload\`，再執行 \`node gifted-ai-lab/tools/build-classroom-packs.mjs\`。\n- 安全檢查：不要在影片、說明或留言放入學生個資。\n`, 'utf8');
    const upload = preserveUpload(item, previous.items?.[String(item.week)]);
    manifest.items[String(item.week)] = {
      week: item.week,
      code,
      title: plan.title,
      course_title: item.title,
      local_video: `shorts-k/week-${code}/short.mp4`,
      poster: `shorts-k/week-${code}/cover.webp`,
      card_image: `week-${code}/week-illustration.webp`,
      captions: `shorts-k/week-${code}/captions.srt`,
      captions_vtt: `shorts-k/week-${code}/captions.vtt`,
      transcript: `shorts-k/week-${code}/transcript.txt`,
      description: `shorts-k/week-${code}/description.txt`,
      upload_checklist: `shorts-k/week-${code}/upload-checklist.md`,
      duration_seconds: Math.round(totalDuration * 100) / 100,
      format: '9:16',
      captions_burned_in: true,
      audience: '國小三年級升四年級資優學生',
      upload,
      notebooklm: {
        ...source,
        query_status: 'completed',
        query_purpose: '把本週 NotebookLM 來源轉成短句、生活例子、一步小任務與安全提醒。',
      },
    };
    mcpRun.weeks[String(item.week)] = { ...source, status: 'completed', note: plan.note };
    console.log(`W${code} 直式影片完成：${Math.round(totalDuration)} 秒。`);
  }
  writeDataFiles(manifest, mcpRun);
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
  fs.rmSync(tempProfile, { recursive: true, force: true });
}

console.log(`完成 ${selectedWeeks.length} 支 ShortsK 三年級好懂版影片與上傳包。`);
