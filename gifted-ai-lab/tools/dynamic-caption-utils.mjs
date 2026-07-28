import fs from 'node:fs';

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

export function writeDynamicAss(srtPath, assPath) {
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
