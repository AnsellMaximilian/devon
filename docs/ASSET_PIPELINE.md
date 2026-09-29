# Developer portrait asset pipeline

Developer art is deliberately separate from every changeable stat. Each production file in `public/developers/` is a text-free 724×966 PNG with a consistent 3:4 crop. Names, roles, completion power, sanity, traits, counts, and effects are ordinary UI components.

The two roster sheets were created with the built-in image generator, then cropped into individual portraits with a small inward gutter so no neighboring tile appears at the edge.

## Prompt set 1 — core eight

> Production game-card portrait sprite sheet for a developer-themed card battler. Exactly eight waist-up cartoon developer headshots in a perfectly aligned 4×2 contact sheet: Chad (smug blond frontend developer in blazer and tie), Fan (cold Chinese backend developer with black bob and turtleneck), Aiden (scrawny full-stack prodigy with messy hair, round glasses, purple hoodie), Tigor (muscular Indonesian mobile developer with mohawk and orange gym hoodie), Wendy (Korean idol-turned-frontend developer with short pink-black hair and star clip), Stewart (retro robotic teddy bear in teal hoodie), Priya (Indian backend reliability engineer with braid and yellow jacket), and Mateo (Latino mobile developer with curly hair and coral headphones). Polished 2D cartoon illustration, thick crisp black outlines, flat cel shading, expressive faces, vibrant indie strategy-game art, identical proportions and camera angle. Unique abstract programming-pattern background per tile. Text-free; no names, numbers, logos, UI frames, card borders, readable code, overlap, extra people, cropped heads, or watermarks.

## Prompt set 2 — matching expansion four

> Match the core roster sheet precisely. Exactly four new portraits in a perfectly aligned 4×1 sheet: Zara (Black frontend accessibility specialist with high tied locs, lime round glasses, lime jacket), Nikko (Filipino backend night owl with undercut, sleepy eyes, purple-black hoodie, coffee), Valentina (Argentine full-stack pairing mentor with auburn hair and teal scarf), and Omar (Middle Eastern mobile speed hacker with trimmed beard, red beanie, crimson jacket). Preserve the same polished 2D cartoon style, thick black outlines, flat cel shading, proportions, camera angle, uniform scale, and abstract programming backgrounds. Text-free; no names, numbers, logos, UI frames, borders, readable code, duplicates, cropped heads, or watermarks.

## Adding a developer

1. Generate the portrait without any game text or stats.
2. Crop/export at 3:4 using the existing 724×966 dimensions.
3. Add the image under `public/developers/<id>.png`.
4. Add the mutable developer definition to `lib/game-data.ts`.
5. Implement any new mechanical hook in the battle resolver and document it in the rules.
