import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const sandbox = { window: {} };
for (const file of ['week-data.js', 'week-enrichment.js', 'week-depth-data.js', 'week-student-language.js']) {
  vm.runInNewContext(fs.readFileSync(path.join(labDir, file), 'utf8'), sandbox);
}

const weeks = sandbox.window.GIFTED_WEEKS;
const enrichment = sandbox.window.GIFTED_ENRICHMENT;
const depthData = sandbox.window.GIFTED_DEPTH;
const routeNames = { foundation: '基礎', advanced: '進階', researcher: '研究者' };

for (const week of weeks) {
  const code = String(week.week).padStart(2, '0');
  const extra = enrichment[week.week];
  const depth = depthData[week.week];
  const lines = [
    `# W${code} ${week.title}：資優探究深化來源`,
    '',
    '## 課程定位',
    '',
    `- 授課教師：黃凱揚老師`,
    `- 學校：桃園市龍潭區石門國民小學`,
    `- 本週驅動問題：${extra.drivingQuestion}`,
    `- 本週可見產出：${week.output}`,
    '- 教學原則：先留下學生原想法，再用證據、反例與重測深化；AI 只協助擴充與比較，不代替學生判斷。',
    '',
    '## 診斷式形成評量',
    '',
    `學生整體解釋任務：${depth.evidencePrompt}`,
    '',
  ];
  extra.quiz.forEach((question, index) => {
    lines.push(`### 概念 ${index + 1}：${question[0]}`, '', `- 核心答案：${question[1][question[2]]}`, `- 概念說明：${question[3]}`, `- 第一階提示：${depth.hints[index][0]}`, `- 第二階提示：${depth.hints[index][1]}`, '');
  });
  lines.push('## 自適應挑戰路徑', '');
  for (const [key, route] of Object.entries(depth.routes)) {
    lines.push(`### ${routeNames[key]}路徑：${route[0]}`, '', `- 建議時間：${route[1]}`, ...route[2].map((task, index) => `- 任務 ${index + 1}：${task}`), `- 完成證據：${route[3]}`, '');
  }
  lines.push(
    '## 教師診斷追問',
    '',
    '- 基礎路徑：請先指出看見的事實，再說這項事實支持哪個判斷。',
    '- 進階路徑：什麼反例會讓目前規則失敗？要如何修改？',
    '- 研究者路徑：假設可能被什麼證據推翻？別人能否重做方法？',
    '',
    '## NotebookLM 產出規格',
    '',
    '- 資訊圖表：呈現核心概念、常見迷思、兩層提示與三層挑戰，不使用學生個資。',
    '- 深化簡報：以問題、預測、反例、測試、證據與反思組織，不只是知識摘要。',
    '- 研究者短片：用一個認知衝突開場，提出可實作挑戰，結尾留下未解問題，不直接公布完整解法。',
    '',
    '## 資料與 AI 安全',
    '',
    '- 不輸入姓名、臉部、帳號、聯絡資訊、未公開作品或可識別的資優身分資料。',
    '- 任何 AI 內容都要查證並說明採用、修改或不採用的理由。',
    '- 公開成果必須匿名，並由教師完成最後核准。',
  );
  fs.writeFileSync(path.join(labDir, `week-${code}`, 'depth-source.md'), `${lines.join('\n')}\n`, 'utf8');
}

console.log(`Built ${weeks.length} NotebookLM depth sources.`);
