import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const corrections = {
  annual: {
    '11.04': '十週任務「石門智繪客：AI 創意解題」。',
    '41.43': '你看喔，一邊是只要你走過去，',
    '48.83': '另外一邊是能跟你天南地北聊天的 ChatGPT。',
    '73.75': '辨識與推理，',
    '101.45': '想像一下，我們在玩你畫我猜的遊戲。',
    '170.35': '這時候就要派出演算法的 IPO 模型了。',
    '190.11': '步驟三，',
    '213.49': '這就是演算法的骨架。',
    '218.61': '想像你在設計一個磁力玩具的安全提醒器，',
    '223.23': '如果磁鐵靠得太近，',
    '250.65': '你的第一版 V1 本來就是拿來被測試、用來抓 bug 的，',
    '309.88': '你才是那個掌控全局的創造大師。',
    '322.68': 'AI 是不可能取代你聰明的腦袋的耶！',
    '357.98': '這個專屬句型很好用：',
    '360.18': '「今天我決定＿＿，AI 幫我＿＿。」',
    '414.12': '你的作品才會安全又符合道德。',
    '424.18': '我們來用這個企劃句型聚焦一下：',
    '431.22': '做出一個原型。',
    '436.54': '先鎖定一個你能幫助的對象，',
    '474.10': '這個原型版本記錄表絕對是你最好的戰友。',
    '481.50': '最小可行原型的縮寫。',
    '518.02': '哪些是會讓程式當機的必修問題，',
    '550.98': '你用了什麼資料跟演算法，',
    '588.00': '希望這次的石門智繪客任務，',
  },
  'week-03': {
    '48.45': '但一般計算機就只能死板地算數學啦。',
    '81.81': '大家暫停影片，',
  },
  'week-06': {
    '80.12': '然後幫它們精準命名、貼標籤吧。',
  },
  'week-09': {
    '11.20': '怎麼會認不出我們常吃的饅頭或平頂公寓啊？',
    '20.90': '它當然滿頭問號、認不得囉！',
    '48.95': '資料就像一把放大鏡，',
    '69.23': '請化身成為最負責任的石門校園 AI 訓練師。',
    '74.73': '記住三大口訣：你先動腦想，再讓 AI 幫忙擴充，',
    '93.37': '最後，隱私原則請牢記：',
    '117.05': '先暫停影片，大家討論看看吧。',
  },
  'week-12': {
    '7.24': '想像一下，你想烤個超好吃的蛋糕，廚房卻一團糟！',
    '24.03': '這時，演算法就出馬了！',
    '32.81': '超強演算法背後都藏著三個神奇公式。',
    '63.87': '它們不會通靈，只會死盯著指令；叫它往東，絕不往西。',
    '134.08': '揪出那些可能讓演算法崩潰的極端狀況。',
    '142.86': '演算法該怎麼辦？',
  },
  'week-15': {
    '22.80': '所以我們需要演算法。',
    '59.90': '我們要像名偵探一樣，',
    '114.32': '你的任務就是寫出無敵演算法，',
  },
  'week-18': {
    '6.96': '想想看，如果垃圾只分紙跟塑膠，',
    '20.56': '在程式裡，有個叫分類器的神奇分類帽，',
    '27.52': '只要用 Scratch 裡的「如果……那麼」積木，',
    '33.62': '但如果遇到沒倒乾淨的飲料瓶呢？',
  },
  'week-21': {
    '19.92': '麻省理工的研究說，',
    '31.04': '最後再由你親自判斷。',
    '48.00': '把 AI 設定成視障人士或三年級學生，',
    '56.84': '與其給模糊想法，不如加上具體限制，',
    '59.64': '答案才會精準。',
    '63.96': '決定要採用、修改還是捨棄，',
    '79.12': '就算用學校帳號也一樣喔。',
  },
  'week-24': {
    '23.16': '為你隆重介紹檢驗 AI 的四面鏡，',
    '53.16': '沒經過同意就上傳朋友照片給 AI，',
    '56.52': '出事了，負責的可是你喔，',
    '79.72': '請套用這個神奇公式：',
    '86.72': '你的點子必須闖過四關：',
  },
  'week-27': {},
  'week-30': {
    '19.43': '千萬別開口教，',
    '32.93': '就像修玩具車，',
    '35.53': '再去管烤漆顏色。',
    '45.73': '永遠是你先想點子，',
    '50.93': '這裡有個絕對要遵守的隱私鐵則：',
  },
};

const globalReplacements = [
  [/演演算法/g, '演算法'],
  [/十門校園/g, '石門校園'],
  [/智慧客/g, '智繪客'],
  [/資料級/g, '資料集'],
];

function cleanText(text) {
  let result = text.trim();
  for (const [pattern, replacement] of globalReplacements) {
    result = result.replace(pattern, replacement);
  }
  result = result
    .replaceAll(',', '，')
    .replaceAll('?', '？')
    .replaceAll('!', '！')
    .replace(/\s*AI\s*/g, ' AI ')
    .replace(/\s+/g, ' ')
    .replace(/^ /, '')
    .replace(/ ([，。！？；：])/g, '$1');
  return result;
}

function srtTime(seconds) {
  const millis = Math.max(0, Math.round(seconds * 1000));
  const h = Math.floor(millis / 3600000);
  const m = Math.floor((millis % 3600000) / 60000);
  const s = Math.floor((millis % 60000) / 1000);
  const ms = millis % 1000;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')},${String(ms).padStart(3, '0')}`;
}

function wrapCaption(text, max = 22) {
  if (text.length <= max) return text;
  const punctuation = new Set(['，', '。', '！', '？', '；', '：']);
  const lines = [];
  let remaining = text;
  while (remaining.length > max) {
    let cut = max;
    for (let i = max; i >= Math.max(10, max - 8); i -= 1) {
      if (punctuation.has(remaining[i - 1])) {
        cut = i;
        break;
      }
    }
    lines.push(remaining.slice(0, cut));
    remaining = remaining.slice(cut);
  }
  if (remaining) lines.push(remaining);
  return lines.join('\n');
}

for (const [slug, slugCorrections] of Object.entries(corrections)) {
  const folder = path.join(root, 'youtube', slug);
  const jsonPath = path.join(folder, 'transcript.json');
  const data = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  for (const segment of data.segments) {
    const key = Number(segment.start).toFixed(2);
    segment.text = cleanText(slugCorrections[key] ?? segment.text);
  }

  const transcript = data.segments
    .map((segment) => `[${Number(segment.start).toFixed(2).padStart(7, '0')}] ${segment.text}`)
    .join('\n') + '\n';
  const srt = data.segments
    .map((segment, index) => `${index + 1}\n${srtTime(segment.start)} --> ${srtTime(segment.end)}\n${wrapCaption(segment.text)}\n`)
    .join('\n');

  fs.writeFileSync(jsonPath, `${JSON.stringify(data, null, 2)}\n`, 'utf8');
  fs.writeFileSync(path.join(folder, 'transcript.txt'), `\ufeff${transcript}`, 'utf8');
  fs.writeFileSync(path.join(folder, 'zh-TW.srt'), `\ufeff${srt}`, 'utf8');
  console.log(`[OK] ${slug}: ${data.segments.length} captions`);
}
