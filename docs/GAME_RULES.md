# Dev On! — MVP rules reference

Dev On! is a tactical card battler about assembling a software team, managing developer sanity, and shipping a shared project before a rival team. The MVP is local player-versus-computer; its state is local, but the rules are organized so a server-authoritative match can replace it later.

## Win condition

Each lead starts at 30 sanity. Reduce the rival lead to 0 to win. A developer who reaches 0 sanity quits and is removed from their work area; player-controlled developers are recorded in the Unemployment pile for the remainder of the battle. A player at 0 sanity loses immediately.

## Office and deployment

Each side has four opposing work-area slots. Opposing lanes share the same visible board column: player Work Area 1 faces rival Work Area 1, Area 2 faces Area 2, and so on. An open space holds four developers and enables coworker traits, but developers there may be taunted by developers in the directly opposing slot. A cubicle holds two developers, disables collaborative traits, and protects developer sanity: taunt damage is redirected to the player.

Every battle begins in a dedicated Office Setup stage. A short stage announcement introduces it, then a pulsing instruction and two reusable space cards are dealt below the board. Drag either the blue Open Space card or the red Cubicles card into any highlighted bay; the cards stay in the tray so either layout can be reused. Clicking a card and then a bay is an equivalent accessibility fallback. A configured bay can be replaced until all four are filled. The Ready button remains visible but disabled until the layout is complete; confirming it enters Sprint Planning and reveals the hand and draw pile. This makes capacity, protection, and collaboration an explicit decision instead of silently pre-filling the board. The computer configures its own office mix.

During deployment, every available desk is an independent target. After selecting a developer from the hand, choose the exact empty desk inside the work area instead of having the game fill desks in a fixed order. Open Space exposes a 2×2 set of four desks; Cubicles presents exactly two taller desks with no placeholder cells.

The starter collection excludes every campaign Lead and signature-team developer. Campaign victories run the Lead's full visible reward cache through a horizontal card reel, then award one random, previously locked developer when the reel stops beneath the center selector. The unlock and current deck are stored locally. An unlocked reward is added to the deck automatically when there is room, and can then be used like any other collected developer. Boss Leads remain encounter-only cards.

At battle start, the player reveals five developers from their deck. At the beginning of later turns, they draw one up to a hand limit of five. Chad's Nepotism can increase this to two when he is in open space. Each successful turn-start draw is presented as a short deal from the draw pile into the hand before the new card becomes interactive. Aiden can only enter cubicles.

After the player locks in all four office spaces, the board eases into a top-down view and a routing cursor spins over the production line to determine who goes first. The cursor has an even 50/50 chance of pointing toward either office. The winning side deploys first while the other board remains empty. The rival's five signature developers are dealt onto its office one at a time; the player drags every opening card that has a valid desk into place, then explicitly locks the team. Who goes first also determines which side resolves first in every action sequence for that battle.

Developer cards in the battle view can be inspected before committing to them. The profile dialog shows role compatibility, completion power, current and maximum sanity on a thick meter, and the developer's trait. Clicking a developer in hand opens this inspection-only profile; deployment is performed by dragging the fanned hand card directly onto an exact empty desk. The deck stack remains available during Office Setup and normal play, opening an art-first loadout overview so the player can compare roles and traits before choosing office layouts. During play it sits beside the silver-gray, broken-briefcase Unemployment pile; overlapping badges show the number of cards remaining and the number of developers who have quit. Cards in the deck overview are informational and cannot bypass the normal draw-and-hand rules. Rival cards face the rival side of the board but can be inspected the same way.

The board camera supports horizontal panning, vertical tilt, and bounded zoom from 72% to 130%. Camera buttons can be clicked for a small adjustment or held for continuous movement. Planning phases announce the active player before normal interaction resumes.

## Projects and the shared backlog

Projects are placed into a shared backlog. Claiming one locks the player to it and prevents the opponent from claiming it. A player may abandon an unfinished project, reset its progress, return it to the backlog, and lose 3 sanity.

Each side's currently claimed project appears directly beneath its sanity bar, including live MVP and completed-task progress. The shared backlog opens in a dedicated project picker: inspect every task, task type, MVP value, dependency, and Brag reward, then explicitly confirm the claim. Abandoning also requires a separate confirmation. Each sanity display has a mirrored Brag bank beside it: the player's is interactive and visibly locked until a project completes, while the rival's shows how many Brags the computer is holding. Selecting the player's bank while locked calls attention back to the active project or backlog selector.

