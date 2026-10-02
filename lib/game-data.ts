export type Role = "Frontend" | "Backend" | "Mobile" | "Full Stack";
export type AreaType = "open" | "cubicle";

export type Developer = {
  id: string;
  name: string;
  role: Role;
  completion: number;
  sanity: number;
  trait: string;
  traitLabel: string;
  quote: string;
  art: string;
  accent: string;
};

export type ProjectTask = {
  id: string;
  title: string;
  type: Exclude<Role, "Full Stack">;
  points: number;
  dependsOn?: string;
  coupling?: number;
};

export type Project = {
  id: string;
  name: string;
  client: string;
  description: string;
  mvp: number;
  brag: number;
  accent: string;
  tasks: ProjectTask[];
};

export type CampaignLead = {
  id: string;
  level: number;
  name: string;
  title: string;
  teamName: string;
  initials: string;
  art: string;
  accent: string;
  tagline: string;
  backstory: string;
  modifierLabel: string;
  modifier: string;
  signatureLabel: string;
  signatureDeck: string[];
  rewards: string[];
  rotatingCards: number;
  projectId: string;
};

export const DEVELOPERS: Developer[] = [
  { id: "chad", name: "Chad", role: "Frontend", completion: 48, sanity: 7, traitLabel: "Nepotism", trait: "In an open space, draw +1 developer at turn start.", quote: "My dad said this deploy is fine.", art: "/developers/chad-v2.png", accent: "#42d9ff" },
  { id: "preston", name: "Preston", role: "Full Stack", completion: 84, sanity: 13, traitLabel: "Executive Sponsorship", trait: "Other family members in his open space gain +6% completion.", quote: "Merit is knowing who signs the roadmap.", art: "/developers/preston.png", accent: "#3a8cff" },
  { id: "bryson", name: "Bryson", role: "Mobile", completion: 66, sanity: 9, traitLabel: "Bro Code", trait: "Gains +10% completion while sharing a slot with Chad.", quote: "Relax, bro. The app store review is basically QA.", art: "/developers/bryson.png", accent: "#69c7ff" },
  { id: "blair", name: "Blair", role: "Frontend", completion: 76, sanity: 9, traitLabel: "Personal Brand", trait: "Her completed Frontend tasks add +1 MVP.", quote: "If the launch isn't photogenic, it didn't ship.", art: "/developers/blair.png", accent: "#4f7dff" },
  { id: "basil", name: "Basil", role: "Backend", completion: 86, sanity: 12, traitLabel: "Damage Control", trait: "Coworkers in his slot take 1 less taunt damage.", quote: "I have quietly reverted the incident, sir.", art: "/developers/basil.png", accent: "#31b8e8" },
  { id: "fan", name: "Fan", role: "Backend", completion: 78, sanity: 10, traitLabel: "Superiority Complex", trait: "Takes 50% less taunt damage from Frontend developers.", quote: "Your CSS is not an architecture.", art: "/developers/fan.png", accent: "#ff427d" },
  { id: "aiden", name: "Aiden", role: "Full Stack", completion: 88, sanity: 6, traitLabel: "Deep Focus", trait: "Cannot enter open space. +8% completion in a cubicle.", quote: "…I already pushed the fix.", art: "/developers/aiden.png", accent: "#a26aff" },
  { id: "tigor", name: "Tigor", role: "Mobile", completion: 76, sanity: 12, traitLabel: "Spotter", trait: "Mobile tasks completed from his slot add +2 MVP.", quote: "One more rep. One more release.", art: "/developers/tigor.png", accent: "#ff8c35" },
  { id: "wendy", name: "Wendy", role: "Frontend", completion: 70, sanity: 9, traitLabel: "Harmony", trait: "Allies in her open space take 1 less sanity damage.", quote: "Pixel-perfect, pitch-perfect.", art: "/developers/wendy-v2.png", accent: "#ff63ad" },
  { id: "irene", name: "Irene", role: "Full Stack", completion: 85, sanity: 13, traitLabel: "Center Stage", trait: "Red Velvet teammates in her open space gain +8% completion.", quote: "Again from the top. This deploy lands on beat.", art: "/developers/irene.png", accent: "#e3344f" },
  { id: "seulgi", name: "Seulgi", role: "Backend", completion: 82, sanity: 11, traitLabel: "Dual Concept", trait: "Takes only a small cross-role penalty when working on Frontend tasks.", quote: "Cute interface. Monster infrastructure.", art: "/developers/seulgi.png", accent: "#d7362f" },
  { id: "joy", name: "Joy", role: "Mobile", completion: 75, sanity: 10, traitLabel: "Viral Loop", trait: "Her completed Mobile tasks add +1 MVP.", quote: "If it sparks joy, ship it to production.", art: "/developers/joy.png", accent: "#ff665e" },
  { id: "yeri", name: "Yeri", role: "Frontend", completion: 72, sanity: 9, traitLabel: "Maknae Momentum", trait: "Gains +10% completion during the fourth sequence.", quote: "Last ticket, best ticket.", art: "/developers/yeri.png", accent: "#ff4f91" },
  { id: "stewart", name: "Stewart", role: "Full Stack", completion: 84, sanity: 14, traitLabel: "Googoo Gaga Code", trait: "Coworkers in his slot lose 8% completion power.", quote: "Friendship compiled successfully!", art: "/developers/stewart.png", accent: "#20d3c2" },
  { id: "priya", name: "Priya", role: "Backend", completion: 80, sanity: 11, traitLabel: "Incident Commander", trait: "The first failed Backend attempt each turn gains no failure mark.", quote: "Breathe. Read the logs.", art: "/developers/priya.png", accent: "#f3bd2f" },
  { id: "mateo", name: "Mateo", role: "Mobile", completion: 71, sanity: 9, traitLabel: "Rapid Prototype", trait: "His first Mobile attempt each turn gains +10% completion.", quote: "It works on my phone!", art: "/developers/mateo.png", accent: "#339cff" },
  { id: "zara", name: "Zara", role: "Frontend", completion: 74, sanity: 10, traitLabel: "A11y Advocate", trait: "Frontend tasks completed from her slot add +1 MVP.", quote: "If it isn't usable, it isn't done.", art: "/developers/zara.png", accent: "#9eea3a" },
  { id: "nikko", name: "Nikko", role: "Backend", completion: 82, sanity: 7, traitLabel: "Night Owl", trait: "Gets +10% completion during sequences 3–4.", quote: "The servers are quieter at 2 AM.", art: "/developers/nikko.png", accent: "#9255ef" },
  { id: "valentina", name: "Valentina", role: "Full Stack", completion: 77, sanity: 11, traitLabel: "Pairing Energy", trait: "Coworkers in her open space gain +5% completion.", quote: "Two cursors, one clean commit.", art: "/developers/valentina.png", accent: "#2bd2cf" },
  { id: "omar", name: "Omar", role: "Mobile", completion: 68, sanity: 10, traitLabel: "Move Fast", trait: "First attempt gets +12%; a failure adds an extra mark.", quote: "Ship now. Patch elegantly later.", art: "/developers/omar.png", accent: "#f04455" }
];

