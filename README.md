# Timbre Cube

An interactive 3D timbre space explorer. Move a marker through a cube to morph a bowed cello sound in real time across three perceptual dimensions: **inharmonicity**, **spectral centroid** (brightness), and **noisiness**.

**Live demo:** [https://jordan77-lang.github.io/New-timbre/docs/](https://jordan77-lang.github.io/New-timbre/docs/)

---

## What Is Timbre?

Timbre (pronounced "TAM-ber") is the quality that makes two instruments playing the same note sound different. A cello and a flute playing the same G4 (392 Hz) are instantly distinguishable — that difference is timbre.

Researchers have identified measurable properties of sound that correspond to how we perceive timbre. The three most important, according to multidimensional scaling studies, are:

1. **Attack time** — how quickly the sound starts (replaced here by **inharmonicity** for continuous exploration)
2. **Spectral centroid** — how "bright" or "dark" the sound is
3. **Spectral flux / noisiness** — how much the sound changes from moment to moment, or how much noise is present

> **Source:** Grey, J. M. (1977). "Multidimensional perceptual scaling of musical timbres." *Journal of the Acoustical Society of America*, 61(5), 1270–1277. Grey's foundational study established that timbre perception can be modeled in three dimensions.

> **Source:** McAdams, S., Winsberg, S., Donnadieu, S., De Soete, G., & Krimphoff, J. (1995). "Perceptual scaling of synthesized musical timbres." *Psychological Research*, 58, 177–192. Extended Grey's work to show spectral centroid and spectral flux are primary perceptual dimensions.

---

## What Is a Timbre Space?

A timbre space maps these measurable properties onto spatial axes. Each point in the space represents a unique timbral quality. By moving through the space, you smoothly morph between different timbral characters.

The Timbre Cube implements this as a literal 3D cube with:
- **X-axis** → Inharmonicity (how "rough" or "metallic" the sound is)
- **Y-axis** → Spectral Centroid (how "bright" or "dark")
- **Z-axis** → Noisiness (how "breathy" or "turbulent")

> **Source:** Peeters, G., Giordano, B. L., Susini, P., Misdariis, N., & McAdams, S. (2011). "The Timbre Toolbox: Extracting audio descriptors from musical signals." *Journal of the Acoustical Society of America*, 130(5), 2902–2916. Defines the descriptors used as axes.

> **Source:** Reid, L. (2019). *Composing with Timbre*. Describes timbre space visualization approaches for composition pedagogy.

---

## The Base Sound: Procedurally Generated Bowed Cello (G4)

At position **(0, 0, 0)** — the origin — you hear a pure, unmanipulated bowed cello sustaining a G4 note (392 Hz). No effects, no modulation, no noise. Just the raw cello tone.

### Why a Cello?

A cello was chosen as the base sound because:

1. **Full harmonic series.** A bowed string produces both odd *and* even harmonics, giving the spectral filters more "clay to sculpt." By contrast, a clarinet produces predominantly odd harmonics (3rd, 5th, 7th), which limits the range of timbral variation the Y-axis can achieve.

2. **Neutral identity.** A cello sustain is less immediately recognizable than, say, a clarinet or trumpet. This helps the listener perceive the timbre changes as a continuous space rather than hearing "an instrument with effects."

3. **Natural variation.** Bowed strings inherently contain micro-fluctuations from the bow-string interaction — this gives the base sound organic life without needing artificial modulation.

### How the Sample Is Generated

The file `Cello_G4.wav` is generated procedurally by `generate_cello.js` using physical modeling:

1. **Helmholtz motion.** A bowed string moves in a characteristic pattern discovered by Hermann von Helmholtz in 1863: a "sawtooth" waveform where the string sticks to the bow, then slips free. This produces a waveform where harmonic amplitudes fall off as 1/n (where n is the harmonic number).

   > **Source:** Helmholtz, H. von (1863). *Die Lehre von den Tonempfindungen als physiologische Grundlage für die Theorie der Musik* (*On the Sensations of Tone*). The foundational work describing bowed-string vibration.

2. **Body resonances.** 7 biquad peaking filters simulate the cello's wooden body cavity, which amplifies certain frequencies and dampens others. These resonances are what make a cello sound like a cello and not a violin or viola (even though all use bowed strings). The resonance frequencies are modeled from acoustic measurements:
   - 220 Hz — Air resonance (the "A0" mode, where air moves in/out of the f-holes)
   - 390 Hz — Main wood resonance near the fundamental
   - 580 Hz — T1 body mode (the top plate's first bending mode)
   - 850 Hz — Secondary body mode
   - 1200 Hz — Bridge resonance
   - 2800 Hz — Brilliance region
   - 4200 Hz — Air/bridge interaction

   > **Source:** Woodhouse, J. (2014). "The acoustics of the violin: a review." *Reports on Progress in Physics*, 77(11), 115901. While focused on violin, the body-resonance modeling principles apply to all bowed strings.

3. **Bow noise.** Filtered white noise at 2.5% level simulates the friction of rosin on the string — the subtle "shhh" you hear in any bowed instrument up close.

4. **Crossfade looping.** The last 0.5 seconds of the sample are crossfaded with the beginning using equal-power curves, ensuring seamless looping with no clicks.

---

## The Three Axes — In Detail

### X-Axis: Inharmonicity (0 = pure → 1 = rough/metallic)

#### What Is Inharmonicity?

When a note is perfectly harmonic, all its overtones (harmonics) are exact integer multiples of the fundamental frequency. G4 at 392 Hz would have harmonics at 784, 1176, 1568 Hz, and so on.

**Inharmonicity** is when these overtones drift away from those perfect ratios. A piano string, for example, is stiff, which causes its upper harmonics to be slightly sharp — this is why pianos have a characteristic "shimmering" quality. At extreme values, inharmonicity produces metallic, bell-like tones (bells have highly inharmonic overtones).

> **Source:** Fletcher, N. H., & Rossing, T. D. (1998). *The Physics of Musical Instruments*, Ch. 12. Defines inharmonicity in piano strings and its perceptual effect.

> **Source:** Peeters et al. (2011), §III.B.2. Defines the "Inharmonicity" descriptor as the divergence of spectral components from harmonic positions.

#### How the Code Manipulates Inharmonicity

The code uses **three techniques** that increase in intensity:

**1. Asymmetric detuned copies** (main effect)

Two additional copies of the cello sample play simultaneously, but with their playback speed slightly altered to shift their pitch:

```
detuneHiCents = lerp(7, 45, inharmonicity)    // sharp copy: +7 to +45 cents
detuneLoCents = lerp(-11, -55, inharmonicity)  // flat copy: -11 to -55 cents

playbackRate = 2^(cents / 1200)  // convert cents to frequency ratio
```

*In plain English:* One copy plays slightly sharp, one slightly flat. At x=0, the shift is barely noticeable (7 cents sharp, 11 cents flat — less than a quarter-tone). At x=1, the copies diverge to 45 cents sharp and 55 cents flat, creating strong beating and roughness.

The detuning is **asymmetric** (the flat copy drifts further than the sharp copy) because this is how real-world inharmonicity works — piano strings stretch partials upward more than downward.

**2. Ring modulation** (high-x metallic quality)

At x > 0.5, a ring modulator begins to engage. Ring modulation multiplies the signal by a low-frequency oscillator, which creates **sum and difference frequencies** — tones that don't exist in the harmonic series. This produces a metallic, bell-like quality.

```
ringModAmount = clamp((inharmonicity - 0.5)² × 1.6, 0, 0.35)
ringFreq = lerp(0.5, 8, inharmonicity)  // Hz
```

*In plain English:* Below x=0.5, there's no ring modulation. Above x=0.5, the effect fades in gradually, and the modulation frequency increases — creating increasingly complex, metallic overtones.

**3. Primary sample level** (gain rebalancing)

```
primaryLevel = lerp(0.95, 0.45, inharmonicity)
detuneLevel  = lerp(0, 0.40, inharmonicity^0.7)
```

As the detuned copies get louder, the primary (centered) copy gets quieter. This prevents the overall volume from increasing and shifts the timbral center toward the rougher, detuned sound.

---

### Y-Axis: Spectral Centroid (0 = dark/warm → 1 = bright/brilliant)

#### What Is Spectral Centroid?

The spectral centroid is the "center of mass" of a sound's frequency spectrum. Think of it like a seesaw: if you placed all the sound's energy on a beam, the spectral centroid is the balance point.

- **Low spectral centroid** → most energy in lower frequencies → sounds "dark," "warm," "mellow" (like a muted trumpet)
- **High spectral centroid** → energy spread into upper frequencies → sounds "bright," "brilliant," "edgy" (like a harpsichord)

> **Source:** Peeters et al. (2011), §III.A.1. Defines spectral centroid as "the gravity center of the spectrum" and identifies it as the primary correlate of perceived brightness.

> **Source:** Schubert, E., & Wolfe, J. (2006). "Does timbral brightness scale with frequency and spectral centroid?" *Acta Acustica united with Acustica*, 92(5), 820–825. Experimentally confirms that perceived brightness correlates strongly with spectral centroid.

#### How the Code Manipulates Spectral Centroid

The code uses **four parallel techniques** that work together:

**1. Lowpass filter** — Controls the upper boundary of audible frequencies

```
yPerceptual = spectralCentroid^0.6      // perceptual curve (see below)
lpFreq = lerp(4500, 16000, yPerceptual) // Hz
```

*In plain English:* At y=0, a lowpass filter allows frequencies up to ~4500 Hz and rolls off everything above. At y=1, the filter opens to ~16000 Hz, allowing the full spectrum through. The rolloff is gentle (-12 dB/octave instead of -24) so it softens the highs without making the sound muffled.

**Why the power curve?** Human hearing is logarithmic — the perceptual difference between 1000 Hz and 2000 Hz feels the same as between 2000 Hz and 4000 Hz. The `pow(y, 0.6)` curve maps the linear slider position to a perceptually even brightness change.

**2. 3-band tilt EQ** — Shifts the overall spectral balance

```
lowTilt  = lerp(+4, -3, yPerceptual)   // dB: bass shelf
midTilt  = lerp(-1, +1, yPerceptual)   // dB: mid band
highTilt = lerp(-5, +6, yPerceptual)   // dB: treble shelf
```

*In plain English:* This is like a sophisticated bass/treble knob. At y=0, the bass is boosted (+4 dB) and treble is cut (-5 dB) — making the sound warm and full. At y=1, treble is boosted (+6 dB) and bass is slightly cut (-3 dB) — making it bright and forward. This shifts the spectral centroid by redistributing energy across the spectrum.

**3. Formant filters** — Simulate acoustic body cavity resonances

```
f1Freq = lerp(400, 900, yPerceptual)   // Lower resonance
f2Freq = lerp(1200, 2800, yPerceptual) // Upper resonance
```

*In plain English:* Acoustic instruments have "formants" — frequency regions where the body amplifies the sound. This is why a cello sounds different from a viola even playing the same note. The two peaking filters shift upward in frequency as brightness increases — simulating a smaller, brighter-sounding body cavity.

> **Source:** Sundberg, J. (1987). *The Science of the Singing Voice*, Ch. 4. Describes formant frequencies and their role in timbre perception, particularly in the voice (which the instrument body parallels).

**4. Chebyshev saturation** — Warm harmonics at dark end

```
satWet = lerp(0.20, 0.05, yPerceptual)
```

At the dark end (y=0), a Chebyshev waveshaper adds subtle 2nd-order harmonics — the same kind of harmonic distortion that vacuum tube amplifiers produce. This adds warmth without harshness. At the bright end, saturation is minimal so the high frequencies stay clean.

> **Source:** Park, T. H. (2009). *Introduction to Digital Signal Processing*, §10.3. Describes Chebyshev waveshaping as a method of generating specific harmonic orders.

---

### Z-Axis: Noisiness (0 = clean → 1 = breathy/turbulent)

#### What Is Noisiness?

Noisiness describes the ratio of aperiodic (random) to periodic (harmonic) energy in a sound. A sine wave has zero noisiness; white noise has maximum noisiness. Real instruments fall between these extremes:

- A flute at low noisiness → clean, pure tone
- A flute at high noisiness → breathy, airy tone (air turbulence across the embouchure)
- A cymbal → almost entirely noise (aperiodic vibration)

> **Source:** Peeters et al. (2011), §III.A.5. Defines "Noisiness" as a ratio of noise energy to total energy in the spectrum.

> **Source:** Beauchamp, J. W. (2007). "Analysis and synthesis of musical instrument sounds." In *Analysis, Synthesis, and Perception of Musical Sounds*, Springer. Discusses the role of noise components in instrument timbre.

#### How the Code Manipulates Noisiness

The code creates **two noise paths** that blend in as the Z-axis increases:

**1. Breath noise** — Musical, harmonically aware

```
breathLevel = lerp(0, 0.25, noisiness^0.6)
breathFreq  = lerp(800, 4000, yPerceptual)  // tracks Y-axis!
breathQ     = lerp(3.0, 0.8, noisiness)
```

*In plain English:* Pink noise (which has equal energy per octave, matching how we hear) is filtered through a bandpass filter. The center frequency of this filter **tracks the Y-axis** — when the sound is dark, the noise is centered in lower frequencies; when bright, the noise is centered higher. This keeps the noise musically integrated with the tone rather than sounding like random hiss layered on top.

The Q (bandwidth) **widens as noisiness increases**: at low Z, the noise is narrow (almost tonal, like a subtle breath); at high Z, it's wide (like turbulent airflow).

**2. Air turbulence** — Broadband character

```
airLevel = lerp(0, 0.22, ((noisiness - 0.2) / 0.8)^0.8)
airFreq  = lerp(1500, 7000, yPerceptual)
```

*In plain English:* A second noise source (white noise through a wide bandpass) adds broadband energy at higher Z values. It doesn't appear until z > 0.2, then gradually increases. Like the breath noise, its frequency center follows the Y-axis.

**3. Modulated breath** — Organic pulsing

An AutoFilter (LFO-controlled filter) adds slow, wavering modulation to the breath noise:

```
breathModRate = lerp(1.5, 6.0, noisiness) // Hz
```

This simulates the natural fluctuation of a musician's breath — at low noisiness it pulses slowly (1.5 Hz), at high noisiness it flutters quickly (6 Hz).

---

## Cross-Axis Interactions

The three axes don't operate in complete isolation. Several interactions create more natural-sounding transitions between regions of the cube:

| Condition | Effect | Why |
|-----------|--------|-----|
| High brightness + high noisiness | Increased reverb send | Bright, noisy sounds scatter more in acoustic spaces |
| High inharmonicity + high brightness | Extra saturation | Simulates bell-like brilliance (bells are both inharmonic and bright) |
| Low brightness + high noisiness | Noise frequency shifts downward | Prevents dark noisy sounds from having incongruent high-frequency hiss |
| Distance from origin increases | Vibrato and tremolo depth increase | More "extreme" timbres benefit from expressive modulation to stay musical |

```
reverbAmount = clamp(0.12 + centroid×0.10 + noisiness×0.12 + inharm×0.06, 0.10, 0.40)
vibratoDepth = lerp(0, 18, distFromOrigin)  // cents
tremoloDepth = lerp(1.0, 0.78, distFromOrigin)  // amplitude range
```

---

## Sound Architecture: Source → Body → Air

The audio engine is organized as three conceptual layers, inspired by how acoustic instruments actually produce sound:

```
┌─────────────────────────────────────────────────────────┐
│  SOURCE (what vibrates)                                  │
│  ├── Primary cello sample (centered)                     │
│  ├── Detuned copy +sharp (asymmetric inharmonicity)      │
│  ├── Detuned copy −flat                                  │
│  └── Ring modulator (metallic overtones at high X)       │
│                          ↓                               │
│  BODY (what shapes the spectrum)                         │
│  ├── Lowpass filter (gentle -12 dB/oct)                  │
│  ├── 3-band tilt EQ (spectral balance)                   │
│  ├── Formant 1 (lower body resonance)                    │
│  ├── Formant 2 (upper body resonance)                    │
│  └── Chebyshev saturation (tube warmth)                  │
│                          ↓                               │
│  AIR (what adds turbulence)                              │
│  ├── Breath noise (bandpass, formant-tracking)           │
│  ├── Air turbulence (wide bandpass, broadband)           │
│  └── Breath modulation (AutoFilter, organic pulsing)     │
│                          ↓                               │
│  OUTPUT                                                  │
│  ├── Tremolo LFO (amplitude variation)                   │
│  ├── Amplitude envelope (attack/sustain/release)         │
│  ├── Master output                                       │
│  └── Reverb send (convolution with early reflections)    │
└─────────────────────────────────────────────────────────┘
```

All signal paths (source, noise, breath) merge before the body filters, so they share the same spectral shaping and envelope. This is critical for **auditory stream integration** — our ears interpret components that share a common spectral envelope and onset as coming from a single source.

> **Source:** Bregman, A. S. (1990). *Auditory Scene Analysis: The Perceptual Organization of Sound*. MIT Press. Describes the "common fate" principle: components that vary together (in frequency, amplitude, or onset) are grouped as a single auditory stream.

---

## Reverb: Procedural Convolution

Instead of using a recorded impulse response, the reverb uses a procedurally generated impulse response that simulates a small performance hall:

- **Duration:** 0.6 seconds
- **Decay:** Gentle exponential rolloff (power of 2.0)
- **Early reflections:** 6 discrete impulses at 7ms, 11ms, 17ms, 23ms, 31ms, and 41ms, simulating the first sound bounces off nearby walls
- **Stereo spread:** 1ms offset between channels for natural width

---

## Controls

| Control | Action |
|---------|--------|
| **Place Marker** | Spawn a marker at the cube center |
| **Click & Drag marker** | Move through the timbre space |
| **Scroll Wheel** | Adjust depth (Z axis / noisiness) |
| **W/S or ↑/↓** | Move forward/backward (Z) |
| **A/D or ←/→** | Move left/right (X / inharmonicity) |
| **Q/E** | Move up/down (Y / brightness) |
| **1-8** | Jump to corner presets |
| **0** | Return to center (pure cello) |
| **Drag rotation handle** | Rotate the cube view |
| **Clear Marker** | Remove all markers and stop sound |
| **Reset Cube Position** | Reset the cube rotation |
| **Download** | Save the spectrogram image |

---

## Technical Stack

- **[Three.js](https://threejs.org/)** (r128) — 3D rendering
- **[Tone.js](https://tonejs.github.io/)** (14.8.39) — Web Audio API abstraction for synthesis, filtering, and effects
- **Vanilla CSS** — Glassmorphic dark UI with Inter + JetBrains Mono typography

---

## References

- Beauchamp, J. W. (2007). "Analysis and synthesis of musical instrument sounds." In *Analysis, Synthesis, and Perception of Musical Sounds*. Springer.
- Bregman, A. S. (1990). *Auditory Scene Analysis: The Perceptual Organization of Sound*. MIT Press.
- Fletcher, N. H., & Rossing, T. D. (1998). *The Physics of Musical Instruments*. Springer.
- Grey, J. M. (1977). "Multidimensional perceptual scaling of musical timbres." *Journal of the Acoustical Society of America*, 61(5), 1270–1277.
- Helmholtz, H. von (1863). *On the Sensations of Tone as a Physiological Basis for the Theory of Music*.
- McAdams, S., Winsberg, S., Donnadieu, S., De Soete, G., & Krimphoff, J. (1995). "Perceptual scaling of synthesized musical timbres." *Psychological Research*, 58, 177–192.
- Park, T. H. (2009). *Introduction to Digital Signal Processing: Computer Musically Speaking*. World Scientific.
- Peeters, G., Giordano, B. L., Susini, P., Misdariis, N., & McAdams, S. (2011). "The Timbre Toolbox: Extracting audio descriptors from musical signals." *Journal of the Acoustical Society of America*, 130(5), 2902–2916.
- Reid, L. (2019). *Composing with Timbre*. Timbre space visualization for composition pedagogy.
- Schubert, E., & Wolfe, J. (2006). "Does timbral brightness scale with frequency and spectral centroid?" *Acta Acustica united with Acustica*, 92(5), 820–825.
- Sundberg, J. (1987). *The Science of the Singing Voice*. Northern Illinois University Press.
- Woodhouse, J. (2014). "The acoustics of the violin: a review." *Reports on Progress in Physics*, 77(11), 115901.
