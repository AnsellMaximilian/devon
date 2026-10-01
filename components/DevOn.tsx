"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, BookOpen, Brain, BriefcaseBusiness, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleHelp, Code2, DoorOpen, Hand, Home as HomeIcon, Layers3, LockKeyhole, Menu, Minus, MousePointer2, Play, Plus, RotateCcw, Settings, Shield, Sparkles, Swords, Ticket, Trophy, Users, Volume2, VolumeX, X, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { DevCard } from "./DevCard";
import { DEVELOPERS, PROJECTS, ROLE_CHANCES, getDeveloper, roleCanWork, type AreaType, type Developer, type Project } from "@/lib/game-data";

type View = "home" | "deck" | "battle";
type Owner = "player" | "enemy";
type PlacedDev = { instanceId: string; devId: string; sanity: number; slot: number; position: number };
type BoardSlot = { type: AreaType | null; developers: PlacedDev[] };
type TaskProgress = { completed: boolean; marks: number };
type ProjectState = Project & { claimedBy: Owner | null; completed: boolean; progress: number; tasksState: Record<string, TaskProgress> };
type PlannedAction = "skip" | "taunt" | `work:${string}`;
type ActionHighlight = { actorId?: string; targetId?: string; kind: "work" | "taunt" };
type BattlePhase = "setup" | "plan" | "resolving" | "brag" | "gameover";
type InspectedDeveloper = { devId: string; placed?: PlacedDev; owner?: Owner; handIndex?: number };
type StageAnnouncement = { key: number; title: string; subtitle: string; tone: "cyan" | "lime" | "pink" };