Every project task is Frontend, Backend, or Mobile. Completing it contributes the printed points to the project's MVP meter. Reaching the MVP threshold completes the project and banks a Brag whose damage is printed on that project. Both sides bank Brags under the same rules, and each side can spend at most one per turn. When spent, the Brag bursts over the board, flies toward the targeted sanity display, and applies its damage point by point. Additional Brags remain banked. Work actions after the project completes are moot.

## Role compatibility and completion chance

Completion chance starts with a developer's completion power and receives this role modifier:

| Developer role | Frontend task | Backend task | Mobile task |
| --- | ---: | ---: | ---: |
| Frontend | +12% | -62% | -52% |
| Backend | -62% | +12% | -58% |
| Mobile | -48% | -58% | +12% |
| Full Stack | +5% | +5% | -38% |

Every developer may attempt every task. Matching specialists are reliable, while cross-role assignments take severe penalties but always retain a slim chance to work. Full Stack remains close to a specialist on Frontend and Backend but struggles on Mobile. Chances are clamped to 5–96% so even a desperate mismatch can occasionally become a memorable save. Work resolves with one integer roll from 1–100; a roll at or below the displayed chance succeeds. The wheel lands at the center of that roll's one-percent slice so its green or gray landing always matches the result.

A failed attempt gives that task a failure mark. Each mark adds a flat +6 percentage points to later attempts. This linear increase rewards persistence without letting failure snowball exponentially.

Dependencies add the listed coupling bonus once their prerequisite task succeeds. Because sequences resolve from 1 through 4, a prerequisite placed earlier in the same sprint can improve a dependent attempt later in that sprint. Parallel attempts in the same sequence do not receive a dependency that only completes in that sequence.

## Sprint planner

A turn contains four numbered sequences. Each deployed developer gets one action cell per sequence, so a developer can spend at most four tickets. Skipping an early sequence does not preserve the ticket: only the remaining sequence cells can be used.

Available actions are:

- **Work:** explicitly choose any incomplete project task to attempt. The picker previews the current success chance and makes cross-role penalties visible.
- **Taunt:** leave the planner, then choose a specific developer in the directly opposing open-space slot. Against an opposing cubicle or empty slot, selecting that lane redirects damage to the rival lead.
- **Skip:** do nothing in this sequence.

Different developers are scheduled in parallel inside a sequence, but the battle presentation reveals them one by one so every result is readable. Each sequence gets a full-screen announcement. The current actor leaves the board and appears on a dedicated action stage: Skip receives a visible stamp; Taunt shows one speech bubble before the attacker lunges and sanity drains; and Work shows the task beside a percentage wheel before project progress advances. Developer-targeted Taunts keep the two-card clash and target recoil. A Taunt redirected to either lead instead stages only the attacking card in the center, launches it toward the targeted sanity HUD, and lands the damage with that impact—no placeholder lead card is shown. The wheel keeps the action's success chance fixed on screen while its needle resolves the hidden roll. If an earlier action has already completed a queued task (or the whole MVP), that later ticket automatically becomes a clearly labeled **Already Shipped** skip instead of rolling again. The rival team receives the same presentation.

The planner is an editor, not a commit action. Every queued Work action also adds that developer's portrait to the targeted task in the task list, with a count badge when several actions stack on the same requirement. **Save sprint plan** closes it while preserving the queue, allowing the player to inspect the board or revise the plan again. The separate circular **Sprint!** control is the only way to launch the queue. It opens a final warning with the active project and assigned-action count; confirming ends the planning phase and begins sequence resolution. Launching an empty queue is allowed but called out explicitly.

## Current MVP balance constants

- Lead sanity: 30
- Opening hand / hand limit: 5
- Deck limit: 20; copy limit: 3
- Work areas: 4 per player
- Action sequences per sprint: 4
- Open-space capacity: 4; cubicle capacity: 2
- Failure-mark bonus: +6 percentage points each
- Abandon cost: 3 lead sanity
- Standard taunt damage: 2, with an occasional 3-point critical taunt
- Brag damage: 6–10 depending on project scope

These values live in `lib/game-data.ts` or the battle resolver and are intended to be tuned from playtest data.
