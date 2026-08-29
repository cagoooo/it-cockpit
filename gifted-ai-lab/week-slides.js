(function(){
  const week=Number(document.body.dataset.week);
  const data=(window.GIFTED_WEEKS||[]).find(item=>item.week===week);
  const extra=(window.GIFTED_ENRICHMENT||{})[week];
  const stage=document.querySelector('#stage');
  if(!data||!extra){stage.innerHTML='<div style="color:white">找不到本週簡報資料</div>';return;}

  const ww=String(week).padStart(2,'0');
  const sourceCredit=[3,6,9,12,15].includes(week)?'<small class="slide-source">部分內容依 Day of AI 教材改寫｜CC BY-NC-SA 4.0</small>':'';
  if(sourceCredit)document.head.insertAdjacentHTML('beforeend','<style>.slide-source{position:absolute;left:24px;bottom:14px;z-index:2;color:rgba(239,250,247,.76);font-size:clamp(.64rem,1vw,.82rem);font-weight:600;letter-spacing:0}.slide.content .slide-source{color:rgba(23,59,63,.68)}</style>');
  const esc=value=>String(value).replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const speaker=text=>`<aside class="speaker"><b>阿凱老師</b>${esc(text)}</aside>`;
  const pathCards=extra.path.map((item,i)=>`<div class="map-card"><span>0${i+1}</span><b>${esc(item[0])}</b><small>${esc(item[2])}</small></div>`).join('');
  const conceptCards=extra.concepts.map(item=>`<div class="card"><b>${esc(item[0])}</b><p>${esc(item[1])}</p></div>`).join('');
  const quiz=extra.quiz[0];
  const slides=[
    {title:'課程開場',html:`<section class="slide cover"><div class="cover-copy"><div class="code">WEEK ${ww} · ${esc(data.date)} · 90 MIN</div><h1>${esc(data.title)}</h1><p class="lead">${esc(data.goal)}</p><span class="tag">黃凱揚老師｜桃園市龍潭區石門國民小學</span></div><img src="../assets/gifted-lab-cover.webp" alt="資訊科技專題學習情境">${speaker('今天不只要完成任務，更要留下能支持想法的證據。')}</section>`},
    {title:'驅動問題',html:`<section class="slide content"><div><div class="rule"></div><h2>今天要破解的問題</h2></div><div class="prompt"><div class="prompt-mark">?</div><q>${esc(extra.drivingQuestion)}</q></div>${speaker('先聽學生原本怎麼想，這一頁不要急著公布答案。')}</section>`},
    {title:'闖關地圖',html:`<section class="slide content"><div><div class="rule"></div><h2>四段闖關地圖</h2></div><div class="map-grid">${pathCards}</div>${speaker('每一關都問：我們留下了什麼看得到的結果？')}</section>`},
    {title:'三個重點',html:`<section class="slide content"><div><div class="rule"></div><h2>三個重要想法</h2></div><div class="cards">${conceptCards}</div>${speaker('不要只讀文字，請學生各找一個生活例子。')}</section>`},
    {title:'想法偵探',html:`<section class="slide content myth-slide"><div><div class="rule"></div><h2>想法偵探</h2></div><blockquote>「${esc(extra.misconception[0])}」</blockquote><div class="myth-pair"><div><b>先想清楚</b><p>${esc(extra.misconception[1])}</p></div><div><b>動手試試看</b><p>${esc(extra.misconception[2])}</p></div></div>${speaker('先說原本怎麼想，再用測試看看要不要改變。')}</section>`},
    {title:extra.path[0][0],html:`<section class="slide content"><div><div class="rule"></div><h2>第一關｜${esc(extra.path[0][0])}</h2></div><div class="task-grid"><div class="task"><h3>探究任務</h3><p class="lead">${esc(extra.path[0][1])}</p></div><div class="task evidence"><h3>要留下的證據</h3><p>${esc(extra.path[0][2])}</p></div></div>${speaker('只提供第一階提示，讓學生自己說出觀察到的事實。')}</section>`},
    {title:'小挑戰',html:`<section class="slide content"><div><div class="rule"></div><h2>想一想再回答</h2></div><div class="slide-quiz"><h3>${esc(quiz[0])}</h3>${quiz[1].map((option,i)=>`<div><span>${String.fromCharCode(65+i)}</span>${esc(option)}</div>`).join('')}</div>${speaker('先請學生選擇並說理由，不要只問答案。')}</section>`},
    {title:extra.path[1][0],html:`<section class="slide content"><div><div class="rule"></div><h2>第二關｜${esc(extra.path[1][0])}</h2></div><div class="mission-line"><span>任務</span><strong>${esc(extra.path[1][1])}</strong></div><div class="mission-line evidence"><span>證據</span><strong>${esc(extra.path[1][2])}</strong></div>${speaker('把學生第一版留在旁邊，讓修正前後可以被比較。')}</section>`},
    {title:extra.path[2][0],html:`<section class="slide content"><div><div class="rule"></div><h2>第三關｜${esc(extra.path[2][0])}</h2></div><div class="mission-line"><span>任務</span><strong>${esc(extra.path[2][1])}</strong></div><div class="mission-line evidence"><span>證據</span><strong>${esc(extra.path[2][2])}</strong></div>${speaker('這一關刻意加入反例、限制或錯誤輸入，觀察想法能不能撐住。')}</section>`},
    {title:extra.path[3][0],html:`<section class="slide content"><div><div class="rule"></div><h2>第四關｜${esc(extra.path[3][0])}</h2></div><div class="mission-line"><span>任務</span><strong>${esc(extra.path[3][1])}</strong></div><div class="mission-line evidence"><span>證據</span><strong>${esc(extra.path[3][2])}</strong></div>${speaker('最後不是把作品收起來，而是說出證據、限制與下一步。')}</section>`},
    {title:'成功條件',html:`<section class="slide content"><div><div class="rule"></div><h2>完成前的四項檢查</h2></div><div class="success-grid">${extra.success.map((item,i)=>`<div><span>0${i+1}</span><b>${esc(item)}</b></div>`).join('')}</div>${speaker('讓學生選一項最有把握、一項還要補證據的條件。')}</section>`},
    {title:'離堂反思',html:`<section class="slide content"><div><div class="rule"></div><h2>離開教室前</h2></div><div class="exit"><div class="exit-no">01</div><div><p>${esc(data.questions[2]||'今天哪一項證據最有力？')}</p><span class="lead">我原本以為＿＿；現在我發現＿＿；我的證據是＿＿。</span></div></div>${speaker('請把作品、測試、版本與一句反思一起存入本週學習歷程。')}</section>`}
  ];

  let index=Math.max(0,Math.min(slides.length-1,Number((location.hash.match(/slide-(\d+)/)||[])[1]||1)-1));
  let overviewOpen=false,speakerHidden=false;
  const overview=document.querySelector('#overview');
  const renderOverview=()=>{overview.innerHTML=`<div class="overview-head"><div><b>W${ww} 章節總覽</b><span>點選任一頁直接跳轉</span></div><button id="closeOverview" aria-label="關閉總覽">×</button></div><div class="overview-grid">${slides.map((slide,i)=>`<button data-jump="${i}" class="${i===index?'active':''}"><span>${String(i+1).padStart(2,'0')}</span><b>${esc(slide.title)}</b><small>${i===0?data.title:(i===slides.length-1?'證據、限制與下一步':extra.path[Math.min(3,Math.max(0,i-5))]?.[0]||'核心概念')}</small></button>`).join('')}</div>`;overview.querySelector('#closeOverview').onclick=closeOverview;overview.querySelectorAll('[data-jump]').forEach(button=>button.onclick=()=>{index=Number(button.dataset.jump);closeOverview();render();});};
  const openOverview=()=>{overviewOpen=true;overview.classList.add('show');overview.setAttribute('aria-hidden','false');renderOverview();};
  function closeOverview(){overviewOpen=false;overview.classList.remove('show');overview.setAttribute('aria-hidden','true');}
  const render=()=>{stage.innerHTML=slides.map((slide,i)=>slide.html.replace('</section>',`${sourceCredit}</section>`).replace('class="slide',`class="slide ${i===index?'active ':''}`).replace('<section class="slide ',`<section data-page="${String(i+1).padStart(2,'0')} / ${slides.length}" class="slide `)).join('');document.querySelector('#counter').textContent=`${index+1} / ${slides.length}`;document.querySelector('#progress').style.width=`${(index+1)/slides.length*100}%`;document.body.classList.toggle('speaker-hidden',speakerHidden);history.replaceState(null,'',`#slide-${index+1}`);if(overviewOpen)renderOverview();};
  const move=delta=>{index=Math.max(0,Math.min(slides.length-1,index+delta));render();};
  document.querySelector('#prev').onclick=()=>move(-1);document.querySelector('#next').onclick=()=>move(1);document.querySelector('#overviewButton').onclick=()=>overviewOpen?closeOverview():openOverview();
  document.querySelector('#full').onclick=()=>document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();
  addEventListener('keydown',event=>{
    const key=event.key;
    if(overviewOpen&&key==='Escape'){closeOverview();event.preventDefault();return;}
    if(['ArrowRight','PageDown',' '].includes(key)){event.preventDefault();move(1);}
    else if(['ArrowLeft','PageUp'].includes(key)){event.preventDefault();move(-1);}
    else if(key==='Home'){index=0;render();event.preventDefault();}
    else if(key==='End'){index=slides.length-1;render();event.preventDefault();}
    else if(key.toLowerCase()==='m'){overviewOpen?closeOverview():openOverview();event.preventDefault();}
    else if(key.toLowerCase()==='f'){document.querySelector('#full').click();event.preventDefault();}
    else if(key.toLowerCase()==='s'){speakerHidden=!speakerHidden;render();event.preventDefault();}
    else if(/^[1-9]$/.test(key)){index=Math.min(slides.length-1,Number(key)-1);render();event.preventDefault();}
    else if(key==='Escape'){if(document.fullscreenElement){document.exitFullscreen();}else{location.href='index.html';}event.preventDefault();}
  });
  let startX=0;stage.addEventListener('touchstart',event=>startX=event.changedTouches[0].clientX,{passive:true});stage.addEventListener('touchend',event=>{const diff=event.changedTouches[0].clientX-startX;if(Math.abs(diff)>50)move(diff<0?1:-1);},{passive:true});
  render();
})();
