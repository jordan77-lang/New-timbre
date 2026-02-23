# Timbre Cube

Interactive 3D timbre space visualization based on Leah Reid's research and the timbre descriptors from Peeters et al. (2011).

**Live demo:** https://jordan77-lang.github.io/timber/

---

## Overview

The Timbre Cube is an interactive 3D timbre space where each axis controls a perceptual descriptor (Peeters et al., 2011). Moving the marker morphs a real clarinet sample in real time.

- **Pure origin:** (x, y, z) = (0, 0, 0) plays the unmodified clarinet sample—the most "pure/clean/dark" sound.
- **One-sided axes:** Increasing any coordinate adds that descriptor (roughness, brightness, noisiness).
- **Coherent source:** All components (sample, noise, breath) share one filter/envelope path for fusion (Gestalt common fate; Bregman, 1990).
- **Perceptual scaling:** Brightness uses a pow curve; noise follows the same tilt for one-source perception; detune jitter is slow and correlated.

---

## The Three Axes

### X-Axis: Inharmonicity (0 → rougher)

**What it is:** Deviation from perfect harmonic partials; more inharmonicity yields roughness/beating.

**Previous Version:** Used a raw digital PitchShift. This often creates smeary, metallic, robotic artifacts. 

**Current Version:** Uses a `Tone.Chorus` effect. A chorus involves modulating multiple delay lines to create detuning and beating. This is mathematically and psychoacoustically similar to mixing slightly out-of-tune voices, but it sounds lush, thick, and organic rather than robotic.

**What you hear:**
- **x = 0 (pure):** Unmodified clarinet sample.
- **x → 1:** Increasing roughness and beating from the chorus effect mixing in.

**The math:**
```
inharmonicity = x               // 0..1
sampleLevel = lerp(0.97, 0.6, x * 0.8)
chorusLevel = lerp(0.0, 0.6, x)

// Chorus depth and rate ramp up with inharmonicity
chorusDepth = lerp(0.4, 1.0, x)
chorusFreq  = lerp(1.5, 4.0, x)
```

---

### Y-Axis: Spectral Centroid (0 → brighter)

**What it is:** Perceptual brightness; the spectral "center of mass." Higher y lifts brightness.

**What you hear:**
- **y = 0:** Dark/mellow.
- **y → 1:** Bright, brilliant.

**The math:**
```
spectralCentroid = y                      // 0..1
yPerceptual = pow(y, 0.6)                 // perceptual-ish curve
cutoffBase = lerp(700, 13500, yPerceptual)
cutoff     = clamp(cutoffBase + jitterShared, 500, 14500)

filterQ  = clamp(0.8 + 1.1 * spectralCentroid, 0.3, 1.9)
highShelf = (spectralCentroid - 0.5) * 8   // softer, centered tilt
```

Brightness, noise color, and breath all share this same filter tilt for one-source coherence.

---

### Z-Axis: Noisiness (0 → noisier)

**What it is:** Amount and bandwidth of aperiodic (noise) energy.

**Previous Version:** Scaled the volume of a static pink noise generator passed through a static bandpass filter. This sounded like radio static layered linearly on top of the clarinet.

**Current Version:** Uses a `Tone.AutoFilter`. This dynamically sweeps the cutoff frequency of the breath noise using an internal LFO (Low Frequency Oscillator). This simulates the organic, wavering air pressure of human breath.

**What you hear:**
- **z = 0:** Very clean, minimal breath.
- **z → 1:** Airier/breathier, with a fluttering noise band that sounds alive.

**The math:**
```
noisiness = z                       // 0..1
noiseFreqBase = lerp(600, 8000, yPerceptual)
noiseFreq     = clamp(noiseFreqBase + jitterShared * 0.35, 400, 9000)

noiseLevel = clamp(0.01 + 0.45 * noisiness^0.8 + jitterShared / 9000, 0.001, 0.55)
noiseQ     = clamp(1.2 - 0.8 * noisiness, 0.35, 2.0)

// Breath flutter rate scales with noisiness
breathRate = lerp(0.5, 5.0, noisiness)
```

Noise base frequency shares the same filter tilt as the tone to preserve single-source perception.

---

## Cross-Parameter Interactions

**Reverb Send:** Increases with brightness and noisiness, capped for clarity
```
reverbAmount = min(0.28, 0.15 + spectralCentroid * 0.08 + noisiness * 0.10)
```

---

## Sound Synthesis Architecture (coherent path)

- **Base sample:** Real clarinet recording (`Clarinet_G.wav`) loops continuously as the pure source at origin (0,0,0).
- **Inharmonicity (X):** Modulated through a `Tone.Chorus` effect. This avoids the metallic artifacts of raw PitchShifting by using modulated delay lines to create a lush, organic beating effect.
- **Noise (Z):** Pink noise dynamically filtered through a `Tone.AutoFilter`. The flutter rate (LFO) increases with the Z-axis to mimic the wavering pressure of a player blowing harder.
- **Breath transient:** Short white-noise bandpass on note start.
- **Shared chain:** lowpass (centroid, pow-mapped) → gentle high-shelf → body bell (≈1.85 kHz, +2 dB) → Tone.Chebyshev saturation → amplitude envelope → output + reverb send.
- **Saturation Details:** Previous versions used hard clipping `Tone.Distortion`, which adds harsh, unmusical high-order harmonics. The current version uses `Tone.Chebyshev(2)`. This waveshaper algorithm strictly adds 2nd-order even harmonics (similar to a physical vacuum tube amplifier). This warms up the sound and glues the chorus and breath layers together naturally without digital harshness. 
- **Reverb:** Small-room convolution IR; send scaled by Y/Z and capped for clarity.

This shared path reinforces one-source perception (all components share onset, filter, and envelope), aligning with common-fate cues (Bregman, 1990) while applying timbre descriptors (Peeters et al., 2011).

---

## Controls

| Control | Action |
|---------|--------|
| **Click & Drag** | Move marker freely inside the cube (keeps current depth); scroll or Q/E for coarse depth shifts |
| **Scroll Wheel** | Adjust depth (Z axis) |
| **W/S or ↑/↓** | Move forward/backward (Z) |
| **A/D or ←/→** | Move left/right (X) |
| **Q/E** | Move up/down (Y) |
| **1-8** | Jump to corner presets |
| **0** | Return to center |
| **Drag rotation handle** | Rotate the cube view |

---

## References

- Peeters, G., Giordano, B. L., Susini, P., Misdariis, N., & McAdams, S. (2011). The Timbre Toolbox: Extracting audio descriptors from musical signals. *Journal of the Acoustical Society of America*, 130(5), 2902-2916.
- Bregman, A. S. (1990). *Auditory Scene Analysis*. MIT Press (common-fate cue for source fusion).
- Reid, L. - Timbre space visualization research
