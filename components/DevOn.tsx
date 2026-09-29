"use client";

import { useMemo, useRef, useState } from "react";
import { ArrowLeft, Brain, BriefcaseBusiness, ChevronLeft, ChevronRight, CircleHelp, Code2, Crosshair, DoorOpen, Gamepad2, Hand, Layers3, LockKeyhole, Minus, MousePointer2, Play, Plus, RotateCcw, Shield, Sparkles, Swords, Ticket, Trophy, Users, Volume2, X, Zap } from "lucide-react";
import { DevCard } from "./DevCard";
import { DEVELOPERS, PROJECTS, ROLE_CHANCES, getDeveloper, roleCanWork, type AreaType, type Developer, type Project } from "@/lib/game-data";

type View = "home" | "deck" | "battle";
type Owner = "player" | "enemy";
type PlacedDev = { instanceId: string; devId: string; sanity: number; slot: number };
type BoardSlot = { type: AreaType; developers: PlacedDev[] };
type TaskProgress = { completed: boolean; marks: number };
type ProjectState = Project & { claimedBy: Owner | null; completed: boolean; progress: number; tasksState: Record<string, TaskProgress> };
type PlannedAction = "skip" | "taunt" | `work:${string}`;

const starterDeck = DEVELOPERS.map((d) => d.id);
const emptySlots = (): BoardSlot[] => ["open", "cubicle", "open", "cubicle"].map((type) => ({ type: type as AreaType, developers: [] }));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function freshProjects(): ProjectState[] {
  return PROJECTS.map((p) => ({ ...p, claimedBy: null, completed: false, progress: 0, tasksState: Object.fromEntries(p.tasks.map((t) => [t.id, { completed: false, marks: 0 }])) }));
}

function Meter({ value, max, tone = "cyan" }: { value: number; max: number; tone?: "cyan" | "pink" | "lime" }) {
  return <div className={`meter ${tone}`}><span style={{ width: `${clamp((value / max) * 100, 0, 100)}%` }} /></div>;
}

function AppHeader({ onHome, onDeck, deckCount, inBattle = false }: { onHome: () => void; onDeck: () => void; deckCount: number; inBattle?: boolean }) {
  return <header className="app-header">
    <button className="brand" onClick={onHome}><span className="brand-mark">D<span>!</span></span><span><b>DEV ON!</b><small>SHIP IT OR QUIT</small></span></button>
    <nav>
      {!inBattle && <button onClick={onDeck}><Layers3 size={17} /> Deck <em>{deckCount}/20</em></button>}
      <button className="icon-btn" aria-label="Sound"><Volume2 size={18} /></button>
      <button className="icon-btn" aria-label="Help"><CircleHelp size={18} /></button>
    </nav>
  </header>;
}

export function DevOn() {
  const [view, setView] = useState<View>("home");
  const [deck, setDeck] = useState<string[]>(starterDeck);

  if (view === "battle") return <Battle deck={deck.length ? deck : starterDeck} onExit={() => setView("home")} />;

  return <main className="app-shell">
    <AppHeader onHome={() => setView("home")} onDeck={() => setView("deck")} deckCount={deck.length} />
    {view === "home" ? <Home onBattle={() => setView("battle")} onDeck={() => setView("deck")} deckCount={deck.length} /> : <DeckBuilder deck={deck} setDeck={setDeck} onBack={() => setView("home")} onBattle={() => setView("battle")} />}
  </main>;
}

