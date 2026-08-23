// src-electron/preload.js
const { contextBridge } = require('electron')

// Helpful debug message so you can see preload loaded in DevTools console
console.log('PRELOAD: starting preload script')

// We will use a fetch implementation available at runtime.
// Prefer global fetch (Node/Electron >=18). If missing, try dynamic import of node-fetch (works only if node-fetch v2 is installed).
let fetchImpl = globalThis.fetch || null

async function ensureFetch() {
  if (fetchImpl) return
  try {
    // dynamic import can load ESM or fallback depending on package. node-fetch v3 is ESM and will be importable.
    // For node-fetch v3 the default export is the fetch function; for v2 require would be used, but we avoid require here.
    const mod = await import('node-fetch').catch(() => null)
    if (mod) {
      // node-fetch v3 exports default
      fetchImpl = mod.default ?? mod
      console.log('PRELOAD: using node-fetch from dynamic import')
    }
  } catch (err) {
    console.warn('PRELOAD: failed to dynamic import node-fetch:', err && err.message ? err.message : err)
  }
}

const PRELOAD_BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000'

contextBridge.exposeInMainWorld('api', {
  generateMelody: async (prompt, params = {}) => {
    await ensureFetch()
    if (!fetchImpl) throw new Error('No fetch implementation available in preload. Install node-fetch or upgrade Node/Electron.')
    const res = await fetchImpl(`${PRELOAD_BACKEND_URL}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, params })
    })
    if (!res.ok) throw new Error('Failed to generate melody: ' + res.statusText)
    return res.json()
  },

  fetchArrayBuffer: async (url) => {
    await ensureFetch()
    if (!fetchImpl) throw new Error('No fetch implementation available in preload. Install node-fetch or upgrade Node/Electron.')
    const res = await fetchImpl(url)
    if (!res.ok) throw new Error('Failed fetching audio: ' + res.statusText)
    return res.arrayBuffer()
  }
})

// Debug: notify the renderer console that preload successfully finished execution.
console.log('PRELOAD: finished exposing api')