const starterDeck = DEVELOPERS.map((d) => d.id);
const emptySlots = (): BoardSlot[] => Array.from({ length: 4 }, () => ({ type: null, developers: [] }));
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
    <button className="brand" onClick={onHome}><span className="brand-mark"><img src="/brand/dev-on-mark.png" alt="" /></span><span><b>DEV ON!</b><small>SHIP IT OR QUIT</small></span></button>
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
    { type: "open", developers: [{ instanceId: "cpu-fan", devId: "fan", sanity: 10, slot: 0, position: 0 }, { instanceId: "cpu-omar", devId: "omar", sanity: 10, slot: 0, position: 1 }] },
    { type: "cubicle", developers: [{ instanceId: "cpu-aiden", devId: "aiden", sanity: 6, slot: 1, position: 0 }] },
    { type: "open", developers: [{ instanceId: "cpu-wendy", devId: "wendy", sanity: 9, slot: 2, position: 0 }] },
    { type: "cubicle", developers: [] }
  ]);
  const [deckOpen, setDeckOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuHelpOpen, setMenuHelpOpen] = useState(false);
  const [soundOn, setSoundOn] = useState(true);
  const [unemployment, setUnemployment] = useState<string[]>([]);
  const [selectedArea, setSelectedArea] = useState<AreaType | null>(null);
  const [draggedArea, setDraggedArea] = useState<AreaType | null>(null);
  const [dragPointer, setDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [hoveredAreaSlot, setHoveredAreaSlot] = useState<number | null>(null);
  const [draggedDeveloper, setDraggedDeveloper] = useState<{ handIndex: number; devId: string } | null>(null);
  const [developerDragPointer, setDeveloperDragPointer] = useState<{ x: number; y: number } | null>(null);
  const [hoveredDesk, setHoveredDesk] = useState<{ slotIndex: number; position: number } | null>(null);
  const [lastAreaInstall, setLastAreaInstall] = useState<{ slot: number; key: number } | null>(null);
  const [projects, setProjects] = useState<ProjectState[]>(() => { const ps = freshProjects(); ps[1].claimedBy = "enemy"; return ps; });
  const [playerSanity, setPlayerSanity] = useState(30);
  const [enemySanity, setEnemySanity] = useState(30);
  const [turn, setTurn] = useState(1);
  const [cameraX, setCameraX] = useState(0);
  const [cameraTilt, setCameraTilt] = useState(52);
  const [cameraZoom, setCameraZoom] = useState(1);
  const [plannerOpen, setPlannerOpen] = useState(false);
  const [sprintConfirmOpen, setSprintConfirmOpen] = useState(false);
  const [projectModalOpen, setProjectModalOpen] = useState(false);
  const [projectNudge, setProjectNudge] = useState<number | null>(null);
  const [plan, setPlan] = useState<Record<string, PlannedAction>>({});
  const [phase, setPhase] = useState<BattlePhase>("setup");
  const [event, setEvent] = useState("Set up your office before the first sprint begins.");
  const [eventTone, setEventTone] = useState<"neutral" | "good" | "bad">("neutral");
  const [brags, setBrags] = useState<number[]>([]);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [seqActive, setSeqActive] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<ActionHighlight | null>(null);
  const [inspectedDeveloper, setInspectedDeveloper] = useState<InspectedDeveloper | null>(null);
  const [announcement, setAnnouncement] = useState<StageAnnouncement | null>({ key: 0, title: "OFFICE SETUP", subtitle: "Build your workspace before the first sprint", tone: "lime" });
  const cameraHoldDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraHoldInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const areaPointerDrag = useRef<{ area: AreaType; pointerId: number; startX: number; startY: number; dragging: boolean; slotIndex: number | null } | null>(null);
  const suppressAreaClick = useRef(false);
  const developerPointerDrag = useRef<{ handIndex: number; devId: string; pointerId: number; startX: number; startY: number; dragging: boolean; desk: { slotIndex: number; position: number } | null } | null>(null);
  const suppressDeveloperClick = useRef(false);
  const playerProject = projects.find((p) => p.claimedBy === "player" && !p.completed);
  const enemyProject = projects.find((p) => p.claimedBy === "enemy" && !p.completed);
  const placed = playerSlots.flatMap((s) => s.developers);
  const configuredAreas = playerSlots.filter((slot) => slot.type).length;
  const setupReady = configuredAreas === 4;
  const deckRemaining = Math.max(0, shuffledDeck.current.length - drawIndex);
  const plannedActions = Object.values(plan).filter((action) => action !== "skip").length;

  useEffect(() => {
    if (!announcement) return;
    const timer = setTimeout(() => setAnnouncement(null), 2100);
    return () => clearTimeout(timer);
  }, [announcement?.key]);

  useEffect(() => {
    if (!projectNudge) return;
    const timer = setTimeout(() => setProjectNudge(null), 3600);
    return () => clearTimeout(timer);
  }, [projectNudge]);

  useEffect(() => () => {
    if (cameraHoldDelay.current) clearTimeout(cameraHoldDelay.current);
    if (cameraHoldInterval.current) clearInterval(cameraHoldInterval.current);
  }, []);

  const showAnnouncement = (title: string, subtitle: string, tone: StageAnnouncement["tone"] = "cyan") => setAnnouncement({ key: Date.now(), title, subtitle, tone });

  const stopCameraHold = () => {
    if (cameraHoldDelay.current) clearTimeout(cameraHoldDelay.current);
    if (cameraHoldInterval.current) clearInterval(cameraHoldInterval.current);
    cameraHoldDelay.current = null;
    cameraHoldInterval.current = null;
  };

  const startCameraHold = (action: () => void) => {
    stopCameraHold();
    cameraHoldDelay.current = setTimeout(() => {
      action();
      cameraHoldInterval.current = setInterval(action, 55);
    }, 220);
  };

  const holdProps = (action: () => void) => ({
    onPointerDown: () => startCameraHold(action),
    onPointerUp: stopCameraHold,
    onPointerLeave: stopCameraHold,
    onPointerCancel: stopCameraHold,
    onClick: action
  });

  const configureSlot = (slotIndex: number, area: AreaType) => {
    if (phase !== "setup") return;
    const slot = playerSlots[slotIndex];
    setPlayerSlots((slots) => slots.map((s, i) => i === slotIndex ? { ...s, type: area } : s));
    setLastAreaInstall({ slot: slotIndex, key: Date.now() });
    setEvent(`${area === "open" ? "Open Space" : "Cubicles"} ${slot.type ? "replaced" : "installed"} in Work Area ${slotIndex + 1}.`);
    setEventTone("good");
  };

  const endAreaDrag = () => { areaPointerDrag.current = null; setDraggedArea(null); setDragPointer(null); setHoveredAreaSlot(null); };

  const startAreaPointer = (event: React.PointerEvent<HTMLButtonElement>, area: AreaType) => {
    if (event.pointerType === "mouse" && event.button !== 0) return;
    areaPointerDrag.current = { area, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false, slotIndex: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveAreaPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = areaPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.dragging && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    event.preventDefault();
    if (!drag.dragging) { drag.dragging = true; setDraggedArea(drag.area); }
    setDragPointer({ x: event.clientX, y: event.clientY });
    const slotElement = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-setup-slot]") as HTMLElement | null;
    const slotIndex = slotElement ? Number(slotElement.dataset.setupSlot) : null;
    drag.slotIndex = slotIndex !== null && Number.isInteger(slotIndex) ? slotIndex : null;
    setHoveredAreaSlot(drag.slotIndex);
  };

  const finishAreaPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = areaPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.dragging) {
      event.preventDefault();
      suppressAreaClick.current = true;
      if (drag.slotIndex !== null) configureSlot(drag.slotIndex, drag.area);
      setTimeout(() => { suppressAreaClick.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endAreaDrag();
  };

  const cancelAreaPointer = (event: React.PointerEvent<HTMLButtonElement>) => {
    const drag = areaPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endAreaDrag();
  };

  const selectAreaCard = (area: AreaType) => {
    if (suppressAreaClick.current) { suppressAreaClick.current = false; return; }
    setSelectedArea(selectedArea === area ? null : area);
  };

  const endDeveloperDrag = () => { developerPointerDrag.current = null; setDraggedDeveloper(null); setDeveloperDragPointer(null); setHoveredDesk(null); };

  const startDeveloperPointer = (event: React.PointerEvent<HTMLDivElement>, handIndex: number, devId: string) => {
    if (phase !== "plan" || (event.pointerType === "mouse" && event.button !== 0)) return;
    developerPointerDrag.current = { handIndex, devId, pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, dragging: false, desk: null };
    event.currentTarget.setPointerCapture(event.pointerId);
  };

  const moveDeveloperPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = developerPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (!drag.dragging && Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) < 6) return;
    event.preventDefault();
    if (!drag.dragging) { drag.dragging = true; setDraggedDeveloper({ handIndex: drag.handIndex, devId: drag.devId }); }
    setDeveloperDragPointer({ x: event.clientX, y: event.clientY });
    const deskElement = document.elementFromPoint(event.clientX, event.clientY)?.closest("[data-developer-desk]") as HTMLElement | null;
    const [slotValue, positionValue] = deskElement?.dataset.developerDesk?.split(":") ?? [];
    const desk = slotValue !== undefined && positionValue !== undefined ? { slotIndex: Number(slotValue), position: Number(positionValue) } : null;
    drag.desk = desk && Number.isInteger(desk.slotIndex) && Number.isInteger(desk.position) ? desk : null;
    setHoveredDesk(drag.desk);
  };

  const finishDeveloperPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = developerPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (drag.dragging) {
      event.preventDefault(); suppressDeveloperClick.current = true;
      if (drag.desk) deploy(drag.handIndex, drag.desk.slotIndex, drag.desk.position);
      setTimeout(() => { suppressDeveloperClick.current = false; }, 0);
    }
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endDeveloperDrag();
  };

  const cancelDeveloperPointer = (event: React.PointerEvent<HTMLDivElement>) => {
    const drag = developerPointerDrag.current;
    if (!drag || drag.pointerId !== event.pointerId) return;
    if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId);
    endDeveloperDrag();
  };

  const inspectHandDeveloper = (devId: string, handIndex: number) => {
    if (suppressDeveloperClick.current) { suppressDeveloperClick.current = false; return; }
    setInspectedDeveloper({ devId, handIndex });
  };

  const finishSetup = () => {
    if (!setupReady) return;
    setSelectedArea(null); endAreaDrag();
    setProjectNudge(null);
    setPhase("plan");
    setEvent("Office locked in. Deploy developers and choose your first project.");
    setEventTone("good");
    showAnnouncement("YOUR TURN", "Sprint 01 · Deploy your team and choose a project", "cyan");
  };

  const deploy = (handIndex: number, slotIndex: number, position: number) => {
    if (phase !== "plan" || !hand[handIndex]) return;
    const dev = getDeveloper(hand[handIndex]);
    const slot = playerSlots[slotIndex];
    if (!slot.type) { setEvent("Install an office card in that bay before deploying a developer."); setEventTone("bad"); return; }
    const cap = slot.type === "open" ? 4 : 2;
    if (slot.developers.length >= cap) { setEvent("That work area is already full."); setEventTone("bad"); return; }
    if (position < 0 || position >= cap || slot.developers.some((placedDev) => placedDev.position === position)) { setEvent("That desk is already occupied."); setEventTone("bad"); return; }
    if (dev.id === "aiden" && slot.type === "open") { setEvent("Aiden refuses the open space. Try a cubicle."); setEventTone("bad"); return; }
    const instance: PlacedDev = { instanceId: `${dev.id}-${Date.now()}`, devId: dev.id, sanity: dev.sanity, slot: slotIndex, position };
    setPlayerSlots((slots) => slots.map((s, i) => i === slotIndex ? { ...s, developers: [...s.developers, instance] } : s));
    setHand((h) => h.filter((_, i) => i !== handIndex));
    setEvent(`${dev.name} took Desk ${position + 1} in Work Area ${slotIndex + 1}.`); setEventTone("good");
  };

  const claimProject = (id: string) => {
    if (phase !== "plan") return;
    if (playerProject) { setEvent("Finish or abandon your current project first."); setEventTone("bad"); return; }
    const target = projects.find((p) => p.id === id);
    if (!target || target.claimedBy || target.completed) return;
    setProjects((ps) => ps.map((p) => p.id === id ? { ...p, claimedBy: "player" } : p));
    setProjectNudge(null);
    setProjectModalOpen(false);
    setEvent(`${target.name} locked. Time to plan the sprint.`); setEventTone("good");
  };

  const abandon = () => {
    if (!playerProject || phase !== "plan") return;
    setPlayerSanity((s) => Math.max(0, s - 3));
    setProjects((ps) => ps.map((p) => p.id === playerProject.id ? { ...p, claimedBy: null, progress: 0, tasksState: Object.fromEntries(p.tasks.map((t) => [t.id, { completed: false, marks: 0 }])) } : p));
    setEvent("Project abandoned. Your reputation takes 3 sanity damage."); setEventTone("bad");
  };

  const openProjectPicker = () => {
    if (phase !== "plan") return;
    setProjectNudge(null);
    setProjectModalOpen(true);
  };

  const openSprintPlanner = () => {
    if (phase !== "plan") return;
    if (!playerProject) {
      setProjectNudge(Date.now());
      setEvent("Select a project before planning this sprint.");
      setEventTone("bad");
      return;
    }
    setPlannerOpen(true);
  };

  const openSprintConfirmation = () => {
    if (phase !== "plan") return;
    if (!playerProject) {
      setProjectNudge(Date.now());
      setEvent("Select a project before launching this sprint.");
      setEventTone("bad");
      return;
    }
    if (!placed.length) {
      setEvent("Deploy at least one developer before launching the sprint.");
      setEventTone("bad");
      return;
    }
    setSprintConfirmOpen(true);
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
    showAnnouncement("YOUR TURN", `Sprint ${String(turn + 1).padStart(2, "0")} · Plan your next sequence`, "cyan");
  };

  const resolveTurn = async () => {
    if (!playerProject) { setEvent("Claim a project before running the sprint."); setEventTone("bad"); setPlannerOpen(false); return; }
    if (playerSlots.some((slot) => !slot.type)) { setEvent("Install all four work-area cards before running the sprint."); setEventTone("bad"); setPlannerOpen(false); return; }
    if (!placed.length) { setEvent("Deploy at least one developer first."); setEventTone("bad"); setPlannerOpen(false); return; }
    setPlannerOpen(false); setSprintConfirmOpen(false); setPhase("resolving");
    let pSlots = playerSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let eSlots = enemySlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let ps = projects.map((p) => ({ ...p, tasksState: Object.fromEntries(Object.entries(p.tasksState).map(([k, v]) => [k, { ...v }])) }));
    let pSan = playerSanity, eSan = enemySanity;
    let queuedBrags = [...brags];
    let quitDevelopers = [...unemployment];
    let pProjectId: string | undefined = playerProject.id;
    let aiProjectId: string | undefined = enemyProject?.id;

    for (let seq = 1; seq <= 8; seq++) {
      setSeqActive(seq);
      const sequenceEvents: string[] = [];
      let sequenceHighlight: ActionHighlight | null = null;
      const pp = ps.find((p) => p.id === pProjectId && !p.completed);
      if (pp) for (const instance of pSlots.flatMap((s) => s.developers)) {
        const dev = getDeveloper(instance.devId);
        const action = plan[`${instance.instanceId}-${seq}`] ?? "skip";
        if (action.startsWith("work:")) {
          const taskId = action.slice(5); const task = pp.tasks.find((t) => t.id === taskId);
          if (!task || pp.tasksState[taskId].completed || !roleCanWork(dev.role, task.type)) continue;
          const chance = completionChance(dev, taskId, pp, pSlots, instance, seq);
          if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, kind: "work" };
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
          if (targetSlot.type === "cubicle" || !targetSlot.developers.length) { eSan = Math.max(0, eSan - damage); sequenceEvents.push(`${dev.name}'s taunt hit the rival lead for ${damage}`); if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, targetId: "enemy-lead", kind: "taunt" }; }
          else {
            const target = targetSlot.developers[Math.floor(Math.random() * targetSlot.developers.length)];
            let hit = damage;
            if (target.devId === "fan" && dev.role === "Frontend") hit = Math.max(1, Math.floor(hit / 2));
            if (targetSlot.developers.some((d) => d.devId === "wendy")) hit = Math.max(1, hit - 1);
            target.sanity -= hit; sequenceEvents.push(`${dev.name} rattled ${getDeveloper(target.devId).name} for ${hit}`);
            if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, targetId: target.instanceId, kind: "taunt" };
            if (target.sanity <= 0) { targetSlot.developers = targetSlot.developers.filter((d) => d.instanceId !== target.instanceId); sequenceEvents.push(`${getDeveloper(target.devId).name} quit!`); }
          }
        }
      }

      const ap = ps.find((p) => p.id === aiProjectId && !p.completed);
      if (ap) for (const instance of eSlots.flatMap((s) => s.developers)) {
        const dev = getDeveloper(instance.devId);
        if (Math.random() < .18) {
          const targetSlot = pSlots[3 - instance.slot]; const damage = 2;
          if (targetSlot.type === "cubicle" || !targetSlot.developers.length) { pSan = Math.max(0, pSan - damage); sequenceEvents.push(`CPU taunt hit you for ${damage}`); if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, targetId: "player-lead", kind: "taunt" }; }
          else if (targetSlot.developers.length) {
            const target = targetSlot.developers[Math.floor(Math.random() * targetSlot.developers.length)];
            let hit = targetSlot.developers.some((d) => d.devId === "wendy") ? 1 : 2;
            if (target.devId === "fan" && dev.role === "Frontend") hit = 1;
            target.sanity -= hit; sequenceEvents.push(`${dev.name} taunted ${getDeveloper(target.devId).name}`);
            if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, targetId: target.instanceId, kind: "taunt" };
            if (target.sanity <= 0) { targetSlot.developers = targetSlot.developers.filter((d) => d.instanceId !== target.instanceId); quitDevelopers.push(target.devId); sequenceEvents.push(`${getDeveloper(target.devId).name} quit!`); }
          }
          continue;
        }
        const tasks = ap.tasks.filter((t) => !ap.tasksState[t.id].completed && roleCanWork(dev.role, t.type));
        if (!tasks.length || Math.random() < .20) continue;
        const task = tasks[Math.floor(Math.random() * tasks.length)];
        if (!sequenceHighlight) sequenceHighlight = { actorId: instance.instanceId, kind: "work" };
        const chance = clamp(dev.completion + (ROLE_CHANCES[dev.role][task.type] ?? -100) + ap.tasksState[task.id].marks * 6 + (task.dependsOn && ap.tasksState[task.dependsOn]?.completed ? task.coupling ?? 0 : 0), 12, 94);
        if (Math.random() * 100 <= chance) {
          ap.tasksState[task.id].completed = true; ap.progress = Math.min(ap.mvp, ap.progress + task.points); sequenceEvents.push(`CPU shipped ${task.title}`);
          if (ap.progress >= ap.mvp) { ap.completed = true; aiProjectId = undefined; eSan = eSan; pSan = Math.max(0, pSan - ap.brag); sequenceEvents.push(`CPU bragged ${ap.name} for ${ap.brag} sanity!`); break; }
        } else ap.tasksState[task.id].marks += 1;
      }

      setPlayerSlots(pSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setEnemySlots(eSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setUnemployment([...quitDevelopers]);
      setProjects(ps.map((p) => ({ ...p, tasksState: { ...p.tasksState } })));
      setPlayerSanity(pSan); setEnemySanity(eSan); setBrags(queuedBrags);
      setHighlight(sequenceHighlight);
      setEvent(sequenceEvents.length ? sequenceEvents.join(" · ") : `Sequence ${seq}: the office is suspiciously quiet.`);
      setEventTone(sequenceEvents.some((x) => x.includes("missed") || x.includes("CPU")) ? "bad" : sequenceEvents.length ? "good" : "neutral");
      if (pSan <= 0 || eSan <= 0) break;
      await wait(sequenceEvents.length ? 1450 : 850);
      setHighlight(null);
    }
    if (pSan <= 0 || eSan <= 0) { setWinner(pSan > 0 ? "player" : "enemy"); setPhase("gameover"); return; }
    setSeqActive(null); setHighlight(null);
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
      { type: "open", developers: [{ instanceId: "cpu-fan", devId: "fan", sanity: 10, slot: 0, position: 0 }, { instanceId: "cpu-omar", devId: "omar", sanity: 10, slot: 0, position: 1 }] },
      { type: "cubicle", developers: [{ instanceId: "cpu-aiden", devId: "aiden", sanity: 6, slot: 1, position: 0 }] },
      { type: "open", developers: [{ instanceId: "cpu-wendy", devId: "wendy", sanity: 9, slot: 2, position: 0 }] },
      { type: "cubicle", developers: [] }
    ]);
    setDeckOpen(false); setMenuOpen(false); setMenuHelpOpen(false); setUnemployment([]); setSelectedArea(null); endAreaDrag(); endDeveloperDrag(); setLastAreaInstall(null);
    const nextProjects = freshProjects();
    nextProjects[1].claimedBy = "enemy";
    setProjects(nextProjects);
    setPlayerSanity(30); setEnemySanity(30); setTurn(1); setCameraX(0); setCameraTilt(52); setCameraZoom(1);
    setPlannerOpen(false); setSprintConfirmOpen(false); setProjectModalOpen(false); setProjectNudge(null); setPlan({}); setPhase("setup"); setBrags([]);
    setWinner(null); setSeqActive(null); setHighlight(null); setInspectedDeveloper(null); setEventTone("neutral");
    setAnnouncement({ key: Date.now(), title: "OFFICE SETUP", subtitle: "Build your workspace before the first sprint", tone: "lime" });
    setEvent("Set up your office before the first sprint begins.");
  };

  return <main className={`battle-screen ${phase === "setup" ? "setup-active" : ""}`}>
    <div className="battle-hud">
      <PlayerHud owner="enemy" name="NULL POINTERS" sanity={enemySanity} max={30} project={enemyProject} targeted={highlight?.targetId === "enemy-lead"} />
      <div className={`turn-pill ${phase === "setup" ? "setup" : ""}`}><span>{phase === "setup" ? "OFFICE" : "SPRINT"}</span><b>{phase === "setup" ? `${configuredAreas}/4` : String(turn).padStart(2, "0")}</b><small>{phase === "setup" ? "LAYOUT SETUP" : phase === "resolving" ? `SEQUENCE ${seqActive ?? 1}/8` : phase === "brag" ? "BRAG WINDOW" : "PLANNING"}</small></div>
      <PlayerHud owner="player" name="YOU // LOCALHOST" sanity={playerSanity} max={30} project={playerProject} targeted={highlight?.targetId === "player-lead"} />
    </div>

    {phase === "setup" ? <div className="setup-console-spacer" aria-hidden="true" /> : <div className="project-console">
      {playerProject ? <button className="active-project-card" onClick={() => setProjectModalOpen(true)} style={{ "--project": playerProject.accent } as React.CSSProperties}>
        <span className="project-icon"><BriefcaseBusiness size={17} /></span><span><b>{playerProject.name}</b><small>{playerProject.tasks.filter((t) => playerProject.tasksState[t.id].completed).length}/{playerProject.tasks.length} TASKS · {playerProject.progress}/{playerProject.mvp} MVP</small></span><Meter value={playerProject.progress} max={playerProject.mvp} tone="lime" /><em>VIEW PLAN</em>
      </button> : <button className={`select-project-button ${projectNudge ? "needs-attention" : ""}`} onClick={openProjectPicker} disabled={phase !== "plan"}><Plus size={16} /><span><b>Select a project</b><small>Review scope before committing</small></span><ChevronRight size={16} /></button>}
      {projectNudge && <img key={projectNudge} className="project-pointer" src="/ui/project-cursor.png" alt="" aria-hidden="true" />}
    </div>}

    <div className={`board-viewport ${phase === "setup" ? "setup-board" : ""}`}>
      <div className="board-world" style={{ transform: `translateX(calc(-50% + ${cameraX}px)) translateY(${phase === "setup" ? -82 : -115}px) rotateX(${cameraTilt}deg) scale(${(phase === "setup" ? .86 : .8) * cameraZoom})` }}>
        <div className="board-surface">
          <div className="lane-label enemy-lane">RIVAL OFFICE</div>
          <div className="slot-row enemy-row">{enemySlots.map((slot, i) => <BoardSlotView key={i} slot={slot} index={i} owner="enemy" highlight={highlight} onInspect={(placedDev) => setInspectedDeveloper({ devId: placedDev.devId, placed: placedDev, owner: "enemy" })} />)}</div>
          <div className="center-line"><span>PRODUCTION</span><i /><span>PRODUCTION</span></div>
          <div className="slot-row player-row">{playerSlots.map((slot, i) => <BoardSlotView key={`${i}-${lastAreaInstall?.slot === i ? lastAreaInstall.key : 0}`} slot={slot} index={i} owner="player" setupMode={phase === "setup"} selectedArea={selectedArea} draggedArea={draggedArea} dragOver={hoveredAreaSlot === i} draggedDeveloper={draggedDeveloper} hoveredDeskPosition={hoveredDesk?.slotIndex === i ? hoveredDesk.position : null} justPlaced={lastAreaInstall?.slot === i} onConfigure={(area) => configureSlot(i, area)} onInspect={(placedDev) => setInspectedDeveloper({ devId: placedDev.devId, placed: placedDev, owner: "player" })} highlight={highlight} />)}</div>
          <div className="lane-label player-lane">YOUR OFFICE</div>
        </div>
      </div>
      <button className="battle-menu-trigger" onClick={() => setMenuOpen(true)} aria-label="Open battle menu"><Menu size={20} /><span><b>MENU</b><small>SETTINGS</small></span></button>
      <div className="camera-controls camera-pad">
        <button aria-label="Tilt board up" title="Hold to tilt up" {...holdProps(() => setCameraTilt((tilt) => clamp(tilt - 1.25, 38, 68)))}><ChevronUp /></button>
        <div><button aria-label="Pan board left" title="Hold to pan left" {...holdProps(() => setCameraX((x) => clamp(x - 20, -380, 380)))}><ChevronLeft /></button><span><MousePointer2 size={13} /><b>{Math.round(cameraTilt)}°</b><small>HOLD TO MOVE</small></span><button aria-label="Pan board right" title="Hold to pan right" {...holdProps(() => setCameraX((x) => clamp(x + 20, -380, 380)))}><ChevronRight /></button></div>
        <button aria-label="Tilt board down" title="Hold to tilt down" {...holdProps(() => setCameraTilt((tilt) => clamp(tilt + 1.25, 38, 68)))}><ChevronDown /></button>
        <div className="zoom-controls"><button aria-label="Zoom board out" title="Hold to zoom out" {...holdProps(() => setCameraZoom((zoom) => clamp(zoom - .025, .72, 1.3)))}><ZoomOut /></button><span><b>{Math.round(cameraZoom * 100)}%</b><small>ZOOM</small></span><button aria-label="Zoom board in" title="Hold to zoom in" {...holdProps(() => setCameraZoom((zoom) => clamp(zoom + .025, .72, 1.3)))}><ZoomIn /></button></div>
      </div>
      {announcement && <div key={announcement.key} className={`stage-announcement ${announcement.tone}`}><small>{phase === "setup" ? "PRE-BATTLE" : "ACTIVE PLAYER"}</small><b>{announcement.title}</b><span>{announcement.subtitle}</span></div>}
      {phase === "plan" && projectNudge && <div key={projectNudge} className="project-required-warning" role="status" aria-live="polite"><AlertTriangle size={18} /><span><b>SELECT A PROJECT FIRST</b><small>Claim work from the shared backlog, then plan your sprint.</small></span></div>}
      {phase === "setup" && !announcement && configuredAreas === 0 && <div className="setup-drag-hint"><b>PLACE YOUR OFFICE SPACES</b><span>Drag space cards into slots</span></div>}
      {phase === "setup" && !announcement && <div className="setup-card-tray" aria-label="Reusable office space cards"><OfficeCard area="open" selected={selectedArea === "open"} dragging={draggedArea === "open"} onClick={() => selectAreaCard("open")} onPointerDown={(event) => startAreaPointer(event, "open")} onPointerMove={moveAreaPointer} onPointerUp={finishAreaPointer} onPointerCancel={cancelAreaPointer} /><OfficeCard area="cubicle" selected={selectedArea === "cubicle"} dragging={draggedArea === "cubicle"} onClick={() => selectAreaCard("cubicle")} onPointerDown={(event) => startAreaPointer(event, "cubicle")} onPointerMove={moveAreaPointer} onPointerUp={finishAreaPointer} onPointerCancel={cancelAreaPointer} /></div>}
      {phase === "setup" && <div className="setup-deck-preview"><DrawPile remaining={deck.length} total={deck.length} label="YOUR DECK" onOpen={() => setDeckOpen(true)} /></div>}
      {phase === "setup" && <div className="setup-ready-panel"><div><span>OFFICE LAYOUT</span><b>{configuredAreas}<small>/4</small></b><p>{setupReady ? "Every bay is configured." : selectedArea ? `Click a bay to place ${selectedArea === "open" ? "Open Space" : "Cubicles"}.` : "Drag a reusable space card into each bay."}</p></div><button onClick={finishSetup} disabled={!setupReady}><Check size={18} /><span><b>READY</b><small>{setupReady ? "Begin Sprint 01" : `${4 - configuredAreas} bays remaining`}</small></span></button></div>}
      {phase === "resolving" && <div className={`event-banner ${eventTone}`}><small>SEQUENCE {seqActive}/8</small><b>{event}</b></div>}
    </div>

    {phase !== "setup" && <div className="battle-dock"><div className="bottom-command-panel">
        <div className="pile-rack">
          <DrawPile remaining={deckRemaining} total={shuffledDeck.current.length} onOpen={() => setDeckOpen(true)} />
          <UnemploymentPile developers={unemployment} />
        </div>
        <div className="hand-zone"><div className="hand-label"><span><Hand size={15} /> DEVELOPER HAND</span><small>Click to inspect · drag onto an exact desk</small></div><div className="hand-cards fanned">{hand.map((id, i) => { const dev = getDeveloper(id); const offset = i - (hand.length - 1) / 2; return <div className={`hand-drag-card ${draggedDeveloper?.handIndex === i ? "dragging" : ""}`} style={{ "--fan-angle": `${offset * 3.5}deg`, "--fan-y": `${Math.abs(offset) * 3}px`, zIndex: i + 1 } as React.CSSProperties} onClick={() => inspectHandDeveloper(id, i)} onPointerDown={(event) => startDeveloperPointer(event, i, id)} onPointerMove={moveDeveloperPointer} onPointerUp={finishDeveloperPointer} onPointerCancel={cancelDeveloperPointer} key={`${id}-${i}`}><DevCard dev={dev} compact /></div>; })}{Array.from({ length: Math.max(0, 5 - hand.length) }).map((_, i) => <div className="empty-hand" key={i}><Code2 /></div>)}</div></div>
        <div className="battle-actions">
          {phase === "plan" && <div className="sprint-controls"><button className="sprint-button" onClick={openSprintConfirmation} aria-label="Run sprint and end turn"><img src="/ui/sprint-button.png" alt="" /><span>SPRINT!</span></button><button className="plan-queue-button" onClick={openSprintPlanner}><Ticket size={15} /><span>PLAN</span><em>{plannedActions}</em></button></div>}
          {phase === "resolving" && <div className="resolving-button"><span className="spinner" /><div><b>SPRINT IN PROGRESS</b><small>Actions resolve in sequence</small></div></div>}
          {phase === "brag" && <><button className="brag-button" onClick={useBrag}><Sparkles /><span>BRAG!</span>{brags.length > 1 && <em>{brags.length}</em>}</button><button className="skip-button" onClick={skipBrag}>Skip</button></>}
        </div>
    </div></div>}

    {phase === "setup" && draggedArea && dragPointer && <div aria-hidden="true" className={`setup-drag-ghost ${draggedArea}`} style={{ left: dragPointer.x, top: dragPointer.y }}><img src={draggedArea === "open" ? "/areas/open-space.png" : "/areas/cubicles.png"} alt="" /><span>{draggedArea === "open" ? <DoorOpen size={15} /> : <LockKeyhole size={15} />}<b>{draggedArea === "open" ? "OPEN SPACE" : "CUBICLES"}</b></span><em>DROP TO INSTALL</em></div>}
    {phase === "plan" && draggedDeveloper && developerDragPointer && (() => { const dev = getDeveloper(draggedDeveloper.devId); return <div aria-hidden="true" className="developer-drag-ghost" style={{ left: developerDragPointer.x, top: developerDragPointer.y, "--accent": dev.accent } as React.CSSProperties}><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span><em>DROP ON A DESK</em></div>; })()}

    {plannerOpen && <Planner developers={placed} project={playerProject} plan={plan} setPlan={setPlan} onClose={() => setPlannerOpen(false)} onSave={() => setPlannerOpen(false)} />}
    {sprintConfirmOpen && <SprintConfirmation turn={turn} project={playerProject} plannedActions={plannedActions} onCancel={() => setSprintConfirmOpen(false)} onConfirm={resolveTurn} />}
    {projectModalOpen && <ProjectPicker projects={projects} activeProject={playerProject} onClaim={claimProject} onAbandon={abandon} onClose={() => setProjectModalOpen(false)} canEdit={phase === "plan"} />}
    {deckOpen && <DeckViewer deck={deck} remaining={phase === "setup" ? deck.length : deckRemaining} onClose={() => setDeckOpen(false)} onInspect={(devId) => setInspectedDeveloper({ devId })} />}
    {inspectedDeveloper && <DeveloperDetails inspected={inspectedDeveloper} onClose={() => setInspectedDeveloper(null)} />}
    {menuOpen && <div className="modal-backdrop battle-menu-backdrop" onClick={() => setMenuOpen(false)}><section className="battle-menu-modal" onClick={(event) => event.stopPropagation()}>
      <header><img src="/brand/dev-on-mark.png" alt="" /><div><span className="eyebrow-small">BATTLE PAUSED</span><h2>Dev On! menu</h2><p>Adjust the session or review the essentials.</p></div><button onClick={() => setMenuOpen(false)} aria-label="Close battle menu"><X /></button></header>
      {menuHelpOpen ? <div className="battle-menu-help"><div><BookOpen size={22} /><span><b>Battle essentials</b><small>Quick rules reference</small></span></div><ol><li>Claim one project and deploy developers into configured offices.</li><li>Plan up to eight action sequences. Developers can work in parallel.</li><li>Complete the MVP, then Brag to damage the rival lead&apos;s sanity.</li><li>Developers at zero sanity enter the Unemployment pile.</li></ol><button className="menu-row" onClick={() => setMenuHelpOpen(false)}><ArrowLeft /><span><b>Back to menu</b><small>Return to session controls</small></span></button></div> : <div className="battle-menu-options">
        <button className="menu-row primary" onClick={() => setMenuOpen(false)}><Play /><span><b>Continue battle</b><small>Return to the board</small></span><ChevronRight /></button>
        <button className="menu-row" onClick={() => setSoundOn((enabled) => !enabled)}>{soundOn ? <Volume2 /> : <VolumeX />}<span><b>Sound effects</b><small>{soundOn ? "Enabled" : "Muted"}</small></span><em className={soundOn ? "on" : ""}>{soundOn ? "ON" : "OFF"}</em></button>
        <button className="menu-row" onClick={() => setMenuHelpOpen(true)}><CircleHelp /><span><b>How to play</b><small>Review the battle loop</small></span><ChevronRight /></button>
        <button className="menu-row" onClick={resetBattle}><RotateCcw /><span><b>Restart battle</b><small>Return to office setup</small></span></button>
        <button className="menu-row danger" onClick={onExit}><HomeIcon /><span><b>Main menu</b><small>Leave this battle</small></span></button>
      </div>}
      <footer><Settings size={14} /> LOCAL SESSION · SINGLEPLAYER MVP</footer>
    </section></div>}
    {phase === "gameover" && <div className="gameover-overlay"><div className={`gameover-card ${winner}`}><div className="burst" /><Trophy size={54} /><span>{winner === "player" ? "SHIP HAPPENS" : "PROD IS DOWN"}</span><h2>{winner === "player" ? "You shipped it." : "You burned out."}</h2><p>{winner === "player" ? "The rival lead has no sanity left. Take the win." : "Your sanity hit zero. The backlog wins this round."}</p><div><button className="primary-cta small" onClick={resetBattle}><RotateCcw size={17} /> Rematch</button><button className="secondary-cta" onClick={onExit}>Main menu</button></div></div></div>}
  </main>;
}

