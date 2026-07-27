import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';


const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const youtubeRoot = path.join(root, 'youtube');
const site = 'https://cagoooo.github.io/it-cockpit/gifted-ai-lab';
const notebookRows = JSON.parse(fs.readFileSync(path.join(root, 'notebooks.json'), 'utf8').replace(/^\uFEFF/, ''));
const notebooks = new Map(notebookRows.map(item => [Number(item.week), item.notebook_url]));

const weeks = [
  { week: 3, title: 'AI 是什麼？生活中的智慧工具', focus: '以感知、推理、學習、互動與社會影響辨認真正的 AI，並用證據說明判斷。', output: 'AI／非 AI 判斷卡與理由說明', chapters: [['00:00','生活中的智慧工具謎題'],['00:30','會自動運作就等於 AI 嗎'],['00:44','AI 的五項重要能力'],['00:54','辨認只照固定規則的假 AI'],['01:07','本週任務與討論問題']] },
  { week: 6, title: '資料集與機器如何學習', focus: '理解資料、標籤、學習與預測之間的關係，並檢查錯誤標籤如何影響結果。', output: '機器學習三步驟流程圖與微型資料集', chapters: [['00:00','機器如何從例子學習'],['00:30','資料是機器學習的食物'],['00:42','錯誤標籤會造成什麼結果'],['01:04','人類的資料責任'],['01:17','建立微型資料集任務']] },
  { week: 9, title: '資料偏見與石門生活資料採集', focus: '辨認資料代表性、偏見與隱私風險，練習建立安全又多元的校園資料。', output: '石門生活資料採集表與安全審查', chapters: [['00:00','AI 為什麼認不得熟悉事物'],['00:23','資料偏見與學習盲點'],['00:49','資料會放大哪些人的經驗'],['01:05','石門校園 AI 訓練師任務'],['01:33','個資與照片的隱私界線'],['01:45','補齊多元資料與反思']] },
  { week: 12, title: '資料整理與演算法三元素', focus: '用輸入、處理、輸出描述解題流程，並把模糊任務拆成電腦可以執行的明確規則。', output: '資料表 v2 與 IPO 演算法單', chapters: [['00:00','從混亂廚房看資料整理'],['00:30','演算法的核心結構'],['00:47','輸入必須具體明確'],['00:58','電腦不會自行猜測指令'],['01:22','人類負責查證與判斷'],['01:43','IPO 動手挑戰'],['02:11','極端輸入與討論問題']] },
  { week: 15, title: '精準指令與除錯思維', focus: '練習明確、可執行、可驗證的指令，完成預測、測試、找錯、修正與再測試。', output: '人類機器人指令 v2 與除錯紀錄', chapters: [['00:00','模糊指令會發生什麼事'],['00:30','輸入、處理與輸出'],['00:40','把指令寫得精準'],['00:57','除錯循環登場'],['01:30','人類與 AI 的合作規則'],['01:45','人類機器人挑戰'],['02:10','一次修正一個錯誤']] },
  { week: 18, title: 'Scratch 互動與分類器概念', focus: '用 Scratch 條件積木建立規則式分類器，測試一般案例、邊界案例與不確定輸入。', output: 'Scratch 分類器 v1 與測試表', chapters: [['00:00','分類器與回收邊界案例'],['00:30','用 Scratch 寫分類規則'],['00:40','不確定時不要亂猜'],['00:50','規則式與學習式分類'],['01:08','本週任務與討論']] },
  { week: 21, title: '提示工程與 AI 創意發想', focus: '運用角色、目標、背景、格式、限制與檢查條件改善提示詞，保留人的原創與判斷。', output: '提示詞 v1-v3 與 AI 回覆比較表', chapters: [['00:00','先思考再請 AI 擴充'],['00:30','如何和 AI 神隊友溝通'],['00:43','提示詞六大元素'],['01:01','採用、修改或捨棄 AI 點子'],['01:15','個資與 AI 幻覺安全守則'],['01:30','人類才是最後決策者'],['01:40','本週任務與離開小卡']] },
  { week: 24, title: 'AI 倫理與專題定題', focus: '以真實、隱私、公平與責任檢驗 AI 使用，完成具體、可測試且安全的專題定題。', output: 'AI 使用規範與一頁專題計畫', chapters: [['00:00','AI 不能取代人的方向盤'],['00:30','隱私界線與危險提問'],['00:47','使用 AI 的責任歸屬'],['00:59','人類把關的黃金準則'],['01:13','專題定題公式'],['01:27','題目必須通過的四項測試'],['01:41','假資料由誰負責']] },
  { week: 27, title: '原型設計與作品製作', focus: '把點子縮小成可操作、可測試的最小可行原型，並以使用者證據規劃下一版。', output: '流程圖、介面草圖與 MVP v1', chapters: [['00:00','把大點子變成真實作品'],['00:12','最小可行原型 MVP'],['00:29','從核心功能開始測試'],['00:44','人類與 AI 的設計分工'],['01:06','製作與測試任務'],['01:20','只能保留一個功能時怎麼選']] },
  { week: 30, title: '測試精緻化與成果發表', focus: '用真實試用證據排列修改優先順序，完成 MVP v2、成果發表與下一步反思。', output: 'MVP v2、成果發表與完整歷程檔', chapters: [['00:00','不要提示測試者怎麼操作'],['00:30','排列回饋與修改優先順序'],['00:43','AI 只能協助不能代替決定'],['01:05','90 分鐘測試與修改任務'],['01:19','準備最終成果發表'],['01:33','如果重來一次會改變什麼']] },
];

