export const SFX = {
  uiConfirm: "/audio/ui-confirm.wav",
  officePlace: "/audio/office-place.wav",
  cardDeal: "/audio/card-deal.wav",
  cardPlace: "/audio/card-place.wav",
  projectLock: "/audio/project-lock.wav",
  sequenceStart: "/audio/sequence-start.wav",
  wheelSpin: "/audio/wheel-spin.wav",
  needleLand: "/audio/needle-land.wav",
  workSuccess: "/audio/work-success.wav",
  workFail: "/audio/work-fail.wav",
  skip: "/audio/skip.wav",
  taunt: "/audio/taunt.wav",
  impact: "/audio/impact.wav",
  sanityDrop: "/audio/sanity-drop.wav",
  projectComplete: "/audio/project-complete.wav",
  brag: "/audio/brag.wav",
  victory: "/audio/victory.wav",
  defeat: "/audio/defeat.wav"
} as const;

export type SoundEffect = keyof typeof SFX;

const LEVELS: Partial<Record<SoundEffect, number>> = {
  wheelSpin: .42,
  needleLand: .56,
  officePlace: .58,
  cardDeal: .5,
  cardPlace: .52,
  sequenceStart: .5,
  taunt: .46,
  impact: .64,
  sanityDrop: .48,
  projectComplete: .58,
  brag: .66,
  victory: .6,
  defeat: .55
};

const PITCH_VARIANCE = new Set<SoundEffect>(["officePlace", "cardDeal", "cardPlace", "skip", "taunt", "impact"]);
const activeSounds = new Set<HTMLAudioElement>();
const preloadedSounds: HTMLAudioElement[] = [];
let preloaded = false;

export function preloadSfx() {
  if (preloaded || typeof Audio === "undefined") return;
  preloaded = true;
  Object.values(SFX).forEach((source) => {
    const audio = new Audio(source);
    audio.preload = "auto";
    preloadedSounds.push(audio);
  });
}

export function playSfx(effect: SoundEffect, enabled = true) {
  if (!enabled || typeof Audio === "undefined") return;
  const audio = new Audio(SFX[effect]);
  audio.preload = "auto";
  audio.volume = LEVELS[effect] ?? .5;
  if (PITCH_VARIANCE.has(effect)) audio.playbackRate = .97 + Math.random() * .06;
  activeSounds.add(audio);
  const release = () => activeSounds.delete(audio);
  audio.addEventListener("ended", release, { once: true });
  audio.addEventListener("error", release, { once: true });
  void audio.play().catch(release);
}

export function stopAllSfx() {
  activeSounds.forEach((audio) => {
    audio.pause();
    audio.currentTime = 0;
  });
  activeSounds.clear();
}
