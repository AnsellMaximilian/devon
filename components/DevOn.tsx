"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AlertTriangle, ArrowLeft, BookOpen, Brain, BriefcaseBusiness, Check, ChevronDown, ChevronLeft, ChevronRight, ChevronUp, CircleHelp, Code2, DoorOpen, Hand, Home as HomeIcon, Layers3, LockKeyhole, Menu, Minus, MousePointer2, Play, Plus, RotateCcw, Settings, Shield, Sparkles, Swords, Ticket, Trophy, Users, Volume2, VolumeX, X, Zap, ZoomIn, ZoomOut } from "lucide-react";
import { DevCard } from "./DevCard";
import { CAMPAIGN_LEADS, DEVELOPERS, PROJECTS, ROLE_CHANCES, getDeveloper, type AreaType, type CampaignLead, type Developer, type Project, type ProjectTask } from "@/lib/game-data";
import { playSfx, preloadSfx, stopAllSfx, type SoundEffect } from "@/lib/sound";

type View = "home" | "deck" | "campaign" | "battle";
type Owner = "player" | "enemy";
type PlacedDev = { instanceId: string; devId: string; sanity: number; slot: number; position: number };
type BoardSlot = { type: AreaType | null; developers: PlacedDev[] };
type TaskProgress = { completed: boolean; marks: number };
type ProjectState = Project & { claimedBy: Owner | null; completed: boolean; progress: number; tasksState: Record<string, TaskProgress> };
type PlannedAction = "skip" | `taunt:${string}` | `work:${string}`;
type ActionHighlight = { actorId?: string; targetId?: string; kind: "skip" | "work" | "taunt" };
type BattlePhase = "setup" | "plan" | "resolving" | "brag" | "gameover";
type InspectedDeveloper = { devId: string; placed?: PlacedDev; owner?: Owner; handIndex?: number };
type StageAnnouncement = { key: number; title: string; subtitle: string; tone: "cyan" | "lime" | "pink" };
type TauntTargetRequest = { key: string; placed: PlacedDev; sequence: number };
type TurnDrawEvent = { key: number; cards: string[] };
type ActionStage = {
  key: number;
  sequence: number;
  owner: Owner;
  actor: PlacedDev;
  kind: "skip" | "work" | "taunt";
  skipReason?: "idle" | "task-complete" | "project-complete";
  phase: "intro" | "rolling" | "result";
  message: string;
  task?: ProjectTask;
  chance?: number;
  roll?: number;
  success?: boolean;
  target?: PlacedDev;
  targetIsLead?: boolean;
  targetSanityBefore?: number;
  targetSanityAfter?: number;
  damage?: number;
  projectName?: string;
  projectAccent?: string;
  projectBefore?: number;
  projectAfter?: number;
  projectMax?: number;
};

const starterDeck = DEVELOPERS.map((d) => d.id);
const SEQUENCE_COUNT = 4;
const emptySlots = (): BoardSlot[] => Array.from({ length: 4 }, () => ({ type: null, developers: [] }));
const wait = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
const clamp = (n: number, min: number, max: number) => Math.max(min, Math.min(max, n));

function createEnemySlots(opponent: CampaignLead): BoardSlot[] {
  const [lead, heir, brother, sister, fixer] = opponent.signatureDeck;
  const placed = (devId: string, slot: number, position: number): PlacedDev => ({ instanceId: `cpu-${devId}`, devId, sanity: getDeveloper(devId).sanity, slot, position });
  return [
    { type: "open", developers: [placed(lead, 0, 0), placed(heir, 0, 1), placed(brother, 0, 2)] },
    { type: "cubicle", developers: [] },
    { type: "open", developers: [placed(sister, 2, 0), placed(fixer, 2, 1)] },
    { type: "cubicle", developers: [] }
  ];
}

function freshBattleProjects(opponent: CampaignLead): ProjectState[] {
  const projects = freshProjects();
  const rivalProject = projects.find((project) => project.id === opponent.projectId) ?? projects[1];
  rivalProject.claimedBy = "enemy";
  return projects;
}

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
  const [leadId, setLeadId] = useState(CAMPAIGN_LEADS[0].id);
  const selectedLead = CAMPAIGN_LEADS.find((lead) => lead.id === leadId) ?? CAMPAIGN_LEADS[0];

  if (view === "battle") return <Battle deck={deck.length ? deck : starterDeck} opponent={selectedLead} onExit={() => setView("campaign")} />;

  return <main className="app-shell">
    <AppHeader onHome={() => setView("home")} onDeck={() => setView("deck")} deckCount={deck.length} />
    {view === "home" ? <Home onCampaign={() => setView("campaign")} onDeck={() => setView("deck")} deckCount={deck.length} /> : view === "deck" ? <DeckBuilder deck={deck} setDeck={setDeck} onBack={() => setView("home")} onBattle={() => setView("campaign")} /> : <Campaign deck={deck} selectedLead={selectedLead} onSelectLead={setLeadId} onBack={() => setView("home")} onDeck={() => setView("deck")} onBattle={() => setView("battle")} />}
  </main>;
}

function Home({ onCampaign, onDeck, deckCount }: { onCampaign: () => void; onDeck: () => void; deckCount: number }) {
  return <section className="home-screen">
    <div className="hero-copy">
      <div className="eyebrow"><span /> Tactical card battler <span /></div>
      <h1>BUILD A TEAM.<br /><em>BREAK PROD.</em></h1>
      <p>Climb the Lead ladder. Plan each sprint, manage the egos, and ship the MVP before the boss&apos;s hand-picked team steals your thunder.</p>
      <div className="hero-actions">
        <button className="primary-cta" onClick={onCampaign}><Trophy size={19} /> Start campaign <span>Choose a Lead</span></button>
        <button className="secondary-cta" onClick={onDeck}><Layers3 size={19} /> Edit deck <span>{deckCount}/20</span></button>
      </div>
      <div className="feature-row">
        <span><Ticket /> 4-step sprints</span><span><Users /> Team synergies</span><span><Brain /> Sanity warfare</span>
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
    <footer className="home-footer"><span>v0.1 // LOCAL BUILD</span><span>{DEVELOPERS.length} DEVELOPERS · {PROJECTS.length} PROJECTS</span></footer>
  </section>;
}

