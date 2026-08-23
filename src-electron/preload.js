const { contextBridge } = require('electron')
const fetch = require('node-fetch')

// Set your backend REST API base URL here or replace with process.env var handing.
const PRELOAD_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

contextBridge.exposeInMainWorld('api', {
  // send prompt -> backend generate endpoint expected to return JSON like { notes: [...], audio_url: '...' }
  generateMelody: async (prompt, params = {}) => {
    const res = await fetch(`${PRELOAD_BACKEND_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, params })
    })
    if (!res.ok) throw new Error('Failed to generate melody: ' + res.statusText)
    return res.json()
  },
  // optionally fetch audio by url (return ArrayBuffer)
  fetchArrayBuffer: async (url) => {
    const res = await fetch(url)
    if (!res.ok) throw new Error('Failed fetching audio: ' + res.statusText)
    return res.arrayBuffer()
  }
})