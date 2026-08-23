#!/usr/bin/env python3

import argparse
import csv
import re
from pathlib import Path

import pretty_midi

## Mode of use
"""
python beethoven.py output.mid \
    --tempo tempo.txt \
    --chords chords.txt \
    --melody melody.txt \
    --bass bass.txt \
    --drums drums.txt \
    --synth synth.txt
"""
# ============================================================
# Configuration
# ============================================================

INSTRUMENTS = {
    "piano": 0,             # Acoustic Grand Piano
    "acoustic_guitar": 25,  # Acoustic Guitar (steel)
    "guitar": 27,           # Electric Guitar (clean)
    "bass": 33,             # Electric Bass (finger)
    "drums": 0,             # GM percussion
    "synth": 81,            # Lead 2 (sawtooth)
}

DRUM_NOTES = {
    "KICK": 36,
    "SNARE": 38,
    "CLAP": 39,
    "HAT": 42,
    "OPEN_HAT": 46,
    "LOW_TOM": 45,
    "MID_TOM": 47,
    "HIGH_TOM": 50,
    "CRASH": 49,
    "RIDE": 51,
    "BONGO": 60,
    "CONGA": 64,
}


# ============================================================
# Utility functions
# ============================================================

def note_to_midi(note):
    """
    Convert note names such as C4, F#3, Bb4 to MIDI numbers.
    """

    match = re.match(r"^([A-Ga-g])([#b]?)(-?\d+)$", note.strip())

    if not match:
        raise ValueError(f"Invalid note: {note}")

    name, accidental, octave = match.groups()

    semitones = {
         "C": 0,
        "C#": 1,
        "Db": 1,
        "D": 2,
        "D#": 3,
        "Eb": 3,
        "E": 4,
        "F": 5,
        "F#": 6,
        "Gb": 6,
        "G": 7,
        "G#": 8,
        "Ab": 8,
        "A": 9,
        "A#": 10,
        "Bb": 10,
        "B": 11,
    }

    value = semitones[name.upper()]

    if accidental == "#":
        value += 1
    elif accidental == "b":
        value -= 1

    octave = int(octave)

    return 12 * (octave + 1) + value


def beats_to_seconds(beat, tempo):
    """
    Convert quarter-note beats into seconds.
    """
    return beat * 60.0 / tempo


# ============================================================
# File parsing
# ============================================================

def load_tempo(filename):
    tempo = 120
    time_signature = "4/4"
    key = "C"

    with open(filename, "r", encoding="utf-8") as f:

        for line in f:

            line = line.strip()

            if not line or line.startswith("#"):
                continue

            if "=" not in line:
                continue

            key_name, value = line.split("=", 1)

            key_name = key_name.strip()
            value = value.strip()

            if key_name == "tempo":
                tempo = float(value)

            elif key_name == "time_signature":
                time_signature = value

            elif key_name == "key":
                key = value

    return {
        "tempo": tempo,
        "time_signature": time_signature,
        "key": key,
    }


def load_note_file(filename):
    """
    Load:

    start_beat,duration,note,velocity

    Returns a list of dictionaries.
    """

    notes = []

    with open(filename, "r", encoding="utf-8") as f:

        for line in f:

            line = line.strip()

            if not line or line.startswith("#"):
                continue

            parts = [x.strip() for x in line.split(",")]

            if len(parts) != 4:
                raise ValueError(
                    f"Invalid line in {filename}: {line}"
                )

            start_beat = float(parts[0])
            duration = float(parts[1])
            note = parts[2]
            velocity = int(parts[3])

            notes.append({
                "start": start_beat,
                "duration": duration,
                "note": note,
                "velocity": min(127,velocity),
            })

    return notes


def load_chord_file(filename):
    """
    Load:

    start_beat,duration,chord,velocity

    Example:

    0,4,Cm,90
    """

    chords = []

    with open(filename, "r", encoding="utf-8") as f:

        for line in f:

            line = line.strip()

            if not line or line.startswith("#"):
                continue

            parts = [x.strip() for x in line.split(",")]

            if len(parts) != 4:
                raise ValueError(
                    f"Invalid chord line: {line}"
                )

            chords.append({
                "start": float(parts[0]),
                "duration": float(parts[1]),
                "chord": parts[2],
                "velocity": int(parts[3]),
            })

    return chords


