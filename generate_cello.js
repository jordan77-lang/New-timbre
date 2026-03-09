// Generate a realistic bowed-cello-like sustained G4 using a bow-string model.
// Uses a sawtooth-based waveform (which is what a bowed string actually produces)
// with body resonance filtering, vibrato, and bow noise.
// Output: 16-bit PCM WAV, 44100 Hz, stereo, ~5 seconds

const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const DURATION = 5.0;
const FUNDAMENTAL = 130.81; // C3
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// --- Cello body resonance frequencies (simulates the wooden body cavity) ---
// These formant-like resonances are what make a cello sound like a cello.
// Data from acoustic measurements of cello body resonances.
const BODY_RESONANCES = [
    { freq: 220, Q: 3.0, gain: 0.6 },   // Air resonance (A0 mode)
    { freq: 390, Q: 4.0, gain: 0.8 },   // Main wood resonance near fundamental
    { freq: 580, Q: 2.5, gain: 0.5 },   // T1 mode
    { freq: 850, Q: 3.5, gain: 0.45 },  // Body mode
    { freq: 1200, Q: 2.0, gain: 0.3 },   // Bridge resonance
    { freq: 2800, Q: 1.5, gain: 0.15 },  // High body mode (brilliance)
    { freq: 4200, Q: 1.2, gain: 0.08 },  // Air/bridge interaction
];

// --- Vibrato parameters ---
const VIBRATO_RATE = 5.2;
const VIBRATO_DEPTH = 5.0; // cents
const VIBRATO_ONSET = 0.35;

// --- Bow parameters ---
const BOW_PRESSURE_VAR_RATE = 3.6; // Hz — slow bow pressure variation
const BOW_PRESSURE_VAR_DEPTH = 0.08;
const BOW_NOISE_LEVEL = 0.025; // Rosin/friction noise

// Simple biquad filter implementation for body resonances
class BiquadFilter {
    constructor(freq, Q, gain, sampleRate) {
        const w0 = 2 * Math.PI * freq / sampleRate;
        const alpha = Math.sin(w0) / (2 * Q);
        const A = Math.pow(10, gain / 2); // gain is linear here, not dB

        // Peaking EQ coefficients
        this.b0 = 1 + alpha * A;
        this.b1 = -2 * Math.cos(w0);
        this.b2 = 1 - alpha * A;
        this.a0 = 1 + alpha / A;
        this.a1 = -2 * Math.cos(w0);
        this.a2 = 1 - alpha / A;

        // Normalize
        this.b0 /= this.a0;
        this.b1 /= this.a0;
        this.b2 /= this.a0;
        this.a1 /= this.a0;
        this.a2 /= this.a0;

        this.x1 = 0; this.x2 = 0;
        this.y1 = 0; this.y2 = 0;
    }

    process(x) {
        const y = this.b0 * x + this.b1 * this.x1 + this.b2 * this.x2
            - this.a1 * this.y1 - this.a2 * this.y2;
        this.x2 = this.x1; this.x1 = x;
        this.y2 = this.y1; this.y1 = y;
        return y;
    }
}

// Simple 1-pole lowpass for smoothing
class OnePole {
    constructor(freq, sampleRate) {
        this.a = Math.exp(-2 * Math.PI * freq / sampleRate);
        this.b = 1 - this.a;
        this.y = 0;
    }
    process(x) {
        this.y = this.b * x + this.a * this.y;
        return this.y;
    }
}

