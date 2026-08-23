import React, { useEffect, useRef, useState } from 'react'
import MidiWriter from 'jsmidgen'

const KEY_ORDER = ['C','C#','D','D#','E','F','F#','G','G#','A','A#','B']

function noteNameToMidi(noteName) {
  // e.g., C4 -> midi number 60
  const match = noteName.match(/^([A-G]#?)(\d)$/)
  if (!match) return 60
  const [, pitch, oct] = match
  const pitchIndex = KEY_ORDER.indexOf(pitch)
  return 12 * (parseInt(oct) + 1) + pitchIndex
}

function midiToNoteName(midi) {
  const oct = Math.floor(midi / 12) - 1
  const pitch = KEY_ORDER[midi % 12]
  return pitch + oct
}

export default function PianoPage() {
  const [notes, setNotes] = useState([]) // recorded notes { pitch: 'C4', start: sec, length: sec }
  const [currentTime, setCurrentTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const audioCtxRef = useRef(null)
  const oscillatorRef = useRef(null)
  const lastNoteTimeRef = useRef(0)

  useEffect(() => {
    audioCtxRef.current = new (window.AudioContext || window.webkitAudioContext)()
  }, [])

  const playNoteTone = (midi) => {
    const ctx = audioCtxRef.current
    if (!ctx) return
    const frequency = 440 * Math.pow(2, (midi - 69) / 12)
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = frequency
    gain.gain.value = 0.2
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.start()
    oscillatorRef.current = { osc, gain }
  }
  const stopNoteTone = () => {
    const o = oscillatorRef.current
    if (o) {
      try { o.gain.gain.setTargetAtTime(0.0001, audioCtxRef.current.currentTime, 0.02) } catch(e){}
      try { o.osc.stop(audioCtxRef.current.currentTime + 0.05) } catch(e){}
      oscillatorRef.current = null
    }
  }

  const handleKeyDown = (pitch) => {
    // add to notes with start time
    const now = Date.now() / 1000
    lastNoteTimeRef.current = now
    setNotes(prev => [...prev, { pitch, start: now, length: 0 }])
    // play tone
    const midi = noteNameToMidi(pitch)
    playNoteTone(midi)
  }

  const handleKeyUp = (pitch) => {
    const now = Date.now() / 1000
    // find last note with pitch that has length 0
    setNotes(prev => {
      const next = [...prev]
      for (let i = next.length - 1; i >= 0; i--) {
        if (next[i].pitch === pitch && next[i].length === 0) {
          next[i] = { ...next[i], length: Math.max(0.1, now - next[i].start) }
          break
        }
      }
      return next
    })
    stopNoteTone()
  }

  const exportMidi = () => {
    const file = new MidiWriter.Writer(buildMidiFromNotes(notes))
    const blob = new Blob([file.buildFile()], { type: 'audio/midi' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'melody.mid'
    a.click()
    URL.revokeObjectURL(url)
  }

  function buildMidiFromNotes(notesArr) {
    // Construct a midi track: convert seconds -> ticks with an arbitrary tempo mapping
    const header = new MidiWriter.Writer()
    // We'll build a track
    const track = new MidiWriter.Track()
    const ticksPerBeat = 128
    // We'll assume 120 BPM (0.5s per beat)
    const tempoBpm = 120
    track.setTempo(tempoBpm)
    // Convert each note into a MidiWriter.NoteEvent
    // Simple approach: use absolute timing by sorting by start
    const sorted = [...notesArr].map(n => ({ ...n })).sort((a,b) => a.start - b.start)
    let lastTick = 0
    for (const n of sorted) {
      const startTicks = Math.round((n.start - (sorted[0]?.start || n.start)) * (tempoBpm / 60) * ticksPerBeat)
      const durationTicks = Math.round((n.length || 0.5) * (tempoBpm / 60) * ticksPerBeat)
      const note = midiToNoteName(noteNameToMidi(n.pitch)).replace(/\d$/, '') // we will pass pitch names via noteNumbers
      // Use pitch number instead
      const pitchNum = noteNameToMidi(n.pitch)
      track.addEvent(new MidiWriter.NoteEvent({ pitch: [pitchNum], duration: 'T' + durationTicks, startTick: startTicks }))
    }
    return [track]
  }

  return (
    <div className="panel">
      <h2>Piano & Piano-Roll</h2>
      <p>Click keys to create notes; they will appear in the piano-roll below. Export as MIDI when ready.</p>

      <div className="piano" style={{ marginTop: 12 }}>
        {['C4','D4','E4','F4','G4','A4','B4','C5'].map(k => (
          <div key={k} className="key" onMouseDown={() => handleKeyDown(k)} onMouseUp={() => handleKeyUp(k)} onMouseLeave={() => handleKeyUp(k)}>
            {k}
          </div>
        ))}
      </div>

      <div className="piano-roll panel" style={{ marginTop: 12 }}>
        <PianoRoll notes={notes} />
      </div>

      <div style={{ marginTop: 8 }}>
        <button onClick={exportMidi}>Export MIDI</button>
        <button onClick={() => { setNotes([]) }} style={{ marginLeft: 8 }}>Clear</button>
      </div>
    </div>
  )
}

// Very simple piano roll canvas visualizer
function PianoRoll({ notes = [] }) {
  const canvasRef = useRef(null)

  useEffect(() => {
    const c = canvasRef.current
    if (!c) return
    const ctx = c.getContext('2d')
    const w = c.width = c.clientWidth * devicePixelRatio
    const h = c.height = c.clientHeight * devicePixelRatio
    // background
    ctx.fillStyle = '#081018'
    ctx.fillRect(0,0,w,h)

    // draw grid for pitches (we map 8 steps)
    const pitches = ['C5','B4','A4','G4','F4','E4','D4','C4']
    const rowH = h / pitches.length
    ctx.strokeStyle = '#0f2430'
    for (let i=0;i<pitches.length;i++){
      ctx.strokeRect(0, i*rowH, w, rowH)
      ctx.fillStyle = '#2c5566'
      ctx.font = `${12*devicePixelRatio}px sans-serif`
      ctx.fillText(pitches[i], 6*devicePixelRatio, (i+0.35)*rowH)
    }

    if (notes.length === 0) return
    // normalize times to canvas width
    const minStart = Math.min(...notes.map(n => n.start || 0))
    const maxEnd = Math.max(...notes.map(n => (n.start || 0) + (n.length || 0.5)))
    const total = Math.max(0.5, maxEnd - minStart)

    for (const n of notes) {
      const startNorm = ((n.start || 0) - minStart) / total
      const lenNorm = (n.length || 0.5) / total
      const x = startNorm * w
      const width = Math.max(6, lenNorm * w)
      const pitchIndex = pitches.indexOf(n.pitch)
      if (pitchIndex === -1) continue
      const y = pitchIndex * rowH + 6*devicePixelRatio
      ctx.fillStyle = '#6ad1ff'
      ctx.fillRect(x, y, width, rowH - 12*devicePixelRatio)
    }
  }, [notes])

  return <canvas ref={canvasRef} className="piano-roll" style={{ width: '100%', height: 220 }} />
}