export const CAMPAIGN_LEADS: CampaignLead[] = [
  {
    id: "preston-chadworth",
    level: 1,
    name: "Preston Chadworth",
    title: "The Legacy Hire",
    teamName: "CHADWORTH & SONS",
    initials: "PC",
    art: "/developers/preston.png",
    accent: "#3a8cff",
    tagline: "The org chart is a family tree.",
    backstory: "Preston inherited a fund, a corner office, and the conviction that leadership is genetic. He staffed his delivery team from the family group chat—then hired Basil to make sure anything actually ships.",
    modifierLabel: "Family Business",
    modifier: "Preston boosts relatives in his open space. Expect high-synergy lanes and Basil cleaning up their mistakes.",
    signatureLabel: "5 FAMILY CARDS",
    signatureDeck: ["preston", "chad", "bryson", "blair", "basil"],
    rewards: ["chad", "bryson", "blair", "basil"],
    rotatingCards: 7,
    projectId: "creator-studio"
  },
  {
    id: "irene-red-velvet",
    level: 2,
    name: "Irene",
    title: "The Comeback Lead",
    teamName: "RED VELVET LABS",
    initials: "IR",
    art: "/developers/irene.png",
    accent: "#e3344f",
    tagline: "Every deploy lands on eight counts.",
    backstory: "Red Velvet Labs treats every release like a comeback stage: rehearsed, polished, and impossible to ignore. Irene runs the sprint with exacting calm while Seulgi, Wendy, Joy, and Yeri turn every ticket into a coordinated performance.",
    modifierLabel: "Perfect Synchronization",
    modifier: "Teammates sharing Irene's open space gain +8% completion. Wendy softens taunts while the rest of the lineup converts role-specific work into fast MVP progress.",
    signatureLabel: "5 MEMBER CARDS",
    signatureDeck: ["irene", "seulgi", "wendy", "joy", "yeri"],
    rewards: ["seulgi", "wendy", "joy", "yeri"],
    rotatingCards: 7,
    projectId: "focus-flow"
  }
];

