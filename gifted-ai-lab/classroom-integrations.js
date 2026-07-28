(function () {
  const week = Number(document.body.dataset.week);
  const code = String(week).padStart(2, '0');
  const youtube = window.GIFTED_YOUTUBE?.items?.[String(week)];
  const escapeHtml = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));

  const actions = document.querySelector('.actions');
  actions?.insertAdjacentHTML('afterbegin', `
    <a class="action primary stable-action" href="classroom-pack.html">一鍵上課</a>
    <a class="action stable-action" href="student-task.html">學生任務單</a>
    <a class="action stable-action" href="../transcripts.html?week=${code}">逐字稿搜尋</a>
    <button class="connection-pill" type="button" data-offline-install aria-live="polite">檢查教材狀態</button>
  `);

  const tabs = document.querySelector('.tabs');
  tabs?.insertAdjacentHTML('beforeend', '<button class="tab" data-view="safety">安全護欄</button>');
  document.querySelector('main')?.insertAdjacentHTML('beforeend', `
    <section id="safety" class="view safety-view">
      <section class="section safety-hero"><div class="section-head"><span>PRIVACY &amp; AI SAFETY</span><h2>資料分級與公開前把關</h2></div><div class="data-levels">
        <article><b>公開資料</b><p>教師核准、匿名且無法辨識學生的成果摘要。</p></article>
        <article><b>教師限定</b><p>課堂觀察、評量與備課紀錄，只保存在教師控制的空間。</p></article>
        <article><b>學生私人</b><p>原始作品、聲音、照片、帳號及任何可識別資料，不放入公開網站。</p></article>
      </div></section>
      <section class="section"><div class="section-head"><span>PRE-FLIGHT</span><h2>使用 AI 或公開成果前檢核</h2></div><div class="safety-checks">
        ${[
          '沒有輸入真實姓名、臉部、帳號、聯絡方式或可識別資料。',
          '學生先提出自己的想法，AI 只協助擴充、比較或查找反例。',
          'AI 內容已用課本、來源或實際測試查證。',
          '公開成果已匿名，並由教師完成最後核准。',
        ].map((label, index) => `<label><input type="checkbox" data-safety-check="${index}"><span>${label}</span></label>`).join('')}
      </div><div class="safety-progress" aria-live="polite">安全檢核 0 / 4</div></section>
      <section class="section"><div class="section-head"><span>AI COLLABORATION LOG</span><h2>人機協作紀錄</h2></div><p class="privacy-warning">不要在下列欄位輸入學生姓名或其他個資；內容只保存在目前瀏覽器。</p><div class="ai-log-grid">
        <label><span>使用工具與用途</span><textarea data-ai-log="tool" placeholder="例如：NotebookLM，查找反例"></textarea></label>
        <label><span>AI 提供了什麼</span><textarea data-ai-log="assist" placeholder="只記錄協助內容，不記錄個資"></textarea></label>
        <label><span>我如何查證與決定</span><textarea data-ai-log="decision" placeholder="採用、修改或不採用的理由"></textarea></label>
      </div></section>
      <section class="section"><div class="section-head"><span>ARCHIVE &amp; DELETE</span><h2>學年封存與刪除</h2></div><div class="safety-checks archive-checks">
        <label><input type="checkbox" data-retention-check="0"><span>私人原始作品已移至教師管理的非公開資料夾。</span></label>
        <label><input type="checkbox" data-retention-check="1"><span>公開版本已匿名化，並與原始作品分開保存。</span></label>
        <label><input type="checkbox" data-retention-check="2"><span>學年結束後已依保存期限清除不再需要的本機紀錄。</span></label>
      </div><button class="clear-local-record" type="button" data-clear-safety>清除本週本機安全紀錄</button></section>
      <section class="section publish-gate"><div><div class="section-head"><span>TEACHER APPROVAL</span><h2>成果公開核准</h2></div><p>預設為不公開。這個開關只記錄教師的本機核准狀態，不會自動上傳作品。</p></div><label class="approval-switch"><input type="checkbox" data-publish-approval><span>教師已核准匿名公開</span></label></section>
    </section>
  `);

  const safetyKey = `gifted-week-${code}-safety`;
  let safetyState = { checks: [false, false, false, false], retention: [false, false, false], log: {}, approved: false };
  try { safetyState = { ...safetyState, ...JSON.parse(localStorage.getItem(safetyKey) || '{}') }; } catch {}
  const saveSafety = () => localStorage.setItem(safetyKey, JSON.stringify(safetyState));
  const renderSafety = () => {
    document.querySelectorAll('[data-safety-check]').forEach((input) => {
      input.checked = Boolean(safetyState.checks[Number(input.dataset.safetyCheck)]);
    });
    document.querySelectorAll('[data-retention-check]').forEach((input) => {
      input.checked = Boolean(safetyState.retention?.[Number(input.dataset.retentionCheck)]);
    });
    const count = safetyState.checks.filter(Boolean).length;
    const progress = document.querySelector('.safety-progress');
    if (progress) progress.textContent = `安全檢核 ${count} / 4${count === 4 ? '，可以進行教師審查。' : ''}`;
    const approval = document.querySelector('[data-publish-approval]');
    if (approval) approval.checked = Boolean(safetyState.approved);
  };
  document.querySelectorAll('[data-safety-check]').forEach((input) => input.addEventListener('change', () => {
    safetyState.checks[Number(input.dataset.safetyCheck)] = input.checked;
    if (!input.checked) safetyState.approved = false;
    saveSafety(); renderSafety();
  }));
  document.querySelectorAll('[data-ai-log]').forEach((field) => {
    field.value = safetyState.log[field.dataset.aiLog] || '';
    field.addEventListener('input', () => { safetyState.log[field.dataset.aiLog] = field.value; saveSafety(); });
  });
  document.querySelectorAll('[data-retention-check]').forEach((input) => input.addEventListener('change', () => {
    safetyState.retention[Number(input.dataset.retentionCheck)] = input.checked;
    saveSafety();
  }));
  document.querySelector('[data-clear-safety]')?.addEventListener('click', () => {
    if (!confirm('確定清除本週保存在這台裝置上的安全檢核與人機協作紀錄？')) return;
    localStorage.removeItem(safetyKey);
    safetyState = { checks: [false, false, false, false], retention: [false, false, false], log: {}, approved: false };
    document.querySelectorAll('[data-ai-log]').forEach((field) => { field.value = ''; });
    renderSafety();
  });
  document.querySelector('[data-publish-approval]')?.addEventListener('change', (event) => {
    if (event.target.checked && safetyState.checks.filter(Boolean).length < 4) {
      event.target.checked = false;
      document.querySelector('.safety-progress').textContent = '請先完成四項安全檢核。';
      return;
    }
    safetyState.approved = event.target.checked; saveSafety(); renderSafety();
  });
  renderSafety();

  if (location.hash === '#safety') {
    document.querySelector('[data-view="safety"]')?.click();
  }

  const mediaView = document.querySelector('#media');
  const localVideo = mediaView?.querySelector('.week-video');
  const mediaGrid = mediaView?.querySelector('.media-grid');
  let videoMode = 'local';
  let transcript = [];
  if (youtube && localVideo && mediaGrid) {
    localVideo.id = 'localLessonVideo';
    mediaGrid.insertAdjacentHTML('beforebegin', `
      <div class="video-toolbar"><div class="segmented" role="group" aria-label="影片來源"><button class="active" data-video-mode="local">站內影片</button><button data-video-mode="youtube">YouTube CC</button></div><a class="youtube-watch" href="${escapeHtml(youtube.watchUrl)}" target="_blank" rel="noopener noreferrer">在 YouTube 觀看</a>${window.GIFTED_YOUTUBE.playlistUrl ? `<a class="youtube-watch" href="${escapeHtml(window.GIFTED_YOUTUBE.playlistUrl)}" target="_blank" rel="noopener noreferrer">完整播放清單</a>` : ''}</div>
    `);
    localVideo.insertAdjacentHTML('afterend', `<iframe class="youtube-frame" title="W${code} YouTube 課程影片" loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" allowfullscreen hidden></iframe>`);
    mediaGrid.insertAdjacentHTML('afterend', `
      <section class="section chapter-section"><div class="section-head"><span>VIDEO CHAPTERS</span><h2>影片章節</h2></div><div class="chapter-list">${youtube.chapters.map((chapter) => `<button data-chapter="${chapter.seconds}"><time>${chapter.stamp}</time><span>${escapeHtml(chapter.title)}</span></button>`).join('')}</div></section>
      <section class="section transcript-section"><div class="transcript-head"><div class="section-head"><span>SEARCHABLE TRANSCRIPT</span><h2>繁體中文逐字稿</h2></div><div class="transcript-tools"><label><span class="sr-only">搜尋逐字稿</span><input type="search" data-transcript-search placeholder="搜尋本週內容"></label><button type="button" data-font="down" title="縮小文字">A−</button><button type="button" data-font="up" title="放大文字">A＋</button><button type="button" data-print-transcript>列印</button></div></div><div class="transcript-status" aria-live="polite">正在載入逐字稿…</div><div class="transcript-list"></div></section>
    `);
    const frame = mediaView.querySelector('.youtube-frame');
    const setVideoMode = (mode, start = 0) => {
      videoMode = mode;
      mediaView.querySelectorAll('[data-video-mode]').forEach((button) => button.classList.toggle('active', button.dataset.videoMode === mode));
      localVideo.hidden = mode !== 'local';
      frame.hidden = mode !== 'youtube';
      if (mode === 'youtube') frame.src = `https://www.youtube-nocookie.com/embed/${youtube.videoId}?rel=0&cc_load_policy=1&hl=zh-TW&start=${Math.floor(start)}`;
    };
    mediaView.querySelectorAll('[data-video-mode]').forEach((button) => button.addEventListener('click', () => setVideoMode(button.dataset.videoMode)));
    mediaView.querySelectorAll('[data-chapter]').forEach((button) => button.addEventListener('click', () => {
      const seconds = Number(button.dataset.chapter);
      if (videoMode === 'local') { localVideo.currentTime = seconds; localVideo.play().catch(() => {}); }
      else setVideoMode('youtube', seconds);
    }));

    const transcriptList = mediaView.querySelector('.transcript-list');
    const transcriptStatus = mediaView.querySelector('.transcript-status');
    const renderTranscript = (query = '') => {
      const term = query.trim().toLocaleLowerCase('zh-Hant-TW');
      const matches = transcript.filter((segment) => !term || segment.text.toLocaleLowerCase('zh-Hant-TW').includes(term));
      transcriptList.innerHTML = matches.map((segment) => `<button class="transcript-row" data-transcript-time="${segment.start}"><time>${formatTime(segment.start)}</time><span>${highlight(segment.text, term)}</span></button>`).join('');
      transcriptStatus.textContent = term ? `找到 ${matches.length} 段` : `共 ${matches.length} 段繁體中文逐字稿`;
      transcriptList.querySelectorAll('[data-transcript-time]').forEach((button) => button.addEventListener('click', () => {
        const seconds = Number(button.dataset.transcriptTime);
        if (videoMode === 'local') { localVideo.currentTime = seconds; localVideo.play().catch(() => {}); }
        else setVideoMode('youtube', seconds);
      }));
    };
    fetch(`../youtube/week-${code}/transcript.json`).then((response) => response.ok ? response.json() : Promise.reject()).then((data) => {
      transcript = data.segments || []; renderTranscript();
    }).catch(() => { transcriptStatus.textContent = '逐字稿目前無法載入，請稍後再試。'; });
    mediaView.querySelector('[data-transcript-search]').addEventListener('input', (event) => renderTranscript(event.target.value));
    let fontScale = 1;
    mediaView.querySelectorAll('[data-font]').forEach((button) => button.addEventListener('click', () => {
      fontScale = Math.min(1.35, Math.max(.85, fontScale + (button.dataset.font === 'up' ? .1 : -.1)));
      transcriptList.style.setProperty('--transcript-scale', fontScale);
    }));
    mediaView.querySelector('[data-print-transcript]').addEventListener('click', () => { document.body.classList.add('print-transcript'); print(); setTimeout(() => document.body.classList.remove('print-transcript'), 500); });
  }

  function formatTime(value) {
    const seconds = Math.floor(Number(value));
    return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`;
  }
  function highlight(text, term) {
    const safe = escapeHtml(text);
    if (!term) return safe;
    const index = text.toLocaleLowerCase('zh-Hant-TW').indexOf(term);
    if (index < 0) return safe;
    return `${escapeHtml(text.slice(0, index))}<mark>${escapeHtml(text.slice(index, index + term.length))}</mark>${escapeHtml(text.slice(index + term.length))}`;
  }

  const statusButton = document.querySelector('[data-offline-install]');
  const setConnectionStatus = () => {
    if (!statusButton) return;
    const controlled = Boolean(navigator.serviceWorker?.controller);
    statusButton.textContent = navigator.onLine ? (controlled ? '核心教材可離線' : '教材已連線') : (controlled ? '離線教材模式' : '目前離線');
    statusButton.classList.toggle('offline', !navigator.onLine);
  };
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('../../sw.js').then(() => navigator.serviceWorker.ready).then(() => setConnectionStatus()).catch(() => setConnectionStatus());
  }
  addEventListener('online', setConnectionStatus);
  addEventListener('offline', setConnectionStatus);
  statusButton?.addEventListener('click', async () => {
    if (!navigator.serviceWorker?.controller) { setConnectionStatus(); return; }
    statusButton.textContent = '正在確認離線教材…';
    navigator.serviceWorker.controller.postMessage({ type: 'CACHE_GIFTED_CORE' });
    setTimeout(setConnectionStatus, 1800);
  });
  setConnectionStatus();
})();
