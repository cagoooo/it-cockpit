(function(){
  const week=Number(document.body.dataset.week),data=(window.GIFTED_WEEKS||[]).find(item=>item.week===week),stage=document.querySelector('#stage');let index=0;
  if(!data){stage.innerHTML='<div style="color:white">找不到本週簡報資料</div>';return;}
  const ww=String(week).padStart(2,'0');
  const concepts=[['核心概念',data.concept],['今天要證明',data.goal],['完成作品',data.output]];
  const hook=data.questions[0]||'你怎麼知道？有什麼證據？';
  const checkpoint=data.questions[1]||'什麼證據會讓你改變想法？';
  const exit=data.questions[2]||'下一次你會先改善哪一件事？';
  const slides=[
    `<section class="slide cover" data-page="01 / 06"><div class="cover-copy"><div class="code">WEEK ${ww} · ${data.date} · 90 MIN</div><h1>${data.title}</h1><p class="lead">${data.goal}</p><span class="tag">黃凱揚老師｜石門國小資優班</span></div><img src="../assets/gifted-lab-cover.png" alt="資訊科技專題學習情境"></section>`,
    `<section class="slide content" data-page="02 / 06"><div><div class="rule"></div><h2>今天先想這一題</h2></div><div class="prompt"><div class="prompt-mark">?</div><q>${hook}</q></div></section>`,
    `<section class="slide content" data-page="03 / 06"><div><div class="rule"></div><h2>今天的三個重點</h2></div><div class="cards">${concepts.map(item=>`<div class="card"><b>${item[0]}</b><p>${item[1]}</p></div>`).join('')}</div></section>`,
    `<section class="slide content" data-page="04 / 06"><div><div class="rule"></div><h2>第一節｜理解與小實驗</h2></div><div class="task-grid"><div class="task"><h3>動手前先說理由</h3><ol><li>${data.student[0]}</li><li>把第一個想法留下來</li><li>遇到反例再修正</li></ol></div><div class="task"><h3>45 分鐘檢查點</h3><p class="lead">${checkpoint}</p></div></div></section>`,
    `<section class="slide content" data-page="05 / 06"><div><div class="rule"></div><h2>第二節｜製作、測試、留下版本</h2></div><div class="task-grid"><div class="task"><h3>本週任務</h3><ol>${data.student.slice(1).map(item=>`<li>${item}</li>`).join('')}<li>保留第一版與修改版</li></ol></div><div class="task"><h3>本週可見產出</h3><p class="lead">${data.output}</p></div></div></section>`,
    `<section class="slide content" data-page="06 / 06"><div><div class="rule"></div><h2>離開教室前</h2></div><div class="exit"><div class="exit-no">01</div><div><p>${exit}</p><span class="lead">把作品、測試與反思存入本週學習歷程。</span></div></div></section>`
  ];
  const render=()=>{stage.innerHTML=slides.map((slide,i)=>slide.replace('class="slide',`class="slide ${i===index?'active ':''}`)).join('');document.querySelector('#counter').textContent=`${index+1} / ${slides.length}`;document.querySelector('#progress').style.width=`${(index+1)/slides.length*100}%`};
  const move=delta=>{index=Math.max(0,Math.min(slides.length-1,index+delta));render()};
  document.querySelector('#prev').onclick=()=>move(-1);document.querySelector('#next').onclick=()=>move(1);document.querySelector('#full').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
  addEventListener('keydown',event=>{if(['ArrowRight','PageDown',' '].includes(event.key)){event.preventDefault();move(1)}if(['ArrowLeft','PageUp'].includes(event.key)){event.preventDefault();move(-1)}if(event.key.toLowerCase()==='f')document.querySelector('#full').click();if(event.key==='Escape'&&!document.fullscreenElement)location.href='index.html'});let startX=0;stage.addEventListener('touchstart',event=>startX=event.changedTouches[0].clientX,{passive:true});stage.addEventListener('touchend',event=>{const diff=event.changedTouches[0].clientX-startX;if(Math.abs(diff)>50)move(diff<0?1:-1)},{passive:true});render();
})();
