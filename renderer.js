const $ = (id) => document.getElementById(id);

const urlInput = $('url');
const urlCount = $('urlCount');
const urlLabel = $('urlLabel');
const pasteBtn = $('paste');
const downloadBtn = $('download');
const cancelBtn = $('cancel');
const progressCard = $('progressCard');
const progressLabel = $('progressLabel');
const progressBar = $('progressBar');
const metaPct = $('metaPct');
const metaSize = $('metaSize');
const metaSpeed = $('metaSpeed');
const metaEta = $('metaEta');
const queueList = $('queueList');
const resultCard = $('resultCard');
const resultTitle = $('resultTitle');
const resultPath = $('resultPath');
const errorCard = $('errorCard');
const errorText = $('errorText');
const folderBtn = $('folderBtn');
const saveDirEl = $('saveDir');
const revealBtn = $('reveal');
const againBtn = $('again');

let format = 'auto';
let lastFile = null;
let downloading = false;
let cancelAll = false;

function parseUrls(text) {
  return text
    .split(/\r?\n/)
    .map((s) => s.trim())
    .filter((s) => /^https?:\/\/\S+/i.test(s));
}

const LINE_HEIGHT = 22;
const PADDING_Y = 8;
const MIN_LINES = 1;
const MAX_LINES = 6;

function autoSizeTextarea() {
  const lines = Math.max(MIN_LINES, urlInput.value.split('\n').length);
  const visible = Math.min(lines, MAX_LINES);
  urlInput.style.height = `${visible * LINE_HEIGHT + PADDING_Y}px`;
  urlInput.classList.toggle('scrollable', lines > MAX_LINES);
}

function refreshCount() {
  const n = parseUrls(urlInput.value).length;
  const lineCount = urlInput.value.split('\n').filter((l) => l.trim()).length;
  urlCount.textContent = n;
  urlCount.classList.toggle('has-items', n > 0);
  urlLabel.textContent = lineCount > 1 || urlInput.value.includes('\n') ? 'urls — one per line' : 'url';
  downloadBtn.textContent = n > 1 ? `Download ${n}` : 'Download';
}

urlInput.addEventListener('input', () => {
  autoSizeTextarea();
  refreshCount();
});

document.querySelectorAll('.chip').forEach((chip) => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip').forEach((c) => {
      c.classList.remove('active');
      c.setAttribute('aria-selected', 'false');
    });
    chip.classList.add('active');
    chip.setAttribute('aria-selected', 'true');
    format = chip.dataset.format;
  });
});

pasteBtn.addEventListener('click', async () => {
  try {
    const t = await navigator.clipboard.readText();
    if (t) {
      urlInput.value = urlInput.value
        ? urlInput.value.replace(/\s+$/, '') + '\n' + t.trim()
        : t.trim();
      autoSizeTextarea();
      refreshCount();
      urlInput.focus();
    }
  } catch {}
});

urlInput.addEventListener('keydown', (e) => {
  if (e.key !== 'Enter' || downloading) return;
  if (e.metaKey || e.ctrlKey) {
    e.preventDefault();
    downloadBtn.click();
    return;
  }
  // Plain Enter on a single-line, valid URL → download immediately.
  if (!e.shiftKey && !urlInput.value.includes('\n') && /^https?:\/\/\S+$/i.test(urlInput.value.trim())) {
    e.preventDefault();
    downloadBtn.click();
  }
});

function showOnly(card) {
  [progressCard, resultCard, errorCard].forEach((c) => c.classList.add('hidden'));
  if (card) card.classList.remove('hidden');
}

function setDownloading(on, label) {
  downloading = on;
  downloadBtn.disabled = on;
  if (on) downloadBtn.textContent = label || 'Downloading…';
  else refreshCount();
}

function resetProgress() {
  progressBar.style.width = '0%';
  metaPct.textContent = '0%';
  metaSize.textContent = '— / —';
  metaSpeed.textContent = '—';
  metaEta.textContent = 'eta —';
}

window.api.onProgress((d) => {
  const pct = (d.percent || '').replace('%', '').trim();
  const num = parseFloat(pct);
  if (!isNaN(num)) progressBar.style.width = `${Math.min(100, num)}%`;
  metaPct.textContent = d.percent || '—';
  metaSize.textContent = `${d.downloaded || '—'} / ${d.total || '—'}`;
  metaSpeed.textContent = d.speed || '—';
  metaEta.textContent = d.eta ? `eta ${d.eta}` : 'eta —';
});

