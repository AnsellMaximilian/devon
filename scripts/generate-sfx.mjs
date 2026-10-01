import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const RATE = 32_000;
const TAU = Math.PI * 2;
const outputDirectory = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "audio");
mkdirSync(outputDirectory, { recursive: true });

let randomState = 0xdecafbad;
const random = () => {
  randomState ^= randomState << 13;
  randomState ^= randomState >>> 17;
  randomState ^= randomState << 5;
  return ((randomState >>> 0) / 0xffffffff) * 2 - 1;
};

const envelope = (time, duration, attack = .01, release = .12) => {
  const attackGain = Math.min(1, time / Math.max(.001, attack));
  const releaseGain = Math.min(1, (duration - time) / Math.max(.001, release));
  return Math.max(0, Math.min(attackGain, releaseGain));
};

const makeSound = (duration) => new Float64Array(Math.ceil(duration * RATE));

function tone(buffer, { start = 0, duration, from, to = from, gain = .3, wave = "sine", attack = .005, release = .1 }) {
  const first = Math.floor(start * RATE);
  const samples = Math.floor(duration * RATE);
  let phase = 0;
  for (let i = 0; i < samples && first + i < buffer.length; i += 1) {
    const t = i / RATE;
    const progress = t / duration;
    const frequency = from + (to - from) * progress;
    phase += TAU * frequency / RATE;
    const base = wave === "square" ? Math.sign(Math.sin(phase))
      : wave === "triangle" ? (2 / Math.PI) * Math.asin(Math.sin(phase))
        : wave === "saw" ? 2 * ((phase / TAU) % 1) - 1
          : Math.sin(phase);
    buffer[first + i] += base * gain * envelope(t, duration, attack, release);
  }
}

function noise(buffer, { start = 0, duration, gain = .2, attack = .001, release = .08, color = 0 }) {
  const first = Math.floor(start * RATE);
  const samples = Math.floor(duration * RATE);
  let filtered = 0;
  for (let i = 0; i < samples && first + i < buffer.length; i += 1) {
    const value = random();
    filtered = filtered * color + value * (1 - color);
    buffer[first + i] += filtered * gain * envelope(i / RATE, duration, attack, release);
  }
}

function echo(buffer, seconds, gain) {
  const delay = Math.floor(seconds * RATE);
  for (let i = delay; i < buffer.length; i += 1) buffer[i] += buffer[i - delay] * gain;
}

function click(buffer, start, pitch = 950, gain = .24) {
  noise(buffer, { start, duration: .025, gain, release: .02, color: .1 });
  tone(buffer, { start, duration: .045, from: pitch, to: pitch * .62, gain, wave: "square", release: .04 });
}

function writeWav(name, buffer) {
  const edge = Math.min(96, Math.floor(buffer.length / 2));
  for (let i = 0; i < edge; i += 1) {
    const fade = i / edge;
    buffer[i] *= fade;
    buffer[buffer.length - 1 - i] *= fade;
  }
  let peak = .001;
  for (const sample of buffer) peak = Math.max(peak, Math.abs(sample));
  const scale = .9 / peak;
  const dataSize = buffer.length * 2;
  const wav = Buffer.alloc(44 + dataSize);
  wav.write("RIFF", 0);
  wav.writeUInt32LE(36 + dataSize, 4);
  wav.write("WAVE", 8);
  wav.write("fmt ", 12);
  wav.writeUInt32LE(16, 16);
  wav.writeUInt16LE(1, 20);
  wav.writeUInt16LE(1, 22);
  wav.writeUInt32LE(RATE, 24);
  wav.writeUInt32LE(RATE * 2, 28);
  wav.writeUInt16LE(2, 32);
  wav.writeUInt16LE(16, 34);
  wav.write("data", 36);
  wav.writeUInt32LE(dataSize, 40);
  for (let i = 0; i < buffer.length; i += 1) wav.writeInt16LE(Math.round(Math.max(-1, Math.min(1, buffer[i] * scale)) * 32767), 44 + i * 2);
  writeFileSync(join(outputDirectory, `${name}.wav`), wav);
}