function OfficeCard({ area, selected, dragging, onClick, onPointerDown, onPointerMove, onPointerUp, onPointerCancel }: { area: AreaType; selected: boolean; dragging: boolean; onClick: () => void; onPointerDown: (event: React.PointerEvent<HTMLButtonElement>) => void; onPointerMove: (event: React.PointerEvent<HTMLButtonElement>) => void; onPointerUp: (event: React.PointerEvent<HTMLButtonElement>) => void; onPointerCancel: (event: React.PointerEvent<HTMLButtonElement>) => void }) {
  const open = area === "open";
  return <button type="button" draggable={false} aria-label={`Drag ${open ? "Open Space" : "Cubicles"} card`} className={`setup-space-card ${area} ${selected ? "selected" : ""} ${dragging ? "dragging" : ""}`} onClick={onClick} onPointerDown={onPointerDown} onPointerMove={onPointerMove} onPointerUp={onPointerUp} onPointerCancel={onPointerCancel}>
    <img src={open ? "/areas/open-space.png" : "/areas/cubicles.png"} alt="" draggable={false} />
    <span><i>{open ? <DoorOpen size={14} /> : <LockKeyhole size={14} />}</i><span><b>{open ? "OPEN SPACE" : "CUBICLES"}</b><small>{open ? "4 DESKS · COLLAB" : "2 DESKS · PROTECTED"}</small></span></span>
    <em>DRAG TO PLACE</em>
  </button>;
}

