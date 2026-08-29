import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const source = fs.readFileSync(path.join(labDir, 'week-data.js'), 'utf8');
const sandbox = { window: {} };
vm.runInNewContext(source, sandbox);
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'week-student-language.js'), 'utf8'), sandbox);
const weeks = sandbox.window.GIFTED_WEEKS;
const siteBase = 'https://cagoooo.github.io/it-cockpit/gifted-ai-lab';
const imageUrl = `${siteBase}/assets/gifted-og.jpg`;
const depthAssetVersion = '20260828-kai-slides-v3';
const dayAssetVersion = '20260729-day-of-ai-v1';
const shortsAssetVersion = '20260829-shorts-k-v1';
const imageFallbackScript = '<script src="../../assets/webp-fallback.js" defer></script>';

const meta = ({ title, description, url, assetPrefix }) => `
<meta name="description" content="${description}">
<meta name="author" content="黃凱揚老師｜桃園市龍潭區石門國民小學">
<meta name="theme-color" content="#15383c">
<link rel="canonical" href="${url}">
<link rel="icon" href="${assetPrefix}gifted-favicon.ico" sizes="any">
<link rel="icon" href="${assetPrefix}gifted-favicon-32.png" type="image/png" sizes="32x32">
<link rel="apple-touch-icon" href="${assetPrefix}gifted-apple-touch-icon.png" sizes="180x180">
<link rel="manifest" href="../site.webmanifest">
<meta property="og:locale" content="zh_TW">
<meta property="og:type" content="website">
<meta property="og:site_name" content="石門智繪客">
<meta property="og:title" content="${title}">
<meta property="og:description" content="${description}">
<meta property="og:url" content="${url}">
<meta property="og:image" content="${imageUrl}">
<meta property="og:image:secure_url" content="${imageUrl}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="石門智繪客創造力資優 AI 資訊科技教學駕駛艙">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${title}">
<meta name="twitter:description" content="${description}">
<meta name="twitter:image" content="${imageUrl}">`;

