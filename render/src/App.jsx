import React, { useState } from 'react'
import PromptPage from './pages/PromptPage'
import MixerPage from './pages/MixerPage'
import PianoPage from './pages/PianoPage'

export default function App() {
  const [route, setRoute] = useState('prompt')
  return (
    <div className="app">
      <header className="topbar">
        <h1>Hippo DJ</h1>
        <nav>
          <button onClick={() => setRoute('prompt')}>Prompt</button>
          <button onClick={() => setRoute('mixer')}>Mixer</button>
          <button onClick={() => setRoute('piano')}>Piano</button>
        </nav>
      </header>

      <main className="content">
        {route === 'prompt' && <PromptPage />}
        {route === 'mixer' && <MixerPage />}
        {route === 'piano' && <PianoPage />}
      </main>
    </div>
  )
}