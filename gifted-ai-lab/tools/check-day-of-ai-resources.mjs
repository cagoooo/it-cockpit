import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { fileURLToPath } from 'node:url';

const toolsDir = path.dirname(fileURLToPath(import.meta.url));
const labDir = path.resolve(toolsDir, '..');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(path.join(labDir, 'day-of-ai-resource-data.js'), 'utf8'), sandbox);
const resources = sandbox.window.DAY_OF_AI_RESOURCES || [];

async function check(item) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 25000);
  try {
    let response = await fetch(item.url, {
      method: 'HEAD',
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'user-agent': 'Mozilla/5.0 gifted-ai-lab-link-check' },
    });
    if (!response.ok) {
      response = await fetch(item.url, {
        redirect: 'follow',
        signal: controller.signal,
        headers: { 'user-agent': 'Mozilla/5.0 gifted-ai-lab-link-check' },
      });
      await response.body?.cancel();
    }
    return { id: item.id, status: response.status, ok: response.ok, final: new URL(response.url).hostname };
  } catch (error) {
    return { id: item.id, status: 'ERR', ok: false, final: error.name === 'AbortError' ? 'timeout' : error.message };
  } finally {
    clearTimeout(timer);
  }
}

const results = [];
for (let index = 0; index < resources.length; index += 5) {
  results.push(...await Promise.all(resources.slice(index, index + 5).map(check)));
}
console.table(results);
const failures = results.filter((item) => !item.ok);
console.log(`Day of AI external links: ${results.length - failures.length}/${results.length} available`);
if (failures.length) process.exit(1);
