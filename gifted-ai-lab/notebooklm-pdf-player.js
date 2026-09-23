// 預設讀取預先轉好的逐頁 WebP（每頁約 130 KB），只有圖片缺少時才退回 pdf.js 解析整份 PDF。
const body=document.body;
const pdfUrl=body.dataset.pdf;
const imageDir=body.dataset.images||'';
const imagePages=Number(body.dataset.pages||0);
const title=body.dataset.title||'NotebookLM 新版簡報';
const viewport=document.querySelector('#pdfViewport');
const canvas=document.querySelector('#slideCanvas');
const image=document.querySelector('#slideImage');
const loading=document.querySelector('#pdfLoading');
const counter=document.querySelector('#pdfCounter');
const progress=document.querySelector('#pdfProgress');
const previous=document.querySelector('#pdfPrevious');
const next=document.querySelector('#pdfNext');
const overviewButton=document.querySelector('#pdfOverviewButton');
const overview=document.querySelector('#pdfOverview');
const directPdf=document.querySelector('#pdfDirect');

let source;
let pageNumber=Math.max(1,Number((location.hash.match(/slide-(\d+)/)||[])[1]||1));
let touchStartX=0;
let loadingTimer;

document.title=title;
directPdf.href=pdfUrl;

// 圖片通常瞬間就出現，延遲顯示提示文字避免每次翻頁都閃一下。
function setLoading(message,delay=0){
  clearTimeout(loadingTimer);
  loadingTimer=setTimeout(()=>{loading.textContent=message;loading.hidden=false;},delay);
}
function hideLoading(){clearTimeout(loadingTimer);loading.hidden=true;}
function updateUrl(){history.replaceState(null,'',`#slide-${pageNumber}`);}
function updateControls(){
  counter.textContent=`${pageNumber} / ${source.numPages}`;
  previous.disabled=pageNumber===1;
  next.disabled=pageNumber===source.numPages;
  progress.style.width=`${pageNumber/source.numPages*100}%`;
}

const pad=number=>String(number).padStart(2,'0');
const pageUrl=number=>`${imageDir}${pad(number)}.webp`;
const thumbUrl=number=>`${imageDir}${pad(number)}-thumb.webp`;

function createImageSource(){
  const cache=new Map();
  const preload=number=>{
    if(number<1||number>imagePages)return null;
    if(!cache.has(number)){
      const img=new Image();
      img.decoding='async';
      img.src=pageUrl(number);
      cache.set(number,img.decode().then(()=>img));
    }
    return cache.get(number);
  };
  return{
    numPages:imagePages,
    async show(number,isCurrent){
      setLoading(`正在顯示第 ${number} 頁…`,150);
      await preload(number);
      if(!isCurrent())return;
      image.src=pageUrl(number);
      image.alt=`${title} 第 ${number} 頁`;
      image.hidden=false;
      hideLoading();
      // 先把前後頁載好，翻頁時就不必等待。
      [number+1,number-1,number+2].forEach(preload);
    },
    thumb(number){
      const img=new Image();
      img.loading='lazy';
      img.decoding='async';
      img.src=thumbUrl(number);
      img.alt='';
      return img;
    }
  };
}

async function createPdfSource(){
  const pdfjsLib=await import('./vendor/pdfjs/pdf.min.mjs');
  pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).toString();
  const pdfDocument=await pdfjsLib.getDocument(pdfUrl).promise;
  const context=canvas.getContext('2d',{alpha:false});
  let renderTask;
  canvas.hidden=false;
  return{
    numPages:pdfDocument.numPages,
    async show(number,isCurrent){
      if(renderTask){renderTask.cancel();renderTask=null;}
      setLoading(`正在顯示第 ${number} 頁…`);
      const page=await pdfDocument.getPage(number);
      if(!isCurrent())return;
      const sourceViewport=page.getViewport({scale:1});
      const availableWidth=Math.max(280,viewport.clientWidth-16);
      const availableHeight=Math.max(180,viewport.clientHeight-16);
      const displayScale=Math.min(availableWidth/sourceViewport.width,availableHeight/sourceViewport.height);
      const pixelRatio=Math.min(window.devicePixelRatio||1,2);
      const renderViewport=page.getViewport({scale:displayScale*pixelRatio});
      canvas.width=Math.ceil(renderViewport.width);
      canvas.height=Math.ceil(renderViewport.height);
      canvas.style.width=`${Math.ceil(sourceViewport.width*displayScale)}px`;
      canvas.style.height=`${Math.ceil(sourceViewport.height*displayScale)}px`;
      context.fillStyle='#ffffff';
      context.fillRect(0,0,canvas.width,canvas.height);
      renderTask=page.render({canvasContext:context,viewport:renderViewport});
      try{await renderTask.promise;}catch(error){if(error?.name!=='RenderingCancelledException')throw error;}
      if(isCurrent())hideLoading();
    },
    async rerender(number,isCurrent){await this.show(number,isCurrent);},
    thumb(number){
      const thumb=document.createElement('canvas');
      pdfDocument.getPage(number).then(page=>{
        const thumbViewport=page.getViewport({scale:.19});
        thumb.width=Math.ceil(thumbViewport.width);
        thumb.height=Math.ceil(thumbViewport.height);
        return page.render({canvasContext:thumb.getContext('2d',{alpha:false}),viewport:thumbViewport}).promise;
      }).catch(console.error);
      return thumb;
    }
  };
}

