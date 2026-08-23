# File structure

## Guitar
CSV headers: start_beat,duration,note,velocity

Sample:
```
# CIRCULO MEXICANO - clean guitar / melodic lick
# 96 BPM | A# major
# start_beat,duration,note,velocity

0.5,0.35,A#3,58
1.5,0.35,A#3,58
2.5,0.35,A#3,58
3.5,0.35,A#3,58
```

# Bass

CSV Headers: start_beat,duration,note,velocity

Sample
```
# CIRCULO MEXICANO - salsa tumbao bass
# 96 BPM | A# major
# start_beat,duration,note,velocity

0,1,A#2,78
1.5,0.5,F2,70
2.5,0.5,A#2,74
3.5,0.5,C3,76
4,1,G2,78
5.5,0.5,D3,70
```

# Chords

CSV Headers: start_beat,duration,chord,velocity

Sample:
```
# CIRCULO MEXICANO - romantic salsa
# 96 BPM | A# major
# start_beat,duration,chord,velocity

0,4,A#maj7,82
4,4,Gm7,78
8,4,D#maj7,84
12,2,Fsus4,76
14,2,F7,80
16,4,A#maj7,86
20,4,Gm7,80
24,4,D#maj7,83
28,2,Fsus4,75
30,2,F7,81
```

# Melody

CSV Headers:start_beat,duration,note,velocity

Sample:
```
# CIRCULO MEXICANO - melodic / piano guide
# 96 BPM | A# major
# start_beat,duration,note,velocity

4,1,A#4,58
5,1,C5,62
6,2,D#5,70
12,1,A#4,58
13,1,C5,62
14,2,D#5,70
20,1,A#4,58
```

# Synth

CSV Headers:start_beat,duration,note,velocity

Sample:
```
# CIRCULO MEXICANO - warm synth pad / hook
# 96 BPM | A# major
# start_beat,duration,note,velocity

0,3.5,A#4,64
4,3.5,G4,64
8,3.5,D#4,64
12,3.5,F4,64
16,3.5,A#4,64
20,3.5,G4,64
24,3.5,D#4,64
28,3.5,F4,64
32,3.5,A#4,64
```

# Drums

CSV Headers: start_beat,duration,note,velocity

Sample
```
# CIRCULO MEXICANO - romantic salsa percussion
# 96 BPM
# start_beat,duration,note,velocity

0,0.25,KICK,78
0.5,0.25,HAT,42
0.75,0.25,CONGA,58
1,0.25,CLAP,62
1.5,0.25,HAT,42
1.75,0.25,BONGO,54
```

Notes:
```js
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
```

# Tempo

txt file
```
tempo=96
time_signature=4/4
key=A#
```