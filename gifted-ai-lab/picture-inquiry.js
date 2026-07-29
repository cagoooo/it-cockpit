(function () {
  const week = Number(document.body.dataset.week);
  if (!week) return;
  const code = String(week).padStart(2, '0');
  const data = (window.GIFTED_WEEKS || []).find((item) => item.week === week);
  const extra = (window.GIFTED_ENRICHMENT || {})[week];
  const visualWall = document.querySelector('.visual-learning-wall');
  if (!data || !extra || !visualWall) return;

  const positions = [
    [{ x: 23, y: 69 }, { x: 51, y: 68 }, { x: 79, y: 70 }],
    [{ x: 25, y: 72 }, { x: 54, y: 65 }, { x: 81, y: 71 }],
    [{ x: 21, y: 66 }, { x: 49, y: 73 }, { x: 78, y: 64 }],
  ][(week / 3) % 3];
  const concepts = extra.concepts.slice(0, 3);
  const storageKey = `gifted-week-${code}-picture-inquiry-v1`;
  let state = { found: [], answer: '' };
  try { state = { ...state, ...JSON.parse(localStorage.getItem(storageKey) || '{}') }; } catch {}
  const save = () => localStorage.setItem(storageKey, JSON.stringify(state));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  visualWall.insertAdjacentHTML('beforebegin', `
    <section class="picture-inquiry" aria-labelledby="pictureInquiryTitle">
      <div class="picture-inquiry__head"><div><span class="code">LOOK · THINK · TELL</span><h2 id="pictureInquiryTitle">圖片線索偵探</h2></div><p>點三個圓點找線索，再說出你的發現。</p></div>
      <div class="picture-inquiry__layout">
        <div class="picture-inquiry__stage">
          <img src="week-illustration.webp" width="1152" height="768" alt="${esc(data.title)}圖片探究">
          ${concepts.map((item, index) => `<button class="picture-hotspot${state.found.includes(index) ? ' found' : ''}" style="--hotspot-x:${positions[index].x}%;--hotspot-y:${positions[index].y}%" data-hotspot="${index}" aria-label="查看圖片線索 ${index + 1}">${index + 1}</button>`).join('')}
        </div>
        <div class="picture-inquiry__panel">
          <article class="clue-card" aria-live="polite"><small>先點圖片上的圓點</small><h3>你發現了什麼？</h3><p>${esc(extra.drivingQuestion)}</p></article>
          <div class="clue-progress">已找到 ${state.found.length} / ${concepts.length} 個線索</div>
          <section class="voice-inquiry"><small>我的想法</small><label for="pictureInquiryAnswer">看完圖片後，我想說……</label><textarea id="pictureInquiryAnswer" placeholder="可以用說的，也可以自己打字。">${esc(state.answer)}</textarea><div class="voice-inquiry__actions"><button class="primary" type="button" data-voice-start>開始說話</button><button type="button" data-read-question>念出問題</button><button type="button" data-clear-answer>清除</button></div><p class="voice-inquiry__status" aria-live="polite">內容會先保存在這台裝置。</p></section>
        </div>
      </div>
    </section>`);

  const card = document.querySelector('.clue-card');
  const progress = document.querySelector('.clue-progress');
  document.querySelectorAll('[data-hotspot]').forEach((button) => button.addEventListener('click', () => {
    const index = Number(button.dataset.hotspot);
    if (!state.found.includes(index)) state.found.push(index);
    document.querySelectorAll('[data-hotspot]').forEach((item) => item.classList.toggle('active', item === button));
    button.classList.add('found');
    card.innerHTML = `<small>線索 ${index + 1}</small><h3>${esc(concepts[index][0])}</h3><p>${esc(concepts[index][1])}</p>`;
    progress.textContent = `已找到 ${state.found.length} / ${concepts.length} 個線索${state.found.length === concepts.length ? '，三個都找到了！' : ''}`;
    save();
  }));

  const answer = document.querySelector('#pictureInquiryAnswer');
  answer.addEventListener('input', () => { state.answer = answer.value; save(); });
  document.querySelector('[data-clear-answer]').addEventListener('click', () => { answer.value = ''; state.answer = ''; save(); answer.focus(); });
  document.querySelector('[data-read-question]').addEventListener('click', () => {
    if (!('speechSynthesis' in window)) return;
    speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(extra.drivingQuestion);
    utterance.lang = 'zh-TW'; utterance.rate = 0.9; speechSynthesis.speak(utterance);
  });

  const voiceButton = document.querySelector('[data-voice-start]');
  const voiceStatus = document.querySelector('.voice-inquiry__status');
  const Recognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!Recognition) {
    voiceButton.disabled = true;
    voiceButton.textContent = '此瀏覽器請用打字';
    voiceStatus.textContent = '這台裝置沒有開放語音辨識，仍可直接打字作答。';
    return;
  }
  const recognition = new Recognition();
  recognition.lang = 'zh-TW'; recognition.interimResults = true; recognition.continuous = false;
  let startingText = '';
  voiceButton.addEventListener('click', () => { startingText = answer.value.trim(); recognition.start(); });
  recognition.addEventListener('start', () => { voiceButton.textContent = '正在聽…'; voiceButton.disabled = true; voiceStatus.textContent = '請用一句完整的話說出你看到的線索。'; });
  recognition.addEventListener('result', (event) => {
    const transcript = [...event.results].map((result) => result[0].transcript).join('');
    answer.value = `${startingText}${startingText && transcript ? ' ' : ''}${transcript}`;
    state.answer = answer.value; save();
  });
  recognition.addEventListener('end', () => { voiceButton.textContent = '再說一次'; voiceButton.disabled = false; voiceStatus.textContent = '已記下你的想法，也可以再修改文字。'; });
  recognition.addEventListener('error', () => { voiceButton.textContent = '再試一次'; voiceButton.disabled = false; voiceStatus.textContent = '剛才沒有聽清楚，可以再說一次或直接打字。'; });
})();
