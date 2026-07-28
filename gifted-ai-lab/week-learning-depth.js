(function () {
  const week = Number(document.body.dataset.week);
  const extra = (window.GIFTED_ENRICHMENT || {})[week];
  const depth = (window.GIFTED_DEPTH || {})[week];
  const assessment = document.querySelector('#assessment');
  if (!extra || !depth || !assessment) return;

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const ww = String(week).padStart(2, '0');
  const storageKey = `gifted-week-${ww}-depth-v1`;
  const routeOrder = ['foundation', 'advanced', 'researcher'];
  const routeNames = { foundation: '基礎', advanced: '進階', researcher: '研究者' };

  const defaultState = () => ({
    questions: extra.quiz.map(() => ({ attempts: 0, solved: false, confidence: '', lastChoice: null })),
    evidence: '',
    route: '',
    routeLocked: false,
    routeChecks: { foundation: [false, false, false], advanced: [false, false, false], researcher: [false, false, false] },
  });
  let state = defaultState();
  try {
    const saved = JSON.parse(localStorage.getItem(storageKey) || 'null');
    if (saved && Array.isArray(saved.questions) && saved.questions.length === extra.quiz.length) {
      state = { ...state, ...saved, routeChecks: { ...state.routeChecks, ...(saved.routeChecks || {}) } };
    }
  } catch {}

  const quizSection = assessment.querySelector('.section');
  quizSection.classList.add('depth-assessment');
  quizSection.innerHTML = `
    <div class="section-head"><span>DIAGNOSTIC ASSESSMENT</span><h2>三題診斷式形成評量</h2></div>
    <p class="depth-intro">先判斷自己的把握度，再作答。答錯時只會收到分層提示，可以修改後再次作答；完成後還要留下解釋證據。</p>
    <div class="depth-summary" aria-live="polite">
      <div><b id="depthScore">0 / 3</b><span>概念已理解</span></div>
      <div><b id="depthAttempts">0</b><span>作答次數</span></div>
      <div><b id="depthEvidence">待補</b><span>解釋證據</span></div>
    </div>
    <div class="quiz-list depth-quiz-list">${extra.quiz.map((item, qi) => `
      <article class="quiz-item depth-quiz" data-depth-quiz="${qi}">
        <div class="quiz-status"><span>概念 ${String(qi + 1).padStart(2, '0')}</span><b>尚未作答</b></div>
        <h3>${qi + 1}. ${esc(item[0])}</h3>
        <div class="confidence-row" role="group" aria-label="第 ${qi + 1} 題作答把握度">
          <span>作答前把握度</span>
          <button data-confidence="unsure">不確定</button><button data-confidence="likely">大致確定</button><button data-confidence="sure">很確定</button>
        </div>
        <div class="quiz-options">${item[1].map((option, oi) => `<button data-depth-choice="${oi}">${String.fromCharCode(65 + oi)}. ${esc(option)}</button>`).join('')}</div>
        <p class="quiz-feedback" aria-live="polite"></p>
      </article>`).join('')}</div>
    <label class="evidence-box"><b>用自己的話留下理解證據</b><span>${esc(depth.evidencePrompt)}</span><textarea id="depthEvidenceInput" placeholder="不要填姓名或其他個資；請寫下理由、例子或反例。"></textarea><small>至少 18 個字，才能建議研究者路徑。內容只保存在目前瀏覽器。</small></label>
    <div class="depth-controls"><button class="action" id="resetDepth">重新診斷</button></div>`;

  const routeSection = document.createElement('section');
  routeSection.className = 'section adaptive-section';
  routeSection.innerHTML = `
    <div class="section-head"><span>ADAPTIVE CHALLENGE</span><h2>自適應挑戰路徑</h2></div>
    <div class="route-diagnosis"><div><span>系統建議</span><strong id="routeRecommendation">尚待作答</strong><p id="routeReason">完成形成評量後，系統會依理解證據推薦路徑。</p></div><button class="action primary" id="acceptRoute">採用建議路徑</button></div>
    <div class="route-switch" role="group" aria-label="挑戰路徑">${routeOrder.map((key) => `<button data-route="${key}">${routeNames[key]}</button>`).join('')}</div>
    <article class="route-panel" id="routePanel"></article>
    <p class="local-only">路徑、勾選與解釋都只存在這台裝置，不會建立學生帳號或上傳個人資料。</p>`;
  quizSection.insertAdjacentElement('afterend', routeSection);

  const mediaView = document.querySelector('#media');
  if (mediaView) {
    mediaView.insertAdjacentHTML('afterbegin', `
      <section class="section depth-materials">
        <div class="section-head"><span>NOTEBOOKLM DEPTH STUDIO</span><h2>資優探究深化教材</h2></div>
        <p>依本週診斷提示與三層挑戰重新製作，不是原簡報與原影片的重複版本。</p>
        <div class="depth-media-grid">
          <a class="depth-infographic" href="depth-infographic.png" target="_blank" rel="noopener noreferrer"><img src="depth-infographic.png" alt="W${ww} 資優探究資訊圖"><span>開啟高解析度資訊圖</span></a>
          <div class="resources depth-resource-list">
            <a class="resource" href="depth-slides.pdf" target="_blank"><b>資優探究深化簡報 →</b><span>認知衝突、反例、小實驗與三層任務</span></a>
            <a class="resource" href="depth-video.mp4" target="_blank"><b>研究者挑戰短片 →</b><span>逐句淡入、同步高亮的動態繁體中文字幕</span></a>
            <a class="resource" href="depth-video-captions.srt" target="_blank"><b>標準字幕檔 →</b><span>可供播放器載入、剪輯與無障礙使用</span></a>
            <a class="resource" href="depth-video-transcript.txt" target="_blank"><b>短片逐字稿 →</b><span>可供備課、無聲閱讀與無障礙使用</span></a>
            <a class="resource" href="depth-source.md"><b>NotebookLM 深化來源 →</b><span>診斷提示、挑戰路徑與完成證據</span></a>
            <a class="resource" href="${esc((window.GIFTED_WEEKS || []).find((item) => item.week === week)?.notebookUrl || '#')}" target="_blank" rel="noopener noreferrer"><b>回到本週 NotebookLM →</b><span>繼續查詢、比較與產生新教材</span></a>
          </div>
        </div>
      </section>`);
  }

  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const solvedCount = () => state.questions.filter((item) => item.solved).length;
  const totalAttempts = () => state.questions.reduce((sum, item) => sum + item.attempts, 0);
  const recommendedRoute = () => {
    const score = solvedCount();
    if (score < 2) return 'foundation';
    if (score < 3 || state.evidence.trim().length < 18) return 'advanced';
    return 'researcher';
  };
  const recommendationReason = (route) => {
    if (route === 'foundation') return '目前仍有兩個以上概念需要重新建立，先用具體例子與操作證據打穩基礎。';
    if (route === 'advanced') return solvedCount() === 3
      ? '三題都已理解；補強解釋證據後，就能進入研究者路徑。'
      : '已有主要概念，可進一步處理反例、比較與邊界條件。';
    return '三題皆理解且已有完整解釋證據，適合設計可反駁、可重做的小研究。';
  };
  const teacherMove = (route) => ({
    foundation: '教師追問：請先指出你看見的事實，再說這項事實支持哪個判斷。',
    advanced: '教師追問：什麼反例會讓你的規則失敗？你要如何修改？',
    researcher: '教師追問：你的假設可能被什麼證據推翻？別人能否重做你的方法？',
  }[route]);

  function renderQuestion(qi) {
    const item = quizSection.querySelector(`[data-depth-quiz="${qi}"]`);
    const qState = state.questions[qi];
    const answer = extra.quiz[qi][2];
    item.querySelectorAll('[data-confidence]').forEach((button) => button.classList.toggle('selected', button.dataset.confidence === qState.confidence));
    item.querySelectorAll('[data-depth-choice]').forEach((button) => {
      const choice = Number(button.dataset.depthChoice);
      button.disabled = qState.solved;
      button.classList.toggle('correct', qState.solved && choice === answer);
      button.classList.toggle('wrong', !qState.solved && qState.lastChoice === choice && qState.attempts > 0);
    });
    const status = item.querySelector('.quiz-status b');
    const feedback = item.querySelector('.quiz-feedback');
    if (qState.solved) {
      status.textContent = `已理解 · ${qState.attempts} 次`;
      status.className = 'status-solved';
      feedback.textContent = `證據成立。${extra.quiz[qi][3]}`;
      feedback.className = 'quiz-feedback show success';
    } else if (qState.attempts > 0) {
      const hintIndex = Math.min(qState.attempts - 1, 1);
      status.textContent = `正在修正 · ${qState.attempts} 次`;
      status.className = 'status-retry';
      feedback.textContent = `先不公布答案。提示 ${hintIndex + 1}：${depth.hints[qi][hintIndex]}`;
      feedback.className = 'quiz-feedback show retry';
    } else {
      status.textContent = '尚未作答';
      status.className = '';
      feedback.textContent = '';
      feedback.className = 'quiz-feedback';
    }
  }

  function renderRoute() {
    const suggested = recommendedRoute();
    if (!state.route || !state.routeLocked) state.route = suggested;
    const active = state.route;
    const route = depth.routes[active];
    document.querySelector('#routeRecommendation').textContent = `${routeNames[suggested]}路徑`;
    document.querySelector('#routeReason').textContent = recommendationReason(suggested);
    document.querySelector('#acceptRoute').disabled = state.routeLocked && active === suggested;
    document.querySelector('#acceptRoute').textContent = state.routeLocked && active === suggested ? '已採用建議' : '採用建議路徑';
    document.querySelectorAll('[data-route]').forEach((button) => button.classList.toggle('active', button.dataset.route === active));
    const checks = state.routeChecks[active] || [false, false, false];
    document.querySelector('#routePanel').innerHTML = `
      <div class="route-head"><div><span>${esc(route[1])}</span><h3>${esc(route[0])}</h3></div><b>${checks.filter(Boolean).length} / 3</b></div>
      <div class="route-tasks">${route[2].map((task, index) => `<label><input type="checkbox" data-route-check="${index}" ${checks[index] ? 'checked' : ''}><span><b>任務 ${index + 1}</b>${esc(task)}</span></label>`).join('')}</div>
      <div class="route-evidence"><b>完成證據</b><p>${esc(route[3])}</p></div>
      <div class="teacher-move"><b>教師診斷追問</b><p>${esc(teacherMove(active))}</p></div>`;
    document.querySelectorAll('[data-route-check]').forEach((input) => input.addEventListener('change', () => {
      state.routeChecks[active][Number(input.dataset.routeCheck)] = input.checked;
      save();
      renderRoute();
    }));
  }

  function render() {
    state.questions.forEach((_, qi) => renderQuestion(qi));
    document.querySelector('#depthScore').textContent = `${solvedCount()} / 3`;
    document.querySelector('#depthAttempts').textContent = String(totalAttempts());
    document.querySelector('#depthEvidence').textContent = state.evidence.trim().length >= 18 ? '已具體' : '待補';
    document.querySelector('#depthEvidenceInput').value = state.evidence;
    renderRoute();
    save();
  }

  quizSection.addEventListener('click', (event) => {
    const confidence = event.target.closest('[data-confidence]');
    if (confidence) {
      const qi = Number(confidence.closest('[data-depth-quiz]').dataset.depthQuiz);
      state.questions[qi].confidence = confidence.dataset.confidence;
      render();
      return;
    }
    const choiceButton = event.target.closest('[data-depth-choice]');
    if (!choiceButton) return;
    const qi = Number(choiceButton.closest('[data-depth-quiz]').dataset.depthQuiz);
    const qState = state.questions[qi];
    if (!qState.confidence) {
      const feedback = choiceButton.closest('.depth-quiz').querySelector('.quiz-feedback');
      feedback.textContent = '請先選擇作答前的把握度，再提交答案。';
      feedback.className = 'quiz-feedback show retry';
      return;
    }
    if (qState.solved) return;
    qState.attempts += 1;
    qState.lastChoice = Number(choiceButton.dataset.depthChoice);
    qState.solved = qState.lastChoice === extra.quiz[qi][2];
    render();
  });

  document.querySelector('#depthEvidenceInput').addEventListener('input', (event) => {
    state.evidence = event.target.value;
    document.querySelector('#depthEvidence').textContent = state.evidence.trim().length >= 18 ? '已具體' : '待補';
    if (!state.routeLocked) renderRoute();
    save();
  });
  document.querySelector('#acceptRoute').addEventListener('click', () => {
    state.route = recommendedRoute();
    state.routeLocked = true;
    render();
  });
  document.querySelector('.route-switch').addEventListener('click', (event) => {
    const button = event.target.closest('[data-route]');
    if (!button) return;
    state.route = button.dataset.route;
    state.routeLocked = true;
    render();
  });
  document.querySelector('#resetDepth').addEventListener('click', () => {
    if (!window.confirm('要清除本週形成評量、解釋證據與挑戰進度嗎？')) return;
    state = defaultState();
    render();
  });
  render();
})();
