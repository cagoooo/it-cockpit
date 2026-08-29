import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const labDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const sandbox={window:{}};
for(const file of ['week-data.js','week-student-language.js'])vm.runInNewContext(fs.readFileSync(path.join(labDir,file),'utf8'),sandbox);
const notebook=JSON.parse(fs.readFileSync(path.join(labDir,'notebook-student-sources.json'),'utf8'));
const depth=JSON.parse(fs.readFileSync(path.join(labDir,'notebook-depth-artifacts.json'),'utf8'));
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(path.join(labDir,file))).digest('hex');
const size=file=>fs.statSync(path.join(labDir,file)).size;
const core=['index.html','week-data.js','week-student-language.js','week-cockpit.js','week-cockpit-rich.css','week-learning-depth.js','week-phase-six.js','notebooklm-pdf-player.css','notebooklm-pdf-player.js','vendor/pdfjs/pdf.min.mjs','vendor/pdfjs/pdf.worker.min.mjs','picture-book-artifacts.json','notebook-teacher-avatar-slides.json','reports.html','reports.js','sync-status.html','sync-status.js','materials/teacher-guide.pdf','materials/student-workbook.pdf','lesson-video-manifest.json','lesson-video-data.js','lesson-videos/notebooklm-mcp-run.json'];
const records=[];
for(const file of core)if(fs.existsSync(path.join(labDir,file)))records.push({file,sha256:hash(file),bytes:size(file),scope:'core'});
const weeks=sandbox.window.GIFTED_WEEKS.map(item=>{
  const code=String(item.week).padStart(2,'0');
  const files=['index.html','lecture-slides.html','notebooklm-kai-slides.html','notebooklm-kai-slides-v2.html','classroom-pack.html','student-task.html','student-guide.md','student-warmup.md','student-review.md','teacher-pack.pdf','slides.pdf','notebooklm-kai-slides.pdf','notebooklm-kai-slides-v2.pdf','notebooklm-kai-slides-v2-thumb.png','notebooklm-kai-slides-v2-thumb.webp','video.mp4','video-captions.srt','depth-infographic.png','depth-infographic.webp','depth-video.mp4','depth-video-captions.srt','student-video-card.png','student-video-card.webp','week-illustration.webp'];
  if(fs.existsSync(path.join(labDir,`week-${code}`,'student-infographic.png')))files.push('student-infographic.png');
  if(fs.existsSync(path.join(labDir,`week-${code}`,'student-infographic.webp')))files.push('student-infographic.webp');
  for(const name of files){const file=`week-${code}/${name}`;if(fs.existsSync(path.join(labDir,file)))records.push({file,sha256:hash(file),bytes:size(file),scope:`week-${code}`});}
  for(const name of ['lesson-video.mp4','captions.srt','captions.vtt','captions.ass','lesson-video-card.webp','transcript.txt','description.txt']){const file=`lesson-videos/week-${code}/${name}`;if(fs.existsSync(path.join(labDir,file)))records.push({file,sha256:hash(file),bytes:size(file),scope:`week-${code}`});}
  const student=notebook.find(row=>row.week===item.week)||{};
  const deep=depth.find(row=>row.week===item.week)||{};
  return{week:item.week,date:item.date,teacher:'黃凱揚老師',sessions:2,minutes:90,title:item.title,goal:item.goal,output:item.output,plan_source:'materials/teacher-guide.pdf',notebook_id:student.notebook_id||'',student_source_id:student.student_source_id||'',student_infographic_id:student.infographic_id||'',student_infographic_status:student.infographic_status||'missing',depth_source_id:deep.source_id||'',lesson_video_source:'lesson-video-manifest.json',lesson_video_format:'9:16',lesson_video_status:fs.existsSync(path.join(labDir,'lesson-videos',`week-${code}`,'lesson-video.mp4'))?'ready':'missing',status:student.notebook_id&&student.student_source_id?'ready':'needs_attention'};
});
const manifest={schema_version:1,release:'2026.08.29-lesson-videos-v2',generated_at:new Date().toISOString(),formal_plan:{teacher:'黃凱揚老師',school:'桃園市龍潭區石門國民小學',school_year:'115',weeks:10,sessions:20,minutes_per_session:45,source:'materials/teacher-guide.pdf'},weeks,files:records};
fs.writeFileSync(path.join(labDir,'course-version-manifest.json'),`${JSON.stringify(manifest,null,2)}\n`,'utf8');
const lines=['# 石門智繪客教材版本對照表','',`- 發布版本：${manifest.release}`,`- 產生時間：${manifest.generated_at}`,'- 正式計畫來源：`materials/teacher-guide.pdf`','','| 週次 | 日期 | 正式課程目標 | 網站與 NotebookLM | 兒童版資訊圖 | 直式課前影片 |','|---|---|---|---|---|---|',...weeks.map(row=>`| W${String(row.week).padStart(2,'0')} | ${row.date} | ${row.goal} | ${row.status==='ready'?'一致':'需檢查'} | ${row.student_infographic_status} | ${row.lesson_video_status} |`),'','## 同步規則','','1. 修改課程資料後，先重建週次頁面與教材。','2. 執行 `node gifted-ai-lab/tools/build-course-version-manifest.mjs` 更新雜湊。','3. 執行 `node gifted-ai-lab/tools/check-course-versions.mjs` 驗證所有檔案未漂移。','4. NotebookLM 產出仍需教師確認，未完成時保留網站自製圖卡。','5. 直式課前影片與字幕檔保留在 GitHub Pages，供課前引導與課堂複習使用。'];
fs.writeFileSync(path.join(labDir,'version-matrix.md'),`${lines.join('\n')}\n`,'utf8');
console.log(`Built course version manifest with ${records.length} file hashes.`);
