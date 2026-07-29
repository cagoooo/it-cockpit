(function () {
  const actions = document.querySelector('.actions');
  if (!actions || !document.body.dataset.week) return;
  const week = String(Number(document.body.dataset.week)).padStart(2, '0');
  const config = {
    projectId: 'teacher-c571b',
    appId: '1:82691545657:web:ad62b41bea668909958be8',
    storageBucket: 'teacher-c571b.firebasestorage.app',
    apiKey: 'AIzaSyDT1mqP5T18zxlzMfs-IIkKxr0iMUVcDII',
    authDomain: 'teacher-c571b.firebaseapp.com',
    messagingSenderId: '82691545657',
  };
  const metaKey = 'gifted-teacher-sync-v1';
  const allowedKeys = [
    /^gifted-week-\d{2}-note$/,
    /^gifted-week-\d{2}-understanding-v1$/,
    /^gifted-week-\d{2}-rubric-v1$/,
    /^gifted-week-\d{2}-safety$/,
    /^gifted-pack-\d{2}$/,
  ];
  const isAllowed = (key) => allowedKeys.some((pattern) => pattern.test(key));
  let meta = { syncKey: '', deviceLabel: '', lastRemoteAt: 0, dirty: false };
  try { meta = { ...meta, ...JSON.parse(localStorage.getItem(metaKey) || '{}') }; } catch {}
  const saveMeta = () => localStorage.setItem(metaKey, JSON.stringify(meta));
  const esc = (value) => String(value).replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));

  actions.insertAdjacentHTML('afterbegin', '<button class="action teacher-sync-launch" type="button" data-sync-open>教師備忘同步</button>');
  document.body.insertAdjacentHTML('beforeend', `
    <dialog class="teacher-sync-dialog" aria-labelledby="teacherSyncTitle">
      <header class="teacher-sync__head"><div><span class="gifted-status" data-sync-status data-state="warn">尚未連線</span><h2 id="teacherSyncTitle">教師備忘跨裝置同步</h2></div><button type="button" data-sync-close aria-label="關閉">關閉</button></header>
      <div class="teacher-sync__body">
        <section><h3>1. 使用同一把教師同步金鑰</h3><p>第一次請按「建立新金鑰」。換到教室 iPad 或家中電腦時，輸入同一組金鑰即可。金鑰只保存在您的裝置，網站管理者也看不到。</p><div class="sync-key-row"><input data-sync-key value="${esc(meta.syncKey)}" autocomplete="off" spellcheck="false" aria-label="教師同步金鑰" placeholder="例如 8A21F1C4-..."><button type="button" data-copy-key>複製</button></div><div class="sync-actions"><button class="primary" type="button" data-create-key>建立新金鑰</button><button type="button" data-connect>連接這組金鑰</button><button type="button" data-forget>中斷並忘記金鑰</button></div></section>
        <section><h3>2. 這台裝置</h3><label>裝置名稱 <input data-device-label value="${esc(meta.deviceLabel)}" maxlength="40" placeholder="例如：教室 iPad"></label><p class="sync-details" data-sync-details>尚未讀取雲端資料。</p><div class="sync-actions"><button class="primary" type="button" data-upload disabled>上傳這台的備忘</button><button type="button" data-download disabled>下載雲端備忘</button><button type="button" data-export>匯出備份檔</button></div></section>
        <section><h3>同步範圍與安全</h3><p>同步教師課後備忘、理解觀察、評量、AI 安全檢核與一鍵上課包紀錄。學生反思、圖片語音回答、姓名、照片與作品不會上傳。請勿在教師備忘中輸入可辨識學生身分的資料。</p></section>
      </div>
    </dialog>`);

  const dialog = document.querySelector('.teacher-sync-dialog');
  const status = dialog.querySelector('[data-sync-status]');
  const details = dialog.querySelector('[data-sync-details]');
  const keyInput = dialog.querySelector('[data-sync-key]');
  const deviceInput = dialog.querySelector('[data-device-label]');
  const uploadButton = dialog.querySelector('[data-upload]');
  const downloadButton = dialog.querySelector('[data-download]');
  let cloud = null;
  let api = null;
  let ref = null;
  let unsubscribe = null;
  let uploadTimer = 0;

  function setStatus(state, text, detail) {
    status.dataset.state = state; status.textContent = text;
    if (detail) details.textContent = detail;
  }
  function normalizeKey(value) { return value.toUpperCase().replace(/[^A-F0-9]/g, ''); }
  function displayKey(value) { return normalizeKey(value).match(/.{1,8}/g)?.join('-') || ''; }
  function createKey() { const bytes = crypto.getRandomValues(new Uint8Array(16)); return [...bytes].map((byte) => byte.toString(16).padStart(2, '0')).join('').toUpperCase(); }
  async function digest(value) { const bytes = new TextEncoder().encode(normalizeKey(value)); const hash = await crypto.subtle.digest('SHA-256', bytes); return [...new Uint8Array(hash)].map((byte) => byte.toString(16).padStart(2, '0')).join(''); }
  function snapshotLocal() { const snapshot = {}; for (let index = 0; index < localStorage.length; index += 1) { const key = localStorage.key(index); if (key && isAllowed(key)) snapshot[key] = localStorage.getItem(key); } return snapshot; }
  function applySnapshot(snapshot) {
    Object.entries(snapshot || {}).forEach(([key, value]) => { if (isAllowed(key) && typeof value === 'string') localStorage.setItem(key, value); });
    const note = document.querySelector('#teacher .teacher-note');
    if (note) note.value = localStorage.getItem(`gifted-week-${week}-note`) || '';
    meta.dirty = false; saveMeta();
  }
  function formatTime(value) { if (!value) return '尚未同步'; return new Intl.DateTimeFormat('zh-TW', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value)); }

  async function loadFirebase() {
    if (api) return api;
    const [appModule, authModule, firestoreModule] = await Promise.all([
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js'),
      import('https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js'),
    ]);
    const app = appModule.initializeApp(config, 'gifted-teacher-sync');
    const auth = authModule.getAuth(app);
    await authModule.signInAnonymously(auth);
    const db = firestoreModule.getFirestore(app);
    api = { db, ...firestoreModule };
    return api;
  }

  async function connect() {
    const normalized = normalizeKey(keyInput.value);
    if (normalized.length !== 32) { setStatus('error', '金鑰格式不正確', '同步金鑰必須包含 32 個英文字母或數字。'); return; }
    setStatus('checking', '正在安全連線', '第一次連線可能需要幾秒鐘。');
    try {
      const firebase = await loadFirebase();
      const id = await digest(normalized);
      ref = firebase.doc(firebase.db, 'giftedTeacherSync', id);
      meta.syncKey = displayKey(normalized); meta.deviceLabel = deviceInput.value.trim() || `裝置 ${week}`; saveMeta(); keyInput.value = meta.syncKey; deviceInput.value = meta.deviceLabel;
      const existing = await firebase.getDoc(ref);
      cloud = existing.exists() ? existing.data() : null;
      uploadButton.disabled = false; downloadButton.disabled = !cloud;
      if (cloud) setStatus('ok', '已連接雲端備忘', `雲端最後更新：${formatTime(cloud.clientUpdatedAt)}，來自 ${cloud.deviceLabel || '另一台裝置'}。請選擇下載或上傳。`);
      else { setStatus('ok', '已建立同步空間', '目前沒有雲端備忘，正在上傳這台裝置的教師紀錄。'); await upload(false); }
      unsubscribe?.();
      unsubscribe = firebase.onSnapshot(ref, (document) => {
        if (!document.exists()) return;
        const incoming = document.data();
        if (incoming.clientUpdatedAt <= meta.lastRemoteAt) return;
        cloud = incoming; downloadButton.disabled = false;
        if (meta.dirty) setStatus('warn', '發現另一台裝置的新版本', `雲端於 ${formatTime(incoming.clientUpdatedAt)} 更新；請先下載，或確認後上傳這台版本。`);
        else if (meta.lastRemoteAt) { applySnapshot(incoming.snapshot); meta.lastRemoteAt = incoming.clientUpdatedAt; saveMeta(); setStatus('ok', '已自動收到新備忘', `已套用 ${incoming.deviceLabel || '另一台裝置'} 於 ${formatTime(incoming.clientUpdatedAt)} 的更新。`); }
      }, () => setStatus('error', '同步暫時中斷', '請檢查網路後重新連接。'));
    } catch (error) { setStatus('error', '無法連接同步服務', navigator.onLine ? '請稍後再試；本機備忘仍會照常保存。' : '目前離線；連上 Wi-Fi 後再試。'); console.error('[gifted sync]', error); }
  }

  async function upload(confirmConflict = true) {
    if (!ref || !api) return;
    if (confirmConflict && cloud?.clientUpdatedAt > meta.lastRemoteAt && !confirm('雲端有較新的備忘。確定要用這台裝置的內容覆蓋嗎？')) return;
    const now = Date.now();
    setStatus('checking', '正在上傳', '教師備忘正在安全同步。');
    try {
      await api.setDoc(ref, { source: 'gifted-ai-lab', schemaVersion: 1, snapshot: snapshotLocal(), deviceLabel: deviceInput.value.trim() || '未命名裝置', clientUpdatedAt: now, updatedAt: api.serverTimestamp() });
      meta.lastRemoteAt = now; meta.dirty = false; meta.deviceLabel = deviceInput.value.trim() || '未命名裝置'; saveMeta();
      setStatus('ok', '已同步', `${meta.deviceLabel} 於 ${formatTime(now)} 完成上傳。`);
    } catch (error) { setStatus('error', '上傳失敗', '本機內容沒有遺失，請檢查網路後再按一次上傳。'); console.error('[gifted sync upload]', error); }
  }
  function download() {
    if (!cloud?.snapshot) return;
    if (meta.dirty && !confirm('下載會以雲端備忘更新這台裝置。確定繼續嗎？')) return;
    applySnapshot(cloud.snapshot); meta.lastRemoteAt = cloud.clientUpdatedAt || Date.now(); saveMeta();
    setStatus('ok', '已下載雲端備忘', `已套用 ${cloud.deviceLabel || '另一台裝置'} 的版本；其他已開啟的週次重新整理後會更新。`);
  }
  function scheduleUpload() { if (!ref) return; meta.dirty = true; saveMeta(); clearTimeout(uploadTimer); uploadTimer = setTimeout(() => upload(false), 1800); setStatus('checking', '等待自動同步', '停止輸入後會自動上傳。'); }

  document.querySelector('[data-sync-open]').addEventListener('click', () => dialog.showModal());
  dialog.querySelector('[data-sync-close]').addEventListener('click', () => dialog.close());
  dialog.querySelector('[data-create-key]').addEventListener('click', () => { keyInput.value = displayKey(createKey()); setStatus('warn', '新金鑰尚未連接', '請先保存這組金鑰，再按「連接這組金鑰」。'); });
  dialog.querySelector('[data-copy-key]').addEventListener('click', async () => { await navigator.clipboard.writeText(keyInput.value); setStatus('ok', '金鑰已複製', '請把金鑰保存在教師自己的密碼管理工具，不要公開分享。'); });
  dialog.querySelector('[data-connect]').addEventListener('click', connect);
  dialog.querySelector('[data-upload]').addEventListener('click', () => upload(true));
  dialog.querySelector('[data-download]').addEventListener('click', download);
  dialog.querySelector('[data-forget]').addEventListener('click', () => { if (!confirm('確定中斷同步並從這台裝置忘記金鑰？本機備忘不會刪除。')) return; unsubscribe?.(); ref = null; cloud = null; meta = { syncKey: '', deviceLabel: meta.deviceLabel, lastRemoteAt: 0, dirty: false }; saveMeta(); keyInput.value = ''; uploadButton.disabled = true; downloadButton.disabled = true; setStatus('warn', '已中斷同步', '本機教師備忘仍保留在這台裝置。'); });
  dialog.querySelector('[data-export]').addEventListener('click', () => { const blob = new Blob([JSON.stringify({ exportedAt: new Date().toISOString(), snapshot: snapshotLocal() }, null, 2)], { type: 'application/json' }); const link = document.createElement('a'); link.href = URL.createObjectURL(blob); link.download = `gifted-teacher-notes-${new Date().toISOString().slice(0, 10)}.json`; link.click(); URL.revokeObjectURL(link.href); });
  deviceInput.addEventListener('change', () => { meta.deviceLabel = deviceInput.value.trim(); saveMeta(); });
  document.addEventListener('input', (event) => { if (event.target.matches('#teacher .teacher-note,[data-understanding-note],[data-rubric-evidence],[data-ai-log]')) scheduleUpload(); }, true);
  document.addEventListener('change', (event) => { if (event.target.matches('[data-understanding],[data-rubric],[data-safety-check],[data-publish-approval]')) scheduleUpload(); }, true);
  if (meta.syncKey) connect();
})();
