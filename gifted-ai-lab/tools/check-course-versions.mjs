import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const labDir=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const manifest=JSON.parse(fs.readFileSync(path.join(labDir,'course-version-manifest.json'),'utf8'));
const failures=[];
for(const record of manifest.files){const target=path.join(labDir,record.file);if(!fs.existsSync(target)){failures.push(`${record.file}: missing`);continue;}const actual=crypto.createHash('sha256').update(fs.readFileSync(target)).digest('hex');if(actual!==record.sha256)failures.push(`${record.file}: version drift`);}
if(manifest.weeks.length!==10)failures.push(`week count: ${manifest.weeks.length}`);
for(const week of manifest.weeks)if(week.status!=='ready')failures.push(`W${week.week}: NotebookLM metadata incomplete`);
console.log(`Course versions: ${manifest.files.length-failures.length}/${manifest.files.length} files consistent`);
if(failures.length){console.error(failures.join('\n'));process.exit(1);}