function Home({ onBattle, onDeck, deckCount }: { onBattle: () => void; onDeck: () => void; deckCount: number }) {
  return <section className="home-screen">
    <div className="hero-copy">
      <div className="eyebrow"><span /> Tactical card battler <span /></div>
      <h1>BUILD A TEAM.<br /><em>BREAK PROD.</em></h1>
      <p>Plan the sprint. Manage the egos. Ship the MVP before the other team steals your thunder.</p>
      <div className="hero-actions">
        <button className="primary-cta" onClick={onBattle}><Play fill="currentColor" size={19} /> Start a battle <span>vs. CPU</span></button>
        <button className="secondary-cta" onClick={onDeck}><Layers3 size={19} /> Edit deck <span>{deckCount}/20</span></button>
      </div>
      <div className="feature-row">
        <span><Ticket /> 8-step sprints</span><span><Users /> Team synergies</span><span><Brain /> Sanity warfare</span>
      </div>
    </div>
    <div className="hero-stage" aria-label="Developer cards on an isometric game board">
      <div className="code-spark spark-a">{`</>`}</div><div className="code-spark spark-b">{`{ }`}</div>
      <div className="iso-board">
        <div className="iso-line" />
        {["fan", "tigor", "wendy"].map((id, i) => <div className={`hero-card hero-card-${i}`} key={id}><img src={getDeveloper(id).art} alt="" /><span>{getDeveloper(id).name}</span></div>)}
        <div className="board-chip"><Zap size={14} /> SPRINT 04</div>
      </div>
      <div className="floating-pill pill-a"><b>+18%</b><span>dependency bonus</span></div>
      <div className="floating-pill pill-b"><b>SHIP IT!</b><span>MVP reached</span></div>
    </div>
    <footer className="home-footer"><span>v0.1 // LOCAL BUILD</span><span>12 DEVELOPERS · 6 PROJECTS</span></footer>
  </section>;
}

function DeckBuilder({ deck, setDeck, onBack, onBattle }: { deck: string[]; setDeck: (d: string[]) => void; onBack: () => void; onBattle: () => void }) {
  const [role, setRole] = useState("All");
  const counts = useMemo(() => Object.fromEntries(DEVELOPERS.map((d) => [d.id, deck.filter((x) => x === d.id).length])), [deck]);
  const visible = role === "All" ? DEVELOPERS : DEVELOPERS.filter((d) => d.role === role);
  const add = (id: string) => { if (deck.length < 20 && counts[id] < 3) setDeck([...deck, id]); };
  const remove = (id: string) => { const at = deck.lastIndexOf(id); if (at >= 0) setDeck(deck.filter((_, i) => i !== at)); };

  return <section className="deck-screen">
    <div className="deck-heading">
      <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /> Back</button>
      <div><span className="eyebrow-small">TEAM CONFIGURATION</span><h1>Build your <em>dev team</em></h1><p>Pick up to 20 cards. You can run up to three copies of a developer.</p></div>
      <button className="primary-cta small" onClick={onBattle} disabled={!deck.length}><Swords size={18} /> Battle ready</button>
    </div>
    <div className="deck-toolbar">
      <div className="role-tabs">{["All", "Frontend", "Backend", "Mobile", "Full Stack"].map((r) => <button key={r} className={role === r ? "active" : ""} onClick={() => setRole(r)}>{r}</button>)}</div>
      <div className="deck-cap"><span>DECK CAPACITY</span><b className={deck.length === 20 ? "full" : ""}>{deck.length}<small>/20</small></b><Meter value={deck.length} max={20} /></div>
    </div>
    <div className="deck-layout">
      <div className="collection"><div className="section-label"><span>DEVELOPER POOL</span><small>Click a card to recruit · max 3 copies</small></div><div className="card-grid">{visible.map((dev, i) => <div className="card-wrap" style={{ animationDelay: `${i * 45}ms` }} key={dev.id}><DevCard dev={dev} count={counts[dev.id]} onClick={() => add(dev.id)} disabled={deck.length >= 20 || counts[dev.id] >= 3} /></div>)}</div></div>
      <aside className="deck-stack-panel">
        <div className="stack-title"><Layers3 size={17} /><div><b>YOUR DECK</b><small>{new Set(deck).size} unique developers</small></div><button onClick={() => setDeck([])}>Clear</button></div>
        <div className="deck-list">{DEVELOPERS.filter((d) => counts[d.id]).map((dev) => <div className="deck-list-item" key={dev.id} style={{ "--accent": dev.accent } as React.CSSProperties}><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span><div><button onClick={() => remove(dev.id)}><Minus size={13} /></button><strong>{counts[dev.id]}</strong><button onClick={() => add(dev.id)} disabled={deck.length >= 20 || counts[dev.id] >= 3}><Plus size={13} /></button></div></div>)}</div>
        {!deck.length && <div className="empty-deck"><Hand size={28} /><b>No one on the team</b><span>Recruit a developer to start.</span></div>}
        <div className="stack-foot"><span>Opening hand</span><b>5 cards</b><span>Draw rate</span><b>1 / turn</b></div>
      </aside>
    </div>
  </section>;
}

