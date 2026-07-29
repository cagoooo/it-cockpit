(function () {
  const week = Number(document.body.dataset.week);
  const lesson = window.DAY_OF_AI_ADAPTATIONS?.[week];
  if (!lesson) return;
  const notebookUrl = (window.GIFTED_WEEKS || []).find((item) => item.week === week)?.notebookUrl;

  const esc = (value) => String(value).replace(/[&<>'"]/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
  const tabs = document.querySelector('.tabs');
  const main = document.querySelector('main');
  if (!tabs || !main) return;

  tabs.insertAdjacentHTML('beforeend', '<button class="tab" data-view="day-ai">生活探究</button>');
  main.insertAdjacentHTML('beforeend', `
    <section id="day-ai" class="view day-ai-view">
      <section class="day-ai-hero">
        <div><span>DAY OF AI 本土化挑戰</span><h2>${esc(lesson.title)}</h2><p>${esc(lesson.intro)}</p></div>
        <strong>${esc(lesson.question)}</strong>
      </section>
      <section class="section"><div class="section-head"><span>先選一個生活例子</span><h2>點一下，再找線索</h2></div>
        <div class="day-ai-scenarios" role="group" aria-label="生活例子">${lesson.scenarios.map((item, index) => `<button type="button" data-day-scenario="${index}" class="${index === 0 ? 'active' : ''}">${esc(item[0])}</button>`).join('')}</div>
        <div class="day-ai-clue" aria-live="polite"><b>${esc(lesson.scenarios[0][0])}</b><p>${esc(lesson.scenarios[0][1])}</p></div>
      </section>
      <section class="section"><div class="section-head"><span>跟著做</span><h2>四步完成探究</h2></div><div class="day-ai-steps">${lesson.steps.map((step, index) => `<label><input type="checkbox" data-day-step="${index}"><span><b>${index + 1}</b>${esc(step)}</span></label>`).join('')}</div><p class="day-ai-progress" aria-live="polite">完成 0 / 4</p></section>
      <section class="section"><div class="section-head"><span>不用寫長篇文章</span><h2>用三句話記下發現</h2></div><div class="day-ai-notes">${lesson.prompts.map((prompt, index) => `<label><span>${esc(prompt)}</span><textarea data-day-note="${index}" rows="2" placeholder="用自己的話寫，不用擔心一次寫對。"></textarea></label>`).join('')}</div><p class="day-ai-save" aria-live="polite">內容只保存在這台裝置</p></section>
      <section class="day-ai-grid"><article class="section"><div class="section-head"><span>老師可以這樣問</span><h2>幫學生再想一步</h2></div><ul>${lesson.teacherQuestions.map((item) => `<li>${esc(item)}</li>`).join('')}</ul></article><article class="section"><div class="section-head"><span>難詞小幫手</span><h2>先懂意思再記名字</h2></div><dl>${lesson.words.map((item) => `<div><dt>${esc(item[0])}</dt><dd>${esc(item[1])}</dd></div>`).join('')}</dl></article></section>
      <section class="section"><div class="section-head"><span>教師備課來源</span><h2>原教材與延伸工具</h2></div><div class="day-ai-links">${notebookUrl ? `<a href="${esc(notebookUrl)}" target="_blank" rel="noopener noreferrer">本週 NotebookLM：上課小幫手＋生活挑戰題<span>↗</span></a>` : ''}${lesson.links.map((item) => `<a href="${esc(item[1])}" target="_blank" rel="noopener noreferrer">${esc(item[0])}<span>↗</span></a>`).join('')}<a href="../source-credits.html">教材來源與使用方式<span>→</span></a></div></section>
    </section>
  `);
  const dayView = document.querySelector('#day-ai');
  const firstLearningBlock = document.querySelector('.picture-inquiry') || document.querySelector('.visual-learning-wall');
  if (dayView && firstLearningBlock) firstLearningBlock.insertAdjacentElement('beforebegin', dayView);

  const key = `gifted-day-ai-${String(week).padStart(2, '0')}`;
  let state = { scenario: 0, steps: [false, false, false, false], notes: ['', '', ''] };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(key) || '{}') }; } catch {}
  const save = () => localStorage.setItem(key, JSON.stringify(state));
  const clue = document.querySelector('.day-ai-clue');
  const renderScenario = () => {
    const item = lesson.scenarios[state.scenario] || lesson.scenarios[0];
    clue.innerHTML = `<b>${esc(item[0])}</b><p>${esc(item[1])}</p>`;
    document.querySelectorAll('[data-day-scenario]').forEach((button) => button.classList.toggle('active', Number(button.dataset.dayScenario) === state.scenario));
  };
  document.querySelectorAll('[data-day-scenario]').forEach((button) => button.addEventListener('click', () => { state.scenario = Number(button.dataset.dayScenario); save(); renderScenario(); }));
  const renderSteps = () => {
    document.querySelectorAll('[data-day-step]').forEach((input) => { input.checked = Boolean(state.steps[Number(input.dataset.dayStep)]); });
    document.querySelector('.day-ai-progress').textContent = `完成 ${state.steps.filter(Boolean).length} / 4`;
  };
  document.querySelectorAll('[data-day-step]').forEach((input) => input.addEventListener('change', () => { state.steps[Number(input.dataset.dayStep)] = input.checked; save(); renderSteps(); }));
  document.querySelectorAll('[data-day-note]').forEach((field) => {
    const index = Number(field.dataset.dayNote); field.value = state.notes[index] || '';
    field.addEventListener('input', () => { state.notes[index] = field.value; save(); document.querySelector('.day-ai-save').textContent = '已保存在這台裝置'; });
  });
  renderScenario(); renderSteps();
  if (location.hash === '#day-ai') document.querySelector('[data-view="day-ai"]')?.click();
})();