for (const item of weeks) {
  const code = String(item.week).padStart(2, '0');
  const hasDayOfAiLesson = [3, 6, 9, 12, 15].includes(item.week);
  const weekDir = path.join(labDir, `week-${code}`);
  const title = `W${code} ${item.title}｜石門智繪客`;
  const description = `黃凱揚老師第 ${item.week} 週創造力資優資訊科技課程：${item.goal}包含動手闖關、三題小挑戰、NotebookLM、簡報與影片。`;
  const url = `${siteBase}/week-${code}/`;
  const commonHead = `<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${title}</title>${meta({ title, description, url, assetPrefix: '../assets/' })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">`;

  const cockpit = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
${commonHead}
<link rel="stylesheet" href="../week-cockpit.css">
<link rel="stylesheet" href="../week-cockpit-rich.css?v=${depthAssetVersion}">
<link rel="stylesheet" href="../week-learning-depth.css?v=${depthAssetVersion}">
<link rel="stylesheet" href="../week-phase-six.css?v=${depthAssetVersion}">
<link rel="stylesheet" href="../classroom-integrations.css">
<link rel="stylesheet" href="../gifted-visual-system.css?v=${depthAssetVersion}">${hasDayOfAiLesson ? `
<link rel="stylesheet" href="../day-of-ai-lessons.css?v=${dayAssetVersion}">
<link rel="stylesheet" href="../source-attribution.css?v=${dayAssetVersion}">` : ''}
${imageFallbackScript}
</head>
<body data-week="${item.week}"><div id="app"><p class="loading">正在載入第 ${item.week} 週專用駕駛艙…</p></div><script src="../week-data.js"></script><script src="../week-enrichment.js"></script><script src="../week-depth-data.js?v=${depthAssetVersion}"></script><script src="../week-student-language.js?v=${depthAssetVersion}"></script>${hasDayOfAiLesson ? `<script src="../day-of-ai-adaptations.js?v=${dayAssetVersion}"></script>` : ''}<script src="../youtube-data.js"></script><script src="../shorts-k-data.js?v=${shortsAssetVersion}"></script><script src="../week-cockpit.js?v=${depthAssetVersion}"></script><script src="../week-learning-depth.js?v=${depthAssetVersion}"></script><script src="../week-phase-six.js?v=${depthAssetVersion}"></script><script src="../classroom-integrations.js?v=${depthAssetVersion}"></script><script src="../picture-inquiry.js?v=${depthAssetVersion}"></script><script src="../teacher-sync.js?v=${depthAssetVersion}"></script>${hasDayOfAiLesson ? `<script src="../day-of-ai-lessons.js?v=${dayAssetVersion}"></script><script src="../source-attribution.js?v=${dayAssetVersion}"></script>` : ''}</body>
</html>
`;

  const slideTitle = `W${code} ${item.title}｜教師授課簡報`;
  const slideDescription = `石門智繪客第 ${item.week} 週教師授課簡報，提供 12 張課堂投影、章節總覽、全螢幕與觸控導覽。`;
  const slideUrl = `${url}lecture-slides.html`;
  const slides = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${slideTitle}</title>${meta({ title: slideTitle, description: slideDescription, url: slideUrl, assetPrefix: '../assets/' })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../week-slides.css">
<link rel="stylesheet" href="../week-slides-rich.css">
<link rel="stylesheet" href="../gifted-visual-system.css?v=${depthAssetVersion}">
${imageFallbackScript}
</head>
<body data-week="${item.week}"><main id="stage" class="stage"></main><nav class="controls" aria-label="簡報控制列"><a class="ctrl home" href="index.html" aria-label="回到本週駕駛艙">⌂</a><button id="overviewButton" class="ctrl" aria-label="章節總覽">M</button><button id="prev" class="ctrl" aria-label="上一張">←</button><span id="counter" class="counter">1 / 12</span><button id="next" class="ctrl" aria-label="下一張">→</button><button id="full" class="ctrl" aria-label="全螢幕">⛶</button></nav><div id="progress" class="progress"></div><div id="overview" class="slide-overview" aria-hidden="true"></div><script src="../week-data.js"></script><script src="../week-enrichment.js"></script><script src="../week-student-language.js?v=${depthAssetVersion}"></script><script src="../week-slides.js?v=${depthAssetVersion}"></script></body>
</html>
`;

  const notebookSlideTitle = `W${code} ${item.title}｜黃凱揚老師帶課新版投影片`;
  const notebookSlideUrl = `${url}notebooklm-kai-slides.html`;
  const notebookSlides = `<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>${notebookSlideTitle}</title>${meta({ title: notebookSlideTitle, description: `石門智繪客第 ${item.week} 週新版 NotebookLM 投影片，可左右播放、觸控翻頁與全螢幕展示。`, url: notebookSlideUrl, assetPrefix: '../assets/' })}
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../notebooklm-pdf-player.css?v=${depthAssetVersion}">
${imageFallbackScript}
</head>
<body class="pdf-player" data-week="${item.week}" data-pdf="notebooklm-kai-slides.pdf" data-title="${notebookSlideTitle}">
<header class="pdf-header"><a class="pdf-home" href="index.html" aria-label="回到本週駕駛艙" title="回到本週駕駛艙">⌂</a><div class="pdf-heading"><small>NOTEBOOKLM · W${code}</small><strong>${item.title}</strong></div></header>
<main class="pdf-stage"><div id="pdfViewport" class="pdf-viewport"><canvas id="slideCanvas" aria-label="新版 NotebookLM 投影片"></canvas><p id="pdfLoading" class="pdf-loading" aria-live="polite">正在載入新版 NotebookLM 簡報…</p></div></main>
<nav class="pdf-controls" aria-label="投影片控制列"><button id="pdfOverviewButton" type="button" aria-label="投影片總覽" title="投影片總覽">▦</button><button id="pdfPrevious" type="button" aria-label="上一張投影片" title="上一張投影片">←</button><span id="pdfCounter" class="pdf-counter">1 / 1</span><button id="pdfNext" type="button" aria-label="下一張投影片" title="下一張投影片">→</button><button id="pdfFullscreen" type="button" aria-label="全螢幕" title="全螢幕">⛶</button><a id="pdfDirect" href="notebooklm-kai-slides.pdf" aria-label="開啟原始 PDF" title="開啟原始 PDF">↓</a></nav>
<div id="pdfProgress" class="pdf-progress"></div>
<aside id="pdfOverview" class="pdf-overview" aria-hidden="true"><div class="pdf-overview-inner"><div class="pdf-overview-head"><div><h1>投影片總覽</h1><p>點選縮圖可直接跳到該頁。</p></div><button id="pdfOverviewClose" class="pdf-overview-close" type="button" aria-label="關閉投影片總覽">×</button></div><div class="pdf-thumb-grid"></div></div></aside>
<script type="module" src="../notebooklm-pdf-player.js?v=${depthAssetVersion}"></script>
</body>
</html>
`;

  const notebookSlideV2Title = `W${code} ${item.title}｜黃凱揚老師帶課 Q 版新版投影片`;
  const notebookSlideV2Url = `${url}notebooklm-kai-slides-v2.html`;
  const notebookSlidesV2 = notebookSlides
    .replaceAll(notebookSlideTitle, notebookSlideV2Title)
    .replaceAll(notebookSlideUrl, notebookSlideV2Url)
    .replaceAll('notebooklm-kai-slides.pdf', 'notebooklm-kai-slides-v2.pdf')
    .replaceAll('新版 NotebookLM', 'Q 版新版 NotebookLM')
    .replaceAll('黃凱揚老師帶課新版投影片', '黃凱揚老師帶課 Q 版新版投影片')
    .replaceAll('週Q 版', '週 Q 版')
    .replaceAll('載入Q 版', '載入 Q 版');

  fs.writeFileSync(path.join(weekDir, 'index.html'), cockpit, 'utf8');
  fs.writeFileSync(path.join(weekDir, 'lecture-slides.html'), slides, 'utf8');
  fs.writeFileSync(path.join(weekDir, 'notebooklm-kai-slides.html'), notebookSlides, 'utf8');
  fs.writeFileSync(path.join(weekDir, 'notebooklm-kai-slides-v2.html'), notebookSlidesV2, 'utf8');
}

console.log(`Generated ${weeks.length} cockpit pages and ${weeks.length} slide pages.`);
