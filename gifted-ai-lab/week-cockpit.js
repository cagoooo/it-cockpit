(function(){
  const week=Number(document.body.dataset.week);
  const data=(window.GIFTED_WEEKS||[]).find(item=>item.week===week);
  const extra=(window.GIFTED_ENRICHMENT||{})[week];
  const app=document.querySelector('#app');
  if(!data||!extra){app.innerHTML='<p class="loading">找不到本週課程資料。</p>';return;}

  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const ww=String(data.week).padStart(2,'0');
  const allWeeks=window.GIFTED_WEEKS||[];
  const currentIndex=allWeeks.findIndex(item=>item.week===week);
  const prev=allWeeks[currentIndex-1],next=allWeeks[currentIndex+1];
  const glossary=(window.GIFTED_GLOSSARY||{})[week]||[];
  const localHref=href=>href.startsWith('../')?'../'+href:href;
  const flowGuide=['先說說原本怎麼想，留下第一版。','用生活例子把想法弄懂。','完成第一個看得見的小成果。','用一句話或作品說說學會了什麼。','把想法做成可以試的第一版。','加入不一樣、很難分或故意錯的例子。','看測試結果修改，並保留前後兩版。','幫作品命名，說說發現和下次想做什麼。'];
  const rubric=[
    ['我懂了嗎','能完成基本分類或步驟','能用自己的話說明並比較','能用不同例子檢查並修改想法'],
    ['我怎麼知道','能說出自己的想法','能用資料、測試或觀察支持','能說明目前還不能確定的地方'],
    ['我怎麼修改','完成第一版','保留前後版本並說出改了什麼','比較不同做法後，說出選擇理由'],
    ['我有安全使用 AI 嗎','知道不能輸入私人資料','會再確認 AI 的答案並說明 AI 幫了什麼','能說出最後是誰做決定和負責']
  ];

  document.title=`W${ww} ${data.title}｜石門智繪客`;
  app.innerHTML=`
  <header class="topbar"><div class="shell topbar-inner"><a class="brand" href="../index.html"><img class="brand-icon" src="../assets/gifted-favicon-192.png" alt=""><span><b>石門智繪客</b><small>第 ${week} 週專用駕駛艙</small></span></a><nav class="topnav">${prev?`<a class="nav-btn" href="../week-${String(prev.week).padStart(2,'0')}/" title="上一週" aria-label="上一週">←</a>`:''}<a class="nav-btn wide" href="../index.html">年度總覽</a>${next?`<a class="nav-btn" href="../week-${String(next.week).padStart(2,'0')}/" title="下一週" aria-label="下一週">→</a>`:''}</nav></div></header>
  <main class="shell">
    <section class="hero"><div class="hero-copy"><div class="code">第 ${ww} 週 · ${esc(data.date)} · 90 分鐘</div><h1>${esc(data.title)}</h1><p>${esc(data.goal)}</p><div class="driving"><span>這週的大問題</span><strong>${esc(extra.drivingQuestion)}</strong></div></div><div class="hero-side"><figure class="week-visual"><img src="week-illustration.webp" width="1152" height="768" alt="${esc(data.title)}的 Q 版繪本情境圖" fetchpriority="high"><figcaption>先看圖找線索，再開始今天的挑戰。</figcaption></figure><div class="output"><span>今天要完成</span>${esc(data.output)}<small id="pathProgress">闖關進度 0 / 4</small></div></div></section>
    <div class="actions"><a class="action primary" href="lecture-slides.html">開啟 12 張課堂簡報</a><a class="action notebook" href="${esc(data.notebookUrl)}" target="_blank" rel="noopener noreferrer">開啟本週 NotebookLM</a><a class="action" href="teacher-pack.pdf?v=20260727-rich">下載直式詳案</a><button class="action" id="printWeek">列印本週</button></div>
    <nav class="tabs" role="tablist" aria-label="課程內容"><button class="tab active" data-view="teacher">上課流程</button><button class="tab" data-view="explore">動手闖關</button><button class="tab" data-view="student">我的工作室</button><button class="tab" data-view="assessment">小挑戰</button><button class="tab" data-view="media">影片與教材</button></nav>
    <section class="visual-learning-wall" aria-label="本週圖像學習牆"><a class="visual-learning-card" href="week-illustration.webp" target="_blank"><img src="week-illustration.webp" width="1152" height="768" alt="${esc(data.title)}的 Q 版繪本圖"><span><b>故事情境</b>先看圖猜猜今天要做什麼</span></a><a class="visual-learning-card" href="student-infographic.png" target="_blank"><img src="student-infographic.png" loading="lazy" alt="第 ${week} 週好懂版資訊圖"><span><b>好懂圖解</b>用一張圖整理重要想法</span></a><a class="visual-learning-card" href="depth-infographic.png" target="_blank"><img src="depth-infographic.png" loading="lazy" alt="第 ${week} 週研究挑戰圖"><span><b>再想一步</b>看看還能研究什麼問題</span></a></section>

    <section id="teacher" class="view active">
      <div class="summary"><div class="summary-cell"><b>這週最重要的想法</b>${esc(data.concept)}</div><div class="summary-cell"><b>要準備的東西</b>${esc(data.materials)}</div><div class="summary-cell"><b>上課方式</b>一對一｜連續兩節｜動手試、說理由</div></div>
      <section class="section"><div class="section-head"><span>今天怎麼上課</span><h2>90 分鐘逐段流程</h2></div><div class="timeline">${data.timeline.map((row,i)=>`<div class="time-row"><div class="time">${esc(row[0])}</div><div class="time-main"><b>${esc(row[1])}</b><span>${esc(flowGuide[i])}</span></div><div class="time-tip">${esc(row[2])}</div></div>`).join('')}</div></section>
      <section class="section"><div class="section-head"><span>TEACHER HELP</span><h2>老師怎麼幫你想</h2></div><div class="diagnostic-grid"><div><b>很快答完時</b><p>再說說看：「${esc(data.questions[0])}」</p></div><div><b>卡住時</b><p>先回到「${esc(extra.path[0][0])}」，只說你真的看到什麼。</p></div><div><b>完成基本任務時</b><p>再試一個不一樣的例子：「${esc(extra.misconception[0])}」</p></div></div></section>
      <section class="section"><div class="section-head"><span>QUESTIONS</span><h2>教師追問句</h2></div><div class="questions">${data.questions.map(q=>`<div class="question">「${esc(q)}」</div>`).join('')}</div></section>
      <section class="section"><div class="section-head"><span>可以使用的工具</span><h2>本週教學資源</h2></div><div class="resources">${data.links.filter(x=>x[1]&&!x[1].includes('notebooklm.google.com')).map(x=>`<a class="resource" href="${esc(localHref(x[1]))}"><b>${esc(x[0])} →</b><span>可以操作與練習的教材</span></a>`).join('')}<a class="resource" href="${esc(data.notebookUrl)}" target="_blank" rel="noopener noreferrer"><b>本週 NotebookLM →</b><span>問問題、整理想法與製作素材</span></a><a class="resource" href="enrichment.md"><b>老師陪讀資料 →</b><span>更多例子、小測驗與延伸問題</span></a></div></section>
      <section class="section"><div class="section-head"><span>AFTER CLASS</span><h2>課後銜接備忘</h2></div><textarea class="teacher-note" placeholder="學生今天最有力的推理、卡住的地方、下次要延續的線索…"></textarea></section>
    </section>

    <section id="explore" class="view">
      <section class="section path-intro"><div class="section-head"><span>四個任務</span><h2>四段動手闖關</h2></div><p>每一關都要留下看得到的結果。做完步驟還不夠，也要能說出「我是怎麼知道的」。</p></section>
      <div class="path-grid">${extra.path.map((item,i)=>`<article class="path-stage" data-stage="${i}"><label><input class="stage-check" type="checkbox" data-stage="${i}"><span class="stage-no">0${i+1}</span><span><b>${esc(item[0])}</b><strong>${esc(item[1])}</strong><small>證據：${esc(item[2])}</small></span></label></article>`).join('')}</div>
      <section class="section"><div class="section-head"><span>I CAN DO IT</span><h2>做到這些就過關</h2></div><div class="criteria">${extra.success.map((item,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span>${esc(item)}</div>`).join('')}</div></section>
    </section>

    <section id="student" class="view">
      <section class="student-box"><div class="section-head"><span>我要完成</span><h2>本週任務</h2></div><ol>${data.student.map(item=>`<li>${esc(item)}</li>`).join('')}</ol></section>
      <section class="section"><div class="section-head"><span>KEY IDEAS</span><h2>三張重點卡</h2></div><div class="concept-grid">${extra.concepts.map(item=>`<article><b>${esc(item[0])}</b><p>${esc(item[1])}</p></article>`).join('')}</div></section>
      <section class="section"><div class="section-head"><span>WORD HELP</span><h2>難詞小幫手</h2></div><div class="concept-grid">${glossary.map(item=>`<article><b>${esc(item[0])}</b><p>${esc(item[1])}</p></article>`).join('')}</div></section>
      <section class="section misconception"><div class="section-head"><span>IDEA DETECTIVE</span><h2>想法偵探</h2></div><blockquote>「${esc(extra.misconception[0])}」</blockquote><div class="myth-grid"><div><b>先想清楚</b><p>${esc(extra.misconception[1])}</p></div><div><b>動手試試看</b><p>${esc(extra.misconception[2])}</p></div></div></section>
      <section class="section"><div class="section-head"><span>SELF CHECK</span><h2>完成前自我檢查</h2></div><div class="self-check"><div class="check">我有保留第一版與修改版。</div><div class="check">我能說出選擇的理由。</div><div class="check">我有用測試或資料支持結論。</div><div class="check">使用 AI 時，我有查證並保護個資。</div></div></section>
      <section class="section"><div class="section-head"><span>REFLECTION</span><h2>今天要帶走的一句話</h2></div><textarea class="teacher-note student-reflection" placeholder="我原本以為……，現在我發現……，我的證據是……"></textarea></section>
    </section>

    <section id="assessment" class="view">
      <section class="section"><div class="section-head"><span>QUICK CHECK</span><h2>三題小挑戰</h2></div><div class="quiz-list">${extra.quiz.map((item,qi)=>`<article class="quiz-item" data-quiz="${qi}"><h3>${qi+1}. ${esc(item[0])}</h3><div class="quiz-options">${item[1].map((option,oi)=>`<button data-choice="${oi}">${String.fromCharCode(65+oi)}. ${esc(option)}</button>`).join('')}</div><p class="quiz-feedback" aria-live="polite"></p></article>`).join('')}</div></section>
      <section class="section"><div class="section-head"><span>CHECK MY WORK</span><h2>我的作品檢查表</h2></div><div class="rubric-wrap"><table class="rubric"><thead><tr><th>看看哪一項</th><th>剛開始</th><th>做到了</th><th>更進一步</th></tr></thead><tbody>${rubric.map(row=>`<tr>${row.map(cell=>`<td>${esc(cell)}</td>`).join('')}</tr>`).join('')}</tbody></table></div></section>
      <section class="section"><div class="section-head"><span>FAQ</span><h2>學生常見問題</h2></div><div class="faq-list">${extra.faq.map(item=>`<details><summary>${esc(item[0])}</summary><p>${esc(item[1])}</p></details>`).join('')}</div></section>
    </section>

    <section id="media" class="view">
      <section class="media-grid"><video class="week-video" controls preload="metadata" poster="../assets/gifted-lab-cover.png"><source src="video.mp4" type="video/mp4"></video><div><div class="status-box"><b>本週 NotebookLM 短影片</b><span class="video-status">正在確認影片狀態…</span></div><div class="resources media-links"><a class="resource picture-book-link" href="week-illustration.webp" target="_blank"><b>本週 Q 版繪本圖 →</b><span>看圖找出課程的三個重要線索</span></a><a class="resource" href="slides.pdf"><b>NotebookLM 本週簡報 →</b><span>本週專屬概念與任務教材</span></a><a class="resource" href="notebooklm-kai-slides.html#slide-1"><b>黃凱揚老師帶課新版投影片 →</b><span>可左右播放、全螢幕與觸控翻頁，每頁都有老師人像引導</span></a><a class="resource" href="lecture-slides.html"><b>12 張互動投影簡報 →</b><span>全螢幕、總覽、鍵盤與觸控操作</span></a><a class="resource" href="notebook-faq.md"><b>NotebookLM FAQ 紀錄 →</b><span>由本週全部來源交叉整理的三個追問</span></a><a class="resource" href="video-captions.srt"><b>短影片字幕檔 →</b><span>動態字幕同步文字，可供播放器與剪輯使用</span></a><a class="resource" href="${esc(data.notebookUrl)}" target="_blank" rel="noopener noreferrer"><b>進入本週 NotebookLM →</b><span>繼續研究、查詢與產出教材</span></a></div></div></section>
      <section class="section"><div class="section-head"><span>問問 NotebookLM</span><h2>五個幫助思考的問題</h2></div><div class="prompt-list">${extra.prompts.map((prompt,i)=>`<div><span>${String(i+1).padStart(2,'0')}</span><p>${esc(prompt)}</p><button class="copy-prompt" data-prompt="${esc(prompt)}">複製</button></div>`).join('')}</div></section>
      <section class="section notebook-workflow"><div class="section-head"><span>WORKFLOW</span><h2>NotebookLM 使用節奏</h2></div><div class="workflow"><div><b>課前</b><p>用來源摘要與 FAQ 預測學生迷思。</p></div><div><b>課中</b><p>只查反例與提示，不讓 AI 代替學生作答。</p></div><div><b>課後</b><p>依作品證據整理回饋與下次銜接。</p></div></div></section>
    </section>
  </main>
  <footer class="shell week-footer"><span>桃園市龍潭區石門國民小學 · W${ww} 資訊科技課程</span><span>Made with ❤️ by <a href="https://www.smes.tyc.edu.tw/modules/tadnews/page.php?ncsn=11&amp;nsn=16#a5" target="_blank" rel="noopener noreferrer">阿凱老師</a></span></footer>
  <canvas id="drawCanvas" class="page-draw" aria-hidden="true"></canvas>
  <div class="draw-toolbar" aria-label="畫筆工具"><button class="draw-color active" data-color="#15383c" style="--swatch:#15383c" aria-label="深綠色"></button><button class="draw-color" data-color="#de5c46" style="--swatch:#de5c46" aria-label="紅色"></button><button class="draw-color" data-color="#f1bd45" style="--swatch:#f1bd45" aria-label="黃色"></button><button class="draw-color" data-color="#168277" style="--swatch:#168277" aria-label="綠色"></button><button class="draw-color" data-color="#3575a7" style="--swatch:#3575a7" aria-label="藍色"></button><button id="clearDraw">清除</button><button id="closeDraw">完成</button></div>
  <aside class="tool-dock"><div class="tools"><div class="tool-head"><span>課堂工具</span><button class="nav-btn close-tools" aria-label="關閉工具">×</button></div><div class="timer-display">10:00</div><div class="timer-controls"><button data-min="5">5 分</button><button data-min="10">10 分</button><button data-min="15">15 分</button><button class="start-timer">開始</button></div><button class="action pick-challenge">抽進階挑戰</button><p class="challenge">完成基本任務後，再抽一張挑戰卡。</p><button class="action draw-toggle">開啟全頁畫筆</button></div><button class="tool-toggle" aria-label="開啟課堂工具" title="課堂工具">＋</button></aside>`;

  const showView=view=>{
    document.querySelectorAll('.tab').forEach(tab=>tab.classList.toggle('active',tab.dataset.view===view));
    document.querySelectorAll('.view').forEach(section=>section.classList.toggle('active',section.id===view));
    history.replaceState(null,'',`#${view}`);
  };
  document.querySelector('.tabs').addEventListener('click',event=>{const tab=event.target.closest('[data-view]');if(tab)showView(tab.dataset.view);});
  const initialView=location.hash.slice(1);if(['teacher','explore','student','assessment','media'].includes(initialView))showView(initialView);
  document.querySelector('#printWeek').onclick=()=>window.print();

  const note=document.querySelector('.teacher-note');
  const reflection=document.querySelector('.student-reflection');
  note.value=localStorage.getItem(`gifted-week-${ww}-note`)||'';
  reflection.value=localStorage.getItem(`gifted-week-${ww}-reflection`)||'';
  note.addEventListener('input',()=>localStorage.setItem(`gifted-week-${ww}-note`,note.value));
  reflection.addEventListener('input',()=>localStorage.setItem(`gifted-week-${ww}-reflection`,reflection.value));

  const progressKey=`gifted-week-${ww}-path`;
  let stageState=JSON.parse(localStorage.getItem(progressKey)||'[false,false,false,false]');
  const updateProgress=()=>{
    document.querySelectorAll('.stage-check').forEach(input=>{input.checked=Boolean(stageState[Number(input.dataset.stage)]);input.closest('.path-stage').classList.toggle('done',input.checked);});
    document.querySelector('#pathProgress').textContent=`闖關進度 ${stageState.filter(Boolean).length} / 4`;
    localStorage.setItem(progressKey,JSON.stringify(stageState));
  };
  document.querySelectorAll('.stage-check').forEach(input=>input.addEventListener('change',()=>{stageState[Number(input.dataset.stage)]=input.checked;updateProgress();}));
  updateProgress();

  document.querySelectorAll('.quiz-item').forEach((item,qi)=>item.addEventListener('click',event=>{
    const button=event.target.closest('[data-choice]');if(!button)return;
    const answer=extra.quiz[qi][2],choice=Number(button.dataset.choice),feedback=item.querySelector('.quiz-feedback');
    item.querySelectorAll('button').forEach(option=>{option.disabled=true;const value=Number(option.dataset.choice);option.classList.toggle('correct',value===answer);option.classList.toggle('wrong',value===choice&&choice!==answer);});
    feedback.textContent=(choice===answer?'答對了。':'再檢查一次。')+' '+extra.quiz[qi][3];feedback.classList.add('show');
  }));

  document.querySelectorAll('.copy-prompt').forEach(button=>button.onclick=async()=>{
    try{await navigator.clipboard.writeText(button.dataset.prompt);button.textContent='已複製';setTimeout(()=>button.textContent='複製',1200);}catch{button.textContent='請長按文字複製';}
  });

  const tools=document.querySelector('.tools');
  document.querySelector('.tool-toggle').onclick=()=>tools.classList.toggle('open');
  document.querySelector('.close-tools').onclick=()=>tools.classList.remove('open');
  let seconds=600,timer=null;const display=document.querySelector('.timer-display');
  const showTime=()=>{display.textContent=`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`;};
  document.querySelectorAll('[data-min]').forEach(button=>button.onclick=()=>{clearInterval(timer);timer=null;seconds=Number(button.dataset.min)*60;showTime();document.querySelector('.start-timer').textContent='開始';});
  document.querySelector('.start-timer').onclick=event=>{if(timer){clearInterval(timer);timer=null;event.target.textContent='開始';return;}event.target.textContent='暫停';timer=setInterval(()=>{seconds=Math.max(0,seconds-1);showTime();if(!seconds){clearInterval(timer);timer=null;display.textContent='時間到';event.target.textContent='開始';}},1000);};
  const challenges=[...extra.success.map(item=>'把「'+item+'」提升到更高標準。'),'找一個會讓目前規則失敗的反例。','提出兩種完全不同的解法並比較證據。','請 AI 反對你的想法，再逐點查證。','讓別人在沒有提示下操作你的作品。'];
  document.querySelector('.pick-challenge').onclick=()=>document.querySelector('.challenge').textContent=challenges[Math.floor(Math.random()*challenges.length)];

  const canvas=document.querySelector('#drawCanvas'),ctx=canvas.getContext('2d'),drawToolbar=document.querySelector('.draw-toolbar');let drawing=false,drawColor='#15383c';
  const resizeCanvas=()=>{const ratio=devicePixelRatio||1;canvas.width=Math.round(innerWidth*ratio);canvas.height=Math.round(innerHeight*ratio);canvas.style.width=innerWidth+'px';canvas.style.height=innerHeight+'px';ctx.setTransform(ratio,0,0,ratio,0,0);ctx.lineCap='round';ctx.lineJoin='round';ctx.lineWidth=4;};
  resizeCanvas();addEventListener('resize',resizeCanvas);
  const point=event=>({x:event.clientX,y:event.clientY});
  canvas.addEventListener('pointerdown',event=>{drawing=true;canvas.setPointerCapture(event.pointerId);const p=point(event);ctx.beginPath();ctx.moveTo(p.x,p.y);event.preventDefault();},{passive:false});
  canvas.addEventListener('pointermove',event=>{if(!drawing)return;const p=point(event);ctx.strokeStyle=drawColor;ctx.lineTo(p.x,p.y);ctx.stroke();event.preventDefault();},{passive:false});
  canvas.addEventListener('pointerup',()=>drawing=false);canvas.addEventListener('pointercancel',()=>drawing=false);
  const setDrawMode=enabled=>{canvas.classList.toggle('active',enabled);drawToolbar.classList.toggle('show',enabled);document.body.classList.toggle('drawing',enabled);};
  document.querySelector('.draw-toggle').onclick=()=>{tools.classList.remove('open');setDrawMode(true);};
  document.querySelector('#closeDraw').onclick=()=>setDrawMode(false);
  document.querySelector('#clearDraw').onclick=()=>ctx.clearRect(0,0,innerWidth,innerHeight);
  document.querySelectorAll('.draw-color').forEach(button=>button.onclick=()=>{drawColor=button.dataset.color;document.querySelectorAll('.draw-color').forEach(item=>item.classList.toggle('active',item===button));});

  fetch('video.mp4',{method:'HEAD'}).then(response=>{document.querySelector('.video-status').textContent=response.ok?'影片已完成，含動態繁體中文字幕。':'影片目前無法載入。';}).catch(()=>document.querySelector('.video-status').textContent='影片目前無法載入。');
})();