function DrawPile({ remaining, total, label = "DRAW PILE", onOpen }: { remaining: number; total: number; label?: string; onOpen: () => void }) {
  return <button type="button" className="draw-pile" onClick={onOpen} aria-label={`Open ${label.toLowerCase()}`}>
    <span className="pile-label"><Layers3 size={13} /><b>{label}</b></span>
    <span className="pile-visual"><span className={`card-back-stack ${remaining ? "" : "empty"}`}><i><img src="/cards/dev-on-card-back.png" alt="" /></i><i><img src="/cards/dev-on-card-back.png" alt="" /></i><i><img src="/cards/dev-on-card-back.png" alt="" /></i></span><strong className="pile-badge left">{remaining}</strong></span>
    <small>{label === "YOUR DECK" ? `${total} CARD LOADOUT` : "CLICK TO INSPECT"}</small>
  </button>;
}

function UnemploymentPile({ developers }: { developers: string[] }) {
  const names = developers.map((id) => getDeveloper(id).name).join(", ");
  return <div className={`unemployment-pile ${developers.length ? "occupied" : ""}`} aria-label={`${developers.length} developers in unemployment${names ? `: ${names}` : ""}`} title={names || "No developers have quit"}>
    <span className="pile-label"><BriefcaseBusiness size={13} /><b>UNEMPLOYMENT</b></span>
    <span className="pile-visual"><span className={`card-back-stack unemployment ${developers.length ? "" : "empty"}`}><i><img src="/cards/unemployment-card-back.png" alt="" /></i><i><img src="/cards/unemployment-card-back.png" alt="" /></i><i><img src="/cards/unemployment-card-back.png" alt="" /></i></span><strong className="pile-badge right">{developers.length}</strong></span>
    <small>{developers.length ? "OUT OF THE GAME" : "NO QUITTERS"}</small>
  </div>;
}

