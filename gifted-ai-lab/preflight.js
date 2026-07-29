(function () {
  const checks = [
    { id: 'network', title: '網路連線', detail: '確認 iPad 能連上網路。' },
    { id: 'version', title: '網站版本', detail: '確認讀到最新的課程版本。' },
    { id: 'serviceWorker', title: '離線快取', detail: '確認核心教材可保存到裝置。' },
    { id: 'storage', title: '可用容量', detail: '建議保留至少 120 MB。' },
    { id: 'images', title: '十週圖片', detail: '確認每週繪本圖都能開啟。' },
    { id: 'video', title: '課程影片', detail: '確認本週影片檔可讀取。' },
    { id: 'screen', title: 'iPad 顯示', detail: '確認畫面寬度與直橫式狀態。' },
    { id: 'browser', title: '瀏覽器功能', detail: '確認儲存、語音與安全連線。' },
  ];
  const services = [
    ['NotebookLM', 'https://notebooklm.google.com/', '研究筆記本'],
    ['YouTube', 'https://www.youtube.com/', '字幕影片'],
    ['Scratch', 'https://scratch.mit.edu/', '作品實作'],
    ['GitHub Pages', location.href, '課程網站'],
  ];
  const state = {};
  const grid = document.querySelector('#checkGrid');
  const serviceGrid = document.querySelector('#serviceGrid');
  const code = new URLSearchParams(location.search).get('week') || '03';
  const set = (id, status, message) => { state[id] = status; const card = document.querySelector(`[data-check="${id}"]`); if (!card) return; card.dataset.state = status; card.querySelector('.check-icon').textContent = status === 'ok' ? '✓' : status === 'error' ? '!' : status === 'warn' ? '△' : '…'; card.querySelector('p').textContent = message; renderSummary(); };
  const renderSummary = () => {
    const complete = Object.keys(state).length;
    const ok = Object.values(state).filter((value) => value === 'ok').length;
    const errors = Object.values(state).filter((value) => value === 'error').length;
    const warnings = Object.values(state).filter((value) => value === 'warn').length;
    document.querySelector('#readyScore').textContent = ok;
    if (complete < checks.length) return;
    const status = document.querySelector('#overallStatus');
    status.dataset.state = errors ? 'error' : warnings ? 'warn' : 'ok';
    status.textContent = errors ? '需要處理' : warnings ? '可以上課，請看提醒' : '準備完成';
    document.querySelector('#readyTitle').textContent = errors ? '還有項目需要處理' : warnings ? '核心教材已準備好' : '全部通過，可以上課';
    document.querySelector('#readyMessage').textContent = `通過 ${ok} 項，提醒 ${warnings} 項，需要處理 ${errors} 項。`;
  };
  const timeoutFetch = (url, options = {}, ms = 7000) => Promise.race([fetch(url, options), new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), ms))]);
  const loadImage = (src) => new Promise((resolve) => { const image = new Image(); image.onload = () => resolve(image.naturalWidth > 500); image.onerror = () => resolve(false); image.src = `${src}?check=${Date.now()}`; });

  async function runChecks() {
    grid.innerHTML = checks.map((item) => `<article class="check-card" data-check="${item.id}" data-state="checking"><span class="check-icon">…</span><div><h3>${item.title}</h3><p>${item.detail}</p></div></article>`).join('');
    Object.keys(state).forEach((key) => delete state[key]);
    set('network', navigator.onLine ? 'ok' : 'error', navigator.onLine ? '目前已連上網路。' : '目前離線，請檢查 Wi-Fi。');
    try { const version = await timeoutFetch(`version.json?t=${Date.now()}`, { cache: 'no-store' }); const info = await version.json(); set('version', 'ok', `已讀到 ${info.release} 最新版。`); } catch { set('version', 'error', '無法讀取版本檔，可能是網路或快取問題。'); }
    try { if (!('serviceWorker' in navigator)) throw new Error(); await navigator.serviceWorker.register('../sw.js'); await navigator.serviceWorker.ready; set('serviceWorker', navigator.serviceWorker.controller ? 'ok' : 'warn', navigator.serviceWorker.controller ? '離線功能已啟用。' : '離線功能已安裝，重新整理後生效。'); } catch { set('serviceWorker', 'error', '無法啟用離線快取，請使用 Safari 或 Chrome。'); }
    try { const estimate = await navigator.storage.estimate(); const free = estimate.quota && estimate.usage ? (estimate.quota - estimate.usage) / 1024 / 1024 : 0; set('storage', !free || free >= 120 ? 'ok' : free >= 50 ? 'warn' : 'error', free ? `估計還有 ${Math.round(free)} MB 可用。` : '瀏覽器未提供容量數字，但仍可下載核心教材。'); } catch { set('storage', 'warn', '無法讀取容量，請確認 iPad 仍有可用空間。'); }
    const imageResults = await Promise.all((window.GIFTED_WEEKS || []).map((week) => loadImage(`week-${String(week.week).padStart(2, '0')}/week-illustration.webp`)));
    const imageCount = imageResults.filter(Boolean).length; set('images', imageCount === 10 ? 'ok' : imageCount >= 8 ? 'warn' : 'error', `成功讀取 ${imageCount} / 10 張繪本圖。`);
    try { const response = await timeoutFetch(`week-${code}/video.mp4`, { headers: { Range: 'bytes=0-1023' }, cache: 'no-store' }); set('video', response.ok || response.status === 206 ? 'ok' : 'warn', response.ok || response.status === 206 ? `第 ${Number(code)} 週影片可以讀取。` : '影片未完成下載，建議先開啟測試。'); } catch { set('video', 'warn', '影片目前無法預讀，可改用 YouTube 或離線活動。'); }
    const width = Math.round(window.innerWidth); set('screen', width >= 375 ? 'ok' : 'warn', `目前畫面寬度 ${width}px，${matchMedia('(orientation: portrait)').matches ? '直式' : '橫式'}顯示。`);
    let localOk = false; try { localStorage.setItem('gifted-preflight-test', '1'); localOk = localStorage.getItem('gifted-preflight-test') === '1'; localStorage.removeItem('gifted-preflight-test'); } catch {}
    set('browser', location.protocol === 'https:' && localOk ? 'ok' : 'error', `${location.protocol === 'https:' ? '安全連線' : '不是安全連線'}；${localOk ? '可保存課堂紀錄' : '無法保存本機紀錄'}；${('SpeechRecognition' in window || 'webkitSpeechRecognition' in window) ? '可使用語音輸入' : '語音輸入需改用鍵盤'}。`);
  }

  async function checkServices() {
    serviceGrid.innerHTML = services.map(([name, url, use]) => `<article class="service-card"><span class="gifted-status" data-service="${name}" data-state="checking">檢查中</span><b>${name}</b><span>${use}</span><a href="${url}" target="_blank" rel="noopener noreferrer">開啟確認</a></article>`).join('');
    await Promise.all(services.map(async ([name, url]) => { const badge = document.querySelector(`[data-service="${name}"]`); try { await timeoutFetch(url, { mode: name === 'GitHub Pages' ? 'same-origin' : 'no-cors', cache: 'no-store' }, 6000); badge.dataset.state = 'ok'; badge.textContent = '可連線'; } catch { badge.dataset.state = navigator.onLine ? 'warn' : 'error'; badge.textContent = navigator.onLine ? '請手動確認' : '目前離線'; } }));
  }

  document.querySelector('#runChecks').addEventListener('click', () => { runChecks(); checkServices(); });
  document.querySelector('#downloadOffline').addEventListener('click', async () => { const result = document.querySelector('#updateResult'); result.textContent = '正在下載核心教材…'; try { const registration = await navigator.serviceWorker.ready; registration.active?.postMessage({ type: 'CACHE_GIFTED_CORE' }); result.textContent = '已開始下載。約一分鐘後再按「重新檢查」。'; } catch { result.textContent = '無法啟動下載，請先重新整理頁面。'; } });
  document.querySelector('#clearOldCaches').addEventListener('click', async () => { const keys = await caches.keys(); const old = keys.filter((key) => !key.endsWith('2026-07-29-gifted-phase-8-v15')); await Promise.all(old.map((key) => caches.delete(key))); document.querySelector('#updateResult').textContent = `已清除 ${old.length} 個舊快取，不會刪除教師備忘。`; });
  document.querySelector('#refreshVersion').addEventListener('click', async () => { const registration = await navigator.serviceWorker?.getRegistration('../sw.js'); registration?.waiting?.postMessage({ type: 'SKIP_WAITING' }); await registration?.update(); location.reload(); });
  document.querySelectorAll('[data-manual]').forEach((input) => { const key = `gifted-preflight-${input.dataset.manual}`; input.checked = localStorage.getItem(key) === '1'; input.addEventListener('change', () => localStorage.setItem(key, input.checked ? '1' : '0')); });
  addEventListener('online', runChecks); addEventListener('offline', runChecks);
  runChecks(); checkServices();
})();
