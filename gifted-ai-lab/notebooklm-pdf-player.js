import * as pdfjsLib from './vendor/pdfjs/pdf.min.mjs';

pdfjsLib.GlobalWorkerOptions.workerSrc=new URL('./vendor/pdfjs/pdf.worker.min.mjs',import.meta.url).toString();

const body=document.body;
const pdfUrl=body.dataset.pdf;
const title=body.dataset.title||'NotebookLM 新版簡報';
const viewport=document.querySelector('#pdfViewport');
const canvas=document.querySelector('#slideCanvas');
const context=canvas.getContext('2d',{alpha:false});
const loading=document.querySelector('#pdfLoading');
const counter=document.querySelector('#pdfCounter');
const progress=document.querySelector('#pdfProgress');
const previous=document.querySelector('#pdfPrevious');
const next=document.querySelector('#pdfNext');
const overviewButton=document.querySelector('#pdfOverviewButton');
const overview=document.querySelector('#pdfOverview');
const directPdf=document.querySelector('#pdfDirect');

let pdfDocument;
let pageNumber=Math.max(1,Number((location.hash.match(/slide-(\d+)/)||[])[1]||1));
let renderToken=0;
let renderTask;
let touchStartX=0;

document.title=title;
directPdf.href=pdfUrl;

function setLoading(message){loading.textContent=message;loading.hidden=false;}
function hideLoading(){loading.hidden=true;}
function updateUrl(){history.replaceState(null,'',`#slide-${pageNumber}`);}
function updateControls(){
  counter.textContent=`${pageNumber} / ${pdfDocument.numPages}`;
  previous.disabled=pageNumber===1;
  next.disabled=pageNumber===pdfDocument.numPages;
  progress.style.width=`${pageNumber/pdfDocument.numPages*100}%`;
}

async function renderPage(){
  if(!pdfDocument)return;
  const token=++renderToken;
  if(renderTask){renderTask.cancel();renderTask=null;}
  setLoading(`正在顯示第 ${pageNumber} 頁…`);
  const page=await pdfDocument.getPage(pageNumber);
  if(token!==renderToken)return;
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
  if(token===renderToken){hideLoading();updateControls();}
}

async function goTo(page){
  if(!pdfDocument)return;
  pageNumber=Math.max(1,Math.min(pdfDocument.numPages,page));
  updateUrl();
  await renderPage();
}

async function showOverview(){
  if(!pdfDocument)return;
  overview.classList.add('show');
  overview.setAttribute('aria-hidden','false');
  const grid=overview.querySelector('.pdf-thumb-grid');
  if(grid.childElementCount)return;
  setLoading('正在準備投影片總覽…');
  for(let number=1;number<=pdfDocument.numPages;number+=1){
    const page=await pdfDocument.getPage(number);
    const thumbViewport=page.getViewport({scale:.19});
    const thumb=document.createElement('canvas');
    thumb.width=Math.ceil(thumbViewport.width);
    thumb.height=Math.ceil(thumbViewport.height);
    await page.render({canvasContext:thumb.getContext('2d',{alpha:false}),viewport:thumbViewport}).promise;
    const button=document.createElement('button');
    button.className=`pdf-thumb${number===pageNumber?' active':''}`;
    button.type='button';
    button.setAttribute('aria-label',`跳到第 ${number} 頁`);
    button.append(thumb,Object.assign(document.createElement('span'),{textContent:`第 ${number} 頁`}));
    button.addEventListener('click',async()=>{closeOverview();await goTo(number);});
    grid.append(button);
  }
  hideLoading();
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
  if(!pdfDocument||event.target!==canvas)return;
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
  else if(event.key==='End'){goTo(pdfDocument?.numPages||1);event.preventDefault();}
  else if(event.key.toLowerCase()==='m'){overview.classList.contains('show')?closeOverview():showOverview();event.preventDefault();}
  else if(event.key.toLowerCase()==='f'){toggleFullscreen();event.preventDefault();}
  else if(event.key==='Escape'){if(document.fullscreenElement)document.exitFullscreen();else location.href='index.html';event.preventDefault();}
});
let resizeTimer;
addEventListener('resize',()=>{clearTimeout(resizeTimer);resizeTimer=setTimeout(renderPage,120);});

(async()=>{
  try{
    setLoading('正在載入新版 NotebookLM 簡報…');
    pdfDocument=await pdfjsLib.getDocument(pdfUrl).promise;
    pageNumber=Math.min(pageNumber,pdfDocument.numPages);
    await goTo(pageNumber);
  }catch(error){
    console.error(error);
    setLoading('簡報暫時無法顯示，請使用下方 PDF 按鈕開啟。');
  }
})();