function DeckViewer({ deck, remaining, onClose, onInspect }: { deck: string[]; remaining: number; onClose: () => void; onInspect: (devId: string) => void }) {
  const counts = Object.fromEntries(DEVELOPERS.map((dev) => [dev.id, deck.filter((id) => id === dev.id).length]));
  const roster = DEVELOPERS.filter((dev) => counts[dev.id]);
  return <div className="modal-backdrop deck-viewer-backdrop" onClick={onClose}><section className="deck-viewer" onClick={(event) => event.stopPropagation()}>
    <header><div><span className="eyebrow-small">CURRENT LOADOUT</span><h2>Your developer deck</h2><p>Review your roles and traits before committing office space. Click any card for its full profile.</p></div><div className="deck-viewer-count"><b>{deck.length}</b><small>TOTAL CARDS<br />{remaining} IN DRAW PILE</small></div><button onClick={onClose} aria-label="Close deck overview"><X size={18} /></button></header>
    <div className="deck-viewer-grid">{roster.map((dev, index) => <button type="button" onClick={() => onInspect(dev.id)} className="deck-overview-card" key={dev.id} style={{ "--accent": dev.accent, "--deal-delay": `${index * 35}ms` } as React.CSSProperties}><img src={dev.art} alt={`${dev.name} portrait`} /><span className="deck-card-role">{dev.role}</span><em className="deck-card-count">×{counts[dev.id]}</em><span className="deck-card-overlay"><b>{dev.name}</b><span className="deck-card-stats"><i><Brain size={11} /> {dev.completion}%</i><i><Shield size={11} /> {dev.sanity}</i></span><small><Sparkles size={10} /> {dev.traitLabel}</small></span></button>)}</div>
    <footer><span><Layers3 size={15} /> {roster.length} unique developers · {deck.length}/20 cards</span><button className="primary-cta small" onClick={onClose}>Back to board</button></footer>
  </section></div>;
}

