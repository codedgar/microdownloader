const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('api', {
  getSettings: () => ipcRenderer.invoke('settings:get'),
  setSettings: (s) => ipcRenderer.invoke('settings:set', s),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  openFolder: (p) => ipcRenderer.invoke('shell:openFolder', p),
  revealFile: (p) => ipcRenderer.invoke('shell:revealFile', p),
  startDownload: (opts) => ipcRenderer.invoke('download:start', opts),
  cancelDownload: () => ipcRenderer.invoke('download:cancel'),
  onProgress: (cb) => ipcRenderer.on('download:progress', (_e, d) => cb(d)),
  onLog: (cb) => ipcRenderer.on('download:log', (_e, d) => cb(d)),
});