let showToken=0;
async function goTo(page){
  if(!source)return;
  pageNumber=Math.max(1,Math.min(source.numPages,page));
  updateUrl();
  updateControls();
  const token=++showToken;
  await source.show(pageNumber,()=>token===showToken);
}

function showOverview(){
  if(!source)return;
  overview.classList.add('show');
  overview.setAttribute('aria-hidden','false');
  const grid=overview.querySelector('.pdf-thumb-grid');
  if(!grid.childElementCount){
    for(let number=1;number<=source.numPages;number+=1){
      const button=document.createElement('button');
      button.className='pdf-thumb';
      button.type='button';
      button.dataset.page=number;
      button.setAttribute('aria-label',`跳到第 ${number} 頁`);
      button.append(source.thumb(number),Object.assign(document.createElement('span'),{textContent:`第 ${number} 頁`}));
      button.addEventListener('click',()=>{closeOverview();goTo(number);});
      grid.append(button);
    }
  }
  grid.querySelectorAll('.pdf-thumb').forEach(button=>button.classList.toggle('active',Number(button.dataset.page)===pageNumber));
}

function closeOverview(){overview.classList.remove('show');overview.setAttribute('aria-hidden','true');}
function toggleFullscreen(){
  if(document.fullscreenElement)document.exitFullscreen();
  else document.documentElement.requestFullscreen().catch(()=>{});
}

previous.addEventListener('click',()=>goTo(pageNumber-1));
next.addEventListener('click',()=>goTo(pageNumber+1));
overviewButton.addEventListener('click',()=>overview.classList.contains('show')?closeOverview():showOverview());
document.querySelector('#pdfOverviewClose').addEventListener('click',closeOverview);
document.querySelector('#pdfFullscreen').addEventListener('click',toggleFullscreen);

viewport.addEventListener('click',event=>{
  if(!source||(event.target!==canvas&&event.target!==image))return;
  goTo(event.clientX<window.innerWidth/2?pageNumber-1:pageNumber+1);
});
viewport.addEventListener('touchstart',event=>{touchStartX=event.changedTouches[0].clientX;},{passive:true});
viewport.addEventListener('touchend',event=>{
  const delta=event.changedTouches[0].clientX-touchStartX;
  if(Math.abs(delta)>45)goTo(delta<0?pageNumber+1:pageNumber-1);
},{passive:true});
addEventListener('keydown',event=>{
  if(overview.classList.contains('show')&&event.key==='Escape'){closeOverview();event.preventDefault();return;}
  if(['ArrowRight','PageDown',' '].includes(event.key)){goTo(pageNumber+1);event.preventDefault();}
  else if(['ArrowLeft','PageUp'].includes(event.key)){goTo(pageNumber-1);event.preventDefault();}
  else if(event.key==='Home'){goTo(1);event.preventDefault();}
  else if(event.key==='End'){goTo(source?.numPages||1);event.preventDefault();}
  else if(event.key.toLowerCase()==='m'){overview.classList.contains('show')?closeOverview():showOverview();event.preventDefault();}
  else if(event.key.toLowerCase()==='f'){toggleFullscreen();event.preventDefault();}
  else if(event.key==='Escape'){if(document.fullscreenElement)document.exitFullscreen();else location.href='index.html';event.preventDefault();}
});
// 圖片由 CSS 自動縮放；只有 PDF 模式需要依視窗大小重新繪製。
let resizeTimer;
addEventListener('resize',()=>{
  if(!source?.rerender)return;
  clearTimeout(resizeTimer);
  resizeTimer=setTimeout(()=>{const token=++showToken;source.rerender(pageNumber,()=>token===showToken);},120);
});

(async()=>{
  try{
    if(imageDir&&imagePages){
      source=createImageSource();
      pageNumber=Math.min(pageNumber,source.numPages);
      try{await goTo(pageNumber);return;}
      catch(error){console.warn('逐頁圖片載入失敗，改用 PDF 模式',error);image.hidden=true;source=null;}
    }
    setLoading('正在載入新版 NotebookLM 簡報…');
    source=await createPdfSource();
    pageNumber=Math.min(pageNumber,source.numPages);
    await goTo(pageNumber);
  }catch(error){
    console.error(error);
    setLoading('簡報暫時無法顯示，請使用下方 PDF 按鈕開啟。');
  }
})();