function DeveloperDetails({ inspected, onClose }: { inspected: InspectedDeveloper; onClose: () => void }) {
  const dev = getDeveloper(inspected.devId);
  const currentSanity = inspected.placed?.sanity ?? dev.sanity;
  const workTypes = dev.role === "Full Stack" ? "Frontend + Backend" : dev.role;
  return <div className="modal-backdrop card-detail-backdrop" onClick={onClose}><section className="developer-detail" onClick={(event) => event.stopPropagation()} style={{ "--accent": dev.accent } as React.CSSProperties}>
    <button className="detail-close" onClick={onClose} aria-label="Close developer details"><X size={18} /></button>
    <div className="detail-art"><img src={dev.art} alt={`${dev.name} portrait`} /><span>{dev.role}</span></div>
    <div className="detail-copy">
      <span className="eyebrow-small">DEVELOPER PROFILE</span><h2>{dev.name}</h2><blockquote>“{dev.quote}”</blockquote>
      <div className="detail-stats">
        <div><Brain size={18} /><span><b>{dev.completion}%</b><small>COMPLETION POWER</small></span></div>
        <div><Shield size={18} /><span><b>{currentSanity}<small>/{dev.sanity}</small></b><small>{inspected.placed ? "CURRENT SANITY" : "SANITY"}</small></span></div>
        <div><Code2 size={18} /><span><b>{workTypes}</b><small>WORK COMPATIBILITY</small></span></div>
      </div>
      <div className="detail-trait"><Sparkles size={20} /><span><small>SPECIAL TRAIT</small><b>{dev.traitLabel}</b><p>{dev.trait}</p></span></div>
      {inspected.owner && <div className={`detail-owner ${inspected.owner}`}><span>{inspected.owner === "enemy" ? "RIVAL TEAM" : "YOUR TEAM"}</span><small>Work Area {(inspected.placed?.slot ?? 0) + 1} · Desk {(inspected.placed?.position ?? 0) + 1}</small></div>}
    </div>
  </section></div>;
}

