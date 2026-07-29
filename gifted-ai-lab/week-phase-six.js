(function(){
  const week=Number(document.body.dataset.week);
  if(!week)return;
  const code=String(week).padStart(2,'0');
  const esc=value=>String(value??'').replace(/[&<>"']/g,char=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
  const feedbackKey=`gifted-week-${code}-understanding-v1`;
  const rubricKey=`gifted-week-${code}-rubric-v1`;
  const labels={understood:'我看懂了',example:'我需要一個例子',word:'有一個詞不懂'};
  const dimensions=[
    ['fluency','想出多種點子','能提出一個以上的想法，不只停在第一個答案。'],
    ['flexibility','換不同方法','能改變角度、工具或做法，再試一次。'],
    ['originality','提出自己的新點子','作品或解法有自己的選擇，不只是照著範例。'],
    ['elaboration','把作品改得更完整','會根據回饋補細節、修正並保留版本。'],
    ['evidence','用證據說明','會用觀察、資料或測試結果支持判斷。'],
    ['debugging','找錯並重試','能找到第一個不一樣的地方，一次修改一項後重測。'],
    ['safety','安全負責使用 AI','不輸入私人資料，會查證並說明 AI 幫了什麼。'],
    ['expression','清楚分享與反思','能說明做了什麼、為何修改及下一步。']
  ];
  const read=(key,fallback)=>{try{return{...fallback,...JSON.parse(localStorage.getItem(key)||'{}')}}catch{return fallback}};
  let feedback=read(feedbackKey,{level:'',confusing:'',checks:[false,false,false],observation:'',updatedAt:''});
  let rubric=read(rubricKey,{scores:{},evidence:'',confirmed:false,updatedAt:''});
  const save=(key,value)=>{value.updatedAt=new Date().toISOString();localStorage.setItem(key,JSON.stringify(value));};

  const student=document.querySelector('#student .student-reflection')?.closest('.section');
  if(student)student.insertAdjacentHTML('beforebegin',`<section class="section understanding-panel"><div class="section-head"><span>告訴老師哪裡要再說明</span><h2>這一段我懂了嗎？</h2></div><div class="understanding-buttons" role="group" aria-label="選擇理解情形">${Object.entries(labels).map(([key,label])=>`<button type="button" data-understanding="${key}">${label}</button>`).join('')}</div><textarea class="understanding-note" id="understandingNote" placeholder="哪一句、哪個詞或哪個步驟讓你停下來？不需要填姓名。"></textarea><small class="privacy-note">回饋只保存在這台裝置，目的是幫老師把教材說得更清楚。</small></section>`);

  const teacher=document.querySelector('#teacher .summary');
  if(teacher)teacher.insertAdjacentHTML('afterend',`<section class="section"><div class="section-head"><span>學生實際試用證據</span><h2>好懂度校準</h2></div><div class="calibration-grid"><div class="calibration-status"><span>學生目前回饋</span><strong id="understandingStatus">尚未回饋</strong><small id="understandingUpdated">等待學生操作</small></div><div><div class="calibration-checks">${['能用自己的話說出本週目標。','不需額外解釋就能開始第一個任務。','能解釋難詞小幫手中的三個詞。'].map((text,index)=>`<label><input type="checkbox" data-calibration-check="${index}"><span>${text}</span></label>`).join('')}</div><textarea class="understanding-note" id="calibrationObservation" placeholder="只記錄停頓、求助、說明或操作證據，不填姓名。"></textarea><div class="phase-actions"><button type="button" id="exportWeekEvidence">匯出本週匿名紀錄</button></div></div></div></section>`);

  const assessment=document.querySelector('#assessment');
  if(assessment)assessment.insertAdjacentHTML('beforeend',`<section class="section"><div class="section-head"><span>由老師看作品與過程</span><h2>本週數位評量量規</h2></div><div class="rubric-editor">${dimensions.map(([key,title,help])=>`<article class="rubric-row" data-rubric="${key}"><div><h3>${title}</h3><p>${help}</p></div><div class="rubric-levels">${[1,2,3,4].map(level=>`<button type="button" data-score="${level}">${level}｜${['需要引導','正在做到','能獨立完成','能延伸挑戰'][level-1]}</button>`).join('')}</div></article>`).join('')}</div><textarea class="rubric-note" id="rubricEvidence" placeholder="寫下作品、測試、口頭說明或修改版本中的具體證據。"></textarea><label class="rubric-confirm"><input type="checkbox" id="rubricConfirmed"><span><b>教師已確認本週評量</b><br>分數由教師依可見證據決定，不交給 AI 自動評分。</span></label></section>`);

  const mediaLinks=document.querySelector('#media .depth-resource-list');
  if(mediaLinks)mediaLinks.insertAdjacentHTML('afterbegin',`<a class="resource" href="student-warmup.md"><b>課前暖身小故事 →</b><span>先猜一猜，再用三個問題開始今天的課</span></a><a class="resource" href="student-review.md"><b>課後一分鐘複習 →</b><span>重點、難詞與一句話反思</span></a>`);

  function renderFeedback(){
    document.querySelectorAll('[data-understanding]').forEach(button=>button.classList.toggle('active',button.dataset.understanding===feedback.level));
    const note=document.querySelector('#understandingNote');if(note)note.value=feedback.confusing||'';
    const status=document.querySelector('#understandingStatus');if(status)status.textContent=labels[feedback.level]||'尚未回饋';
    const updated=document.querySelector('#understandingUpdated');if(updated)updated.textContent=feedback.updatedAt?`最後更新：${new Date(feedback.updatedAt).toLocaleString('zh-TW')}`:'等待學生操作';
    document.querySelectorAll('[data-calibration-check]').forEach(input=>input.checked=Boolean(feedback.checks[Number(input.dataset.calibrationCheck)]));
    const observation=document.querySelector('#calibrationObservation');if(observation)observation.value=feedback.observation||'';
  }
  function renderRubric(){
    document.querySelectorAll('[data-rubric]').forEach(row=>row.querySelectorAll('[data-score]').forEach(button=>button.classList.toggle('active',Number(button.dataset.score)===Number(rubric.scores[row.dataset.rubric]))));
    const evidence=document.querySelector('#rubricEvidence');if(evidence)evidence.value=rubric.evidence||'';
    const confirmed=document.querySelector('#rubricConfirmed');if(confirmed)confirmed.checked=Boolean(rubric.confirmed);
  }
  document.addEventListener('click',event=>{
    const understanding=event.target.closest('[data-understanding]');if(understanding){feedback.level=understanding.dataset.understanding;save(feedbackKey,feedback);renderFeedback();}
    const score=event.target.closest('[data-score]');if(score){const row=score.closest('[data-rubric]');rubric.scores[row.dataset.rubric]=Number(score.dataset.score);rubric.confirmed=false;save(rubricKey,rubric);renderRubric();}
  });
  document.querySelector('#understandingNote')?.addEventListener('input',event=>{feedback.confusing=event.target.value;save(feedbackKey,feedback);renderFeedback();});
  document.querySelectorAll('[data-calibration-check]').forEach(input=>input.addEventListener('change',()=>{feedback.checks[Number(input.dataset.calibrationCheck)]=input.checked;save(feedbackKey,feedback);renderFeedback();}));
  document.querySelector('#calibrationObservation')?.addEventListener('input',event=>{feedback.observation=event.target.value;save(feedbackKey,feedback);renderFeedback();});
  document.querySelector('#rubricEvidence')?.addEventListener('input',event=>{rubric.evidence=event.target.value;rubric.confirmed=false;save(rubricKey,rubric);});
  document.querySelector('#rubricConfirmed')?.addEventListener('change',event=>{rubric.confirmed=event.target.checked;save(rubricKey,rubric);});
  document.querySelector('#exportWeekEvidence')?.addEventListener('click',()=>{
    const blob=new Blob([JSON.stringify({week,exportedAt:new Date().toISOString(),understanding:feedback,rubric},null,2)],{type:'application/json'});const link=document.createElement('a');link.href=URL.createObjectURL(blob);link.download=`W${code}-anonymous-learning-evidence.json`;link.click();URL.revokeObjectURL(link.href);
  });
  renderFeedback();renderRubric();
})();