function shortenUrl(u) {
  try {
    const x = new URL(u);
    return x.hostname.replace(/^www\./, '') + x.pathname + (x.search ? '?…' : '');
  } catch { return u; }
}

function renderQueue(items, activeIdx) {
  if (items.length <= 1) { queueList.innerHTML = ''; return; }
  queueList.innerHTML = items.map((it, i) => {
    let cls = 'pending';
    let icon = '·';
    if (it.status === 'done') { cls = 'done'; icon = '✓'; }
    else if (it.status === 'failed') { cls = 'failed'; icon = '✕'; }
    else if (i === activeIdx) { cls = 'active'; icon = '▸'; }
    return `<div class="queue-item ${cls}"><span class="q-status">${icon}</span><span class="q-url" title="${it.url}">${shortenUrl(it.url)}</span></div>`;
  }).join('');
}

downloadBtn.addEventListener('click', async () => {
  const urls = parseUrls(urlInput.value);
  if (!urls.length) {
    errorText.textContent = 'Paste at least one URL.';
    showOnly(errorCard);
    urlInput.focus();
    return;
  }

  cancelAll = false;
  const items = urls.map((u) => ({ url: u, status: 'pending', file: null, error: null }));
  let okCount = 0, failCount = 0;

  showOnly(progressCard);

  for (let i = 0; i < items.length; i++) {
    if (cancelAll) { items[i].status = 'failed'; items[i].error = 'Cancelled'; failCount++; continue; }
    items[i].status = 'active';
    progressLabel.textContent = items.length > 1
      ? `Downloading ${i + 1} / ${items.length}`
      : 'Downloading';
    setDownloading(true, items.length > 1 ? `Downloading ${i + 1}/${items.length}…` : 'Downloading…');
    resetProgress();
    renderQueue(items, i);

    const r = await window.api.startDownload({ url: items[i].url, format });
    if (r.ok) {
      items[i].status = 'done';
      items[i].file = r.file || null;
      lastFile = r.file || lastFile;
      okCount++;
    } else {
      items[i].status = 'failed';
      items[i].error = r.error || 'Failed';
      failCount++;
      if (/Cancelled/i.test(r.error || '')) cancelAll = true;
    }
    renderQueue(items, -1);
  }

  setDownloading(false);

  if (items.length === 1) {
    const it = items[0];
    if (it.status === 'done') {
      resultTitle.textContent = 'Saved';
      resultPath.textContent = it.file || '';
      showOnly(resultCard);
    } else {
      errorText.textContent = it.error || 'Failed.';
      showOnly(errorCard);
    }
  } else {
    if (failCount === 0) {
      resultTitle.textContent = `Saved ${okCount} files`;
      resultPath.textContent = saveDirEl.dataset.path || '';
      lastFile = null;
      showOnly(resultCard);
    } else if (okCount === 0) {
      errorText.textContent = `All ${failCount} downloads failed. ${items[0].error || ''}`.trim();
      showOnly(errorCard);
    } else {
      resultTitle.textContent = `${okCount} done · ${failCount} failed`;
      resultPath.textContent = saveDirEl.dataset.path || '';
      lastFile = null;
      showOnly(resultCard);
    }
  }
});

cancelBtn.addEventListener('click', () => {
  cancelAll = true;
  window.api.cancelDownload();
});

revealBtn.addEventListener('click', () => {
  if (lastFile) window.api.revealFile(lastFile);
  else if (saveDirEl.dataset.path) window.api.openFolder(saveDirEl.dataset.path);
});
againBtn.addEventListener('click', () => {
  urlInput.value = '';
  autoSizeTextarea();
  refreshCount();
  showOnly(null);
  urlInput.focus();
});

folderBtn.addEventListener('click', async () => {
  const p = await window.api.pickFolder();
  if (p) updateSaveDir(p);
});

function updateSaveDir(p) {
  saveDirEl.textContent = p;
  saveDirEl.dataset.path = p;
  folderBtn.title = `Save folder: ${p}`;
}

(async () => {
  const s = await window.api.getSettings();
  updateSaveDir(s.saveDir);
  autoSizeTextarea();
  refreshCount();
})();