# ============================================================
# Chord parser
# ============================================================

CHORD_INTERVALS = {
    "": [0, 4, 7],
    "m": [0, 3, 7],
    "7": [0, 4, 7, 10],
    "maj7": [0, 4, 7, 11],
    "m7": [0, 3, 7, 10],
    "sus2": [0, 2, 7],
    "sus4": [0, 5, 7],
    "dim": [0, 3, 6],
    "aug": [0, 4, 8],
    "add9": [0, 4, 7, 14],
    "madd9": [0, 3, 7, 14],
}


def parse_chord(chord):
    """
    Convert:

        Cm
        C
        Am7
        Fmaj7
        Gsus4

    into MIDI note offsets.
    """

    match = re.match(
        r"^([A-Ga-g])([#b]?)(.*)$",
        chord
    )

    if not match:
        raise ValueError(f"Invalid chord: {chord}")

    root = match.group(1)
    accidental = match.group(2)
    quality = match.group(3)

    root_note = root + accidental

    if quality not in CHORD_INTERVALS:
        raise ValueError(
            f"Unsupported chord quality '{quality}' "
            f"in chord '{chord}'"
        )

    root_midi = note_to_midi(root_note + "3")

    return [
        root_midi + interval
        for interval in CHORD_INTERVALS[quality]
    ]


# ============================================================
# MIDI tracks
# ============================================================

def create_note_track(
    midi,
    notes,
    program,
    tempo,
    name,
):
    instrument = pretty_midi.Instrument(
        program=program,
        name=name
    )

    for item in notes:

        start = beats_to_seconds(
            item["start"],
            tempo
        )

        end = beats_to_seconds(
            item["start"] + item["duration"],
            tempo
        )

        midi_note = note_to_midi(item["note"])

        midi_note = max(0, min(127, midi_note))

        note = pretty_midi.Note(
            velocity=item["velocity"],
            pitch=midi_note,
            start=start,
            end=end,
        )

        instrument.notes.append(note)

    midi.instruments.append(instrument)


def create_chord_track(
    midi,
    chords,
    tempo,
    program,
    name,
):
    instrument = pretty_midi.Instrument(
        program=program,
        name=name
    )

    for chord in chords:

        start = beats_to_seconds(
            chord["start"],
            tempo
        )

        end = beats_to_seconds(
            chord["start"] + chord["duration"],
            tempo
        )

        notes = parse_chord(
            chord["chord"]
        )

        for pitch in notes:

            note = pretty_midi.Note(
                velocity=chord["velocity"],
                pitch=pitch,
                start=start,
                end=end,
            )

            instrument.notes.append(note)

    midi.instruments.append(instrument)


def create_drum_track(
    midi,
    notes,
    tempo,
):
    instrument = pretty_midi.Instrument(
        program=0,
        is_drum=True,
        name="Drums"
    )

    for item in notes:

        drum_name = item["note"].upper()

        if drum_name not in DRUM_NOTES:
            raise ValueError(
                f"Unknown drum note: {drum_name}"
            )

        pitch = DRUM_NOTES[drum_name]

        start = beats_to_seconds(
            item["start"],
            tempo
        )

        end = beats_to_seconds(
            item["start"] + item["duration"],
            tempo
        )

        note = pretty_midi.Note(
            velocity=item["velocity"],
            pitch=pitch,
            start=start,
            end=end,
        )

        instrument.notes.append(note)

    midi.instruments.append(instrument)


# ============================================================
# Main composition
# ============================================================

