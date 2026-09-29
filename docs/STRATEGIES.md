# Dev On! — strategy notes

This is a living record of strategies created by the current mechanics. It is intentionally written before balance is final so later playtests can distinguish a healthy emergent strategy from an accident.

## Reliability versus breadth

Assigning the same developer to the same task across several sequences is the safest way to force through a critical requirement. Every miss adds +6% to the next attempt, but every repeated ticket is one less task attempted that sprint. This is strongest on a high-point task that completes the MVP meter or unlocks a highly coupled dependency.

Spread work across multiple tasks when the team has strong base completion and the project has several independent requirements. Stack attempts when a single prerequisite gates multiple follow-ups or when a low-completion specialist is your only legal worker.

## Dependency chains versus parallel work

Parallel Frontend and Backend work is fast but leaves the Frontend roll at its unassisted chance. Scheduling Authentication API in sequence 1 and Login Flow in sequence 2 is slower but lets Login use its coupling bonus if Authentication succeeds. A player can hedge by scheduling Login again in sequences 3 and 4: an early success makes later tickets moot, while a miss earns a failure mark.

The most efficient chain is usually prerequisite first, dependent second, then an unrelated parallel task. Overcommitting to a perfect dependency chain is risky because the first miss weakens every downstream assumption.

## Office geometry

Open space is an engine. Tigor increases Mobile MVP points, Zara increases Frontend MVP points, Valentina improves coworker accuracy, Wendy reduces incoming sanity damage, and Chad improves card flow. The price is exposure: the directly opposing rival slot can attack those developers.

Cubicles are insurance. They are ideal for fragile, high-output developers such as Aiden and Nikko. Taunts aimed at a cubicle hit the player's sanity instead, so filling every slot with cubicles can keep the team working but make the lead an easy direct target. Use the opposing-slot map: a cubicle across from an enemy taunt specialist can deliberately redirect damage away from an irreplaceable developer.

Stewart is a self-contained anchor. His high completion and sanity are valuable in a cubicle or alone in open space, but his Googoo Gaga Code penalty makes a crowded collaborative slot materially worse.

## Sanity pressure

Taunts are best when they remove a developer before that developer's next important work action. A low-sanity target in sequence 1 is more valuable than the same target in sequence 8. Fan is resistant to Frontend taunts, and Wendy's open-space team absorbs one point from each hit, so matchups matter.

Direct player damage through cubicles can set up a Brag lethal. Conversely, preserving player sanity matters when considering a project abandonment: the 3-sanity cost may be acceptable early, but it becomes dangerous within one Brag of defeat.

## Project racing

The backlog is shared. Claiming a high-value project denies it to the opponent, but locking early can expose a role mismatch in the current hand. Low-MVP projects create faster, smaller Brags; high-MVP projects are slower but can end a damaged opponent outright.

If a project completes in sequence 1, every later Work action aimed at it is wasted. A likely completion should therefore be followed by Taunts or Skips rather than seven speculative Work tickets. The uncertainty is the point: players decide how much insurance to buy.

## Playing against the MVP AI

The computer prefers legal work but occasionally taunts, skips, or chooses a less efficient task. It understands role restrictions, failure marks, and completed dependencies, but it does not solve the entire eight-step sprint optimally. It applies pressure without behaving like an oracle. Future difficulty levels can change its look-ahead depth, targeting quality, and willingness to hedge—not its hidden luck.

## Strategy questions to watch in playtests

- Is +6% per failure mark enough for a visibly worthwhile retry?
- Do open-space synergies compensate for the risk of developer removal?
- Does cubicle damage redirection create meaningful geometry or merely accelerate defeat?
- Is a 3-sanity abandon cost a real choice at 30 starting sanity?
- Do 6–10 damage Brags make project completion decisive without making Taunts irrelevant?
- Does the eight-sequence matrix create satisfying planning, or do players routinely leave its last columns empty?
