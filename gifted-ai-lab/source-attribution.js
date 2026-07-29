(function () {
  const adaptedWeeks = new Set([3, 6, 9, 12, 15]);
  const pathMatch = location.pathname.match(/week-(\d+)/);
  const week = Number(document.body.dataset.week || pathMatch?.[1] || 0);
  const isOverview = /gifted-ai-lab\/?(?:index\.html)?$/.test(location.pathname);
  if (!isOverview && !adaptedWeeks.has(week)) return;

  const prefix = pathMatch ? '../' : '';
  if (!document.querySelector('link[href*="source-attribution.css"]')) {
    const stylesheet = document.createElement('link');
    stylesheet.rel = 'stylesheet';
    stylesheet.href = `${prefix}source-attribution.css?v=20260729-day-of-ai-v1`;
    document.head.append(stylesheet);
  }
  const label = adaptedWeeks.has(week)
    ? `第 ${week} 週部分內容依 Day of AI 教材改寫`
    : '部分課程內容依 Day of AI 教材改寫';

  document.body.insertAdjacentHTML('beforeend', `
    <aside class="source-credit" aria-label="教材來源與授權">
      <div>
        <strong>${label}</strong>
        <span>老師已換成中年級好懂的說法與石門生活例子。</span>
      </div>
      <a href="${prefix}source-credits.html">查看來源與使用方式</a>
    </aside>
  `);
})();