function generateCello() {
    const left = new Float32Array(NUM_SAMPLES);
    const right = new Float32Array(NUM_SAMPLES);

    // Create body resonance filters (one set per channel for slight stereo variation)
    const bodyFiltersL = BODY_RESONANCES.map(r =>
        new BiquadFilter(r.freq, r.Q, r.gain, SAMPLE_RATE)
    );
    const bodyFiltersR = BODY_RESONANCES.map(r =>
        new BiquadFilter(r.freq * 1.003, r.Q, r.gain, SAMPLE_RATE) // Slight detuning for stereo width
    );

    // Noise smoothing filter (shapes white noise into bow-like friction spectrum)
    const noiseFilterL = new BiquadFilter(2500, 0.8, 0.5, SAMPLE_RATE);
    const noiseFilterR = new BiquadFilter(2500, 0.8, 0.5, SAMPLE_RATE);

    // Phase accumulator for the sawtooth oscillator
    let phase = 0;

    // Random walk state for per-cycle bow irregularity
    let bowJitter = 0;

    // No attack/release envelope — Tone.js AmplitudeEnvelope handles that.
    // This sample is designed to be looped seamlessly.

    for (let i = 0; i < NUM_SAMPLES; i++) {
        const t = i / SAMPLE_RATE;

        // --- Vibrato ---
        const vibEnv = Math.min(1, Math.max(0, (t - VIBRATO_ONSET) / 0.25));
        const vibCents = VIBRATO_DEPTH * vibEnv *
            Math.sin(2 * Math.PI * VIBRATO_RATE * t);
        const freq = FUNDAMENTAL * Math.pow(2, vibCents / 1200);

        // --- Bow pressure variation (tremolo) ---
        const bowPressure = 1.0 - BOW_PRESSURE_VAR_DEPTH * 0.5 *
            (1 + Math.sin(2 * Math.PI * BOW_PRESSURE_VAR_RATE * t + 0.4));

        // --- Bowed string oscillator (Helmholtz motion) ---
        const phaseInc = freq / SAMPLE_RATE;
        phase += phaseInc;
        if (phase >= 1.0) phase -= 1.0;

        // Per-cycle jitter
        if (phase < phaseInc) {
            bowJitter += (Math.random() - 0.5) * 0.003;
            bowJitter *= 0.95;
        }

        // Band-limited sawtooth
        let saw = 0;
        const maxHarmonic = Math.min(32, Math.floor(SAMPLE_RATE / (2 * freq)));
        for (let n = 1; n <= maxHarmonic; n++) {
            let amp = 1.0 / n;
            if (n % 2 === 0) amp *= 1.08;
            const hJitter = bowJitter * n * 0.3;
            saw += amp * Math.sin(2 * Math.PI * n * (phase + hJitter));
        }
        saw *= -2.0 / Math.PI;

        // --- Bow friction noise ---
        const rawNoise = Math.random() * 2 - 1;
        const bowNoiseL = noiseFilterL.process(rawNoise) * BOW_NOISE_LEVEL;
        const bowNoiseR = noiseFilterR.process(rawNoise * 0.95 + (Math.random() * 2 - 1) * 0.05) * BOW_NOISE_LEVEL;

        // --- Mix ---
        const drySignal = saw * bowPressure;
        let sigL = drySignal + bowNoiseL;
        let sigR = drySignal + bowNoiseR;

        // --- Body resonance ---
        for (const f of bodyFiltersL) sigL = f.process(sigL);
        for (const f of bodyFiltersR) sigR = f.process(sigR);

        left[i] = drySignal * 0.3 + sigL * 0.7;
        right[i] = drySignal * 0.3 + sigR * 0.7;
    }

    // --- Crossfade for seamless looping ---
    // The last CROSSFADE_SAMPLES blend into the beginning using equal-power crossfade.
    // This eliminates the click at the loop boundary.
    const CROSSFADE_SECONDS = 0.5;
    const CROSSFADE_SAMPLES = Math.floor(SAMPLE_RATE * CROSSFADE_SECONDS);
    for (let i = 0; i < CROSSFADE_SAMPLES; i++) {
        const t = i / CROSSFADE_SAMPLES; // 0..1
        // Equal-power crossfade: uses sqrt curves so energy stays constant
        const fadeOut = Math.cos(t * Math.PI * 0.5); // 1->0
        const fadeIn = Math.sin(t * Math.PI * 0.5);  // 0->1
        const endIdx = NUM_SAMPLES - CROSSFADE_SAMPLES + i;
        left[endIdx] = left[endIdx] * fadeOut + left[i] * fadeIn;
        right[endIdx] = right[endIdx] * fadeOut + right[i] * fadeIn;
    }

    // --- Normalize ---
    let maxAbs = 0;
    for (let i = 0; i < NUM_SAMPLES; i++) {
        maxAbs = Math.max(maxAbs, Math.abs(left[i]), Math.abs(right[i]));
    }
    const gain = 0.82 / maxAbs;
    for (let i = 0; i < NUM_SAMPLES; i++) {
        left[i] *= gain;
        right[i] *= gain;
    }

    return { left, right };
}

function writeWav(filePath, leftChannel, rightChannel) {
    const numChannels = 2;
    const bitsPerSample = 16;
    const bytesPerSample = bitsPerSample / 8;
    const blockAlign = numChannels * bytesPerSample;
    const byteRate = SAMPLE_RATE * blockAlign;
    const dataSize = NUM_SAMPLES * blockAlign;
    const fileSize = 44 + dataSize;

    const buffer = Buffer.alloc(fileSize);
    let offset = 0;

    buffer.write('RIFF', offset); offset += 4;
    buffer.writeUInt32LE(fileSize - 8, offset); offset += 4;
    buffer.write('WAVE', offset); offset += 4;
    buffer.write('fmt ', offset); offset += 4;
    buffer.writeUInt32LE(16, offset); offset += 4;
    buffer.writeUInt16LE(1, offset); offset += 2;
    buffer.writeUInt16LE(numChannels, offset); offset += 2;
    buffer.writeUInt32LE(SAMPLE_RATE, offset); offset += 4;
    buffer.writeUInt32LE(byteRate, offset); offset += 4;
    buffer.writeUInt16LE(blockAlign, offset); offset += 2;
    buffer.writeUInt16LE(bitsPerSample, offset); offset += 2;
    buffer.write('data', offset); offset += 4;
    buffer.writeUInt32LE(dataSize, offset); offset += 4;

    for (let i = 0; i < NUM_SAMPLES; i++) {
        const l = Math.max(-1, Math.min(1, leftChannel[i]));
        const r = Math.max(-1, Math.min(1, rightChannel[i]));
        buffer.writeInt16LE(Math.round(l * 32767), offset); offset += 2;
        buffer.writeInt16LE(Math.round(r * 32767), offset); offset += 2;
    }

    fs.writeFileSync(filePath, buffer);
    console.log(`Written: ${filePath} (${(fileSize / 1024).toFixed(1)} KB, ${DURATION}s)`);
}

const { left, right } = generateCello();
const outPath = path.join(__dirname, 'docs', 'assets', 'sounds', 'Cello_C3.wav');
writeWav(outPath, left, right);
console.log('Done! Bowed-string cello G4 generated with:');
console.log(`  - Band-limited sawtooth (Helmholtz bow model, up to 32 harmonics)`);
console.log(`  - ${BODY_RESONANCES.length} body resonance filters`);
console.log(`  - Vibrato: ${VIBRATO_RATE} Hz, ${VIBRATO_DEPTH} cents`);
console.log(`  - Bow noise: ${BOW_NOISE_LEVEL * 100}% level`);
console.log(`  - Duration: ${DURATION}s`);
