# Developer portrait asset pipeline

Developer art is deliberately separate from every changeable stat. Each production file in `public/developers/` is a text-free 724×966 PNG with a consistent 3:4 crop. Names, roles, completion power, sanity, traits, counts, and effects are ordinary UI components.

The original roster was created as two contact sheets and cropped into individual portraits. That was fast for initial art direction, but it allowed neighboring colors to leak into a few edge crops. Chad and Wendy were repaired as individual image edits, and all new gameplay art is now generated as one isolated asset at a time. Contact sheets may be used for exploration, but never as the final production source.

## Prompt set 1 — core eight

> Production game-card portrait sprite sheet for a developer-themed card battler. Exactly eight waist-up cartoon developer headshots in a perfectly aligned 4×2 contact sheet: Chad (smug blond frontend developer in blazer and tie), Fan (cold Chinese backend developer with black bob and turtleneck), Aiden (scrawny full-stack prodigy with messy hair, round glasses, purple hoodie), Tigor (muscular Indonesian mobile developer with mohawk and orange gym hoodie), Wendy (Korean idol-turned-frontend developer with short pink-black hair and star clip), Stewart (retro robotic teddy bear in teal hoodie), Priya (Indian backend reliability engineer with braid and yellow jacket), and Mateo (Latino mobile developer with curly hair and coral headphones). Polished 2D cartoon illustration, thick crisp black outlines, flat cel shading, expressive faces, vibrant indie strategy-game art, identical proportions and camera angle. Unique abstract programming-pattern background per tile. Text-free; no names, numbers, logos, UI frames, card borders, readable code, overlap, extra people, cropped heads, or watermarks.

## Prompt set 2 — matching expansion four

> Match the core roster sheet precisely. Exactly four new portraits in a perfectly aligned 4×1 sheet: Zara (Black frontend accessibility specialist with high tied locs, lime round glasses, lime jacket), Nikko (Filipino backend night owl with undercut, sleepy eyes, purple-black hoodie, coffee), Valentina (Argentine full-stack pairing mentor with auburn hair and teal scarf), and Omar (Middle Eastern mobile speed hacker with trimmed beard, red beanie, crimson jacket). Preserve the same polished 2D cartoon style, thick black outlines, flat cel shading, proportions, camera angle, uniform scale, and abstract programming backgrounds. Text-free; no names, numbers, logos, UI frames, borders, readable code, duplicates, cropped heads, or watermarks.

## Adding a developer

1. Generate the portrait as an individual image without any game text, stats, card frame, or neighboring characters.
2. Export at 3:4 using the existing 724×966 dimensions.
3. Add the image under `public/developers/<id>.png`.
4. Add the mutable developer definition to `lib/game-data.ts`.
5. Implement any new mechanical hook in the battle resolver and document it in the rules.

## Work-area cards

Open Space and Cubicle illustrations follow the same text-free 3:4 asset contract and live in `public/areas/`. They are ordinary 2D textures in the interface and are transformed in CSS as flat cards on the perspective board.

### Open Space prompt

> Single isolated 3:4 portrait-format artwork for a developer card battler work-area card. Semi-isometric slightly top-down open-plan software office with one shared desk cluster for four developers, exactly four colorful chairs and four monitors, cyan code-like screen glow, plants and sticky notes, subtle collaborative arrows and connected-node motifs in the carpet. No people, no readable text, no UI, no card border, no neighboring panels. Match the developer portrait style: simple polished 2D cartoon, thick crisp black outlines, flat cel shading, vibrant indie strategy-game palette.

### Cubicles prompt

> Single isolated 3:4 portrait-format artwork for a developer card battler work-area card. Semi-isometric slightly top-down pair of private software-office cubicles for two developers, navy acoustic dividers, exactly two chairs and two monitors, magenta code-like screen glow, small desk lamps, lock and shield motifs in the carpet to suggest protection. No people, no readable text, no UI, no card border, no neighboring panels. Match the developer portrait style: simple polished 2D cartoon, thick crisp black outlines, flat cel shading, vibrant indie strategy-game palette.