function PlayerHud({ owner, name, sanity, max, project, targeted = false }: { owner: Owner; name: string; sanity: number; max: number; project?: ProjectState; targeted?: boolean }) {
  const rain = owner === "player" ? ["01", "</>", "npm", "101", "git", "{}", "dev", "011"] : ["ERR", "404", "NULL", "010", "BUG", "!", "500", "ptr"];
  return <div className={`player-hud ${owner} ${targeted ? "targeted" : ""}`}>
    <span className="matrix-rain" aria-hidden="true">{rain.map((glyphs, index) => <i key={`${glyphs}-${index}`} style={{ "--matrix-x": `${6 + index * 12}%`, "--matrix-delay": `${-index * .47}s`, "--matrix-speed": `${2.9 + index % 3 * .7}s` } as React.CSSProperties}>{glyphs}</i>)}</span>
    {targeted && <span className="hud-target">!</span>}<div className="avatar">{owner === "player" ? "YO" : "NP"}<i /></div><div className="hud-copy"><span>{name}</span><div><Brain size={14} /><b>{sanity}</b><small> / {max} SANITY</small></div><Meter value={sanity} max={max} tone={owner === "enemy" ? "pink" : "cyan"} /></div>
  </div>;
}

function ProjectPicker({ projects, activeProject, onClaim, onAbandon, onClose, canEdit }: { projects: ProjectState[]; activeProject?: ProjectState; onClaim: (id: string) => void; onAbandon: () => void; onClose: () => void; canEdit: boolean }) {
  const [selectedId, setSelectedId] = useState<string | null>(activeProject?.id ?? null);
  const [confirmAbandon, setConfirmAbandon] = useState(false);
  const selected = projects.find((p) => p.id === selectedId);
  const locked = !!selected?.claimedBy && selected.claimedBy !== "player";
  return <div className="modal-backdrop"><section className="project-modal">
    <header><div><span className="eyebrow-small">SHARED BACKLOG</span><h2>{activeProject ? "Current project" : "Choose your commitment"}</h2><p>Inspect the entire scope. Once confirmed, this project is locked to your team.</p></div><button onClick={onClose}><X /></button></header>
    <div className="project-picker-body">
      <aside className="project-picker-list">{projects.map((project) => {
        const isLocked = !!project.claimedBy && project.claimedBy !== "player";
        return <button key={project.id} className={`${selectedId === project.id ? "selected" : ""} ${isLocked || project.completed ? "locked" : ""}`} onClick={() => setSelectedId(project.id)} style={{ "--project": project.accent } as React.CSSProperties}>
          <span className="project-icon"><BriefcaseBusiness size={17} /></span><span><b>{project.name}</b><small>{project.client}</small></span><em>{project.completed ? "SHIPPED" : isLocked ? "CPU CLAIMED" : `${project.mvp} MVP`}</em>{isLocked && <LockKeyhole size={13} />}
        </button>;
      })}</aside>
      <div className="project-scope">{selected ? <>
        <div className="scope-heading" style={{ "--project": selected.accent } as React.CSSProperties}><span><BriefcaseBusiness /></span><div><small>{selected.client}</small><h3>{selected.name}</h3><p>{selected.description}</p></div><div className="scope-payoff"><b>{selected.brag}</b><small>BRAG<br />DAMAGE</small></div></div>
        <div className="scope-meter"><span>MVP PROGRESS</span><b>{selected.progress} / {selected.mvp}</b><Meter value={selected.progress} max={selected.mvp} tone="lime" /></div>
        <div className="scope-tasks"><div className="scope-label"><span>PROJECT REQUIREMENTS</span><small>{selected.tasks.length} specific tasks</small></div>{selected.tasks.map((task, index) => { const state = selected.tasksState[task.id]; const dep = selected.tasks.find((t) => t.id === task.dependsOn); return <div className={`scope-task ${state.completed ? "complete" : ""}`} key={task.id}><span className="task-index">{state.completed ? <Check size={14} /> : String(index + 1).padStart(2, "0")}</span><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type}{dep ? ` · Depends on ${dep.title} · +${task.coupling}% when ready` : " · Independent"}</small></span><em>+{task.points} MVP</em></div>; })}</div>
        {locked && <div className="project-lock-note"><LockKeyhole size={16} /> The rival team claimed this project. It is no longer available.</div>}
      </> : <div className="scope-empty"><BriefcaseBusiness size={38} /><b>Select a project to inspect its scope</b></div>}</div>
    </div>
    <footer>
      {activeProject ? <><button className={`abandon-confirm ${confirmAbandon ? "armed" : ""}`} onClick={() => confirmAbandon ? (onAbandon(), onClose()) : setConfirmAbandon(true)} disabled={!canEdit}>{confirmAbandon ? <><AlertTriangle size={16} /> Confirm abandon · lose 3 sanity</> : "Abandon project"}</button><span className="modal-spacer" /><button className="primary-cta small" onClick={onClose}>Back to board</button></> : <><button className="secondary-cta" onClick={onClose}>Not yet</button><span className="modal-spacer" /><div className="commit-warning"><LockKeyhole size={14} /><span><b>Exclusive commitment</b><small>The opponent cannot take it after you confirm.</small></span></div><button className="primary-cta small" onClick={() => selected && onClaim(selected.id)} disabled={!selected || locked || selected.completed || !canEdit}><Check size={16} /> Confirm project</button></>}
    </footer>
  </section></div>;
}

function BoardSlotView({ slot, index, owner, setupMode = false, selectedArea, draggedArea, dragOver = false, draggedDeveloper, hoveredDeskPosition, justPlaced = false, onConfigure, onInspect, highlight }: { slot: BoardSlot; index: number; owner: Owner; setupMode?: boolean; selectedArea?: AreaType | null; draggedArea?: AreaType | null; dragOver?: boolean; draggedDeveloper?: { handIndex: number; devId: string } | null; hoveredDeskPosition?: number | null; justPlaced?: boolean; onConfigure?: (area: AreaType) => void; onInspect?: (placed: PlacedDev) => void; highlight?: ActionHighlight | null }) {
  const cap = slot.type === "open" ? 4 : slot.type === "cubicle" ? 2 : 0;
  const readyForDev = !!slot.type && !!draggedDeveloper && slot.developers.length < cap;
  const placeSelectedArea = () => { if (setupMode && selectedArea) onConfigure?.(selectedArea); };
  return <div data-setup-slot={setupMode ? index : undefined} data-drag-label={draggedArea ? `DROP ${draggedArea === "open" ? "OPEN SPACE" : "CUBICLES"} HERE` : undefined} className={`board-slot ${owner} ${slot.type ?? "unconfigured"} ${setupMode ? "setup-available" : ""} ${draggedArea ? "area-drag-target" : ""} ${dragOver ? "drag-over" : ""} ${justPlaced ? "area-just-placed" : ""}`} onClick={placeSelectedArea}>
    <div className="slot-header"><span>{slot.type === "open" ? <DoorOpen size={13} /> : slot.type === "cubicle" ? <LockKeyhole size={13} /> : <Layers3 size={13} />}{slot.type === "open" ? "OPEN SPACE" : slot.type === "cubicle" ? "CUBICLES" : "EMPTY BAY"}</span>{setupMode && slot.type && <em className="setup-edit">REPLACE</em>}<b>{slot.type ? `${slot.developers.length}/${cap}` : "—"}</b></div>
    {!slot.type ? <div className="unconfigured-slot"><div className="bay-grid" /><MousePointer2 size={22} /><b>{dragOver ? "RELEASE TO INSTALL" : selectedArea ? "CLICK TO INSTALL" : "DROP OFFICE CARD"}</b><small>{draggedArea ? (draggedArea === "open" ? "Open Space · 4 desks" : "Cubicles · 2 desks") : "Open Space or Cubicles"}</small></div> : <div className="slot-grid">{Array.from({ length: cap }).map((_, position) => {
      const placedDev = slot.developers.find((developer) => developer.position === position);
      if (placedDev) { const dev = getDeveloper(placedDev.devId); const targeted = highlight?.targetId === placedDev.instanceId; const acting = highlight?.actorId === placedDev.instanceId; return <button type="button" aria-label={`Inspect ${dev.name} at desk ${position + 1}`} className={`board-card ${targeted ? "targeted" : ""} ${acting ? `acting ${highlight?.kind}` : ""}`} onClick={(event) => { event.stopPropagation(); onInspect?.(placedDev); }} key={placedDev.instanceId} style={{ "--accent": dev.accent } as React.CSSProperties}>{targeted && <span className="target-marker">!</span>}{acting && <span className="action-marker">{highlight?.kind === "taunt" ? "💬" : "</>"}</span>}<span className="board-card-face"><img src={dev.art} alt={dev.name} /><span className="board-card-meta"><b>{dev.name}</b><span><Brain size={10} /> {placedDev.sanity}</span></span></span></button>; }
      if (owner === "enemy") return <div className="slot-empty" key={`empty-${position}`}><Plus size={13} /></div>;
      return <div data-developer-desk={`${index}:${position}`} className={`slot-empty ${readyForDev ? "deploy-target" : ""} ${hoveredDeskPosition === position ? "developer-drag-over" : ""}`} key={`empty-${position}`}><Plus size={13} /><small>{hoveredDeskPosition === position ? "RELEASE" : readyForDev ? `DESK ${position + 1}` : ""}</small></div>;
    })}</div>}
    <div className="slot-number">0{index + 1}</div>
  </div>;
}

