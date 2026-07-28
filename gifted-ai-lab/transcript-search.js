(function () {
  const catalog = window.GIFTED_YOUTUBE || { items: {} };
  const query = document.querySelector('#query');
  const filter = document.querySelector('#weekFilter');
  const results = document.querySelector('#results');
  const summary = document.querySelector('#summary');
  const playlistLink = document.querySelector('[data-playlist]');
  const records = [];
  let fontScale = 1;

  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const labelFor = (key) => key === 'annual' ? '年度總覽' : `W${String(key).padStart(2, '0')}`;
  const formatTime = (value) => {
    const seconds = Math.floor(Number(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  };
  const highlight = (text, term) => {
    const index = text.toLocaleLowerCase('zh-Hant-TW').indexOf(term);
    if (!term || index < 0) return escapeHtml(text);
    return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(text.slice(index, index + term.length))}</mark>${escapeHtml(text.slice(index + term.length))}`;
  };

  if (catalog.playlistUrl) {
    playlistLink.href = catalog.playlistUrl;
    playlistLink.hidden = false;
  }
  Object.entries(catalog.items).forEach(([key, item]) => {
    if (key !== 'annual') filter.insertAdjacentHTML('beforeend', `<option value="${escapeHtml(key)}">${labelFor(key)} ${escapeHtml(item.title.replace(/^W\d+\s*/, '').split('｜')[0])}</option>`);
  });
  const initialWeek = new URLSearchParams(location.search).get('week');
  if (initialWeek && [...filter.options].some((option) => option.value === String(Number(initialWeek)))) filter.value = String(Number(initialWeek));

  const render = () => {
    const term = query.value.trim().toLocaleLowerCase('zh-Hant-TW');
    const selected = filter.value;
    const matches = records.filter((record) => (selected === 'all' || record.key === selected) && (!term || record.text.toLocaleLowerCase('zh-Hant-TW').includes(term)));
    const visible = term ? matches : matches.slice(0, 160);
    results.style.setProperty('--transcript-scale', fontScale);
    results.innerHTML = visible.map((record) => {
      const item = catalog.items[record.key];
      const watch = `${item.watchUrl}&t=${Math.floor(record.start)}s`;
      const cockpit = record.key === 'annual' ? 'index.html' : `week-${String(record.key).padStart(2, '0')}/#media`;
      return `<article class="result-row"><div class="result-meta"><b>${labelFor(record.key)}</b><time>${formatTime(record.start)}</time></div><p>${highlight(record.text, term)}</p><div class="result-actions"><a href="${escapeHtml(watch)}" target="_blank" rel="noopener noreferrer">YouTube</a><a href="${cockpit}">駕駛艙</a></div></article>`;
    }).join('');
    summary.textContent = term ? `找到 ${matches.length} 段符合內容` : `已載入 ${records.length} 段；目前顯示 ${visible.length} 段`;
  };

  Promise.all(Object.entries(catalog.items).map(async ([key, item]) => {
    const response = await fetch(item.transcript);
    if (!response.ok) throw new Error(item.transcript);
    const data = await response.json();
    for (const segment of data.segments || []) records.push({ key, start: segment.start, text: segment.text });
  })).then(() => { records.sort((a, b) => String(a.key).localeCompare(String(b.key)) || a.start - b.start); render(); }).catch(() => { summary.textContent = '部分逐字稿目前無法載入，請重新整理後再試。'; });

  query.addEventListener('input', render);
  filter.addEventListener('change', render);
  document.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
    fontScale = Math.min(1.4, Math.max(.85, fontScale + (button.dataset.font === 'up' ? .1 : -.1)));
    render();
  }));
  document.querySelector('#printResults').addEventListener('click', () => print());
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('../sw.js').catch(() => {});
})();
