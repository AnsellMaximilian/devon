# Dev On! — MVP rules reference

Dev On! is a tactical card battler about assembling a software team, managing developer sanity, and shipping a shared project before a rival team. The MVP is local player-versus-computer; its state is local, but the rules are organized so a server-authoritative match can replace it later.

## Win condition

Each lead starts at 30 sanity. Reduce the rival lead to 0 to win. A developer who reaches 0 sanity quits and is removed from their work area. A player at 0 sanity loses immediately.

## Office and deployment

Each side has four opposing work-area slots. An open space holds four developers and enables coworker traits, but developers there may be taunted by developers in the directly opposing slot. A cubicle holds two developers, disables collaborative traits, and protects developer sanity: taunt damage is redirected to the player.

Every battle begins in a dedicated Office Setup stage. The player's four slots begin unconfigured, and all project, deployment, and sprint actions remain unavailable until an illustrated Open Space or Cubicle card has been placed into every bay and the layout is confirmed. A configured bay can be replaced during setup. Once confirmed, the office cards leave the interface and the draw-pile counter takes their place. This makes capacity, protection, and collaboration an explicit decision instead of silently pre-filling the board. The computer configures its own office mix.

At battle start, the player reveals five developers from their deck. At the beginning of later turns, they draw one up to a hand limit of five. Chad's Nepotism can increase this to two when he is in open space. Aiden can only enter cubicles.

Developer cards in the battle view can be inspected before committing to them. The profile dialog shows role compatibility, completion power, current and maximum sanity, and the developer's trait. A developer in hand is selected for deployment from this dialog. Rival cards face the rival side of the board but can be inspected the same way.

## Projects and the shared backlog

Projects are placed into a shared backlog. Claiming one locks the player to it and prevents the opponent from claiming it. A player may abandon an unfinished project, reset its progress, return it to the backlog, and lose 3 sanity.

Only the currently claimed project remains on the battle HUD. The shared backlog opens in a dedicated project picker: inspect every task, task type, MVP value, dependency, and Brag reward, then explicitly confirm the claim. Abandoning also requires a separate confirmation.

Every project task is Frontend, Backend, or Mobile. Completing it contributes the printed points to the project's MVP meter. Reaching the MVP threshold completes the project and banks a Brag whose damage is printed on that project. Only one Brag can be used each turn; additional Brags remain banked. Work actions after the project completes are moot.

## Role compatibility and completion chance

Completion chance starts with a developer's completion power and receives this role modifier:

| Developer role | Frontend task | Backend task | Mobile task |
| --- | ---: | ---: | ---: |
| Frontend | +12% | Cannot attempt | Cannot attempt |
| Backend | Cannot attempt | +12% | Cannot attempt |
| Mobile | Cannot attempt | Cannot attempt | +12% |
| Full Stack | +5% | +5% | Cannot attempt |

This MVP keeps the strict role restrictions in the brief: specialists only do their own task type, while Full Stack handles Frontend and Backend. Chances are clamped to 12–96% so every legal attempt retains some uncertainty.

A failed attempt gives that task a failure mark. Each mark adds a flat +6 percentage points to later attempts. This linear increase rewards persistence without letting failure snowball exponentially.

Dependencies add the listed coupling bonus once their prerequisite task succeeds. Because sequences resolve from 1 through 8, a prerequisite placed earlier in the same sprint can improve a dependent attempt later in that sprint. Parallel attempts in the same sequence do not receive a dependency that only completes in that sequence.

## Sprint planner

A turn contains eight numbered sequences. Each deployed developer gets one action cell per sequence, so a developer can spend at most eight tickets. Skipping an early sequence does not preserve the ticket: only the remaining sequence cells can be used.

Available actions are:

- **Work:** explicitly choose one compatible, incomplete project task to attempt. The picker previews its current success chance.
- **Taunt:** attack a developer in the directly opposing open-space slot; against an opposing cubicle or empty slot, damage goes to the rival lead.
- **Skip:** do nothing in this sequence.

Different developers act in parallel inside a sequence. Sequences resolve at a deliberately paced interval, with acting and target markers on the 3D board, so task completion, failure marks, sanity damage, quitting, project completion, and Brags remain readable.

## Current MVP balance constants

- Lead sanity: 30
- Opening hand / hand limit: 5
- Deck limit: 20; copy limit: 3
- Work areas: 4 per player
- Open-space capacity: 4; cubicle capacity: 2
- Failure-mark bonus: +6 percentage points each
- Abandon cost: 3 lead sanity
- Standard taunt damage: 2, with an occasional 3-point critical taunt
- Brag damage: 6–10 depending on project scope

These values live in `lib/game-data.ts` or the battle resolver and are intended to be tuned from playtest data.