function Planner({ developers, project, plan, setPlan, onClose, onSave }: { developers: PlacedDev[]; project?: ProjectState; plan: Record<string, PlannedAction>; setPlan: (p: Record<string, PlannedAction>) => void; onClose: () => void; onSave: () => void }) {
  const [editing, setEditing] = useState<{ key: string; placed: PlacedDev; sequence: number } | null>(null);
  const set = (key: string, value: PlannedAction) => setPlan({ ...plan, [key]: value });
  return <div className="modal-backdrop"><section className="planner-modal">
    <header><div><span className="eyebrow-small">ACTION QUEUE</span><h2>Plan the sprint</h2><p>Each column resolves simultaneously. Stack attempts or coordinate dependencies.</p></div><button onClick={onClose}><X /></button></header>
    <div className="planner-summary"><span><BriefcaseBusiness size={14} /> {project?.name ?? "No project selected"}</span>{project && <span><Zap size={14} /> {project.progress}/{project.mvp} MVP</span>}<span><Ticket size={14} /> 8 sequences max</span></div>
    {!developers.length ? <div className="planner-empty"><Users size={34} /><b>No developers deployed</b><span>Close this panel and deploy someone from your hand.</span></div> : <div className="matrix-wrap"><table className="action-matrix"><thead><tr><th>DEVELOPER</th>{Array.from({ length: 8 }).map((_, i) => <th key={i}><span>{i + 1}</span></th>)}</tr></thead><tbody>{developers.map((placed) => { const dev = getDeveloper(placed.devId); return <tr key={placed.instanceId}><td><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span></td>{Array.from({ length: 8 }).map((_, i) => { const key = `${placed.instanceId}-${i + 1}`; const action = plan[key] ?? "skip"; const task = action.startsWith("work:") ? project?.tasks.find((t) => t.id === action.slice(5)) : undefined; return <td key={key}><button className={`matrix-action ${action === "skip" ? "empty" : action === "taunt" ? "taunt" : "work"}`} aria-label={`${dev.name} sequence ${i + 1}: ${task?.title ?? action}`} onClick={() => setEditing({ key, placed, sequence: i + 1 })}>{action === "skip" ? <><Plus size={12} /><span>Assign</span></> : action === "taunt" ? <><AlertTriangle size={12} /><span>Taunt</span></> : <><Code2 size={12} /><span>{task?.title}</span></>}</button></td>; })}</tr>; })}</tbody></table></div>}
    <div className="task-legend">{project?.tasks.map((task) => <div key={task.id} className={project.tasksState[task.id].completed ? "complete" : ""}><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type} · +{task.points} MVP{task.dependsOn ? ` · linked +${task.coupling}%` : ""}</small></span><em>{project.tasksState[task.id].completed ? "DONE" : `${project.tasksState[task.id].marks} MARKS`}</em></div>)}</div>
    <footer><button className="secondary-cta" onClick={onClose}>Keep editing</button><button className="primary-cta small" onClick={onSave}><Check size={16} /> Save sprint plan</button></footer>
    {editing && (() => { const dev = getDeveloper(editing.placed.devId); const current = plan[editing.key] ?? "skip"; const legalTasks = project?.tasks.filter((task) => roleCanWork(dev.role, task.type) && !project.tasksState[task.id].completed) ?? []; return <div className="action-picker-backdrop" onClick={() => setEditing(null)}><div className="action-picker" onClick={(e) => e.stopPropagation()}>
      <header><img src={dev.art} alt="" /><span><small>SEQUENCE {editing.sequence}</small><b>{dev.name}'s action</b><em>{dev.role} · {dev.completion}% base power</em></span><button onClick={() => setEditing(null)}><X size={18} /></button></header>
      <div className="quick-actions"><button className={current === "skip" ? "selected" : ""} onClick={() => { set(editing.key, "skip"); setEditing(null); }}><Minus size={15} /><span><b>Skip</b><small>Leave this ticket unused</small></span></button><button className={current === "taunt" ? "selected taunt" : "taunt"} onClick={() => { set(editing.key, "taunt"); setEditing(null); }}><AlertTriangle size={15} /><span><b>Taunt opposite slot</b><small>Attack developer sanity</small></span></button></div>
      <div className="picker-label"><span>OR ASSIGN A SPECIFIC TASK</span><small>{legalTasks.length} compatible</small></div>
      <div className="picker-tasks">{legalTasks.map((task) => { const state = project!.tasksState[task.id]; const depReady = !task.dependsOn || project!.tasksState[task.dependsOn]?.completed; const estimate = clamp(dev.completion + (ROLE_CHANCES[dev.role][task.type] ?? 0) + state.marks * 6 + (task.dependsOn && depReady ? task.coupling ?? 0 : 0), 12, 96); return <button key={task.id} className={current === `work:${task.id}` ? "selected" : ""} onClick={() => { set(editing.key, `work:${task.id}`); setEditing(null); }}><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type} · +{task.points} MVP{task.dependsOn ? depReady ? ` · dependency ready +${task.coupling}%` : " · dependency not ready" : ""}</small></span><em><b>{estimate}%</b><small>EST. CHANCE</small></em></button>; })}{!legalTasks.length && <div className="no-compatible">No compatible incomplete tasks for this developer.</div>}</div>
      <p className="picker-note">Estimate includes role, current failure marks, and completed dependencies. Slot traits resolve during the sprint.</p>
    </div></div>; })()}
  </section></div>;
}

function SprintConfirmation({ turn, project, plannedActions, onCancel, onConfirm }: { turn: number; project?: ProjectState; plannedActions: number; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop sprint-confirm-backdrop" onClick={onCancel}><section className="sprint-confirm" onClick={(event) => event.stopPropagation()}>
    <div className="sprint-confirm-art"><img src="/ui/sprint-button.png" alt="" /><span>TURN COMMIT</span></div>
    <span className="eyebrow-small">SPRINT {String(turn).padStart(2, "0")}</span><h2>Launch this sprint?</h2><p>Running the sprint commits your queue and ends your planning phase. Every action will resolve in sequence.</p>
    <div className="sprint-confirm-stats"><span><BriefcaseBusiness size={16} /><b>{project?.name ?? "No project"}</b></span><span><Ticket size={16} /><b>{plannedActions} planned actions</b></span></div>
    {plannedActions === 0 && <div className="sprint-empty-warning"><AlertTriangle size={17} /><span><b>Your queue is empty.</b><small>The team will spend every sequence idle.</small></span></div>}
    <footer><button className="secondary-cta" onClick={onCancel}>Back to planning</button><button className="sprint-confirm-go" onClick={onConfirm}><Play fill="currentColor" size={17} /> End turn &amp; Sprint!</button></footer>
  </section></div>;
}
