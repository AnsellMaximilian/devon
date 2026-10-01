# Sound design

Dev On! uses a small original synthesized sound set stored in `public/audio`. The palette separates interface actions, work resolution, sanity combat, and major game events so feedback stays readable even during a busy sprint.

## Cue families

- **Planning:** soft confirmation tones, card swishes, desk snaps, office thumps, and a three-note project lock.
- **Sprint structure:** a short sequence signal and a mechanical accelerating wheel tick.
- **Work:** a physical needle click followed by a bright compile arpeggio or a descending build-failure buzz.
- **Sanity combat:** a cartoony synthetic taunt voice, a low impact, and a descending sanity tone.
- **Major events:** longer project-complete, Brag, victory, and defeat signatures.

Repeated physical effects receive subtle playback-rate variation so card placement, skips, taunts, and hits do not sound mechanically identical. The battle menu's Sound Effects control stops active cues immediately when muted.

## Regeneration

The WAV files are deterministic and can be regenerated without third-party audio libraries:

```bash
pnpm generate:sfx
```

The generator writes 32 kHz, mono, 16-bit PCM WAV files. Keep action cues short and reserve the longer sounds for state changes such as completing a project or ending a match.
