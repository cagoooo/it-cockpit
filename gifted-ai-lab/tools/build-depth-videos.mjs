import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const sandbox = { window: {} };
for (const file of ['week-data.js', 'week-enrichment.js', 'week-depth-data.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(labDir, file), 'utf8'), sandbox);
}

const weeks = sandbox.window.GIFTED_WEEKS;
const enrichment = sandbox.window.GIFTED_ENRICHMENT;
const depthData = sandbox.window.GIFTED_DEPTH;
const requestedWeeks = new Set(process.argv.slice(2));
const selectedWeeks = requestedWeeks.size
  ? weeks.filter((week) => requestedWeeks.has(String(week.week).padStart(2, '0')))
  : weeks;
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gifted-depth-video-'));

function run(command, args) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe' });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
}

for (const week of selectedWeeks) {
  const code = String(week.week).padStart(2, '0');
  const folder = path.join(labDir, `week-${code}`);
  const extra = enrichment[week.week];
  const depth = depthData[week.week];
  const concepts = extra.quiz.map((item) => `${item[0]} 核心線索是：${item[3]}`).join(' ');
  const script = [
    `這是資優班第 ${week.week} 週，${week.title}的探究短片。`,
    `先想一想：${extra.drivingQuestion}`,
    '這一週不急著找標準答案，而要先留下自己的預測，再用證據、反例與重新測試來修正想法。',
    concepts,
    '完成概念檢核後，可以依理解狀態選擇基礎、進階或研究者路徑。研究者的任務不是做得更多，而是提出可能推翻自己假設的證據，並讓別人能重做你的方法。',
    `本週要留下的可見成果是：${week.output}。請在作品旁寫下你原本怎麼想、證據改變了什麼，以及下一個還想追問的問題。`,
    `現在，請從這個挑戰開始：${depth.routes.researcher[2][0]}`,
  ].join('\n\n');

  const transcript = [
    `W${code} ${week.title}｜資優探究深化短片逐字稿`,
    '', script, '',
    '製作說明：內容依 NotebookLM 深化來源與資訊圖表整理；AI 協助擴充與呈現，不代替學生判斷。',
  ].join('\n');
  fs.writeFileSync(path.join(folder, 'depth-video-transcript.txt'), `${transcript}\n`, 'utf8');

  const audioPath = path.join(tempDir, `week-${code}.mp3`);
  run('python', ['-m', 'edge_tts', '--voice', 'zh-TW-YunJheNeural', '--rate=-6%', '--text', script, '--write-media', audioPath]);
  run('ffmpeg', [
    '-y', '-v', 'error', '-loop', '1', '-i', path.join(folder, 'depth-infographic.png'), '-i', audioPath,
    '-vf', "scale=1408:792,crop=1280:720,zoompan=z='min(zoom+0.00022,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30,format=yuv420p",
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '22', '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', path.join(folder, 'depth-video.mp4'),
  ]);
  console.log(`Built W${code} depth video and transcript.`);
}

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`Built ${selectedWeeks.length} stable Traditional Chinese depth videos.`);
