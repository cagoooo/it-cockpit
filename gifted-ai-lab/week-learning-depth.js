(function () {
  const week = Number(document.body.dataset.week);
  const extra = (window.GIFTED_ENRICHMENT || {})[week];
  const depth = (window.GIFTED_DEPTH || {})[week];
  const studentInfographic = (window.GIFTED_STUDENT_INFOGRAPHICS || {})[week] || 'depth-infographic.webp';
  const assessment = document.querySelector('#assessment');
  if (!extra || !depth || !assessment) return;

  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[char]));
  const ww = String(week).padStart(2, '0');
  const storageKey = `gifted-week-${ww}-depth-v1`;
  const routeOrder = ['foundation', 'advanced', 'researcher'];
  const routeNames = { foundation: '先學會', advanced: '再挑戰', researcher: '小研究' };

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
    <div class="section-head"><span>QUICK CHECK</span><h2>三題小挑戰</h2></div>
    <p class="depth-intro">先選你有多確定，再回答。答錯沒關係，系統會先給一點提示，讓你修改後再試一次。最後要用自己的話說明理由。</p>
    <div class="depth-summary" aria-live="polite">
      <div><b id="depthScore">0 / 3</b><span>已經學會</span></div>
      <div><b id="depthAttempts">0</b><span>試了幾次</span></div>
      <div><b id="depthEvidence">待補</b><span>我的理由</span></div>
    </div>
    <div class="quiz-list depth-quiz-list">${extra.quiz.map((item, qi) => `
      <article class="quiz-item depth-quiz" data-depth-quiz="${qi}">
        <div class="quiz-status"><span>概念 ${String(qi + 1).padStart(2, '0')}</span><b>尚未作答</b></div>
        <h3>${qi + 1}. ${esc(item[0])}</h3>
        <div class="confidence-row" role="group" aria-label="第 ${qi + 1} 題作答把握度">
          <span>我有多確定</span>
          <button data-confidence="unsure">不確定</button><button data-confidence="likely">大致確定</button><button data-confidence="sure">很確定</button>
        </div>
        <div class="quiz-options">${item[1].map((option, oi) => `<button data-depth-choice="${oi}">${String.fromCharCode(65 + oi)}. ${esc(option)}</button>`).join('')}</div>
        <p class="quiz-feedback" aria-live="polite"></p>
      </article>`).join('')}</div>
    <label class="evidence-box"><b>用自己的話說明理由</b><span>${esc(depth.evidencePrompt)}</span><textarea id="depthEvidenceInput" placeholder="不要填姓名或私人資料；請寫下理由，或舉一個例子。"></textarea><small>寫滿 18 個字，系統才能建議最適合你的挑戰。內容只保存在這台裝置。</small></label>
    <div class="depth-controls"><button class="action" id="resetDepth">重新挑戰</button></div>`;

  const routeSection = document.createElement('section');
  routeSection.className = 'section adaptive-section';
  routeSection.innerHTML = `
    <div class="section-head"><span>我的下一關</span><h2>選擇下一個挑戰</h2></div>
    <div class="route-diagnosis"><div><span>系統建議</span><strong id="routeRecommendation">先完成三題</strong><p id="routeReason">回答三題並寫下理由後，系統會推薦適合的挑戰。</p></div><button class="action primary" id="acceptRoute">選擇這個挑戰</button></div>
    <div class="route-switch" role="group" aria-label="挑戰路徑">${routeOrder.map((key) => `<button data-route="${key}">${routeNames[key]}</button>`).join('')}</div>
    <article class="route-panel" id="routePanel"></article>
    <p class="local-only">路徑、勾選與解釋都只存在這台裝置，不會建立學生帳號或上傳個人資料。</p>`;
  quizSection.insertAdjacentElement('afterend', routeSection);

  const mediaView = document.querySelector('#media');
  if (mediaView) {
    mediaView.insertAdjacentHTML('afterbegin', `
      <section class="section depth-materials">
        <div class="section-head"><span>MORE TO EXPLORE</span><h2>看圖、看影片，再想深一點</h2></div>
        <p>這些教材用圖片、小實驗和不同例子，幫你把這週的問題想得更清楚。</p>
        <div class="depth-media-grid">
          <a class="depth-infographic" href="${studentInfographic}" target="_blank" rel="noopener noreferrer"><img src="${studentInfographic}" alt="W${ww} 中年級好懂版資訊圖"><span>開啟中年級好懂版資訊圖</span></a>
          <div class="resources depth-resource-list">
            <a class="resource" href="lecture-slides.html" target="_blank"><b>12 張好懂版課堂簡報 →</b><span>短句、大字、生活例子和四段闖關</span></a>
            <a class="resource" href="depth-slides.pdf" target="_blank"><b>老師陪讀進階簡報 →</b><span>適合和老師一起挑戰較難的問題</span></a>
            <a class="resource" href="depth-video.mp4" target="_blank"><b>小研究挑戰短片 →</b><span>有動態繁體中文字幕，可以跟著一起讀</span></a>
            <a class="resource" href="depth-video-captions.srt" target="_blank"><b>標準字幕檔 →</b><span>可供播放器載入、剪輯與無障礙使用</span></a>
            <a class="resource" href="depth-video-transcript.txt" target="_blank"><b>短片逐字稿 →</b><span>可供備課、無聲閱讀與無障礙使用</span></a>
            <a class="resource" href="student-guide.md"><b>中年級好懂版 →</b><span>難詞解釋、生活例子和一步一步任務</span></a>
            <a class="resource" href="depth-source.md"><b>NotebookLM 完整資料 →</b><span>本週問題、提示和各種挑戰</span></a>
            <a class="resource" href="${esc((window.GIFTED_WEEKS || []).find((item) => item.week === week)?.notebookUrl || '#')}" target="_blank" rel="noopener noreferrer"><b>開啟本週 NotebookLM →</b><span>用自己的問題繼續查詢和比較</span></a>
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
    if (route === 'foundation') return '目前有兩個以上的想法還要再練，先用生活例子和動手操作弄懂。';
    if (route === 'advanced') return solvedCount() === 3
      ? '三題都答對了；再把理由說清楚，就能開始小研究。'
      : '主要想法已經懂了，可以試試不一樣的例子和更難分的情況。';
    return '三題都答對，而且理由很清楚，適合設計一個別人也能照著做的小研究。';
  };
  const teacherMove = (route) => ({
    foundation: '老師會問：你真的看到什麼？這個發現讓你怎麼想？',
    advanced: '老師會問：有沒有一個不一樣的例子，會讓你的規則失敗？要怎麼改？',
    researcher: '老師會問：看到什麼結果時，你會願意改變想法？別人能照你的步驟再做一次嗎？',
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
      <div class="route-evidence"><b>完成時要留下</b><p>${esc(route[3])}</p></div>
      <div class="teacher-move"><b>老師會這樣問</b><p>${esc(teacherMove(active))}</p></div>`;
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
    if (!window.confirm('要清除本週三題小挑戰、理由和闖關進度嗎？')) return;
    state = defaultState();
    render();
  });
  render();
})();
