# Tommy DJ Studio — Melancholic House × Country

This knowledge base defines a compact composition grammar for generating expressive MIDI tracks.

## Core idea

Compose music as:

`MOTIF → REPETITION → VARIATION → PHRASE → DEVELOPMENT → CLIMAX → RESOLUTION`

The model should design musical phrases first and serialize them into the Tommy MIDI TXT format second.

## Target sound

A melancholic, emotional House foundation fused with Country/Americana melodic language:

- steady four-on-the-floor groove
- warm, organic feeling
- memorable guitar/lead motifs
- pentatonic and major/minor modal colors
- tasteful bends/implied slides through pitch movement
- call-and-response
- pauses and breathing room
- gradual development
- emotional rather than virtuosic melodies

## Generation order

1. Establish key, BPM, and section structure.
2. Create a 1–2 bar primary motif.
3. Repeat it before changing it.
4. Create a variation by changing only one or two dimensions.
5. Build 4- or 8-bar phrases.
6. Add a contrasting response phrase.
7. Create a controlled climax.
8. Resolve clearly.
9. Assign notes to instruments.
10. Validate the TXT output.

## Tommy TXT format

Melodic instruments:
`# start_beat,duration,note,velocity`

Drums:
`# start_beat,duration,drum,velocity`

Melodic notes use names such as `C4`, `F#4`, `Bb3`.