function Campaign({ deck, selectedLead, onSelectLead, onBack, onDeck, onBattle }: { deck: string[]; selectedLead: CampaignLead; onSelectLead: (id: string) => void; onBack: () => void; onDeck: () => void; onBattle: () => void }) {
  const uniqueDevelopers = new Set(deck).size;
  const roles = (["Frontend", "Backend", "Mobile", "Full Stack"] as const).map((role) => ({ role, count: deck.filter((id) => getDeveloper(id).role === role).length }));
  const previewCards = deck.slice(0, 5).map((id) => getDeveloper(id));
  const signature = selectedLead.signatureDeck.map((id) => getDeveloper(id));
  const rewards = selectedLead.rewards.map((id) => getDeveloper(id));

  return <section className="campaign-screen" style={{ "--lead": selectedLead.accent } as React.CSSProperties}>
    <header className="campaign-heading">
      <button className="back-btn" onClick={onBack}><ArrowLeft size={18} /> Main menu</button>
      <div><span className="eyebrow-small">SINGLE-PLAYER CAMPAIGN</span><h1>Choose your <em>Lead</em></h1><p>Every boss brings a signature team, a battle modifier, and a different reward pool.</p></div>
      <div className="campaign-progress"><small>LEAD LADDER</small><b>01 <span>/ 06</span></b></div>
    </header>

    <nav className="campaign-levels" aria-label="Campaign levels">
      {[1, 2, 3, 4, 5, 6].map((level) => {
        const lead = CAMPAIGN_LEADS.find((candidate) => candidate.level === level);
        return <button key={level} className={selectedLead.level === level ? "active" : ""} disabled={!lead} onClick={() => lead && onSelectLead(lead.id)}><span>{String(level).padStart(2, "0")}</span><small>{lead ? lead.title : "Classified"}</small>{!lead && <LockKeyhole size={12} />}</button>;
      })}
    </nav>

    <div className="campaign-layout">
      <aside className="campaign-player-panel attached-panel">
        <div className="campaign-panel-label"><span>YOUR LOADOUT</span><small>LOCALHOST</small></div>
        <div className="campaign-player-id"><span>YO</span><div><b>Ready to ship</b><small>{uniqueDevelopers} unique developers</small></div></div>
        <div className="campaign-deck-total"><span><Layers3 size={15} /> DECK TOTAL</span><b>{deck.length}<small>/20</small></b><Meter value={deck.length} max={20} /></div>
        <div className="campaign-role-counts">{roles.map(({ role, count }) => <span key={role}><small>{role === "Full Stack" ? "FULL" : role.toUpperCase()}</small><b>{count}</b></span>)}</div>
        <div className="campaign-mini-deck" aria-label="Top cards in your deck">{previewCards.map((dev, index) => <img key={`${dev.id}-${index}`} src={dev.art} alt={dev.name} style={{ "--card-index": index } as React.CSSProperties} />)}</div>
        <div className="campaign-deck-notes"><span><b>5</b><small>OPENING HAND</small></span><span><b>1</b><small>DRAW / TURN</small></span></div>
        <button className="campaign-edit-deck" onClick={onDeck}><Layers3 size={15} /> Edit deck <ChevronRight size={14} /></button>
      </aside>

      <article className="campaign-lead-dossier">
        <div className="lead-portrait-stage">
          <span className="lead-halo" aria-hidden="true" /><img src={selectedLead.art} alt={`${selectedLead.name}, ${selectedLead.title}`} />
          <span className="lead-boss-crown"><Trophy size={18} /> LEAD {String(selectedLead.level).padStart(2, "0")}</span>
          <div className="lead-nameplate"><small>{selectedLead.teamName}</small><h2>{selectedLead.name}</h2><b>{selectedLead.title}</b></div>
        </div>
        <div className="lead-intel">
          <span className="lead-tagline">“{selectedLead.tagline}”</span>
          <p>{selectedLead.backstory}</p>
          <div className="lead-modifier"><Sparkles size={20} /><span><small>ENCOUNTER MODIFIER</small><b>{selectedLead.modifierLabel}</b><p>{selectedLead.modifier}</p></span></div>
          <div className="lead-roster-heading"><span>SIGNATURE DECK</span><small>5 FAMILY CARDS + {selectedLead.rotatingCards} ROTATING</small></div>
          <div className="lead-roster">{signature.map((dev, index) => <button key={dev.id} style={{ "--accent": dev.accent, "--roster-index": index } as React.CSSProperties} title={`${dev.name}: ${dev.traitLabel}`}><img src={dev.art} alt={dev.name} /><span><b>{dev.name}</b><small>{dev.traitLabel}</small></span></button>)}</div>
        </div>
      </article>

      <aside className="campaign-rewards-panel attached-panel">
        <div className="campaign-panel-label"><span>POSSIBLE REWARDS</span><small>WIN THE SPRINT</small></div>
        <p>Defeat this Lead for one card from the themed reward cache.</p>
        <div className="reward-cards">{rewards.map((dev, index) => <div key={dev.id} className="reward-card" style={{ "--accent": dev.accent, "--reward-index": index } as React.CSSProperties}><img src={dev.art} alt={dev.name} /><span><small>{dev.role}</small><b>{dev.name}</b><em>{dev.traitLabel}</em></span></div>)}</div>
        <div className="campaign-stakes"><Shield size={17} /><span><b>30 SANITY</b><small>One battle · no continues</small></span></div>
        <button className="campaign-fight-button" onClick={onBattle}><Swords size={20} /><span><b>FACE THE LEAD</b><small>Start Level {String(selectedLead.level).padStart(2, "0")}</small></span><ChevronRight /></button>
      </aside>
    </div>
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

function Battle({ deck, opponent, onExit }: { deck: string[]; opponent: CampaignLead; onExit: () => void }) {
  const shuffledDeck = useRef([...deck].sort(() => Math.random() - .5));
  const [drawIndex, setDrawIndex] = useState(5);
  const [hand, setHand] = useState<string[]>(shuffledDeck.current.slice(0, 5));
  const [playerSlots, setPlayerSlots] = useState<BoardSlot[]>(emptySlots());
  const [enemySlots, setEnemySlots] = useState<BoardSlot[]>(() => createEnemySlots(opponent));
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
  const [projects, setProjects] = useState<ProjectState[]>(() => freshBattleProjects(opponent));
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
  const [bragNudge, setBragNudge] = useState<number | null>(null);
  const [plan, setPlan] = useState<Record<string, PlannedAction>>({});
  const [phase, setPhase] = useState<BattlePhase>("setup");
  const [event, setEvent] = useState("Set up your office before the first sprint begins.");
  const [eventTone, setEventTone] = useState<"neutral" | "good" | "bad">("neutral");
  const [brags, setBrags] = useState<number[]>([]);
  const [winner, setWinner] = useState<Owner | null>(null);
  const [seqActive, setSeqActive] = useState<number | null>(null);
  const [highlight, setHighlight] = useState<ActionHighlight | null>(null);
  const [actionStage, setActionStage] = useState<ActionStage | null>(null);
  const [tauntTargetRequest, setTauntTargetRequest] = useState<TauntTargetRequest | null>(null);
  const [turnDrawEvent, setTurnDrawEvent] = useState<TurnDrawEvent | null>(null);
  const [handArrival, setHandArrival] = useState<{ key: number; count: number } | null>(null);
  const [inspectedDeveloper, setInspectedDeveloper] = useState<InspectedDeveloper | null>(null);
  const [announcement, setAnnouncement] = useState<StageAnnouncement | null>({ key: 0, title: "OFFICE SETUP", subtitle: "Build your workspace before the first sprint", tone: "lime" });
  const cameraHoldDelay = useRef<ReturnType<typeof setTimeout> | null>(null);
  const cameraHoldInterval = useRef<ReturnType<typeof setInterval> | null>(null);
  const soundEnabled = useRef(true);
  const lastDrawSoundKey = useRef<number | null>(null);
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
  const playBattleSound = (effect: SoundEffect) => playSfx(effect, soundEnabled.current);

  useEffect(() => {
    preloadSfx();
    return () => stopAllSfx();
  }, []);

  useEffect(() => {
    soundEnabled.current = soundOn;
    if (!soundOn) stopAllSfx();
  }, [soundOn]);

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

  useEffect(() => {
    if (!bragNudge) return;
    const timer = setTimeout(() => setBragNudge(null), 3600);
    return () => clearTimeout(timer);
  }, [bragNudge]);

  useEffect(() => {
    if (!turnDrawEvent) return;
    const draw = turnDrawEvent;
    if (lastDrawSoundKey.current !== draw.key) {
      lastDrawSoundKey.current = draw.key;
      playSfx("cardDeal", soundEnabled.current);
    }
    const handTimer = setTimeout(() => {
      setHand((current) => [...current, ...draw.cards].slice(0, 5));
      setHandArrival({ key: draw.key, count: draw.cards.length });
    }, 3000);
    const clearTimer = setTimeout(() => {
      setTurnDrawEvent((current) => current?.key === draw.key ? null : current);
      setHandArrival((current) => current?.key === draw.key ? null : current);
    }, 3850);
    return () => { clearTimeout(handTimer); clearTimeout(clearTimer); };
  }, [turnDrawEvent]);

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
    playBattleSound("officePlace");
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
    playBattleSound("uiConfirm");
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
    playBattleSound("cardPlace");
  };

  const claimProject = (id: string) => {
    if (phase !== "plan") return;
    if (playerProject) { setEvent("Finish or abandon your current project first."); setEventTone("bad"); return; }
    const target = projects.find((p) => p.id === id);
    if (!target || target.claimedBy || target.completed) return;
    setProjects((ps) => ps.map((p) => p.id === id ? { ...p, claimedBy: "player" } : p));
    setProjectNudge(null);
    setBragNudge(null);
    setProjectModalOpen(false);
    setEvent(`${target.name} locked. Time to plan the sprint.`); setEventTone("good");
    playBattleSound("projectLock");
  };

  const abandon = () => {
    if (!playerProject || phase !== "plan") return;
    setPlayerSanity((s) => Math.max(0, s - 3));
    setProjects((ps) => ps.map((p) => p.id === playerProject.id ? { ...p, claimedBy: null, progress: 0, tasksState: Object.fromEntries(p.tasks.map((t) => [t.id, { completed: false, marks: 0 }])) } : p));
    setEvent("Project abandoned. Your reputation takes 3 sanity damage."); setEventTone("bad");
    playBattleSound("sanityDrop");
  };

  const openProjectPicker = () => {
    if (phase !== "plan") return;
    setProjectNudge(null);
    setBragNudge(null);
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
    setSprintConfirmOpen(true);
  };

  const requestTauntTarget = (key: string, placedDev: PlacedDev, sequence: number) => {
    setPlannerOpen(false);
    setTauntTargetRequest({ key, placed: placedDev, sequence });
    setEvent(`${getDeveloper(placedDev.devId).name} can taunt targets directly ahead in rival Work Area ${placedDev.slot + 1}.`);
    setEventTone("neutral");
  };

  const selectTauntTarget = (targetId: string) => {
    if (!tauntTargetRequest) return;
    setPlan((current) => ({ ...current, [tauntTargetRequest.key]: `taunt:${targetId}` }));
    setTauntTargetRequest(null);
    setPlannerOpen(true);
    setEvent("Taunt target locked. Finish planning the sprint.");
    setEventTone("good");
    playBattleSound("uiConfirm");
  };

  const cancelTauntTarget = () => {
    setTauntTargetRequest(null);
    setPlannerOpen(true);
  };

  const completionChance = (dev: Developer, taskId: string, project: ProjectState, slots: BoardSlot[], instance: PlacedDev, sequence: number, dependencyReadyAtSequenceStart?: boolean) => {
    const task = project.tasks.find((t) => t.id === taskId)!;
    const roleBonus = ROLE_CHANCES[dev.role][task.type];
    let chance = dev.completion + roleBonus + project.tasksState[task.id].marks * 6;
    if (task.dependsOn && (dependencyReadyAtSequenceStart ?? project.tasksState[task.dependsOn]?.completed)) chance += task.coupling ?? 0;
    const coworkers = slots[instance.slot].developers.map((d) => d.devId);
    if (dev.id === "aiden" && slots[instance.slot].type === "cubicle") chance += 8;
    if (dev.id === "nikko" && sequence >= 3) chance += 10;
    if (dev.id === "mateo" && sequence === 1) chance += 10;
    if (dev.id === "omar" && sequence === 1) chance += 12;
    if (coworkers.includes("stewart") && dev.id !== "stewart") chance -= 8;
    if (coworkers.includes("valentina") && dev.id !== "valentina" && slots[instance.slot].type === "open") chance += 5;
    if (coworkers.includes("preston") && ["chad", "bryson", "blair"].includes(dev.id) && slots[instance.slot].type === "open") chance += 6;
    if (dev.id === "bryson" && coworkers.includes("chad")) chance += 10;
    return clamp(chance, 5, 96);
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
    const room = Math.max(0, 5 - hand.length);
    const count = Math.min(draws, room, Math.max(0, shuffledDeck.current.length - drawIndex));
    const cards = shuffledDeck.current.slice(drawIndex, drawIndex + count);
    if (count) {
      setDrawIndex((i) => i + count);
      setTurnDrawEvent({ key: Date.now(), cards });
    }
    setPlan({}); setPhase("plan"); setSeqActive(null); setActionStage(null); setTauntTargetRequest(null);
    setEvent(count ? nepotism && count > 1 ? "New sprint. Nepotism pulled two new résumés." : "New sprint. A developer is joining your hand." : hand.length >= 5 ? "New sprint. Your hand is full, so no developer was drawn." : "New sprint. Your draw pile is empty."); setEventTone("neutral");
    showAnnouncement("YOUR TURN", `Sprint ${String(turn + 1).padStart(2, "0")} · Plan your next sequence`, "cyan");
  };

  const resolveTurn = async () => {
    if (!playerProject) { setEvent("Claim a project before running the sprint."); setEventTone("bad"); setPlannerOpen(false); return; }
    if (playerSlots.some((slot) => !slot.type)) { setEvent("Install all four work-area cards before running the sprint."); setEventTone("bad"); setPlannerOpen(false); return; }
    setPlannerOpen(false); setSprintConfirmOpen(false); setTauntTargetRequest(null); setPhase("resolving");
    playBattleSound("uiConfirm");
    let pSlots = playerSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let eSlots = enemySlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) }));
    let ps = projects.map((p) => ({ ...p, tasksState: Object.fromEntries(Object.entries(p.tasksState).map(([k, v]) => [k, { ...v }])) }));
    let pSan = playerSanity, eSan = enemySanity;
    let queuedBrags = [...brags];
    let quitDevelopers = [...unemployment];
    let pProjectId: string | undefined = playerProject.id;
    let aiProjectId: string | undefined = enemyProject?.id;
    let stageKey = Date.now();

    const commitBattleState = () => {
      setPlayerSlots(pSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setEnemySlots(eSlots.map((s) => ({ ...s, developers: s.developers.map((d) => ({ ...d })) })));
      setUnemployment([...quitDevelopers]);
      setProjects(ps.map((p) => ({ ...p, tasksState: Object.fromEntries(Object.entries(p.tasksState).map(([id, state]) => [id, { ...state }])) })));
      setPlayerSanity(pSan); setEnemySanity(eSan); setBrags([...queuedBrags]);
    };

    const clearActionStage = async () => {
      setHighlight(null);
      setActionStage(null);
      await wait(180);
    };

    const playSkip = async (owner: Owner, actor: PlacedDev, sequence: number, message: string, skipReason: ActionStage["skipReason"] = "idle", task?: ProjectTask) => {
      const dev = getDeveloper(actor.devId);
      const key = ++stageKey;
      setHighlight({ actorId: actor.instanceId, kind: "skip" });
      setActionStage({ key, sequence, owner, actor: { ...actor }, kind: "skip", skipReason, task, phase: "result", message });
      setEvent(`${dev.name}: ${message}`); setEventTone("neutral");
      playBattleSound("skip");
      await wait(1200);
      await clearActionStage();
    };

    const playWork = async (owner: Owner, actor: PlacedDev, project: ProjectState, task: ProjectTask, sequence: number, completedAtSequenceStart: Set<string>) => {
      const dev = getDeveloper(actor.devId);
      const actorSlots = owner === "player" ? pSlots : eSlots;
      const chance = completionChance(dev, task.id, project, actorSlots, actor, sequence, !!task.dependsOn && completedAtSequenceStart.has(task.dependsOn));
      // Use the same discrete 1-100 roll for both the game result and the wheel.
      // This keeps a visually successful landing from disagreeing with the result.
      const roll = Math.floor(Math.random() * 100) + 1;
      const success = roll <= chance;
      const before = project.progress;
      const key = ++stageKey;
      const baseStage: ActionStage = { key, sequence, owner, actor: { ...actor }, kind: "work", phase: "rolling", message: `${dev.name} is attempting ${task.title}.`, task, chance, roll, projectName: project.name, projectAccent: project.accent, projectBefore: before, projectAfter: before, projectMax: project.mvp };
      setHighlight({ actorId: actor.instanceId, kind: "work" });
      setActionStage(baseStage);
      setEvent(`${dev.name} is working on ${task.title}…`); setEventTone("neutral");
      playBattleSound("wheelSpin");
      await wait(1550);

      let points = task.points;
      let message: string;
      let projectJustCompleted = false;
      if (success) {
        project.tasksState[task.id].completed = true;
        const coworkers = actorSlots[actor.slot].developers.map((d) => d.devId);
        if (task.type === "Mobile" && coworkers.includes("tigor")) points += 2;
        if (task.type === "Frontend" && coworkers.includes("zara")) points += 1;
        if (task.type === "Frontend" && dev.id === "blair") points += 1;
        project.progress = Math.min(project.mvp, project.progress + points);
        message = `${dev.name} shipped ${task.title} · +${points} MVP`;
        if (project.progress >= project.mvp) {
          project.completed = true;
          projectJustCompleted = true;
          if (owner === "player") {
            queuedBrags.push(project.brag);
            pProjectId = undefined;
            message = `${project.name} reached MVP — BRAG unlocked!`;
          } else {
            aiProjectId = undefined;
            pSan = Math.max(0, pSan - project.brag);
            message = `Rival shipped ${project.name} and bragged for ${project.brag} sanity!`;
          }
        }
      } else {
        const ignoreMark = dev.id === "priya" && sequence === 1;
        if (!ignoreMark) project.tasksState[task.id].marks += dev.id === "omar" ? 2 : 1;
        message = `${dev.name} missed ${task.title} · next attempt gets a mark`;
      }
      commitBattleState();
      setActionStage({ ...baseStage, phase: "result", success, message, projectAfter: project.progress });
      setEvent(message); setEventTone(success ? owner === "player" ? "good" : "bad" : owner === "player" ? "bad" : "good");
      await wait(900);
      playBattleSound("needleLand");
      playBattleSound(projectJustCompleted ? "projectComplete" : success ? "workSuccess" : "workFail");
      await wait((success ? 2050 : 1650) - 900);
      await clearActionStage();
    };

    const playTaunt = async (owner: Owner, actor: PlacedDev, sequence: number, requestedTargetId?: string) => {
      const dev = getDeveloper(actor.devId);
      const defendingSlots = owner === "player" ? eSlots : pSlots;
      const targetSlot = defendingSlots[actor.slot];
      const leadId = owner === "player" ? "enemy-lead" : "player-lead";
      const leadBefore = owner === "player" ? eSan : pSan;
      const forcedLead = targetSlot.type === "cubicle" || !targetSlot.developers.length || requestedTargetId === leadId;
      const requestedTarget = !forcedLead ? targetSlot.developers.find((candidate) => candidate.instanceId === requestedTargetId) : undefined;
      const target = forcedLead ? undefined : requestedTarget ?? targetSlot.developers[0];
      const targetSnapshot = target ? { ...target } : undefined;
      const before = target?.sanity ?? leadBefore;
      const baseDamage = owner === "player" ? 2 + (Math.random() > .72 ? 1 : 0) : 2;
      let damage = baseDamage;
      if (target?.devId === "fan" && dev.role === "Frontend") damage = Math.max(1, Math.floor(damage / 2));
      if (target && targetSlot.developers.some((candidate) => candidate.devId === "wendy")) damage = Math.max(1, damage - 1);
      if (target && targetSlot.developers.some((candidate) => candidate.devId === "basil")) damage = Math.max(1, damage - 1);
      const key = ++stageKey;
      const baseStage: ActionStage = { key, sequence, owner, actor: { ...actor }, kind: "taunt", phase: "intro", message: `${dev.name} winds up a taunt…`, target: targetSnapshot, targetIsLead: !target, targetSanityBefore: before, targetSanityAfter: before, damage };
      setHighlight({ actorId: actor.instanceId, targetId: target?.instanceId ?? leadId, kind: "taunt" });
      setActionStage(baseStage);
      setEvent(`${dev.name} lines up a taunt.`); setEventTone("neutral");
      playBattleSound("taunt");
      await wait(1050);

      let message: string;
      let after: number;
      if (!target) {
        if (owner === "player") eSan = Math.max(0, eSan - damage);
        else pSan = Math.max(0, pSan - damage);
        after = owner === "player" ? eSan : pSan;
        message = `${dev.name}'s taunt hit the ${owner === "player" ? "rival" : "player"} lead for ${damage}.`;
      } else {
        target.sanity = Math.max(0, target.sanity - damage);
        after = target.sanity;
        const targetName = getDeveloper(target.devId).name;
        message = `${dev.name} rattled ${targetName} for ${damage} sanity.`;
        if (target.sanity <= 0) {
          targetSlot.developers = targetSlot.developers.filter((candidate) => candidate.instanceId !== target.instanceId);
          if (owner === "enemy") quitDevelopers.push(target.devId);
          message = `${targetName} took ${damage} sanity and quit!`;
        }
      }
      commitBattleState();
      setActionStage({ ...baseStage, phase: "result", message, targetSanityAfter: after });
      setEvent(message); setEventTone(owner === "player" ? "good" : "bad");
      playBattleSound("impact");
      setTimeout(() => playBattleSound("sanityDrop"), 90);
      await wait(2200);
      await clearActionStage();
    };

    for (let seq = 1; seq <= SEQUENCE_COUNT; seq++) {
      const completedAtSequenceStart = new Map(ps.map((project) => [project.id, new Set(project.tasks.filter((task) => project.tasksState[task.id].completed).map((task) => task.id))]));
      setSeqActive(seq);
      setActionStage(null); setHighlight(null);
      showAnnouncement(`SEQUENCE ${String(seq).padStart(2, "0")}`, `Ticket lane ${seq} of ${SEQUENCE_COUNT} · your team acts first`, "cyan");
      playBattleSound("sequenceStart");
      await wait(1650);
      setAnnouncement(null);
      await wait(180);

      for (const snapshot of pSlots.flatMap((slot) => slot.developers)) {
        const actor = pSlots.flatMap((slot) => slot.developers).find((candidate) => candidate.instanceId === snapshot.instanceId);
        if (!actor) continue;
        const action = plan[`${actor.instanceId}-${seq}`] ?? "skip";
        const pp = ps.find((project) => project.id === pProjectId && !project.completed);
        if (action.startsWith("work:")) {
          const taskId = action.slice(5);
          const task = pp?.tasks.find((candidate) => candidate.id === taskId);
          if (!pp || !task) await playSkip("player", actor, seq, "Project already reached MVP — this ticket was auto-skipped.", "project-complete");
          else if (pp.tasksState[taskId].completed) await playSkip("player", actor, seq, `${task.title} was already shipped by an earlier action — this ticket was auto-skipped.`, "task-complete", task);
          else await playWork("player", actor, pp, task, seq, completedAtSequenceStart.get(pp.id) ?? new Set<string>());
        } else if (action.startsWith("taunt:")) {
          await playTaunt("player", actor, seq, action.slice(6));
        } else {
          await playSkip("player", actor, seq, "SKIP · ticket left unused.");
        }
        if (pSan <= 0 || eSan <= 0) break;
      }
      if (pSan <= 0 || eSan <= 0) break;

      for (const snapshot of eSlots.flatMap((slot) => slot.developers)) {
        const actor = eSlots.flatMap((slot) => slot.developers).find((candidate) => candidate.instanceId === snapshot.instanceId);
        if (!actor) continue;
        const dev = getDeveloper(actor.devId);
        const ap = ps.find((project) => project.id === aiProjectId && !project.completed);
        if (Math.random() < .20) {
          const targetSlot = pSlots[actor.slot];
          const target = targetSlot.type === "open" && targetSlot.developers.length ? targetSlot.developers[Math.floor(Math.random() * targetSlot.developers.length)].instanceId : "player-lead";
          await playTaunt("enemy", actor, seq, target);
        } else if (!ap || Math.random() < .18) {
          await playSkip("enemy", actor, seq, "SKIP · rival held this ticket.");
        } else {
          const tasks = ap.tasks.filter((task) => !ap.tasksState[task.id].completed);
          if (!tasks.length) await playSkip("enemy", actor, seq, "SKIP · no unfinished requirements.");
          else {
            const preferred = tasks.filter((task) => ROLE_CHANCES[dev.role][task.type] >= 0);
            const pool = preferred.length && Math.random() < .72 ? preferred : tasks;
            await playWork("enemy", actor, ap, pool[Math.floor(Math.random() * pool.length)], seq, completedAtSequenceStart.get(ap.id) ?? new Set<string>());
          }
        }
        if (pSan <= 0 || eSan <= 0) break;
      }
      if (pSan <= 0 || eSan <= 0) break;
    }
    setActionStage(null); setHighlight(null);
    if (pSan <= 0 || eSan <= 0) {
      const matchWinner = pSan > 0 ? "player" : "enemy";
      setWinner(matchWinner); setPhase("gameover"); playBattleSound(matchWinner === "player" ? "victory" : "defeat"); return;
    }
    setSeqActive(null);
    if (queuedBrags.length) { setPhase("brag"); setEvent("Project complete. Brag now—or bank it and end the sprint."); setEventTone("good"); }
    else advanceTurn(ps, aiProjectId);
  };

  const useBrag = () => {
    const hit = brags[0]; const remaining = brags.slice(1); const nextEnemy = Math.max(0, enemySanity - hit);
    setEnemySanity(nextEnemy); setBrags(remaining); setEvent(`You shipped it and bragged for ${hit} sanity damage!`); setEventTone("good");
    playBattleSound("brag");
    if (nextEnemy <= 0) { setWinner("player"); setPhase("gameover"); setTimeout(() => playBattleSound("victory"), 650); return; }
    // One brag per turn; extra brags remain banked.
    setTimeout(() => advanceTurn(projects, projects.find((p) => p.claimedBy === "enemy" && !p.completed)?.id), 500);
  };

  const tryUseBrag = () => {
    if (!brags.length) {
      setBragNudge(Date.now());
      setEvent(playerProject ? `Complete ${playerProject.name}'s MVP to unlock a Brag.` : "Claim and complete a project to unlock a Brag.");
      setEventTone("bad");
      playBattleSound("skip");
      return;
    }
    if (phase !== "brag") {
      setEvent("Brag banked. Finish the current sprint to open the Brag window.");
      setEventTone("neutral");
      playBattleSound("uiConfirm");
      return;
    }
    setBragNudge(null);
    useBrag();
  };

  const skipBrag = () => { playBattleSound("skip"); advanceTurn(projects, projects.find((p) => p.claimedBy === "enemy" && !p.completed)?.id); };

  const toggleSound = () => {
    const enabled = !soundEnabled.current;
    soundEnabled.current = enabled;
    setSoundOn(enabled);
    if (enabled) playSfx("uiConfirm", true);
    else stopAllSfx();
  };

  const resetBattle = () => {
    stopAllSfx();
    playBattleSound("uiConfirm");
    shuffledDeck.current = [...deck].sort(() => Math.random() - .5);
    setDrawIndex(5);
    setHand(shuffledDeck.current.slice(0, 5));
    setPlayerSlots(emptySlots());
    setEnemySlots(createEnemySlots(opponent));
    setDeckOpen(false); setMenuOpen(false); setMenuHelpOpen(false); setUnemployment([]); setSelectedArea(null); endAreaDrag(); endDeveloperDrag(); setLastAreaInstall(null); setTurnDrawEvent(null); setHandArrival(null);
    const nextProjects = freshBattleProjects(opponent);
    setProjects(nextProjects);
    setPlayerSanity(30); setEnemySanity(30); setTurn(1); setCameraX(0); setCameraTilt(52); setCameraZoom(1);
    setPlannerOpen(false); setSprintConfirmOpen(false); setProjectModalOpen(false); setProjectNudge(null); setBragNudge(null); setPlan({}); setPhase("setup"); setBrags([]);
    setWinner(null); setSeqActive(null); setHighlight(null); setActionStage(null); setTauntTargetRequest(null); setInspectedDeveloper(null); setEventTone("neutral");
    setAnnouncement({ key: Date.now(), title: "OFFICE SETUP", subtitle: "Build your workspace before the first sprint", tone: "lime" });
    setEvent("Set up your office before the first sprint begins.");
  };

  return <main className={`battle-screen ${phase === "setup" ? "setup-active" : ""}`}>
    <div className="battle-hud">
      <div className="hud-stack player-hud-stack"><PlayerHud owner="player" name="YOU // LOCALHOST" sanity={playerSanity} max={30} project={playerProject} targeted={highlight?.targetId === "player-lead"} /></div>
      <div className={`turn-pill ${phase === "setup" ? "setup" : ""}`}><span>{phase === "setup" ? "OFFICE" : "SPRINT"}</span><b>{phase === "setup" ? `${configuredAreas}/4` : String(turn).padStart(2, "0")}</b><small>{phase === "setup" ? "LAYOUT SETUP" : phase === "resolving" ? `SEQUENCE ${seqActive ?? 1}/${SEQUENCE_COUNT}` : phase === "brag" ? "BRAG WINDOW" : "PLANNING"}</small></div>
      <div className="hud-stack enemy-hud-stack">
        <PlayerHud owner="enemy" name={opponent.teamName} avatarText={opponent.initials} sanity={enemySanity} max={30} project={enemyProject} targeted={highlight?.targetId === "enemy-lead"} />
        <button type="button" className={`hud-brag-button ${brags.length ? "armed" : "locked"} ${phase === "brag" ? "ready" : ""}`} onClick={tryUseBrag} aria-label={brags.length ? `Use Brag. ${brags.length} available.` : "Brag locked. Complete a project first."}>
          <img src="/ui/brag-burst.png" alt="" />
          {!brags.length && <span><LockKeyhole size={10} /> LOCKED</span>}
          {!!brags.length && <em>{brags.length}</em>}
        </button>
      </div>
    </div>

    {phase === "setup" ? <div className="setup-console-spacer" aria-hidden="true" /> : <div className="project-console">
      {playerProject ? <button className={`active-project-card ${bragNudge ? "needs-attention" : ""}`} onClick={() => { setBragNudge(null); setProjectModalOpen(true); }} style={{ "--project": playerProject.accent, "--project-progress": `${clamp((playerProject.progress / playerProject.mvp) * 100, 0, 100)}%` } as React.CSSProperties}>
        <span className="project-icon"><BriefcaseBusiness size={16} /></span><span className="active-project-name"><b>{playerProject.name}</b><small>{playerProject.progress}/{playerProject.mvp} MVP</small></span><em>{playerProject.tasks.filter((t) => playerProject.tasksState[t.id].completed).length}/{playerProject.tasks.length} TASKS</em><ChevronRight size={14} />
      </button> : <button className={`select-project-button ${projectNudge || bragNudge ? "needs-attention" : ""}`} onClick={openProjectPicker} disabled={phase !== "plan"}><Plus size={16} /><span><b>Select a project</b><small>Review scope before committing</small></span><ChevronRight size={16} /></button>}
      {(projectNudge || bragNudge) && <img key={projectNudge ?? bragNudge} className="project-pointer" src="/ui/project-cursor.png" alt="" aria-hidden="true" />}
    </div>}

    <div className={`board-viewport ${phase === "setup" ? "setup-board" : ""}`}>
      <div className="board-world" style={{ transform: `translateX(calc(-50% + ${cameraX}px)) translateY(${phase === "setup" ? -82 : -115}px) rotateX(${cameraTilt}deg) scale(${(phase === "setup" ? .86 : .8) * cameraZoom})` }}>
        <div className="board-surface">
          <div className="lane-label enemy-lane">RIVAL OFFICE</div>
          <div className="slot-row enemy-row">{enemySlots.map((slot, i) => <BoardSlotView key={i} slot={slot} index={i} owner="enemy" highlight={highlight} tauntTargetRequest={tauntTargetRequest} onSelectTauntTarget={selectTauntTarget} onInspect={(placedDev) => setInspectedDeveloper({ devId: placedDev.devId, placed: placedDev, owner: "enemy" })} />)}</div>
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
      {bragNudge && <div key={bragNudge} className="project-required-warning brag-required-warning" role="status" aria-live="polite"><img src="/ui/brag-burst.png" alt="" /><span><b>COMPLETE A PROJECT FIRST</b><small>{phase === "setup" ? "Finish office setup, then claim and complete a project." : playerProject ? `Reach ${playerProject.name}'s MVP to unlock a Brag.` : "Claim work from the shared backlog and complete its MVP."}</small></span></div>}
      {phase === "plan" && projectNudge && !bragNudge && <div key={projectNudge} className="project-required-warning" role="status" aria-live="polite"><AlertTriangle size={18} /><span><b>SELECT A PROJECT FIRST</b><small>Claim work from the shared backlog, then plan your sprint.</small></span></div>}
      {phase === "plan" && tauntTargetRequest && <div className="taunt-target-prompt" role="status" aria-live="polite"><AlertTriangle size={20} /><span><b>CHOOSE A TAUNT TARGET</b><small>{getDeveloper(tauntTargetRequest.placed.devId).name} can hit rival Work Area {tauntTargetRequest.placed.slot + 1}, directly ahead. Select a highlighted developer; cubicles redirect the hit to the rival lead.</small></span><button onClick={cancelTauntTarget}>Cancel</button></div>}
      {phase === "setup" && !announcement && configuredAreas === 0 && <div className="setup-drag-hint"><b>PLACE YOUR OFFICE SPACES</b><span>Drag space cards into slots</span></div>}
      {phase === "setup" && !announcement && <div className="setup-card-tray" aria-label="Reusable office space cards"><OfficeCard area="open" selected={selectedArea === "open"} dragging={draggedArea === "open"} onClick={() => selectAreaCard("open")} onPointerDown={(event) => startAreaPointer(event, "open")} onPointerMove={moveAreaPointer} onPointerUp={finishAreaPointer} onPointerCancel={cancelAreaPointer} /><OfficeCard area="cubicle" selected={selectedArea === "cubicle"} dragging={draggedArea === "cubicle"} onClick={() => selectAreaCard("cubicle")} onPointerDown={(event) => startAreaPointer(event, "cubicle")} onPointerMove={moveAreaPointer} onPointerUp={finishAreaPointer} onPointerCancel={cancelAreaPointer} /></div>}
      {phase === "setup" && <div className="setup-deck-preview"><DrawPile remaining={deck.length} total={deck.length} label="YOUR DECK" onOpen={() => setDeckOpen(true)} /></div>}
      {phase === "setup" && <div className="setup-ready-panel"><div><span>OFFICE LAYOUT</span><b>{configuredAreas}<small>/4</small></b><p>{setupReady ? "Every bay is configured." : selectedArea ? `Click a bay to place ${selectedArea === "open" ? "Open Space" : "Cubicles"}.` : "Drag a reusable space card into each bay."}</p></div><button onClick={finishSetup} disabled={!setupReady}><Check size={18} /><span><b>READY</b><small>{setupReady ? "Begin Sprint 01" : `${4 - configuredAreas} bays remaining`}</small></span></button></div>}
      {phase === "resolving" && actionStage && <ActionStageView stage={actionStage} />}
      {turnDrawEvent && <TurnDrawEventView draw={turnDrawEvent} />}
    </div>

    {phase !== "setup" && <div className="battle-dock"><div className="bottom-command-panel">
        <div className="pile-rack">
          <DrawPile remaining={deckRemaining} total={shuffledDeck.current.length} onOpen={() => setDeckOpen(true)} />
          <UnemploymentPile developers={unemployment} />
        </div>
        <div className="hand-zone"><div className="hand-label"><span><Hand size={15} /> DEVELOPER HAND</span><small>Click to inspect · drag onto an exact desk</small></div><div className="hand-cards fanned">{hand.map((id, i) => { const dev = getDeveloper(id); const offset = i - (hand.length - 1) / 2; const arriving = !!handArrival && i >= hand.length - handArrival.count; return <div className={`hand-drag-card ${draggedDeveloper?.handIndex === i ? "dragging" : ""} ${arriving ? "draw-arrival" : ""}`} style={{ "--fan-angle": `${offset * 3.5}deg`, "--fan-y": `${Math.abs(offset) * 3}px`, zIndex: i + 1 } as React.CSSProperties} onClick={() => inspectHandDeveloper(id, i)} onPointerDown={(event) => startDeveloperPointer(event, i, id)} onPointerMove={moveDeveloperPointer} onPointerUp={finishDeveloperPointer} onPointerCancel={cancelDeveloperPointer} key={`${id}-${i}`}><DevCard dev={dev} compact /></div>; })}{Array.from({ length: Math.max(0, 5 - hand.length) }).map((_, i) => <div className="empty-hand" key={i}><Code2 /></div>)}</div></div>
        <div className="battle-actions">
          {phase === "plan" && <div className="sprint-controls"><button className="sprint-button" onClick={openSprintConfirmation} aria-label="Run sprint and end turn"><img src="/ui/sprint-button.png" alt="" /><span>SPRINT!</span></button><button className="plan-queue-button" onClick={openSprintPlanner}><Ticket size={15} /><span>PLAN</span><em>{plannedActions}</em></button></div>}
          {phase === "resolving" && <div className="resolving-button"><span className="spinner" /><div><b>SPRINT IN PROGRESS</b><small>Actions resolve in sequence</small></div></div>}
          {phase === "brag" && <div className="brag-window-actions"><span>BRAG READY ABOVE</span><button className="skip-button" onClick={skipBrag}>Bank for later</button></div>}
        </div>
    </div></div>}

    {phase === "setup" && draggedArea && dragPointer && <div aria-hidden="true" className={`setup-drag-ghost ${draggedArea}`} style={{ left: dragPointer.x, top: dragPointer.y }}><img src={draggedArea === "open" ? "/areas/open-space.png" : "/areas/cubicles.png"} alt="" /><span>{draggedArea === "open" ? <DoorOpen size={15} /> : <LockKeyhole size={15} />}<b>{draggedArea === "open" ? "OPEN SPACE" : "CUBICLES"}</b></span><em>DROP TO INSTALL</em></div>}
    {phase === "plan" && draggedDeveloper && developerDragPointer && (() => { const dev = getDeveloper(draggedDeveloper.devId); return <div aria-hidden="true" className="developer-drag-ghost" style={{ left: developerDragPointer.x, top: developerDragPointer.y, "--accent": dev.accent } as React.CSSProperties}><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span><em>DROP ON A DESK</em></div>; })()}

    {plannerOpen && <Planner developers={placed} opponents={enemySlots.flatMap((slot) => slot.developers)} project={playerProject} plan={plan} setPlan={setPlan} onRequestTaunt={requestTauntTarget} onClose={() => setPlannerOpen(false)} onSave={() => setPlannerOpen(false)} />}
    {sprintConfirmOpen && <SprintConfirmation turn={turn} project={playerProject} plannedActions={plannedActions} onCancel={() => setSprintConfirmOpen(false)} onConfirm={resolveTurn} />}
    {projectModalOpen && <ProjectPicker projects={projects} activeProject={playerProject} onClaim={claimProject} onAbandon={abandon} onClose={() => setProjectModalOpen(false)} canEdit={phase === "plan"} />}
    {deckOpen && <DeckViewer deck={deck} remaining={phase === "setup" ? deck.length : deckRemaining} onClose={() => setDeckOpen(false)} onInspect={(devId) => setInspectedDeveloper({ devId })} />}
    {inspectedDeveloper && <DeveloperDetails inspected={inspectedDeveloper} onClose={() => setInspectedDeveloper(null)} />}
    {menuOpen && <div className="modal-backdrop battle-menu-backdrop" onClick={() => setMenuOpen(false)}><section className="battle-menu-modal" onClick={(event) => event.stopPropagation()}>
      <header><img src="/brand/dev-on-mark.png" alt="" /><div><span className="eyebrow-small">BATTLE PAUSED</span><h2>Dev On! menu</h2><p>Adjust the session or review the essentials.</p></div><button onClick={() => setMenuOpen(false)} aria-label="Close battle menu"><X /></button></header>
      {menuHelpOpen ? <div className="battle-menu-help"><div><BookOpen size={22} /><span><b>Battle essentials</b><small>Quick rules reference</small></span></div><ol><li>Claim one project and deploy developers into configured offices.</li><li>Plan up to four action sequences. Developers can work in parallel.</li><li>Complete the MVP, then Brag to damage the rival lead&apos;s sanity.</li><li>Developers at zero sanity enter the Unemployment pile.</li></ol><button className="menu-row" onClick={() => setMenuHelpOpen(false)}><ArrowLeft /><span><b>Back to menu</b><small>Return to session controls</small></span></button></div> : <div className="battle-menu-options">
        <button className="menu-row primary" onClick={() => setMenuOpen(false)}><Play /><span><b>Continue battle</b><small>Return to the board</small></span><ChevronRight /></button>
        <button className="menu-row" onClick={toggleSound}>{soundOn ? <Volume2 /> : <VolumeX />}<span><b>Sound effects</b><small>{soundOn ? "Enabled" : "Muted"}</small></span><em className={soundOn ? "on" : ""}>{soundOn ? "ON" : "OFF"}</em></button>
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
  const workTypes = `All tasks · ${dev.role} specialty`;
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

function PlayerHud({ owner, name, sanity, max, project, avatarText, targeted = false }: { owner: Owner; name: string; sanity: number; max: number; project?: ProjectState; avatarText?: string; targeted?: boolean }) {
  const rain = owner === "player" ? ["01", "</>", "npm", "101", "git", "{}", "dev", "011"] : ["ERR", "404", "NULL", "010", "BUG", "!", "500", "ptr"];
  return <div className={`player-hud ${owner} ${targeted ? "targeted" : ""}`}>
    <span className="matrix-rain" aria-hidden="true">{rain.map((glyphs, index) => <i key={`${glyphs}-${index}`} style={{ "--matrix-x": `${6 + index * 12}%`, "--matrix-delay": `${-index * .47}s`, "--matrix-speed": `${2.9 + index % 3 * .7}s` } as React.CSSProperties}>{glyphs}</i>)}</span>
    {targeted && <span className="hud-target">!</span>}<div className="avatar">{avatarText ?? (owner === "player" ? "YO" : "NP")}<i /></div><div className="hud-copy"><span>{name}</span><div><Brain size={14} /><b>{sanity}</b><small> / {max} SANITY</small></div><Meter value={sanity} max={max} tone={owner === "enemy" ? "pink" : "cyan"} /></div>
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

function BoardSlotView({ slot, index, owner, setupMode = false, selectedArea, draggedArea, dragOver = false, draggedDeveloper, hoveredDeskPosition, justPlaced = false, onConfigure, onInspect, highlight, tauntTargetRequest, onSelectTauntTarget }: { slot: BoardSlot; index: number; owner: Owner; setupMode?: boolean; selectedArea?: AreaType | null; draggedArea?: AreaType | null; dragOver?: boolean; draggedDeveloper?: { handIndex: number; devId: string } | null; hoveredDeskPosition?: number | null; justPlaced?: boolean; onConfigure?: (area: AreaType) => void; onInspect?: (placed: PlacedDev) => void; highlight?: ActionHighlight | null; tauntTargetRequest?: TauntTargetRequest | null; onSelectTauntTarget?: (targetId: string) => void }) {
  const cap = slot.type === "open" ? 4 : slot.type === "cubicle" ? 2 : 0;
  const readyForDev = !!slot.type && !!draggedDeveloper && slot.developers.length < cap;
  const isTauntLane = owner === "enemy" && !!tauntTargetRequest && index === tauntTargetRequest.placed.slot;
  const redirectsToLead = isTauntLane && (slot.type === "cubicle" || !slot.developers.length);
  const handleSlotClick = () => {
    if (redirectsToLead) { onSelectTauntTarget?.("enemy-lead"); return; }
    if (setupMode && selectedArea) onConfigure?.(selectedArea);
  };
  return <div data-setup-slot={setupMode ? index : undefined} data-drag-label={draggedArea ? `DROP ${draggedArea === "open" ? "OPEN SPACE" : "CUBICLES"} HERE` : undefined} className={`board-slot ${owner} ${slot.type ?? "unconfigured"} ${setupMode ? "setup-available" : ""} ${draggedArea ? "area-drag-target" : ""} ${dragOver ? "drag-over" : ""} ${justPlaced ? "area-just-placed" : ""} ${isTauntLane ? "taunt-target-ready" : ""} ${redirectsToLead ? "taunt-lead-redirect" : ""}`} onClick={handleSlotClick}>
    <div className="slot-header"><span>{slot.type === "open" ? <DoorOpen size={13} /> : slot.type === "cubicle" ? <LockKeyhole size={13} /> : <Layers3 size={13} />}{slot.type === "open" ? "OPEN SPACE" : slot.type === "cubicle" ? "CUBICLES" : "EMPTY BAY"}</span>{setupMode && slot.type && <em className="setup-edit">REPLACE</em>}<b>{slot.type ? `${slot.developers.length}/${cap}` : "—"}</b></div>
    {!slot.type ? <div className="unconfigured-slot"><div className="bay-grid" /><MousePointer2 size={22} /><b>{dragOver ? "RELEASE TO INSTALL" : selectedArea ? "CLICK TO INSTALL" : "DROP OFFICE CARD"}</b><small>{draggedArea ? (draggedArea === "open" ? "Open Space · 4 desks" : "Cubicles · 2 desks") : "Open Space or Cubicles"}</small></div> : <div className="slot-grid">{Array.from({ length: cap }).map((_, position) => {
      const placedDev = slot.developers.find((developer) => developer.position === position);
      if (placedDev) { const dev = getDeveloper(placedDev.devId); const targeted = highlight?.targetId === placedDev.instanceId; const acting = highlight?.actorId === placedDev.instanceId; const selectableTauntTarget = isTauntLane && slot.type === "open"; return <button type="button" aria-label={selectableTauntTarget ? `Target ${dev.name} with taunt` : `Inspect ${dev.name} at desk ${position + 1}`} className={`board-card ${targeted ? "targeted" : ""} ${acting ? `acting ${highlight?.kind}` : ""} ${selectableTauntTarget ? "taunt-selectable" : ""}`} onClick={(event) => { event.stopPropagation(); if (selectableTauntTarget) onSelectTauntTarget?.(placedDev.instanceId); else if (redirectsToLead) onSelectTauntTarget?.("enemy-lead"); else onInspect?.(placedDev); }} key={placedDev.instanceId} style={{ "--accent": dev.accent } as React.CSSProperties}>{targeted && <span className="target-marker">!</span>}{selectableTauntTarget && <span className="taunt-pick-marker">TARGET</span>}{acting && <span className="action-marker">{highlight?.kind === "taunt" ? "💬" : highlight?.kind === "work" ? "</>" : "—"}</span>}<span className="board-card-face"><img src={dev.art} alt={dev.name} /><span className="board-card-meta"><b>{dev.name}</b><span><Brain size={10} /> {placedDev.sanity}</span></span></span></button>; }
      if (owner === "enemy") return <div className="slot-empty" key={`empty-${position}`}><Plus size={13} /></div>;
      return <div data-developer-desk={`${index}:${position}`} className={`slot-empty ${readyForDev ? "deploy-target" : ""} ${hoveredDeskPosition === position ? "developer-drag-over" : ""}`} key={`empty-${position}`}><Plus size={13} /><small>{hoveredDeskPosition === position ? "RELEASE" : readyForDev ? `DESK ${position + 1}` : ""}</small></div>;
    })}</div>}
    {redirectsToLead && <div className="taunt-redirect-note"><Shield size={14} /><b>{slot.type === "cubicle" ? "CUBICLE REDIRECT" : "EMPTY LANE"}</b><small>Click to target rival lead</small></div>}
    <div className="slot-number">0{index + 1}</div>
  </div>;
}

function TurnDrawEventView({ draw }: { draw: TurnDrawEvent }) {
  return <div className="turn-draw-event" role="status" aria-live="polite">
    <div className="turn-draw-heading"><small>TURN START · DRAW PHASE</small><b>{draw.cards.length > 1 ? "NEW DEVELOPERS!" : "NEW DEVELOPER!"}</b><span>{draw.cards.length > 1 ? `${draw.cards.length} résumés are joining your hand` : "A résumé is joining your hand"}</span></div>
    <div className="turn-draw-cards">{draw.cards.map((id, index) => { const dev = getDeveloper(id); const center = index - (draw.cards.length - 1) / 2; return <article className="turn-draw-card" key={`${draw.key}-${index}`} style={{ "--accent": dev.accent, "--draw-x": `${center * 118}px`, "--draw-angle": `${center * 7}deg`, "--draw-delay": `${index * 120}ms` } as React.CSSProperties}>
      <div><img src={dev.art} alt={dev.name} /></div><small>{dev.role}</small><b>{dev.name}</b><span><Brain size={12} /> {dev.completion}% <i /> <Shield size={12} /> {dev.sanity}</span>
    </article>; })}</div>
  </div>;
}

function ActionStageView({ stage }: { stage: ActionStage }) {
  const actor = getDeveloper(stage.actor.devId);
  const target = stage.target ? getDeveloper(stage.target.devId) : undefined;
  const targetName = target?.name ?? (stage.owner === "player" ? "RIVAL LEAD" : "YOUR SANITY");
  const targetMax = target?.sanity ?? 30;
  const chance = Math.round(stage.chance ?? 0);
  const roll = clamp(Math.round(stage.roll ?? 1), 1, 100);
  // Land in the center of the roll's one-percent slice, never on the
  // success/failure boundary where anti-aliasing can make the result ambiguous.
  const rollAngle = (roll - .5) * 3.6;
  const projectBefore = clamp(((stage.projectBefore ?? 0) / (stage.projectMax || 1)) * 100, 0, 100);
  const projectAfter = clamp(((stage.projectAfter ?? 0) / (stage.projectMax || 1)) * 100, 0, 100);
  const sanityBefore = clamp(((stage.targetSanityBefore ?? 0) / targetMax) * 100, 0, 100);
  const sanityAfter = clamp(((stage.targetSanityAfter ?? 0) / targetMax) * 100, 0, 100);
  const completedSkip = stage.kind === "skip" && stage.skipReason !== "idle";

  return <div key={stage.key} className={`action-stage ${stage.kind} ${stage.phase} ${stage.success === true ? "success" : stage.success === false ? "failure" : ""}`}>
    <div className="action-stage-heading"><span>SEQUENCE {String(stage.sequence).padStart(2, "0")} / {String(SEQUENCE_COUNT).padStart(2, "0")}</span><b>{stage.owner === "player" ? "YOUR DEVELOPER" : "RIVAL DEVELOPER"}</b></div>
    <div className="action-stage-arena">
      <div className="stage-developer-shell actor-shell">
        <article className="stage-developer-card actor-card" style={{ "--accent": actor.accent } as React.CSSProperties}>
          <div className="stage-card-art"><img src={actor.art} alt={actor.name} />{stage.kind === "skip" && <strong className={`skip-stamp ${completedSkip ? "completed" : ""}`}>{completedSkip ? "DONE" : "SKIP"}</strong>}</div>
          <div className="stage-card-copy"><small>{actor.role}</small><b>{actor.name}</b><span><Brain size={13} /> {stage.actor.sanity} sanity</span></div>
        </article>
        {stage.kind === "taunt" && <img className="taunt-bubble-asset" src="/ui/taunt-bubble.png" alt="" aria-hidden="true" />}
      </div>

      <div className="stage-action-core">
        {stage.kind === "skip" && <div className={`stage-skip-symbol ${completedSkip ? "completed" : ""}`}>{completedSkip ? <Check /> : <Minus />}<b>{completedSkip ? "ALREADY SHIPPED" : "NO ACTION"}</b><small>{completedSkip ? "Auto-skipped" : "Ticket unused"}</small></div>}
        {stage.kind === "taunt" && <div className="stage-taunt-impact" aria-hidden="true"><span><i /><i /><i /></span><b>-{stage.damage}</b></div>}
        {stage.kind === "work" && <div className="chance-wheel-wrap"><div className="chance-wheel" style={{ "--chance-angle": `${chance * 3.6}deg`, "--roll-angle": `${rollAngle}deg` } as React.CSSProperties}><span className="chance-needle" /><span className="chance-center"><b>{chance}%</b><small>SUCCESS</small></span></div><em>{stage.phase === "rolling" ? "ROLLING…" : stage.success ? "COMPILED!" : "BUILD FAILED"}</em></div>}
      </div>

      {stage.kind === "work" && stage.task ? <article className="stage-work-card" style={{ "--project": stage.projectAccent } as React.CSSProperties}>
        <span className={`role-dot ${stage.task.type.toLowerCase()}`} /><small>{stage.task.type} REQUIREMENT</small><b>{stage.task.title}</b><p>Base reward <strong>+{stage.task.points} MVP</strong></p><div><Code2 /><span><b>{chance}% chance</b><small>Role modifier {ROLE_CHANCES[actor.role][stage.task.type] >= 0 ? "+" : ""}{ROLE_CHANCES[actor.role][stage.task.type]}%</small></span></div>
      </article> : stage.kind === "taunt" ? <article className={`stage-developer-card target-card ${stage.targetIsLead ? "lead-card" : ""}`} style={{ "--accent": target?.accent ?? "#ff4f8d", "--sanity-before": `${sanityBefore}%`, "--sanity-after": `${sanityAfter}%` } as React.CSSProperties}>
        {target ? <div className="stage-card-art"><img src={target.art} alt={target.name} /></div> : <div className="stage-lead-art"><Brain /><span>TEAM LEAD</span></div>}
        <div className="stage-card-copy"><small>{target?.role ?? "PLAYER SANITY"}</small><b>{targetName}</b><span className="stage-sanity-readout"><Brain size={13} /><span><i>{stage.targetSanityBefore}</i><i>{stage.targetSanityAfter ?? stage.targetSanityBefore}</i></span>/{targetMax}</span><div className="stage-sanity-meter"><i /></div></div>
      </article> : <div className={`stage-empty-ticket ${completedSkip ? "completed-ticket" : ""}`}>{completedSkip ? <Check /> : <Ticket />}<b>{stage.task?.title ?? (completedSkip ? "PROJECT COMPLETE" : "EMPTY TICKET")}</b><small>{completedSkip ? stage.task ? "Completed by an earlier action this sprint." : "The MVP was already completed earlier this sprint." : "This developer waits for the next sequence."}</small></div>}
    </div>

    <div className={`action-stage-result ${stage.phase === "result" ? "visible" : ""}`}><b>{stage.message}</b></div>
    {stage.kind === "work" && stage.phase === "result" && <div className="stage-project-progress" style={{ "--project": stage.projectAccent, "--progress-before": `${projectBefore}%`, "--progress-after": `${projectAfter}%` } as React.CSSProperties}><span><small>PROJECT MVP</small><b>{stage.projectName}</b></span><div><i /></div><strong>{stage.projectAfter}/{stage.projectMax}</strong></div>}
  </div>;
}

function Planner({ developers, opponents, project, plan, setPlan, onRequestTaunt, onClose, onSave }: { developers: PlacedDev[]; opponents: PlacedDev[]; project?: ProjectState; plan: Record<string, PlannedAction>; setPlan: (p: Record<string, PlannedAction>) => void; onRequestTaunt: (key: string, placed: PlacedDev, sequence: number) => void; onClose: () => void; onSave: () => void }) {
  const [editing, setEditing] = useState<{ key: string; placed: PlacedDev; sequence: number } | null>(null);
  const set = (key: string, value: PlannedAction) => setPlan({ ...plan, [key]: value });
  const tauntLabel = (action: PlannedAction) => {
    if (!action.startsWith("taunt:")) return "Taunt";
    const id = action.slice(6);
    if (id === "enemy-lead") return "Taunt rival lead";
    const target = opponents.find((candidate) => candidate.instanceId === id);
    return target ? `Taunt ${getDeveloper(target.devId).name}` : "Taunt target";
  };
  return <div className="modal-backdrop"><section className="planner-modal">
    <header><div><span className="eyebrow-small">ACTION QUEUE</span><h2>Plan the sprint</h2><p>Four larger beats. Stack attempts, target a rival, or coordinate a dependency chain.</p></div><button onClick={onClose}><X /></button></header>
    <div className="planner-summary"><span><BriefcaseBusiness size={14} /> {project?.name ?? "No project selected"}</span>{project && <span><Zap size={14} /> {project.progress}/{project.mvp} MVP</span>}<span><Ticket size={14} /> {SEQUENCE_COUNT} sequences max</span></div>
    {!developers.length ? <div className="planner-empty"><Users size={34} /><b>No developers deployed</b><span>You can close this panel and deploy someone, or intentionally launch an idle sprint.</span></div> : <div className="matrix-wrap"><table className="action-matrix"><thead><tr><th>DEVELOPER</th>{Array.from({ length: SEQUENCE_COUNT }).map((_, i) => <th key={i}><span>{i + 1}</span><small>SEQUENCE</small></th>)}</tr></thead><tbody>{developers.map((placed) => {
      const dev = getDeveloper(placed.devId);
      return <tr key={placed.instanceId}><td><img src={dev.art} alt="" /><span><b>{dev.name}</b><small>{dev.role}</small></span></td>{Array.from({ length: SEQUENCE_COUNT }).map((_, i) => {
        const key = `${placed.instanceId}-${i + 1}`;
        const action = plan[key] ?? "skip";
        const task = action.startsWith("work:") ? project?.tasks.find((candidate) => candidate.id === action.slice(5)) : undefined;
        const isTaunt = action.startsWith("taunt:");
        const label = task?.title ?? (isTaunt ? tauntLabel(action) : "Assign");
        return <td key={key}><button className={`matrix-action ${action === "skip" ? "empty" : isTaunt ? "taunt" : "work"}`} aria-label={`${dev.name} sequence ${i + 1}: ${label}`} onClick={() => setEditing({ key, placed, sequence: i + 1 })}>{action === "skip" ? <><Plus size={15} /><span>Assign action</span></> : isTaunt ? <><AlertTriangle size={15} /><span>{tauntLabel(action)}</span></> : <><Code2 size={15} /><span>{task?.title}</span></>}</button></td>;
      })}</tr>;
    })}</tbody></table></div>}
    <div className="task-legend">{project?.tasks.map((task) => <div key={task.id} className={project.tasksState[task.id].completed ? "complete" : ""}><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type} · +{task.points} MVP{task.dependsOn ? ` · linked +${task.coupling}%` : ""}</small></span><em>{project.tasksState[task.id].completed ? "DONE" : `${project.tasksState[task.id].marks} MARKS`}</em></div>)}</div>
    <footer><button className="secondary-cta" onClick={onClose}>Keep editing</button><button className="primary-cta small" onClick={onSave}><Check size={16} /> Save sprint plan</button></footer>
    {editing && (() => { const dev = getDeveloper(editing.placed.devId); const current = plan[editing.key] ?? "skip"; const legalTasks = project?.tasks.filter((task) => !project.tasksState[task.id].completed) ?? []; return <div className="action-picker-backdrop" onClick={() => setEditing(null)}><div className="action-picker" onClick={(e) => e.stopPropagation()}>
      <header><img src={dev.art} alt="" /><span><small>SEQUENCE {editing.sequence}</small><b>{dev.name}'s action</b><em>{dev.role} · {dev.completion}% base power</em></span><button onClick={() => setEditing(null)}><X size={18} /></button></header>
      <div className="quick-actions"><button className={current === "skip" ? "selected" : ""} onClick={() => { set(editing.key, "skip"); setEditing(null); }}><Minus size={15} /><span><b>Skip</b><small>Leave this ticket unused</small></span></button><button className={current.startsWith("taunt:") ? "selected taunt" : "taunt"} onClick={() => { onRequestTaunt(editing.key, editing.placed, editing.sequence); setEditing(null); }}><AlertTriangle size={15} /><span><b>{current.startsWith("taunt:") ? tauntLabel(current) : "Choose taunt target"}</b><small>Return to the board and pick a target</small></span></button></div>
      <div className="picker-label"><span>OR ASSIGN A SPECIFIC TASK</span><small>{legalTasks.length} unfinished · every role can try</small></div>
      <div className="picker-tasks">{legalTasks.map((task) => {
        const state = project!.tasksState[task.id];
        const depReady = !task.dependsOn || project!.tasksState[task.dependsOn]?.completed;
        const roleModifier = ROLE_CHANCES[dev.role][task.type];
        const estimate = clamp(dev.completion + roleModifier + state.marks * 6 + (task.dependsOn && depReady ? task.coupling ?? 0 : 0), 5, 96);
        return <button key={task.id} className={current === `work:${task.id}` ? "selected" : ""} onClick={() => { set(editing.key, `work:${task.id}`); setEditing(null); }}><span className={`role-dot ${task.type.toLowerCase()}`} /><span><b>{task.title}</b><small>{task.type} · role {roleModifier >= 0 ? "+" : ""}{roleModifier}% · +{task.points} MVP{task.dependsOn ? depReady ? ` · dependency ready +${task.coupling}%` : " · dependency not ready" : ""}</small></span><em><b>{Math.round(estimate)}%</b><small>EST. CHANCE</small></em></button>;
      })}{!legalTasks.length && <div className="no-compatible">Every requirement on this project is already complete.</div>}</div>
      <p className="picker-note">Cross-role work is legal but heavily penalized. Estimates also include failure marks and completed dependencies; slot traits resolve during the sprint.</p>
    </div></div>; })()}
  </section></div>;
}

function SprintConfirmation({ turn, project, plannedActions, onCancel, onConfirm }: { turn: number; project?: ProjectState; plannedActions: number; onCancel: () => void; onConfirm: () => void }) {
  return <div className="modal-backdrop sprint-confirm-backdrop" onClick={onCancel}><section className="sprint-confirm" onClick={(event) => event.stopPropagation()}>
    <div className="sprint-confirm-art"><img src="/ui/sprint-button.png" alt="" /><span>TURN COMMIT</span></div>
    <span className="eyebrow-small">SPRINT {String(turn).padStart(2, "0")}</span><h2>Launch this sprint?</h2><p>Running the sprint commits your queue and ends your planning phase. Every action will resolve in sequence.</p>
    <div className="sprint-confirm-stats"><span><BriefcaseBusiness size={16} /><b>{project?.name ?? "No project"}</b></span><span><Ticket size={16} /><b>{plannedActions} planned actions</b></span></div>
    {plannedActions === 0 && <div className="sprint-empty-warning"><AlertTriangle size={17} /><span><b>Your queue is empty.</b><small>Your side will spend every sequence idle while the rival team still acts.</small></span></div>}
    <footer><button className="secondary-cta" onClick={onCancel}>Back to planning</button><button className="sprint-confirm-go" onClick={onConfirm}><Play fill="currentColor" size={17} /> End turn &amp; Sprint!</button></footer>
  </section></div>;
}