const sounds = {
  "ui-confirm": () => {
    const b = makeSound(.2);
    tone(b, { duration: .12, from: 520, to: 690, gain: .35, wave: "triangle", release: .08 });
    tone(b, { start: .055, duration: .12, from: 920, to: 1100, gain: .2, release: .09 });
    return b;
  },
  "office-place": () => {
    const b = makeSound(.43);
    tone(b, { duration: .35, from: 105, to: 52, gain: .48, release: .28 });
    noise(b, { duration: .16, gain: .34, release: .15, color: .7 });
    click(b, .03, 720, .25);
    return b;
  },
  "card-deal": () => {
    const b = makeSound(.72);
    noise(b, { duration: .6, gain: .24, attack: .12, release: .18, color: .35 });
    tone(b, { start: .08, duration: .48, from: 190, to: 640, gain: .2, wave: "triangle", attack: .1, release: .14 });
    click(b, .58, 1150, .18);
    return b;
  },
  "card-place": () => {
    const b = makeSound(.31);
    tone(b, { duration: .24, from: 145, to: 82, gain: .4, release: .2 });
    click(b, .018, 1300, .32);
    click(b, .07, 760, .16);
    return b;
  },
  "project-lock": () => {
    const b = makeSound(.67);
    [330, 440, 660].forEach((pitch, index) => tone(b, { start: index * .105, duration: .36, from: pitch, to: pitch * 1.025, gain: .25, wave: "triangle", release: .25 }));
    click(b, .34, 1500, .18);
    echo(b, .12, .2);
    return b;
  },
  "sequence-start": () => {
    const b = makeSound(.64);
    [0, .17, .36].forEach((start, index) => {
      tone(b, { start, duration: .16, from: 370 + index * 120, to: 430 + index * 135, gain: .3, wave: "square", release: .1 });
      tone(b, { start, duration: .2, from: 740 + index * 160, gain: .13, release: .16 });
    });
    return b;
  },
  "wheel-spin": () => {
    const b = makeSound(1.5);
    tone(b, { duration: 1.43, from: 82, to: 125, gain: .075, wave: "saw", attack: .1, release: .16 });
    let time = .02;
    let interval = .13;
    while (time < 1.42) {
      click(b, time, 880 + time * 300, .1 + time * .045);
      time += interval;
      interval = Math.max(.036, interval * .9);
    }
    return b;
  },
  "needle-land": () => {
    const b = makeSound(.23);
    click(b, 0, 1650, .38);
    tone(b, { start: .018, duration: .19, from: 1160, to: 920, gain: .25, wave: "triangle", release: .15 });
    return b;
  },
  "work-success": () => {
    const b = makeSound(.74);
    [523, 659, 784, 1047].forEach((pitch, index) => tone(b, { start: index * .095, duration: .34, from: pitch, gain: .24, wave: "triangle", release: .25 }));
    echo(b, .14, .18);
    return b;
  },
  "work-fail": () => {
    const b = makeSound(.66);
    tone(b, { duration: .58, from: 330, to: 122, gain: .34, wave: "saw", release: .18 });
    tone(b, { start: .08, duration: .48, from: 238, to: 89, gain: .25, wave: "triangle", release: .2 });
    noise(b, { start: .39, duration: .2, gain: .12, release: .16, color: .72 });
    return b;
  },
  "skip": () => {
    const b = makeSound(.38);
    tone(b, { duration: .22, from: 245, to: 165, gain: .36, wave: "triangle", release: .18 });
    click(b, .03, 510, .16);
    click(b, .14, 380, .1);
    return b;
  },
  "taunt": () => {
    const b = makeSound(.86);
    tone(b, { duration: .23, from: 245, to: 430, gain: .3, wave: "saw", release: .08 });
    tone(b, { start: .2, duration: .25, from: 390, to: 265, gain: .34, wave: "square", attack: .02, release: .1 });
    tone(b, { start: .43, duration: .34, from: 310, to: 480, gain: .27, wave: "saw", release: .18 });
    noise(b, { start: .04, duration: .72, gain: .055, release: .2, color: .76 });
    return b;
  },
  "impact": () => {
    const b = makeSound(.48);
    noise(b, { duration: .22, gain: .48, release: .2, color: .48 });
    tone(b, { duration: .43, from: 96, to: 38, gain: .65, release: .34 });
    tone(b, { start: .025, duration: .2, from: 210, to: 75, gain: .24, wave: "square", release: .18 });
    return b;
  },
  "sanity-drop": () => {
    const b = makeSound(.72);
    tone(b, { duration: .63, from: 540, to: 118, gain: .29, wave: "triangle", release: .25 });
    tone(b, { start: .1, duration: .5, from: 390, to: 82, gain: .22, wave: "sine", release: .2 });
    echo(b, .095, .15);
    return b;
  },
  "project-complete": () => {
    const b = makeSound(1.3);
    [392, 523, 659, 784, 1047].forEach((pitch, index) => tone(b, { start: index * .12, duration: .62, from: pitch, to: pitch * 1.015, gain: .23, wave: "triangle", release: .42 }));
    noise(b, { start: .52, duration: .55, gain: .07, attack: .15, release: .35, color: .12 });
    echo(b, .17, .2);
    return b;
  },
  "brag": () => {
    const b = makeSound(1.08);
    tone(b, { duration: .48, from: 88, to: 45, gain: .6, release: .38 });
    noise(b, { duration: .2, gain: .45, release: .18, color: .5 });
    [294, 370, 440].forEach((pitch, index) => tone(b, { start: .18 + index * .06, duration: .68, from: pitch, to: pitch * 1.12, gain: .25, wave: "saw", release: .36 }));
    echo(b, .13, .18);
    return b;
  },
  "victory": () => {
    const b = makeSound(1.58);
    [392, 523, 659, 784, 1047, 1319].forEach((pitch, index) => tone(b, { start: index * .13, duration: .72, from: pitch, gain: .21, wave: "triangle", release: .5 }));
    tone(b, { start: .72, duration: .76, from: 196, to: 262, gain: .22, wave: "saw", release: .48 });
    echo(b, .18, .2);
    return b;
  },
  "defeat": () => {
    const b = makeSound(1.48);
    [330, 277, 220, 165].forEach((pitch, index) => tone(b, { start: index * .19, duration: .68, from: pitch, to: pitch * .78, gain: .25, wave: "triangle", release: .42 }));
    noise(b, { start: .65, duration: .62, gain: .065, attack: .08, release: .4, color: .8 });
    echo(b, .16, .17);
    return b;
  }
};

for (const [name, build] of Object.entries(sounds)) writeWav(name, build());
console.log(`Generated ${Object.keys(sounds).length} original sound effects in ${outputDirectory}`);