def create_composition(
    output_file,
    tempo_file=None,
    chords_file=None,
    melody_file=None,
    bass_file=None,
    drums_file=None,
    synth_file=None,
    guitar_file=None,
):

    # --------------------------------------------------------
    # Tempo
    # --------------------------------------------------------

    if tempo_file:

        settings = load_tempo(
            tempo_file
        )

        tempo = settings["tempo"]

    else:

        tempo = 120

    print(f"Tempo: {tempo} BPM")

    midi = pretty_midi.PrettyMIDI(
        initial_tempo=tempo
    )

    # --------------------------------------------------------
    # Chords
    # --------------------------------------------------------

    if chords_file:

        chords = load_chord_file(
            chords_file
        )

        print(
            f"Adding {len(chords)} chords"
        )

        create_chord_track(
            midi=midi,
            chords=chords,
            tempo=tempo,
            program=INSTRUMENTS[
                "acoustic_guitar"
            ],
            name="Acoustic Guitar Chords",
        )

    # --------------------------------------------------------
    # Melody
    # --------------------------------------------------------

    if melody_file:

        melody = load_note_file(
            melody_file
        )

        print(
            f"Adding {len(melody)} melody notes "
            f"-> Grand Piano"
        )

        create_note_track(
            midi=midi,
            notes=melody,
            program=INSTRUMENTS["piano"],
            tempo=tempo,
            name="Grand Piano Melody",
        )

    # --------------------------------------------------------
    # Bass
    # --------------------------------------------------------

    if bass_file:

        bass = load_note_file(
            bass_file
        )

        print(
            f"Adding {len(bass)} bass notes"
        )

        create_note_track(
            midi=midi,
            notes=bass,
            program=INSTRUMENTS[
                "bass"
            ],
            tempo=tempo,
            name="Bass",
        )
    # --------------------------------------------------------
    # Guitar
    #
    # NEW:
    # Separate guitar track from guitar.txt.
    # Uses Electric Guitar (clean).
    # --------------------------------------------------------

    if guitar_file:
        guitar = load_note_file(
            guitar_file
        )

        print(
            f"Adding {len(guitar)} guitar notes "
            f"-> Clean Electric Guitar"
        )

        create_note_track(
            midi=midi,
            notes=guitar,
            program=INSTRUMENTS["guitar"],
            tempo=tempo,
            name="Clean Electric Guitar",
        )
    
    # --------------------------------------------------------
    # Synth
    # --------------------------------------------------------

    if synth_file:

        synth = load_note_file(
            synth_file
        )

        print(
            f"Adding {len(synth)} synth notes"
        )

        create_note_track(
            midi=midi,
            notes=synth,
            program=INSTRUMENTS[
                "synth"
            ],
            tempo=tempo,
            name="Synth",
        )

    # --------------------------------------------------------
    # Drums
    # --------------------------------------------------------

    if drums_file:

        drums = load_note_file(
            drums_file
        )

        print(
            f"Adding {len(drums)} drum hits"
        )

        create_drum_track(
            midi=midi,
            notes=drums,
            tempo=tempo,
        )

    # --------------------------------------------------------
    # Save
    # --------------------------------------------------------

    output_path = Path(output_file)

    output_path.parent.mkdir(
        parents=True,
        exist_ok=True
    )

    midi.write(
        str(output_path)
    )

    print()
    print("Composition created:")
    print(output_path)


# ============================================================
# CLI
# ============================================================

def main():

    parser = argparse.ArgumentParser(
        description=(
            "Generate a MIDI composition "
            "from text-based musical parts."
        )
    )

    parser.add_argument(
        "output",
        help="Output MIDI filename"
    )

    parser.add_argument(
        "--tempo",
        help="Tempo configuration file"
    )

    parser.add_argument(
        "--guitar",
        help="Separate guitar melody/riff file"
    )

    parser.add_argument(
        "--chords",
        help="Chord progression file"
    )

    parser.add_argument(
        "--melody",
        help="Melody file"
    )

    parser.add_argument(
        "--bass",
        help="Bass file"
    )

    parser.add_argument(
        "--drums",
        help="Drums file"
    )

    parser.add_argument(
        "--synth",
        help="Synth file"
    )

    args = parser.parse_args()

    create_composition(
        output_file=args.output,
        tempo_file=args.tempo,
        chords_file=args.chords,
        melody_file=args.melody,
        bass_file=args.bass,
        drums_file=args.drums,
        synth_file=args.synth,
    )


if __name__ == "__main__":
    main()