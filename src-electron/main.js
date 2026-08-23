const { app, BrowserWindow, ipcMain } = require('electron')
const path = require('path')
const isDev = process.env.NODE_ENV === 'development' || process.env.VITE_DEV_SERVER_URL

function createWindow() {
  const w = new BrowserWindow({
    width: 1280,
    height: 820,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  if (isDev) {
    w.loadURL('http://localhost:5173')
    w.webContents.openDevTools()
  } else {
    w.loadFile(path.join(__dirname, '..', 'dist', 'index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

// Optional: if you want to implement generateMelody in main (instead of preload), you can.
// For this scaffold we call fetch from preload, so no ipcMain handler is required now.