param(
  [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = 'Stop'
$giftedRoot = Join-Path $Root 'gifted-ai-lab'
$teacherPath = Join-Path $giftedRoot 'materials\teacher-guide.md'
$studentPath = Join-Path $giftedRoot 'materials\student-workbook.md'
$teacher = Get-Content -LiteralPath $teacherPath -Raw -Encoding utf8
$student = Get-Content -LiteralPath $studentPath -Raw -Encoding utf8

$weeks = @(
  @{ Week=3; Title='AI 是什麼：生活中的智慧工具'; Date='115.9.23'; Link='https://cagoooo.github.io/it-cockpit/ai-explorer/'; Research='AI 與一般自動化的差異、AI 五大概念、生活工具判斷證據、容易混淆的反例。' },
  @{ Week=6; Title='資料集與機器如何學習'; Date='115.10.14'; Link='https://cagoooo.github.io/it-cockpit/machine-learning/'; Research='資料集、標記、訓練與預測的關係；資料量、資料品質與錯誤預測。' },
  @{ Week=9; Title='資料偏見與石門生活資料採集'; Date='115.11.4'; Link='https://cagoooo.github.io/it-cockpit/ai-fairness/'; Research='文化、風格與年齡偏見；代表性、必要性、隱私安全與石門校園資料。' },
  @{ Week=12; Title='資料整理與演算法三元素'; Date='115.11.25'; Link='https://cagoooo.github.io/it-cockpit/algorithm/'; Research='資料清理、欄位一致性、輸入－處理－輸出，以及可被逐步執行的演算法。' },
  @{ Week=15; Title='精準指令與除錯思維'; Date='115.12.16'; Link='https://cagoooo.github.io/it-cockpit/algorithm/'; Research='明確、可執行、可驗證的指令；預測、測試、找錯、修正、重測的除錯循環。' },
  @{ Week=18; Title='Scratch 互動與分類器概念'; Date='116.3.10'; Link='https://cagoooo.github.io/it-cockpit/scratch-animation/'; Research='Scratch 條件積木、規則式分類器、學習式分類器、一般案例與邊界案例測試。' },
  @{ Week=21; Title='提示工程與 AI 創意發想'; Date='116.3.31'; Link='https://cagoooo.github.io/it-cockpit/gemini-guided-learning/'; Research='角色、目標、格式、限制、例子與檢查條件；人先思考、AI 擴充、人再判斷。' },
  @{ Week=24; Title='AI 倫理與專題定題'; Date='116.4.21'; Link='https://cagoooo.github.io/it-cockpit/digital-safety/'; Research='引用、事實查核、隱私、公平、AI 協作揭露，以及可測試的真實問題定義。' },
  @{ Week=27; Title='原型設計與作品製作'; Date='116.5.12'; Link='https://cagoooo.github.io/it-cockpit/scratch-animation/'; Research='使用者流程、故事板、核心功能、最小可行原型、版本保存與第一次可用性測試。' },
  @{ Week=30; Title='測試精緻化與成果發表'; Date='116.6.2'; Link='https://cagoooo.github.io/it-cockpit/gifted-ai-lab/'; Research='不提示試用、觀察證據、修正優先序、前後版本比較、3 至 5 分鐘成果發表。' }
)

function Get-WeekSection([string]$text, [int]$week, [int]$nextWeek) {
  $startPattern = "(?m)^## 第 $week 週"
  $start = [regex]::Match($text, $startPattern)
  if (-not $start.Success) { throw "找不到第 $week 週段落" }
  if ($nextWeek -gt 0) {
    $end = [regex]::Match($text.Substring($start.Index + $start.Length), "(?m)^## 第 $nextWeek 週")
    if ($end.Success) { return $text.Substring($start.Index, $start.Length + $end.Index).Trim() }
  }
  $nextHeading = [regex]::Match($text.Substring($start.Index + $start.Length), '(?m)^## (?!第 )')
  if ($nextHeading.Success) { return $text.Substring($start.Index, $start.Length + $nextHeading.Index).Trim() }
  return $text.Substring($start.Index).Trim()
}

for ($i = 0; $i -lt $weeks.Count; $i++) {
  $item = $weeks[$i]
  $week = [int]$item.Week
  $nextWeek = if ($i -lt $weeks.Count - 1) { [int]$weeks[$i + 1].Week } else { 0 }
  $folder = Join-Path $giftedRoot ('week-{0:d2}' -f $week)
  New-Item -ItemType Directory -Force -Path $folder | Out-Null
  $teacherSection = Get-WeekSection $teacher $week $nextWeek
  $studentSection = Get-WeekSection $student $week $nextWeek
  $source = @"
# 石門智繪客｜第 $week 週專屬 NotebookLM 來源

## 課程識別

- 授課教師：黃凱揚老師
- 學校：桃園市龍潭區石門國民小學
- 對象：三年級創造能力資賦優異學生 1 名
- 日期：$($item.Date)
- 節數：連續 2 節，每節 45 分鐘，共 90 分鐘
- 主題：$($item.Title)
- 年度主軸：AI 創意解題與智慧生活設計
- 相關互動教材：$($item.Link)

## 本週研究焦點

$($item.Research)

研究與教材產出時必須遵守：

1. 使用適合國小三年級理解的繁體中文，但保留資優生需要的反例、比較、證據與開放探究。
2. 學生只有一位，活動要以一對一對話、實作、測試與作品版本為主，不設計分組競賽。
3. 先讓學生提出想法，再使用 AI 擴充，最後由學生與教師查證、選擇並負責。
4. 不輸入或虛構學生姓名、臉部、聯絡資訊、學習診斷或其他可識別個資。
5. 每 45 分鐘都要有明確檢查點，90 分鐘結束必須留下可見產出。
6. 另外準備無帳號、無 AI 或無網路時仍可完成的替代活動。

## 教師授課詳案

$teacherSection

## 學生任務與紀錄

$studentSection

## NotebookLM 產出規格

### 專屬簡報

- 只處理本週主題，不做十週年度總覽。
- 建議 8 至 12 頁：問題情境、關鍵概念、示例、第一節任務、檢查點、第二節任務、測試或反思、離堂任務。
- 每頁只放一個主要概念，避免大段文字與不適齡術語。
- 至少加入一個容易誤判的反例，以及一個要求學生說明證據的問題。

### 專屬短影片

- 使用繁體中文，目標長度 2 至 4 分鐘。
- 先用生活問題引起動機，再解釋本週核心概念，最後交代學生實作任務。
- 不替學生直接完成答案，不虛構學生個資，不把 AI 描述成永遠正確。
- 結尾必須出現一句可暫停討論的提問。

### 教師可向 NotebookLM 詢問

1. 請依本週 90 分鐘流程，列出每個時間點最適合的教師追問。
2. 學生若快速完成基本任務，可以加入哪兩個不只是增加題量的進階挑戰？
3. 哪些地方最容易形成迷思？請提供一個反例與一個診斷問題。
4. 若當天無法使用網路或生成式 AI，如何達成相同學習目標？
5. 請依學生作品證據整理一份形成性回饋，但不要替教師決定最終評量。

---

Made with ❤️ by [阿凱老師](https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&nsn=16#a5)
"@
  Set-Content -LiteralPath (Join-Path $folder 'source.md') -Value $source -Encoding utf8

  $weekCode = '{0:d2}' -f $week
  $indexHtml = @"
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>W$weekCode $($item.Title)｜石門智繪客</title>
<meta name="description" content="黃凱揚老師第 $week 週資優班資訊科技專用教學駕駛艙：$($item.Title)。">
<meta name="theme-color" content="#15383c">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;500;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../week-cockpit.css">
</head>
<body data-week="$week"><div id="app"><p class="loading">正在載入第 $week 週專用駕駛艙…</p></div><script src="../week-data.js"></script><script src="../week-cockpit.js"></script></body>
</html>
"@
  Set-Content -LiteralPath (Join-Path $folder 'index.html') -Value $indexHtml -Encoding utf8

  $slidesHtml = @"
<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover">
<title>W$weekCode 課堂投影簡報｜石門智繪客</title>
<meta name="theme-color" content="#132f33">
<link rel="icon" href="../../favicon.svg" type="image/svg+xml">
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Noto+Sans+TC:wght@400;600;700;800;900&family=JetBrains+Mono:wght@600;700&display=swap" rel="stylesheet">
<link rel="stylesheet" href="../week-slides.css">
</head>
<body data-week="$week"><main id="stage" class="stage"></main><nav class="controls" aria-label="簡報控制列"><a class="ctrl home" href="index.html" aria-label="回到本週駕駛艙">⌂</a><button id="prev" class="ctrl" aria-label="上一張">←</button><span id="counter" class="counter">1 / 6</span><button id="next" class="ctrl" aria-label="下一張">→</button><button id="full" class="ctrl" aria-label="全螢幕">⛶</button></nav><div id="progress" class="progress"></div><script src="../week-data.js"></script><script src="../week-slides.js"></script></body>
</html>
"@
  Set-Content -LiteralPath (Join-Path $folder 'lecture-slides.html') -Value $slidesHtml -Encoding utf8
}

Write-Host "已建立 $($weeks.Count) 份週次 NotebookLM 來源。"

