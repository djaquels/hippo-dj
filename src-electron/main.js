// src-electron/main.js
const { app, BrowserWindow } = require('electron')
const path = require('path')

function createWindow() {
  console.log('ELECTRON MAIN: createWindow - NODE_ENV=', process.env.NODE_ENV)
  const isDev = process.env.NODE_ENV === 'development'
  const win = new BrowserWindow({
    width: 1280,
    height: 820,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  })

  win.once('ready-to-show', () => {
    console.log('ELECTRON MAIN: ready-to-show - showing window')
    win.show()
  })

  // log load events
  win.webContents.on('did-start-loading', () => console.log('ELECTRON MAIN: webContents did-start-loading'))
  win.webContents.on('did-finish-load', () => {
    console.log('ELECTRON MAIN: did-finish-load, url=', win.webContents.getURL())
  })
  win.webContents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL) => {
    console.error('ELECTRON MAIN: did-fail-load', { errorCode, errorDescription, validatedURL })
  })
  win.webContents.on('crashed', () => console.error('ELECTRON MAIN: webContents crashed'))

  // always open DevTools for debugging in dev
  if (isDev) {
    win.webContents.openDevTools({ mode: 'detach' })
  }

  // Load dev server or production file
  if (isDev) {
    const devUrl = process.env.VITE_DEV_SERVER_URL || 'http://localhost:5173'
    console.log('ELECTRON MAIN: loading dev URL ->', devUrl)
    win.loadURL(devUrl).catch(err => console.error('ELECTRON MAIN: loadURL error', err))
  } else {
    const indexHtml = path.join(__dirname, '..', 'dist', 'index.html')
    console.log('ELECTRON MAIN: loading file ->', indexHtml)
    win.loadFile(indexHtml).catch(err => console.error('ELECTRON MAIN: loadFile error', err))
  }

  return win
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