function Battle({ deck, onExit }: { deck: string[]; onExit: () => void }) {
  const shuffledDeck = useRef([...deck].sort(() => Math.random() - .5));
  const [drawIndex, setDrawIndex] = useState(5);
  const [hand, setHand] = useState<string[]>(shuffledDeck.current.slice(0, 5));
  const [playerSlots, setPlayerSlots] = useState<BoardSlot[]>(emptySlots());
  const [enemySlots, setEnemySlots] = useState<BoardSlot[]>([
    { type: "open", developers: [{ instanceId: "cpu-fan", devId: "fan", sanity: 10, slot: 0 }, { instanceId: "cpu-omar", devId: "omar", sanity: 10, slot: 0 }] },
    { type: "cubicle", developers: [{ instanceId: "cpu-aiden", devId: "aiden", sanity: 6, slot: 1 }] },
    { type: "open", developers: [{ instanceId: "cpu-wendy", devId: "wendy", sanity: 9, slot: 2 }] },
    { type: "cubicle", developers: [] }
  ]);
  const [selectedHand, setSelectedHand] = useState<number | null>(null);
  const [projects, setProjects] = useState<ProjectState[]>(() => { const ps = freshProjects(); ps[1].claimedBy = "enemy"; return ps; });
  const [playerSanity, setPlayerSanity] = useState(30);
  const [enemySanity, setEnemySanity] = useState(30);
  const [turn, setTurn] = useState(1);
  const [cameraX, setCameraX] = useState(0);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [plan, setPlan] = useState<Record<string, PlannedAction>>({});
  const [phase, setPhase] = useState<"plan" | "resolving" | "brag" | "gameover">("plan");
  const [event, setEvent] = useState("Your sprint. Deploy a team and claim a project.");
  const [eventTone, setEventTone] = useState<"neutral" | "good" | "bad">("neutral");
  const [brags, setBrags] = useState<number[]>([]);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [seqActive, setSeqActive] = useState<number | null>(null);
  const playerProject = projects.find((p) => p.claimedBy === "player" && !p.completed);
  const enemyProject = projects.find((p) => p.claimedBy === "enemy" && !p.completed);
  const placed = playerSlots.flatMap((s) => s.developers);

  const toggleSlot = (slotIndex: number) => {
    if (phase !== "plan") return;
    setPlayerSlots((slots) => slots.map((s, i) => i === slotIndex && !s.developers.length ? { ...s, type: s.type === "open" ? "cubicle" : "open" } : s));
  };

  const deploy = (slotIndex: number) => {
    if (selectedHand === null || phase !== "plan") return;
    const dev = getDeveloper(hand[selectedHand]);
    const slot = playerSlots[slotIndex];
    const cap = slot.type === "open" ? 4 : 2;
    if (slot.developers.length >= cap) { setEvent("That work area is already full."); setEventTone("bad"); return; }
    if (dev.id === "aiden" && slot.type === "open") { setEvent("Aiden refuses the open space. Try a cubicle."); setEventTone("bad"); return; }
    const instance: PlacedDev = { instanceId: `${dev.id}-${Date.now()}`, devId: dev.id, sanity: dev.sanity, slot: slotIndex };
    setPlayerSlots((slots) => slots.map((s, i) => i === slotIndex ? { ...s, developers: [...s.developers, instance] } : s));
    setHand((h) => h.filter((_, i) => i !== selectedHand));
    setSelectedHand(null);
    setEvent(`${dev.name} joined Work Area ${slotIndex + 1}.`); setEventTone("good");
  };

  const claimProject = (id: string) => {
    if (phase !== "plan") return;
    if (playerProject) { setEvent("Finish or abandon your current project first."); setEventTone("bad"); return; }
    const target = projects.find((p) => p.id === id);
    if (!target || target.claimedBy || target.completed) return;
    setProjects((ps) => ps.map((p) => p.id === id ? { ...p, claimedBy: "player" } : p));
    setEvent(`${target.name} locked. Time to plan the sprint.`); setEventTone("good");
  };

  const abandon = () => {
    if (!playerProject || phase !== "plan") return;
    setPlayerSanity((s) => Math.max(0, s - 3));
    setProjects((ps) => ps.map((p) => p.id === playerProject.id ? { ...p, claimedBy: null, progress: 0, tasksState: Object.fromEntries(p.tasks.map((t) => [t.id, { completed: false, marks: 0 }])) } : p));
    setEvent("Project abandoned. Your reputation takes 3 sanity damage."); setEventTone("bad");
  };

  const completionChance = (dev: Developer, taskId: string, project: ProjectState, slots: BoardSlot[], instance: PlacedDev, sequence: number) => {
    const task = project.tasks.find((t) => t.id === taskId)!;
    const roleBonus = ROLE_CHANCES[dev.role][task.type] ?? -100;
    let chance = dev.completion + roleBonus + project.tasksState[task.id].marks * 6;
    if (task.dependsOn && project.tasksState[task.dependsOn]?.completed) chance += task.coupling ?? 0;
    const coworkers = slots[instance.slot].developers.map((d) => d.devId);
    if (dev.id === "aiden" && slots[instance.slot].type === "cubicle") chance += 8;
    if (dev.id === "nikko" && sequence >= 5) chance += 10;
    if (dev.id === "mateo" && sequence === 1) chance += 10;
    if (dev.id === "omar" && sequence === 1) chance += 12;
    if (coworkers.includes("stewart") && dev.id !== "stewart") chance -= 8;
    if (coworkers.includes("valentina") && dev.id !== "valentina" && slots[instance.slot].type === "open") chance += 5;
    return clamp(chance, 12, 96);
  };

  const advanceTurn = (ps: ProjectState[], aiProjectId: string | undefined) => {
    let next = ps;
    if (!aiProjectId) {
      const available = next.filter((p) => !p.claimedBy && !p.completed);
      if (available.length) {
        const pick = available[Math.floor(Math.random() * available.length)];
        next = next.map((p) => p.id === pick.id ? { ...p, claimedBy: "enemy" } : p);
      }
    }
    setProjects(next);
    setTurn((t) => t + 1);
    const nepotism = playerSlots.some((s) => s.type === "open" && s.developers.some((d) => d.devId === "chad"));
    const draws = nepotism ? 2 : 1;
    setHand((h) => {
      const room = Math.max(0, 5 - h.length);
      const count = Math.min(draws, room, Math.max(0, shuffledDeck.current.length - drawIndex));
      const cards = shuffledDeck.current.slice(drawIndex, drawIndex + count);
      setDrawIndex((i) => i + count);
      return [...h, ...cards];
    });
    setPlan({}); setPhase("plan"); setSeqActive(null);
    setEvent(nepotism ? "New sprint. Nepotism pulled an extra résumé." : "New sprint. One developer joined your hand."); setEventTone("neutral");
  };

  const resolveTurn = async () => {
    if (!playerProject) { setEvent("Claim a project before running the sprint."); setEventTone("bad"); setPlannerOpen(false); return; }
    if (!placed.length) { setEvent("Deploy at least one developer first."); setEventTone("bad"); setPlannerOpen(false); return; }
    setPlannerOpen(false); setPhase("resolving");
    let pSlots = playerSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let eSlots = enemySlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let ps = projects.map((p) => ({ ...p, tasksState: Object.fromEntries(Object.entries(p.tasksState).map(([k, v]) => [k, { ...v }])) }));
    let pSan = playerSanity, eSan = enemySanity;
    let queuedBrags = [...brags];
    let pProjectId: string | undefined = playerProject.id;
    let aiProjectId: string | undefined = enemyProject?.id;

    for (let seq = 1; seq <= 8; seq++) {
      setSeqActive(seq);
      const sequenceEvents: string[] = [];
      const pp = ps.find((p) => p.id === pProjectId && !p.completed);
      if (pp) for (const instance of pSlots.flatMap((s) => s.developers)) {
        const dev = getDeveloper(instance.devId);
        const action = plan[`${instance.instanceId}-${seq}`] ?? "skip";
        if (action.startsWith("work:")) {
          const taskId = action.slice(5); const task = pp.tasks.find((t) => t.id === taskId);
          if (!task || pp.tasksState[taskId].completed || !roleCanWork(dev.role, task.type)) continue;
          const chance = completionChance(dev, taskId, pp, pSlots, instance, seq);
          if (Math.random() * 100 <= chance) {
            pp.tasksState[taskId].completed = true;
            let points = task.points;
            const coworkers = pSlots[instance.slot].developers.map((d) => d.devId);
            if (task.type === "Mobile" && coworkers.includes("tigor")) points += 2;
            if (task.type === "Frontend" && coworkers.includes("zara")) points += 1;
            pp.progress = Math.min(pp.mvp, pp.progress + points);
            sequenceEvents.push(`${dev.name} shipped ${task.title} (+${points} MVP)`);
            if (pp.progress >= pp.mvp) {
              pp.completed = true; queuedBrags.push(pp.brag); pProjectId = undefined;
              sequenceEvents.push(`${pp.name} reached MVP — BRAG unlocked!`); break;
            }
          } else {
            const ignoreMark = dev.id === "priya" && seq === 1;
            if (!ignoreMark) pp.tasksState[taskId].marks += dev.id === "omar" ? 2 : 1;
            sequenceEvents.push(`${dev.name} missed ${task.title} · ${Math.round(chance)}%`);
          }
        } else if (action === "taunt") {
          const targetSlot = eSlots[3 - instance.slot]; const damage = 2 + (Math.random() > .72 ? 1 : 0);
          if (targetSlot.type === "cubicle" || !targetSlot.developers.length) { eSan = Math.max(0, eSan - damage); sequenceEvents.push(`${dev.name}'s taunt hit the rival lead for ${damage}`); }
          else {
            const target = targetSlot.developers[Math.floor(Math.random() * targetSlot.developers.length)];
            let hit = damage;
            if (target.devId === "fan" && dev.role === "Frontend") hit = Math.max(1, Math.floor(hit / 2));
            if (targetSlot.developers.some((d) => d.devId === "wendy")) hit = Math.max(1, hit - 1);
            target.sanity -= hit; sequenceEvents.push(`${dev.name} rattled ${getDeveloper(target.devId).name} for ${hit}`);
            if (target.sanity <= 0) { targetSlot.developers = targetSlot.developers.filter((d) => d.instanceId !== target.instanceId); sequenceEvents.push(`${getDeveloper(target.devId).name} quit!`); }
          }
        }
      }

      const ap = ps.find((p) => p.id === aiProjectId && !p.completed);
      if (ap) for (const instance of eSlots.flatMap((s) => s.developers)) {
        const dev = getDeveloper(instance.devId);
        if (Math.random() < .18) {
          const targetSlot = pSlots[3 - instance.slot]; const damage = 2;
          if (targetSlot.type === "cubicle" || !targetSlot.developers.length) { pSan = Math.max(0, pSan - damage); sequenceEvents.push(`CPU taunt hit you for ${damage}`); }
          else if (targetSlot.developers.length) {
            const target = targetSlot.developers[Math.floor(Math.random() * targetSlot.developers.length)];
            let hit = targetSlot.developers.some((d) => d.devId === "wendy") ? 1 : 2;
            if (target.devId === "fan" && dev.role === "Frontend") hit = 1;
            target.sanity -= hit; sequenceEvents.push(`${dev.name} taunted ${getDeveloper(target.devId).name}`);
            if (target.sanity <= 0) { targetSlot.developers = targetSlot.developers.filter((d) => d.instanceId !== target.instanceId); sequenceEvents.push(`${getDeveloper(target.devId).name} quit!`); }
          }
          continue;
        }
        const tasks = ap.tasks.filter((t) => !ap.tasksState[t.id].completed && roleCanWork(dev.role, t.type));
        if (!tasks.length || Math.random() < .20) continue;
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        const chance = clamp(dev.completion + (ROLE_CHANCES[dev.role][task.type] ?? -100) + ap.tasksState[task.id].marks * 6 + (task.dependsOn && ap.tasksState[task.dependsOn]?.completed ? task.coupling ?? 0 : 0), 12, 94);
        if (Math.random() * 100 <= chance) {
          ap.tasksState[task.id].completed = true; ap.progress = Math.min(ap.mvp, ap.progress + task.points); sequenceEvents.push(`CPU shipped ${task.title}`);
          if (ap.progress >= ap.mvp) { ap.completed = true; aiProjectId = undefined; eSan = eSan; pSan = Math.max(0, pSan - ap.brag); sequenceEvents.push(`CPU bragged ${ap.name} for ${ap.brag} sanity!`); break; }
        } else ap.tasksState[task.id].marks += 1;
      }

      setPlayerSlots(pSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setEnemySlots(eSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setProjects(ps.map((p) => ({ ...p, tasksState: { ...p.tasksState } })));
      setPlayerSanity(pSan); setEnemySanity(eSan); setBrags(queuedBrags);
      setEvent(sequenceEvents.length ? sequenceEvents.join(" · ") : `Sequence ${seq}: the office is suspiciously quiet.`);
      setEventTone(sequenceEvents.some((x) => x.includes("missed") || x.includes("CPU")) ? "bad" : sequenceEvents.length ? "good" : "neutral");
      if (pSan <= 0 || eSan <= 0) break;
      await wait(420);
    }
    if (pSan <= 0 || eSan <= 0) { setWinner(pSan > 0 ? "player" : "enemy"); setPhase("gameover"); return; }
    setSeqActive(null);
    if (queuedBrags.length) { setPhase("brag"); setEvent("Project complete. Brag now—or bank it and end the sprint."); setEventTone("good"); }
    else advanceTurn(ps, aiProjectId);
  };

  const useBrag = () => {
    if (!brags.length) return;
    const hit = brags[0]; const remaining = brags.slice(1); const nextEnemy = Math.max(0, enemySanity - hit);
    setEnemySanity(nextEnemy); setBrags(remaining); setEvent(`You shipped it and bragged for ${hit} sanity damage!`); setEventTone("good");
    if (nextEnemy <= 0) { setWinner("player"); setPhase("gameover"); return; }
    // One brag per turn; extra brags remain banked.
    setTimeout(() => advanceTurn(projects, projects.find((p) => p.claimedBy === "enemy" && !p.completed)?.id), 500);
  };

  const skipBrag = () => advanceTurn(projects, projects.find((p) => p.claimedBy === "enemy" && !p.completed)?.id);

  const resetBattle = () => {
    shuffledDeck.current = [...deck].sort(() => Math.random() - .5);
    setDrawIndex(5);
    setHand(shuffledDeck.current.slice(0, 5));
    setPlayerSlots(emptySlots());
    setEnemySlots([
      { type: "open", developers: [{ instanceId: "cpu-fan", devId: "fan", sanity: 10, slot: 0 }, { instanceId: "cpu-omar", devId: "omar", sanity: 10, slot: 0 }] },
      { type: "cubicle", developers: [{ instanceId: "cpu-aiden", devId: "aiden", sanity: 6, slot: 1 }] },
      { type: "open", developers: [{ instanceId: "cpu-wendy", devId: "wendy", sanity: 9, slot: 2 }] },
      { type: "cubicle", developers: [] }
    ]);
    setSelectedHand(null);
    const nextProjects = freshProjects();
    nextProjects[1].claimedBy = "enemy";
    setProjects(nextProjects);
    setPlayerSanity(30); setEnemySanity(30); setTurn(1); setCameraX(0);
    setPlannerOpen(false); setPlan({}); setPhase("plan"); setBrags([]);
    setWinner(null); setSeqActive(null); setEventTone("neutral");
    setEvent("Your sprint. Deploy a team and claim a project.");
  };

  return <main className="battle-screen">
    <AppHeader onHome={onExit} onDeck={onExit} deckCount={deck.length} inBattle />
    <div className="battle-hud">
      <PlayerHud owner="enemy" name="NULL POINTERS" sanity={enemySanity} max={30} project={enemyProject} />
      <div className="turn-pill"><span>SPRINT</span><b>{String(turn).padStart(2, "0")}</b><small>{phase === "resolving" ? `SEQUENCE ${seqActive ?? 1}/8` : phase === "brag" ? "BRAG WINDOW" : "PLANNING"}</small></div>
      <PlayerHud owner="player" name="YOU // LOCALHOST" sanity={playerSanity} max={30} project={playerProject} />
    </div>

    <div className="project-ribbon">
      <span className="ribbon-label"><BriefcaseBusiness size={15} /> SHARED BACKLOG</span>
      <div className="project-strip">{projects.map((p) => <ProjectChip key={p.id} project={p} active={p.id === playerProject?.id} onClick={() => claimProject(p.id)} />)}</div>
      {playerProject && <button className="abandon-btn" onClick={abandon} disabled={phase !== "plan"}>Abandon <small>−3 SAN</small></button>}
    </div>

    <div className="board-viewport">
      <div className="board-world" style={{ transform: `translateX(calc(-50% + ${cameraX}px)) rotateX(47deg)` }}>
        <div className="board-surface">
          <div className="lane-label enemy-lane">RIVAL OFFICE</div>
          <div className="slot-row enemy-row">{enemySlots.map((slot, i) => <BoardSlotView key={i} slot={slot} index={i} owner="enemy" />)}</div>
          <div className="center-line"><span>PRODUCTION</span><i /><span>PRODUCTION</span></div>
          <div className="slot-row player-row">{playerSlots.map((slot, i) => <BoardSlotView key={i} slot={slot} index={i} owner="player" selected={selectedHand !== null} onDeploy={() => deploy(i)} onToggle={() => toggleSlot(i)} />)}</div>
          <div className="lane-label player-lane">YOUR OFFICE</div>
        </div>
      </div>
      <div className="camera-controls"><button onClick={() => setCameraX((x) => clamp(x + 140, -320, 320))}><ChevronLeft /></button><span><MousePointer2 size={14} /> PAN BOARD</span><button onClick={() => setCameraX((x) => clamp(x - 140, -320, 320))}><ChevronRight /></button></div>
      {phase === "resolving" && <div className={`event-banner ${eventTone}`}><small>SEQUENCE {seqActive}/8</small><b>{event}</b></div>}
    </div>

    <div className="battle-dock">
      <div className="hand-zone"><div className="hand-label"><span><Hand size={15} /> YOUR HAND</span><small>{selectedHand === null ? "Select a developer, then choose a work area" : "Choose a highlighted work area"}</small></div><div className="hand-cards">{hand.map((id, i) => <DevCard key={`${id}-${i}`} dev={getDeveloper(id)} compact selected={selectedHand === i} onClick={() => phase === "plan" && setSelectedHand(selectedHand === i ? null : i)} />)}{Array.from({ length: Math.max(0, 5 - hand.length) }).map((_, i) => <div className="empty-hand" key={i}><Code2 /></div>)}</div></div>
      <div className="battle-actions">
        {phase === "plan" && <button className="plan-button" onClick={() => setPlannerOpen(true)}><Ticket size={21} /><span><b>PLAN SPRINT</b><small>Assign up to 8 sequences</small></span><ChevronRight /></button>}
        {phase === "resolving" && <div className="resolving-button"><span className="spinner" /><div><b>SPRINT IN PROGRESS</b><small>Actions resolve in sequence</small></div></div>}
        {phase === "brag" && <><button className="brag-button" onClick={useBrag}><Sparkles /><span>BRAG!</span>{brags.length > 1 && <em>{brags.length}</em>}</button><button className="skip-button" onClick={skipBrag}>Skip</button></>}
      </div>
    </div>

    {plannerOpen && <Planner developers={placed} project={playerProject} plan={plan} setPlan={setPlan} onClose={() => setPlannerOpen(false)} onRun={resolveTurn} />}
    {phase === "gameover" && <div className="gameover-overlay"><div className={`gameover-card ${winner}`}><div className="burst" /><Trophy size={54} /><span>{winner === "player" ? "SHIP HAPPENS" : "PROD IS DOWN"}</span><h2>{winner === "player" ? "You shipped it." : "You burned out."}</h2><p>{winner === "player" ? "The rival lead has no sanity left. Take the win." : "Your sanity hit zero. The backlog wins this round."}</p><div><button className="primary-cta small" onClick={resetBattle}><RotateCcw size={17} /> Rematch</button><button className="secondary-cta" onClick={onExit}>Main menu</button></div></div></div>}
  </main>;
}

function PlayerHud({ owner, name, sanity, max, project }: { owner: Owner; name: string; sanity: number; max: number; project?: ProjectState }) {
  return <div className={`player-hud ${owner}`}><div className="avatar">{owner === "player" ? "YO" : "NP"}<i /></div><div className="hud-copy"><span>{name}</span><div><Brain size={14} /><b>{sanity}</b><small> / {max} SANITY</small></div><Meter value={sanity} max={max} tone={owner === "enemy" ? "pink" : "cyan"} />{project && <em>{project.name} · {project.progress}/{project.mvp} MVP</em>}</div></div>;
}

function ProjectChip({ project, active, onClick }: { project: ProjectState; active: boolean; onClick: () => void }) {
  const locked = project.claimedBy && !active;
  return <button className={`project-chip ${active ? "active" : ""} ${locked ? "locked" : ""} ${project.completed ? "done" : ""}`} onClick={onClick} style={{ "--project": project.accent } as React.CSSProperties} disabled={!!locked || project.completed}>
    <span className="project-icon"><BriefcaseBusiness size={16} /></span><span><b>{project.name}</b><small>{project.completed ? "SHIPPED" : project.claimedBy === "enemy" ? "CPU CLAIMED" : `${project.mvp} MVP · ${project.brag} BRAG`}</small></span>{locked && <LockKeyhole size={13} />}
  </button>;
}

function BoardSlotView({ slot, index, owner, selected, onDeploy, onToggle }: { slot: BoardSlot; index: number; owner: Owner; selected?: boolean; onDeploy?: () => void; onToggle?: () => void }) {
  const cap = slot.type === "open" ? 4 : 2;
  return <div className={`board-slot ${slot.type} ${selected && slot.developers.length < cap ? "drop-ready" : ""}`} onClick={selected ? onDeploy : undefined}>
    <div className="slot-header"><span>{slot.type === "open" ? <DoorOpen size={13} /> : <LockKeyhole size={13} />}{slot.type === "open" ? "OPEN SPACE" : "CUBICLES"}</span><b>{slot.developers.length}/{cap}</b>{owner === "player" && <button onClick={(e) => { e.stopPropagation(); onToggle?.(); }} title="Switch work area type">↻</button>}</div>
    <div className="slot-grid">{slot.developers.map((placed) => { const dev = getDeveloper(placed.devId); return <div className="board-card" key={placed.instanceId} style={{ "--accent": dev.accent } as React.CSSProperties}><img src={dev.art} alt={dev.name} /><div><b>{dev.name}</b><span><Brain size={10} /> {placed.sanity}</span></div></div>; })}{Array.from({ length: Math.max(0, cap - slot.developers.length) }).map((_, i) => <div className="slot-empty" key={i}><Plus size={13} /></div>)}</div>
    <div className="slot-number">0{index + 1}</div>
  </div>;
}

function Planner({ developers, project, plan, setPlan, onClose, onRun }: { developers: PlacedDev[]; project?: ProjectState; plan: Record<string, PlannedAction>; setPlan: (p: Record<string, PlannedAction>) => void; onClose: () => void; onRun: () => void }) {
  const set = (key: string, value: PlannedAction) => setPlan({ ...plan, [key]: value });
  return <div className="modal-backdrop"><section className="planner-modal">
    <header><div><span className="eyebrow-small">ACTION QUEUE</span><h2>Plan the sprint</h2><p>Each column resolves simultaneously. Stack attempts or coordinate dependencies.</p></div><button onClick={onClose}><X /></button></header>
    <div className="planner-summary"><span><BriefcaseBusiness size={14} /> {project?.name ?? "No project selected"}</span>{project && <span><Zap size={14} /> {project.progress}/{project.mvp} MVP</span>}<span><Ticket size={14} /> 8 sequences max</span></div>
    {!developers.length ? <div className="planner-empty"><Users size={34} /><b>No developers deployed</b><span>Close this panel and deploy someone from your hand.</span></div> : <div className="matrix-wrap"><table className="action-matrix"><thead><tr><th>DEVELOPER</th>{Array.from({ length: 8 }).map((_, i) => <th key={i}><span>{i + 1}</span></th>)}</tr></thead><tbody>{developers.map((placed) => { const dev = getDeveloper(placed.devId); return <tr key={placed.instanceId}><td><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span></td>{Array.from({ length: 8 }).map((_, i) => { const key = `${placed.instanceId}-${i + 1}`; return <td key={key}><select aria-label={`${dev.name} sequence ${i + 1}`} value={plan[key] ?? "skip"} onChange={(e) => set(key, e.target.value as PlannedAction)}><option value="skip">— Skip</option><option value="taunt">Taunt</option>{project?.tasks.filter((t) => roleCanWork(dev.role, t.type) && !project.tasksState[t.id].completed).map((task) => <option value={`work:${task.id}`} key={task.id}>Work · {task.title}</option>)}</select></td>; })}</tr>; })}</tbody></table></div>}
    <div className="task-legend">{project?.tasks.map((task) => <div key={task.id} className={project.tasksState[task.id].completed ? "complete" : ""}><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type} · +{task.points} MVP{task.dependsOn ? ` · linked +${task.coupling}%` : ""}</small></span><em>{project.tasksState[task.id].completed ? "DONE" : `${project.tasksState[task.id].marks} MARKS`}</em></div>)}</div>
    <footer><button className="secondary-cta" onClick={onClose}>Keep planning</button><button className="primary-cta small" onClick={onRun}><Play fill="currentColor" size={16} /> End turn & run sprint</button></footer>
  </section></div>;
}
