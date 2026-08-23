import React, { useEffect, useRef, useState } from 'react'

function createAudioContext() {
  const AudioContext = window.AudioContext || window.webkitAudioContext
  return new AudioContext()
}

export default function MixerPage() {
  // Simple two-track mixer as illustrated in your pictures
  const [tracks, setTracks] = useState([
    { id: 1, name: 'Track 1', volume: 0.8, muted: false, effect: { delay: false, reverb: false }, audioBuffer: null },
    { id: 2, name: 'Track 2', volume: 0.8, muted: false, effect: { delay: false, reverb: false }, audioBuffer: null }
  ])
  const audioCtxRef = useRef(null)
  const playersRef = useRef({}) // hold source nodes
  const [cursor, setCursor] = useState(0)
  const [crop, setCrop] = useState([0, 5]) // seconds

  useEffect(() => {
    audioCtxRef.current = createAudioContext()
  }, [])

  const loadSampleForTrack = async (idx) => {
    const url = window.prompt('Enter audio sample URL (or leave blank to skip):')
    if (!url) return
    try {
      const buffer = await window.api.fetchArrayBuffer(url).then(b => audioCtxRef.current.decodeAudioData(b))
      setTracks(prev => {
        const next = [...prev]
        next[idx].audioBuffer = buffer
        return next
      })
    } catch (e) {
      alert('Failed to load audio: ' + e.message)
    }
  }

  const playTrack = (idx) => {
    const t = tracks[idx]
    if (!t.audioBuffer) { alert('No audio loaded for that track'); return }
    const ctx = audioCtxRef.current
    const source = ctx.createBufferSource()
    source.buffer = t.audioBuffer

    // Gain node
    const gain = ctx.createGain()
    gain.gain.value = t.muted ? 0 : t.volume

    // optional effects
    let nodeChainEnd = gain
    if (t.effect.delay) {
      const delay = ctx.createDelay(2.0)
      delay.delayTime.value = 0.25
      const fb = ctx.createGain()
      fb.gain.value = 0.3
      delay.connect(fb)
      fb.connect(delay)
      nodeChainEnd.connect(delay)
      nodeChainEnd = delay
    }
    if (t.effect.reverb) {
      // very simple reverb using convolver with tiny impulse
      const convolver = ctx.createConvolver()
      const ir = ctx.createBuffer(2, ctx.sampleRate * 0.5, ctx.sampleRate)
      for (let c = 0; c < ir.numberOfChannels; c++) {
        const arr = ir.getChannelData(c)
        for (let i = 0; i < arr.length; i++) arr[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / arr.length, 2)
      }
      convolver.buffer = ir
      nodeChainEnd.connect(convolver)
      nodeChainEnd = convolver
    }

    nodeChainEnd.connect(ctx.destination)
    source.connect(gain)

    // cropping: schedule start/stop using the crop range
    const startOffset = crop[0]
    const duration = Math.max(0.1, (crop[1] - crop[0]) || 1)
    source.start(0, startOffset, duration)
    playersRef.current[t.id] = source
  }

  const stopTrack = (idx) => {
    const t = tracks[idx]
    const node = playersRef.current[t.id]
    if (node) {
      try { node.stop() } catch (e) {}
      delete playersRef.current[t.id]
    }
  }

  const toggleEffect = (idx, name) => {
    setTracks(prev => {
      const next = [...prev]
      next[idx].effect[name] = !next[idx].effect[name]
      return next
    })
  }

  return (
    <div className="panel">
      <h2>Mixer</h2>
      <p>Two-track mixer with simple effects and crop playback. Load samples into each track, set volume and effects, then play.</p>
      <div style={{ marginTop: 12 }}>
        <label>Crop start: <input type="number" value={crop[0]} step="0.1" onChange={e => setCrop([parseFloat(e.target.value), crop[1]])} /></label>
        <label style={{ marginLeft: 12 }}>end: <input type="number" value={crop[1]} step="0.1" onChange={e => setCrop([crop[0], parseFloat(e.target.value)])} /></label>
      </div>

      <div style={{ marginTop: 12 }}>
        {tracks.map((t, idx) => (
          <div key={t.id} className="track">
            <div style={{ width: 140 }}>
              <strong>{t.name}</strong>
              <div>
                <button onClick={() => loadSampleForTrack(idx)}>Load sample</button>
              </div>
            </div>

            <div style={{ flex: 1 }}>
              <label>Volume: <input type="range" min="0" max="1" step="0.01" value={t.volume} onChange={e => setTracks(prev => { const next=[...prev]; next[idx].volume = parseFloat(e.target.value); return next })} /></label>
              <label style={{ marginLeft: 8 }}>Muted: <input type="checkbox" checked={t.muted} onChange={e => setTracks(prev => { const next=[...prev]; next[idx].muted = e.target.checked; return next })} /></label>
              <div style={{ marginTop: 8 }}>
                <button onClick={() => playTrack(idx)}>Play</button>
                <button onClick={() => stopTrack(idx)} style={{ marginLeft: 8 }}>Stop</button>
                <button onClick={() => toggleEffect(idx, 'delay')} style={{ marginLeft: 8 }}>{t.effect.delay ? 'Disable Delay' : 'Enable Delay'}</button>
                <button onClick={() => toggleEffect(idx, 'reverb')} style={{ marginLeft: 8 }}>{t.effect.reverb ? 'Disable Reverb' : 'Enable Reverb'}</button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}