export const PROJECTS: Project[] = [
  {
    id: "pocket-pay", name: "PocketPay", client: "Fintech MVP", description: "A tiny wallet with very real compliance.", mvp: 14, brag: 8, accent: "#ffcb46",
    tasks: [
      { id: "auth-api", title: "Authentication API", type: "Backend", points: 4 },
      { id: "login", title: "Login flow", type: "Frontend", points: 3, dependsOn: "auth-api", coupling: 14 },
      { id: "ledger", title: "Ledger service", type: "Backend", points: 5 },
      { id: "wallet-mobile", title: "Wallet screen", type: "Mobile", points: 4, dependsOn: "ledger", coupling: 18 },
    ]
  },
  {
    id: "creator-studio", name: "Creator Studio", client: "Social launch", description: "Publish, schedule, and watch the numbers go up.", mvp: 13, brag: 7, accent: "#ff5d96",
    tasks: [
      { id: "media-api", title: "Media pipeline", type: "Backend", points: 4 },
      { id: "composer", title: "Post composer", type: "Frontend", points: 4, dependsOn: "media-api", coupling: 12 },
      { id: "analytics", title: "Analytics dashboard", type: "Frontend", points: 3 },
      { id: "push", title: "Push notifications", type: "Mobile", points: 4 },
    ]
  },
  {
    id: "crisis-pager", name: "Crisis Pager", client: "Ops tooling", description: "Wake the right person before everything burns.", mvp: 11, brag: 6, accent: "#ff654d",
    tasks: [
      { id: "alerts", title: "Alert router", type: "Backend", points: 5 },
      { id: "oncall", title: "On-call console", type: "Frontend", points: 3, dependsOn: "alerts", coupling: 20 },
      { id: "pager", title: "Pager client", type: "Mobile", points: 4, dependsOn: "alerts", coupling: 16 },
    ]
  },
  {
    id: "green-cart", name: "GreenCart", client: "Commerce rebuild", description: "Ethical groceries, unethical deadlines.", mvp: 15, brag: 9, accent: "#93dc45",
    tasks: [
      { id: "catalog", title: "Catalog API", type: "Backend", points: 4 },
      { id: "storefront", title: "Storefront", type: "Frontend", points: 4, dependsOn: "catalog", coupling: 14 },
      { id: "checkout", title: "Checkout service", type: "Backend", points: 5 },
      { id: "shopping-app", title: "Shopping app", type: "Mobile", points: 5, dependsOn: "checkout", coupling: 18 },
    ]
  },
  {
    id: "focus-flow", name: "FocusFlow", client: "Productivity bet", description: "A calm task app made under extreme pressure.", mvp: 12, brag: 7, accent: "#9a71ff",
    tasks: [
      { id: "sync", title: "Realtime sync", type: "Backend", points: 4 },
      { id: "boards", title: "Kanban boards", type: "Frontend", points: 4, dependsOn: "sync", coupling: 12 },
      { id: "focus-app", title: "Focus timer", type: "Mobile", points: 4 },
      { id: "themes", title: "Theme system", type: "Frontend", points: 2 },
    ]
  },
  {
    id: "launchpad", name: "Launchpad", client: "Developer platform", description: "Deploy anything. Ideally on purpose.", mvp: 16, brag: 10, accent: "#42d9ff",
    tasks: [
      { id: "build-api", title: "Build service", type: "Backend", points: 5 },
      { id: "deploy-ui", title: "Deploy console", type: "Frontend", points: 4, dependsOn: "build-api", coupling: 18 },
      { id: "logs", title: "Live logs", type: "Backend", points: 4 },
      { id: "status-app", title: "Status companion", type: "Mobile", points: 4, dependsOn: "logs", coupling: 12 },
    ]
  }
];

export const ROLE_CHANCES: Record<Role, Record<Exclude<Role, "Full Stack">, number>> = {
  Frontend: { Frontend: 12, Backend: -62, Mobile: -52 },
  Backend: { Frontend: -62, Backend: 12, Mobile: -58 },
  Mobile: { Frontend: -48, Backend: -58, Mobile: 12 },
  "Full Stack": { Frontend: 5, Backend: 5, Mobile: -38 },
};

export const getDeveloper = (id: string) => DEVELOPERS.find((d) => d.id === id)!;
