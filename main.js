const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const os = require('os');
const { spawn } = require('child_process');

let liquidGlass = null;
try { liquidGlass = require('electron-liquid-glass'); } catch {}

const isPackaged = app.isPackaged;
const resourcesRoot = isPackaged ? process.resourcesPath : __dirname;
const ytdlpPath = path.join(resourcesRoot, 'resources', 'bin', 'yt-dlp');
const ffmpegPath = path.join(resourcesRoot, 'resources', 'bin', 'ffmpeg');

const settingsPath = path.join(app.getPath('userData'), 'settings.json');

function loadSettings() {
  try {
    return JSON.parse(fs.readFileSync(settingsPath, 'utf8'));
  } catch {
    return { saveDir: path.join(os.homedir(), 'Downloads') };
  }
}
function saveSettings(s) {
  try { fs.writeFileSync(settingsPath, JSON.stringify(s, null, 2)); } catch {}
}

let mainWindow;
let activeJob = null;

function createWindow() {
  const useLiquidGlass = process.platform === 'darwin' && !!liquidGlass;

  mainWindow = new BrowserWindow({
    width: 540,
    height: 420,
    minWidth: 460,
    minHeight: 360,
    titleBarStyle: 'hiddenInset',
    trafficLightPosition: { x: 16, y: 18 },
    transparent: useLiquidGlass,
    backgroundColor: useLiquidGlass ? '#00000000' : '#151619',
    vibrancy: useLiquidGlass ? undefined : 'under-window',
    visualEffectState: useLiquidGlass ? undefined : 'active',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  mainWindow.loadFile('index.html');

  if (useLiquidGlass) {
    mainWindow.webContents.once('did-finish-load', () => {
      try {
        const id = liquidGlass.addView(mainWindow.getNativeWindowHandle());
        if (id !== -1 && liquidGlass.unstable_setVariant) {
          liquidGlass.unstable_setVariant(id, 1);
        }
        mainWindow.setWindowButtonVisibility?.(true);
      } catch (e) {
        console.warn('liquid glass init failed:', e.message);
      }
    });
  }
}

function updateYtDlp() {
  if (!fs.existsSync(ytdlpPath)) return;
  const child = spawn(ytdlpPath, ['-U'], { stdio: 'ignore' });
  child.on('error', () => {});
}

app.whenReady().then(() => {
  createWindow();
  // Fire-and-forget: keep yt-dlp current so YouTube changes don't break us.
  setTimeout(updateYtDlp, 1500);
});
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit(); });
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow(); });

ipcMain.handle('settings:get', () => loadSettings());
ipcMain.handle('settings:set', (_e, s) => { saveSettings(s); return s; });

ipcMain.handle('dialog:pickFolder', async () => {
  const r = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
    defaultPath: loadSettings().saveDir,
  });
  if (r.canceled || !r.filePaths[0]) return null;
  const s = loadSettings(); s.saveDir = r.filePaths[0]; saveSettings(s);
  return s.saveDir;
});

ipcMain.handle('shell:openFolder', (_e, p) => shell.openPath(p));
ipcMain.handle('shell:revealFile', (_e, p) => shell.showItemInFolder(p));

ipcMain.handle('download:cancel', () => {
  if (activeJob && !activeJob.killed) {
    activeJob.kill('SIGTERM');
    return true;
  }
  return false;
});

function friendlyError(stderrTail, exitCode) {
  const s = (stderrTail || '').toLowerCase();
  if (s.includes('sign in to confirm') || s.includes('confirm your age')) {
    return 'This video is age-restricted and requires sign-in. Microdownloader can\'t download it without cookies.';
  }
  if (s.includes('video unavailable') || s.includes('this video is not available')) {
    return 'This video is unavailable — it may have been removed or made private.';
  }
  if (s.includes('private video')) {
    return 'This video is private.';
  }
  if (s.includes('members-only') || s.includes('members only')) {
    return 'This is a members-only video and can\'t be downloaded without sign-in.';
  }
  if (s.includes('http error 403')) {
    return 'The server refused the request (HTTP 403). The video may be region-blocked or require sign-in.';
  }
  if (s.includes('http error 404')) {
    return 'The video could not be found (HTTP 404). Check the URL.';
  }
  if (s.includes('http error 429') || s.includes('too many requests')) {
    return 'Rate-limited by the server (HTTP 429). Wait a few minutes and try again.';
  }
  if (s.includes('unsupported url') || s.includes('no video found')) {
    return 'This URL isn\'t supported by yt-dlp, or no video was found at it.';
  }
  if (s.includes('requested format is not available') || s.includes('requested format')) {
    return 'The requested format isn\'t available for this video. Try a different format option.';
  }
  if (s.includes('unable to extract') || s.includes('extractor')) {
    return 'yt-dlp couldn\'t parse this page — the site may have changed. yt-dlp will auto-update on next launch.';
  }
  if (s.includes('network is unreachable') || s.includes('failed to resolve') || s.includes('could not resolve host')) {
    return 'Network error — check your internet connection.';
  }
  if (s.includes('ffmpeg')) {
    return 'A problem occurred while merging the video and audio streams (ffmpeg).';
  }
  return `Download failed (yt-dlp exited with code ${exitCode}).`;
}

