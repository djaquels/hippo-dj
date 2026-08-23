import React, { useState } from 'react'

export default function PromptPage() {
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  async function handleGenerate() {
    setError(null)
    setLoading(true)
    setResult(null)
    try {
      // call preload-exposed API
      const json = await window.api.generateMelody(prompt, { length: 8 })
      setResult(json)
    } catch (e) {
      setError(e.message || String(e))
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="panel">
      <h2>Generate Melody</h2>
      <p>Type a prompt for the melody generator (style, instruments, tempo...)</p>
      <textarea value={prompt} onChange={e => setPrompt(e.target.value)} rows={4} style={{ width: '100%', marginTop: 10 }} />
      <div className="controls">
        <button onClick={handleGenerate} disabled={loading || !prompt}>Generate</button>
        {loading && <span>Generating...</span>}
      </div>

      {error && <div style={{ marginTop: 12, color: 'salmon' }}>{error}</div>}

      {result && (
        <div style={{ marginTop: 14 }}>
          <h3>Result</h3>
          <pre style={{ whiteSpace: 'pre-wrap' }}>{JSON.stringify(result, null, 2)}</pre>

          {/* If backend returned an audio_url, allow playback via Web Audio */}
          {result.audio_url && <AudioPlayer audioUrl={result.audio_url} />}
        </div>
      )}
    </div>
  )
}

function AudioPlayer({ audioUrl }) {
  const [playing, setPlaying] = React.useState(false)
  const audioRef = React.useRef(null)

  return (
    <div style={{ marginTop: 10 }}>
      <audio ref={audioRef} src={audioUrl} controls onPlay={() => setPlaying(true)} onPause={() => setPlaying(false)} />
      <div style={{ marginTop:6 }}>
        <button onClick={() => audioRef.current && audioRef.current.play()}>Play</button>
        <button onClick={() => audioRef.current && audioRef.current.pause()}>Pause</button>
      </div>
    </div>
  )
}