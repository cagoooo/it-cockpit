param(
    [string]$Root = (Split-Path -Parent (Split-Path -Parent $PSScriptRoot))
)

$ErrorActionPreference = 'Stop'
$utf8NoBom = [System.Text.UTF8Encoding]::new($false)
$edge = 'C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe'
$pdfToTextCandidates = @(
    'C:\Program Files\Git\mingw64\bin\pdftotext.exe',
    'C:\Program Files\Git\usr\bin\pdftotext.exe'
)
$pdfToText = $pdfToTextCandidates | Where-Object { Test-Path -LiteralPath $_ } | Select-Object -First 1

if (-not (Test-Path -LiteralPath $edge)) {
    throw "Microsoft Edge not found: $edge"
}

$labRoot = Join-Path $Root 'gifted-ai-lab'
$targets = @(
    [pscustomobject]@{ Html = 'materials\teacher-guide.html'; Pdf = 'materials\teacher-guide.pdf' },
    [pscustomobject]@{ Html = 'materials\student-workbook.html'; Pdf = 'materials\student-workbook.pdf' }
)

foreach ($week in 3, 6, 9, 12, 15, 18, 21, 24, 27, 30) {
    $code = '{0:D2}' -f $week
    $targets += [pscustomobject]@{
        Html = "week-$code\teacher-pack.html"
        Pdf = "week-$code\teacher-pack.pdf"
    }
}

$style = @'
<style>
  :root { color-scheme: light; }
  * { box-sizing: border-box; }
  html { background: #fff; }
  body {
    margin: 0 auto;
    max-width: 182mm;
    color: #17252a;
    background: #fff;
    font-family: "Microsoft JhengHei", "PingFang TC", "Noto Sans TC", Arial, sans-serif;
    font-size: 10.5pt;
    line-height: 1.6;
    letter-spacing: 0;
  }
  h1, h2, h3 { color: #15383c; break-after: avoid; page-break-after: avoid; }
  h1 { margin: 0 0 8mm; font-size: 21pt; line-height: 1.3; border-bottom: 2px solid #d19a42; padding-bottom: 3mm; }
  h2 { margin: 7mm 0 2.5mm; font-size: 15pt; line-height: 1.35; }
  h3 { margin: 5mm 0 2mm; font-size: 12pt; line-height: 1.4; }
  p { margin: 0 0 2.5mm; }
  ul, ol { margin: 1.5mm 0 3mm; padding-left: 7mm; }
  li { margin: 0 0 1.2mm; }
  table { width: 100%; margin: 2.5mm 0 5mm; border-collapse: collapse; table-layout: fixed; break-inside: auto; }
  thead { display: table-header-group; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  th, td { border: 1px solid #9aadaf; padding: 2.2mm 2.5mm; vertical-align: top; overflow-wrap: anywhere; }
  th { color: #fff; background: #28666e; font-weight: 700; text-align: left; }
  th:first-child, td:first-child { width: 18%; }
  code { font-family: Consolas, "Microsoft JhengHei", monospace; font-size: 0.93em; }
  a { color: #155a68; text-decoration: none; overflow-wrap: anywhere; }
  hr { margin: 7mm 0; border: 0; border-top: 1px solid #b9c7c9; }
  body > p:last-child { margin-top: 8mm; padding-top: 3mm; border-top: 1px solid #d9e1e2; color: #53666a; font-size: 9pt; }
  @page { size: A4 portrait; margin: 15mm 14mm 17mm; }
  @media print {
    body { max-width: none; print-color-adjust: exact; -webkit-print-color-adjust: exact; }
    a { color: inherit; }
  }
</style>
'@

foreach ($target in $targets) {
    $htmlPath = Join-Path $labRoot $target.Html
    $pdfPath = Join-Path $labRoot $target.Pdf
    $content = [System.IO.File]::ReadAllText($htmlPath, [System.Text.Encoding]::UTF8)

    if ($content -match '(?is)<body[^>]*>(.*)</body>') {
        $body = $Matches[1]
    } else {
        $body = $content
    }

    $body = $body.Replace(([string][char]0xFEFF), '')
    $body = [regex]::Replace($body, '(?is)^\s*<p>\s*#\s*(.*?)\s*</p>', '<h1>$1</h1>', 1)
    $titleMatch = [regex]::Match($body, '(?is)<h1[^>]*>(.*?)</h1>')
    $documentTitle = if ($titleMatch.Success) {
        [System.Net.WebUtility]::HtmlDecode([regex]::Replace($titleMatch.Groups[1].Value, '<[^>]+>', '')).Trim()
    } else {
        [System.IO.Path]::GetFileNameWithoutExtension($htmlPath)
    }

    $document = @"
<!DOCTYPE html>
<html lang="zh-Hant-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta http-equiv="Content-Type" content="text/html; charset=UTF-8">
<title>$documentTitle</title>
$style
</head>
<body>
$body
</body>
</html>
"@

    [System.IO.File]::WriteAllText($htmlPath, $document, $utf8NoBom)

    if (Test-Path -LiteralPath $pdfPath) {
        Remove-Item -LiteralPath $pdfPath -Force
    }

    $profile = Join-Path $env:TEMP ("gifted-pdf-" + [guid]::NewGuid().ToString('N'))
    $fileUrl = [System.Uri]::new($htmlPath).AbsoluteUri
    $arguments = @(
        '--headless=new',
        '--disable-gpu',
        '--no-pdf-header-footer',
        "--user-data-dir=$profile",
        "--print-to-pdf=$pdfPath",
        $fileUrl
    )

    $process = Start-Process -FilePath $edge -ArgumentList $arguments -WindowStyle Hidden -PassThru -Wait
    if ($process.ExitCode -ne 0 -or -not (Test-Path -LiteralPath $pdfPath)) {
        throw "PDF generation failed: $($target.Pdf)"
    }

    if ($pdfToText) {
        $textAuditPath = Join-Path $env:TEMP ("gifted-pdf-audit-" + [guid]::NewGuid().ToString('N') + '.txt')
        & $pdfToText -enc UTF-8 $pdfPath $textAuditPath
        $pdfText = [System.IO.File]::ReadAllText($textAuditPath, [System.Text.Encoding]::UTF8)
        Remove-Item -LiteralPath $textAuditPath -Force -ErrorAction SilentlyContinue
        if (-not $pdfText.Contains($documentTitle)) {
            throw "PDF text encoding audit failed: $($target.Pdf)"
        }
    }

    Remove-Item -LiteralPath $profile -Recurse -Force -ErrorAction SilentlyContinue
    Write-Host "Generated $($target.Pdf)"
}