function buildArgs(url, format, saveDir) {
  const out = path.join(saveDir, '%(title).200B [%(id)s].%(ext)s');
  const base = [
    '--newline',
    '--no-playlist',
    '--no-mtime',
    '--restrict-filenames',
    '--ffmpeg-location', ffmpegPath,
    '--progress-template',
    'PROG|%(progress._percent_str)s|%(progress._downloaded_bytes_str)s|%(progress._total_bytes_str)s|%(progress._speed_str)s|%(progress._eta_str)s',
    '-o', out,
  ];
  if (format === 'audio') {
    base.push(
      '-f', 'bestaudio/best',
      '-x',
      '--audio-format', 'mp3',
      '--audio-quality', '0',
    );
  } else if (format === 'video') {
    base.push(
      '-f', 'bestvideo[ext=mp4]+bestaudio[ext=m4a]/bestvideo+bestaudio/best',
      '--merge-output-format', 'mp4',
    );
  } else {
    base.push('-f', 'bv*+ba/b');
  }
  base.push(url);
  return base;
}

ipcMain.handle('download:start', (event, { url, format }) => {
  return new Promise((resolve) => {
    if (!url || !/^https?:\/\//i.test(url.trim())) {
      resolve({ ok: false, error: 'Please paste a valid URL.' });
      return;
    }
    if (!fs.existsSync(ytdlpPath)) {
      resolve({ ok: false, error: 'Bundled yt-dlp not found.' });
      return;
    }
    const settings = loadSettings();
    const args = buildArgs(url.trim(), format, settings.saveDir);
    const child = spawn(ytdlpPath, args, { env: { ...process.env, LC_ALL: 'en_US.UTF-8' } });
    activeJob = child;

    let lastFile = null;
    let title = null;
    const stderrLines = [];
    const send = (ch, payload) => mainWindow && mainWindow.webContents.send(ch, payload);

    const handleLine = (line) => {
      if (!line) return;
      if (line.startsWith('PROG|')) {
        const [, pct, dl, total, speed, eta] = line.split('|');
        send('download:progress', {
          percent: (pct || '').trim(),
          downloaded: (dl || '').trim(),
          total: (total || '').trim(),
          speed: (speed || '').trim(),
          eta: (eta || '').trim(),
        });
        return;
      }
      const dest = line.match(/\[download\] Destination: (.+)$/);
      if (dest) lastFile = dest[1];
      const merge = line.match(/\[Merger\] Merging formats into "(.+)"$/);
      if (merge) lastFile = merge[1];
      const already = line.match(/\[download\] (.+) has already been downloaded/);
      if (already) lastFile = already[1];
      const t = line.match(/\[info\] (.+?): Downloading/);
      if (t) title = t[1];
      send('download:log', line);
    };

    let buf = '';
    const onData = (chunk) => {
      buf += chunk.toString();
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach(handleLine);
    };
    const onErrData = (chunk) => {
      const text = chunk.toString();
      // Also feed stderr through the normal line handler so logs stay unified.
      buf += text;
      const lines = buf.split(/\r?\n/);
      buf = lines.pop();
      lines.forEach(handleLine);
      // Keep only the tail of stderr to map to a friendly message later.
      for (const line of text.split(/\r?\n/)) {
        if (/^(ERROR|WARNING):/i.test(line) || /error/i.test(line)) {
          stderrLines.push(line);
          if (stderrLines.length > 20) stderrLines.shift();
        }
      }
    };
    child.stdout.on('data', onData);
    child.stderr.on('data', onErrData);

    child.on('close', (code, signal) => {
      activeJob = null;
      if (buf) handleLine(buf);
      if (signal === 'SIGTERM') {
        resolve({ ok: false, error: 'Cancelled.' });
      } else if (code === 0) {
        resolve({ ok: true, file: lastFile, title, dir: settings.saveDir });
      } else {
        resolve({ ok: false, error: friendlyError(stderrLines.join('\n'), code) });
      }
    });
    child.on('error', (err) => {
      activeJob = null;
      resolve({ ok: false, error: err.message });
    });
  });
});
