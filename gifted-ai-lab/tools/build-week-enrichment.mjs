import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-data.js'), 'utf8'), sandbox);
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-enrichment.js'), 'utf8'), sandbox);

for (const data of sandbox.window.GIFTED_WEEKS) {
  const extra = sandbox.window.GIFTED_ENRICHMENT[data.week];
  const code = String(data.week).padStart(2, '0');
  const lines = [
    `# 石門智繪客 W${code}｜${data.title}｜進階探究與形成評量`,
    '',
    '## 課程定位',
    '',
    `- 授課教師：黃凱揚老師`,
    `- 學校：桃園市龍潭區石門國民小學`,
    `- 對象：三年級創造能力資賦優異學生 1 名`,
    `- 日期：${data.date}`,
    `- 節數：連續 2 節，每節 45 分鐘，共 90 分鐘`,
    `- 本週目標：${data.goal}`,
    `- 可見產出：${data.output}`,
    '',
    '## 驅動問題',
    '',
    extra.drivingQuestion,
    '',
    '## 四段探究路徑',
    ''
  ];

  extra.path.forEach((item, index) => {
    lines.push(`### ${index + 1}. ${item[0]}`, '', `- 探究任務：${item[1]}`, `- 必留證據：${item[2]}`, '');
  });

  lines.push('## 核心概念', '');
  extra.concepts.forEach(item => lines.push(`### ${item[0]}`, '', item[1], ''));
  lines.push(
    '## 迷思診斷', '',
    `- 常見迷思：${extra.misconception[0]}`,
    `- 概念澄清：${extra.misconception[1]}`,
    `- 驗證方式：${extra.misconception[2]}`,
    '',
    '## 三題形成評量與解析', ''
  );

  extra.quiz.forEach((item, index) => {
    lines.push(`### 第 ${index + 1} 題`, '', item[0]);
    item[1].forEach((option, optionIndex) => lines.push(`- ${String.fromCharCode(65 + optionIndex)}. ${option}`));
    lines.push(`- 正確答案：${String.fromCharCode(65 + item[2])}`, `- 解析：${item[3]}`, '');
  });

  lines.push('## 常見問題 FAQ', '');
  extra.faq.forEach(item => lines.push(`### ${item[0]}`, '', item[1], ''));
  lines.push('## 本週成功條件', '');
  extra.success.forEach(item => lines.push(`- ${item}`));
  lines.push(
    '',
    '## NotebookLM 專屬研究提問', ''
  );
  extra.prompts.forEach((prompt, index) => lines.push(`${index + 1}. ${prompt}`));
  lines.push(
    '',
    '## NotebookLM 回應原則', '',
    '1. 使用適合國小三年級理解的繁體中文，但保留資優生需要的反例、比較、證據與開放探究。',
    '2. 學生只有一位，活動以一對一對話、實作、測試與版本紀錄為主，不設計分組競賽。',
    '3. 先讓學生提出想法，再由 AI 擴充；最後由學生查證、選擇並負責。',
    '4. 不輸入或推測學生姓名、臉部、聯絡資訊、學習診斷等可識別個資。',
    '5. 不直接替學生完成作品；優先提供追問、反例、檢查條件與分層提示。',
    '6. 形成性回饋必須引用學生作品、測試或口頭說明中的可見證據。',
    '',
    '---',
    '',
    '本來源搭配原授課詳案使用：原詳案提供 90 分鐘流程，本來源補充探究層次、迷思診斷、評量、FAQ 與 NotebookLM 查詢策略。'
  );

  fs.writeFileSync(path.join(labDir, `week-${code}`, 'enrichment.md'), lines.join('\n'), 'utf8');
}

console.log(`Generated ${sandbox.window.GIFTED_WEEKS.length} enrichment sources.`);
