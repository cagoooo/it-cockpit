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

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', stdio: 'pipe', ...options });
  if (result.status !== 0) throw new Error(`${command} failed:\n${result.stderr || result.stdout}`);
}

function parseSrt(source) {
  return source.trim().split(/\r?\n\r?\n/).map((block) => {
    const lines = block.split(/\r?\n/);
    const timing = lines.find((line) => line.includes('-->'));
    const [start, end] = timing.split(/\s+-->\s+/);
    return { start, end, text: lines.slice(lines.indexOf(timing) + 1).join(' ').trim() };
  }).filter((cue) => cue.text);
}

function srtSeconds(value) {
  const [hours, minutes, rest] = value.replace(',', '.').split(':');
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(rest);
}

function assTime(value) {
  const seconds = srtSeconds(value);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const whole = Math.floor(seconds % 60);
  const centiseconds = Math.floor((seconds - Math.floor(seconds)) * 100);
  return `${hours}:${String(minutes).padStart(2, '0')}:${String(whole).padStart(2, '0')}.${String(centiseconds).padStart(2, '0')}`;
}

function srtTime(seconds) {
  const milliseconds = Math.max(0, Math.round(seconds * 1000));
  const hours = Math.floor(milliseconds / 3600000);
  const minutes = Math.floor((milliseconds % 3600000) / 60000);
  const wholeSeconds = Math.floor((milliseconds % 60000) / 1000);
  const remainder = milliseconds % 1000;
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(wholeSeconds).padStart(2, '0')},${String(remainder).padStart(3, '0')}`;
}

function escapeAss(text) {
  return text.replace(/\\/g, '／').replace(/[{}]/g, '').replace(/\r?\n/g, '\\N');
}

function karaokeText(text, durationSeconds) {
  const words = [...new Intl.Segmenter('zh-TW', { granularity: 'word' }).segment(text)]
    .map((item) => item.segment)
    .filter(Boolean);
  const units = words.map((word) => Math.max(1, [...word].length));
  const totalUnits = units.reduce((sum, value) => sum + value, 0);
  const totalCentiseconds = Math.max(words.length, Math.round(durationSeconds * 100));
  let remaining = totalCentiseconds;
  return words.map((word, index) => {
    const value = index === words.length - 1
      ? remaining
      : Math.max(1, Math.round((totalCentiseconds * units[index]) / totalUnits));
    remaining -= value;
    return `{\\kf${Math.max(1, value)}}${escapeAss(word)}`;
  }).join('');
}

function writeDynamicAss(srtPath, assPath) {
  const cues = parseSrt(fs.readFileSync(srtPath, 'utf8'));
  for (let index = 0; index < cues.length - 1; index += 1) {
    const nextStart = srtSeconds(cues[index + 1].start);
    if (srtSeconds(cues[index].end) >= nextStart) cues[index].end = srtTime(nextStart - 0.01);
  }
  const normalizedSrt = cues.map((cue, index) => `${index + 1}\n${cue.start} --> ${cue.end}\n${cue.text}`).join('\n\n');
  fs.writeFileSync(srtPath, `${normalizedSrt}\n`, 'utf8');
  const header = `[Script Info]
ScriptType: v4.00+
PlayResX: 1280
PlayResY: 720
WrapStyle: 0
ScaledBorderAndShadow: yes

[V4+ Styles]
Format: Name, Fontname, Fontsize, PrimaryColour, SecondaryColour, OutlineColour, BackColour, Bold, Italic, Underline, StrikeOut, ScaleX, ScaleY, Spacing, Angle, BorderStyle, Outline, Shadow, Alignment, MarginL, MarginR, MarginV, Encoding
Style: Dynamic,Microsoft JhengHei,40,&H004AD5FF,&H00FFFFFF,&H0021170D,&H900B2230,-1,0,0,0,100,100,0,0,3,2,0,2,76,76,34,1

[Events]
Format: Layer, Start, End, Style, Name, MarginL, MarginR, MarginV, Effect, Text`;
  const events = cues.map((cue) => {
    const duration = Math.max(0.2, srtSeconds(cue.end) - srtSeconds(cue.start));
    const text = karaokeText(cue.text, duration);
    return `Dialogue: 0,${assTime(cue.start)},${assTime(cue.end)},Dynamic,,0,0,0,,{\\fad(110,120)\\fscx94\\fscy94\\t(0,180,\\fscx100\\fscy100)}${text}`;
  });
  fs.writeFileSync(assPath, `${header}\n${events.join('\n')}\n`, 'utf8');
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
  const srtPath = path.join(folder, 'depth-video-captions.srt');
  const assPath = path.join(folder, 'depth-video-captions.ass');
  run('python', ['-m', 'edge_tts', '--voice', 'zh-TW-YunJheNeural', '--rate=-6%', '--text', script, '--write-media', audioPath, '--write-subtitles', srtPath]);
  writeDynamicAss(srtPath, assPath);
  const outputPath = path.join(tempDir, `week-${code}-captioned.mp4`);
  run('ffmpeg', [
    '-y', '-v', 'error', '-loop', '1', '-i', path.join(folder, 'depth-infographic.png'), '-i', audioPath,
    '-vf', "scale=1408:792,crop=1280:720,zoompan=z='min(zoom+0.00022,1.10)':x='iw/2-(iw/zoom/2)':y='ih/2-(ih/zoom/2)':d=1:s=1280x720:fps=30,ass=depth-video-captions.ass:fontsdir='C\\:/Windows/Fonts',format=yuv420p",
    '-c:v', 'libx264', '-preset', 'veryfast', '-tune', 'stillimage', '-crf', '22', '-c:a', 'aac', '-b:a', '160k',
    '-shortest', '-movflags', '+faststart', outputPath,
  ], { cwd: folder });
  fs.copyFileSync(outputPath, path.join(folder, 'depth-video.mp4'));
  fs.rmSync(assPath, { force: true });
  console.log(`Built W${code} depth video, animated captions and transcript.`);
}

fs.rmSync(tempDir, { recursive: true, force: true });
console.log(`Built ${selectedWeeks.length} stable Traditional Chinese depth videos.`);