const annualChapters = [
  ['00:00','課程總覽與發明家任務'],['00:38','W03 辨認真正的 AI'],['01:34','W06 資料集與機器學習'],
  ['02:07','W09 資料偏見與隱私'],['02:50','W12 IPO 演算法'],['03:52','W15 精準指令與除錯'],
  ['04:22','W18 Scratch 分類器'],['04:52','W21 提示工程與人機協作'],['06:27','W24 AI 倫理守則'],
  ['06:57','W27 專題聚焦與原型設計'],['08:23','W30 真實測試與成果發表'],['09:27','反思與下一個發明起點'],
];

function chapterText(chapters) {
  return chapters.map(([time, label]) => `${time} ${label}`).join('\n');
}

function weekLinks() {
  return weeks.map(item => {
    const code = String(item.week).padStart(2, '0');
    return `W${code} ${item.title}\n${site}/week-${code}/`;
  }).join('\n\n');
}

function descriptionForWeek(item) {
  const code = String(item.week).padStart(2, '0');
  const cockpit = `${site}/week-${code}/`;
  return `${item.title}｜石門智繪客創造力資優資訊科技課程

本影片是桃園市龍潭區石門國民小學「石門智繪客」創造力資優資訊科技課程第 ${item.week} 週的課前概念導覽。課程採兩節連排，影片只負責建立共同概念，完整探究、實作、形成評量與反思請進入本週教學駕駛艙。

本週教學資源
教學駕駛艙：${cockpit}
12 張互動簡報：${cockpit}lecture-slides.html
直式教師詳案：${cockpit}teacher-pack.pdf
本週 NotebookLM：${notebooks.get(item.week)}
年度課程總覽：${site}/

學習重點
${item.focus}

本週可見產出
${item.output}

影片章節
${chapterText(item.chapters)}

字幕
本片提供繁體中文 CC 字幕，可由 YouTube 播放器的「字幕」按鈕開啟。

課程設計與內容審訂：黃凱揚老師
學校：桃園市龍潭區石門國民小學
影片由 NotebookLM 協助產製，教學內容、活動流程與發布資料均由教師規劃及審訂。

#石門智繪客 #資優教育 #AI素養 #資訊科技 #NotebookLM`;
}

function annualDescription() {
  return `石門智繪客｜創造力資優 AI 素養資訊科技課程總覽

這是一套為創造力資優學生設計的 10 週資訊科技課程，從辨認 AI、資料與偏見、演算法與除錯，一路進入提示工程、AI 倫理、原型製作、真實測試與成果發表。每次課程採兩節連排，強調「你先思考，AI 協助，最後由你決定」。

完整教學駕駛艙
年度總覽：${site}/
年度互動簡報：${site}/lecture-slides.html
年度教師詳案：${site}/materials/teacher-guide.pdf
學生學習手冊：${site}/materials/student-workbook.pdf

10 個週次專用駕駛艙
${weekLinks()}

影片章節
${chapterText(annualChapters)}

字幕
本片提供繁體中文 CC 字幕，可由 YouTube 播放器的「字幕」按鈕開啟。

課程設計與內容審訂：黃凱揚老師
學校：桃園市龍潭區石門國民小學
影片由 NotebookLM 協助產製，教學內容、活動流程與發布資料均由教師規劃及審訂。

#石門智繪客 #資優教育 #AI素養 #創造力 #資訊科技 #NotebookLM`;
}

fs.mkdirSync(youtubeRoot, { recursive: true });
const oldManifestPath = path.join(youtubeRoot, 'manifest.json');
const oldRows = fs.existsSync(oldManifestPath)
  ? JSON.parse(fs.readFileSync(oldManifestPath, 'utf8').replace(/^\uFEFF/, ''))
  : [];
const oldBySlug = new Map(oldRows.map(item => [item.slug, item]));
const entries = [
  {
    slug: 'annual',
    title: '石門智繪客｜創造力資優 AI 素養資訊科技課程總覽（10 週完整導覽）',
    video: 'materials/notebooklm-course-video.mp4',
    description: annualDescription(),
    chapters: annualChapters,
  },
  ...weeks.map(item => {
    const code = String(item.week).padStart(2, '0');
    return {
      slug: `week-${code}`,
      week: item.week,
      title: `W${code} ${item.title}｜石門智繪客資優班`,
      video: `week-${code}/video.mp4`,
      description: descriptionForWeek(item),
      chapters: item.chapters,
    };
  }),
].map(item => ({
  ...item,
  tags: ['石門智繪客','資優教育','AI素養','資訊科技','NotebookLM','石門國小','黃凱揚老師'],
  privacy: 'public',
  caption: `youtube/${item.slug}/zh-TW.srt`,
  ...(oldBySlug.get(item.slug) || {}),
  title: item.title,
  video: item.video,
  description: item.description,
  chapters: item.chapters,
  privacy: 'public',
  caption: `youtube/${item.slug}/zh-TW.srt`,
}));

for (const entry of entries) {
  const directory = path.join(youtubeRoot, entry.slug);
  fs.mkdirSync(directory, { recursive: true });
  fs.writeFileSync(path.join(directory, 'description.txt'), entry.description, 'utf8');
  fs.writeFileSync(path.join(directory, 'metadata.json'), JSON.stringify(entry, null, 2), 'utf8');
}
fs.writeFileSync(oldManifestPath, JSON.stringify(entries, null, 2), 'utf8');
console.log(`Built ${entries.length} YouTube packages.`);
