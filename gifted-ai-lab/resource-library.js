(function () {
  const resources = window.DAY_OF_AI_RESOURCES || [];
  const grid = document.querySelector('#resourceGrid');
  const count = document.querySelector('#resourceCount');
  const search = document.querySelector('#resourceSearch');
  let activeWeek = 'all';
  let activeAudience = 'all';

  const esc = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const audienceLabel = { teacher: '教師備課', student: '學生操作', both: '師生共用' };
  const render = () => {
    const term = search.value.trim().toLocaleLowerCase('zh-Hant-TW');
    const matches = resources.filter((item) => {
      const weekOk = activeWeek === 'all' || item.weeks.includes(Number(activeWeek));
      const audienceOk = activeAudience === 'all' || item.audience === activeAudience || item.audience === 'both';
      const textOk = !term || `${item.title} ${item.type} ${item.note}`.toLocaleLowerCase('zh-Hant-TW').includes(term);
      return weekOk && audienceOk && textOk;
    });
    count.textContent = `${matches.length} 個可用資源`;
    grid.innerHTML = matches.map((item) => `<a class="resource-card" href="${esc(item.url)}" target="_blank" rel="noopener noreferrer" data-resource-id="${esc(item.id)}"><div class="resource-tags"><span>${esc(item.type)}</span><span>${esc(audienceLabel[item.audience])}</span>${item.language ? `<span>${esc(item.language)}</span>` : ''}</div><h2>${esc(item.title)}</h2><p>${esc(item.note)}</p><small>${item.weeks.map((week) => `W${String(week).padStart(2, '0')}`).join(' · ')}</small></a>`).join('') || '<p class="empty">目前沒有符合條件的資源。</p>';
  };

  document.querySelectorAll('[data-week-filter]').forEach((button) => button.addEventListener('click', () => {
    activeWeek = button.dataset.weekFilter;
    document.querySelectorAll('[data-week-filter]').forEach((item) => item.classList.toggle('active', item === button));
    render();
  }));
  document.querySelectorAll('[data-audience-filter]').forEach((button) => button.addEventListener('click', () => {
    activeAudience = button.dataset.audienceFilter;
    document.querySelectorAll('[data-audience-filter]').forEach((item) => item.classList.toggle('active', item === button));
    render();
  }));
  search.addEventListener('input', render);
  const requestedWeek = new URLSearchParams(location.search).get('week');
  if (['3', '6', '9', '12', '15'].includes(requestedWeek)) document.querySelector(`[data-week-filter="${requestedWeek}"]`)?.click();
  else render();
})();
