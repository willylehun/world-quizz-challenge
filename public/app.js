"use strict";

const REGION_OPTIONS = [
  { id: "international", label: "Quizz international", code: "MONDE", hint: "Les 195 pays" },
  { id: "Europe", label: "Quizz Europe", code: "EUROPE", hint: "Du Portugal à la Géorgie" },
  { id: "Afrique", label: "Quizz Afrique", code: "AFRIQUE", hint: "54 pays à découvrir" },
  { id: "Asie", label: "Quizz Asie", code: "ASIE", hint: "Capitales et dirigeants d’Asie" },
  { id: "Amerique", label: "Quizz Amérique", code: "AMÉRIQUE", hint: "Nord, centrale et Sud" },
  { id: "Océanie", label: "Quizz Océanie", code: "OCÉANIE", hint: "Îles et États du Pacifique" },
];

const QUESTION_TYPES = [
  { id: "country-capital", label: "Trouver la capitale", hint: "Le pays est donné", from: "country", to: "capital" },
  { id: "country-leader", label: "Trouver le dirigeant", hint: "Le pays est donné", from: "country", to: "leader" },
  { id: "capital-country", label: "Trouver le pays", hint: "La capitale est donnée", from: "capital", to: "country" },
  { id: "capital-leader", label: "Trouver le dirigeant", hint: "La capitale est donnée", from: "capital", to: "leader" },
  { id: "leader-country", label: "Trouver le pays", hint: "Le dirigeant est donné", from: "leader", to: "country" },
  { id: "leader-capital", label: "Trouver la capitale", hint: "Le dirigeant est donné", from: "leader", to: "capital" },
];

const CHALLENGE_TYPES = [
  { id: "small", name: "Petit Challenge", cost: 50, multiplier: 1, minStars: 1, maxStars: 5, stars: [1, 1, 2, 2, 3, 3, 4, 4, 5, 5], code: "PETIT", hint: "Facile → moyen • gains ×1" },
  { id: "standard", name: "Challenge", cost: 100, multiplier: 2, minStars: 4, maxStars: 8, stars: [4, 4, 5, 5, 6, 6, 7, 7, 8, 8], code: "CHALLENGE", hint: "Moyen → difficile • gains ×2" },
  { id: "ultimate", name: "Challenge ultime", cost: 500, multiplier: 10, minStars: 7, maxStars: 10, stars: [7, 7, 8, 8, 9, 9, 9, 10, 10, 10], code: "ULTIME", hint: "Difficile → ultime • gains ×10" },
];

const CONTINENT_PROGRESS = [
  { id: "Europe", label: "Europe", color: "#4da3ff" },
  { id: "Afrique", label: "Afrique", color: "#f5a623" },
  { id: "Asie", label: "Asie", color: "#ff596d" },
  { id: "Amérique", label: "Amérique", color: "#38d39f" },
  { id: "Océanie", label: "Océanie", color: "#a978ff" },
];

const CAPITAL_TRAPS = {
  FR: ["Lyon", "Marseille", "Bordeaux"],
  GB: ["Manchester", "Birmingham", "Édimbourg"],
  DE: ["Francfort", "Munich", "Hambourg"],
  IT: ["Milan", "Naples", "Turin"],
  ES: ["Rome", "Barcelone", "Séville"],
  PT: ["Porto", "Braga", "Faro"],
  BE: ["Anvers", "Bruges", "Liège"],
  NL: ["La Haye", "Rotterdam", "Utrecht"],
  CI: ["Abidjan", "Bouaké", "Accra"],
  ZA: ["Le Cap", "Bloemfontein", "Johannesburg"],
  TZ: ["Dar es Salaam", "Arusha", "Nairobi"],
  NG: ["Lagos", "Kano", "Accra"],
  TR: ["Istanbul", "Izmir", "Athènes"],
  BR: ["Rio de Janeiro", "São Paulo", "Buenos Aires"],
  AU: ["Sydney", "Melbourne", "Auckland"],
  CA: ["Toronto", "Montréal", "Vancouver"],
  US: ["New York", "Los Angeles", "Chicago"],
  MX: ["Guadalajara", "Monterrey", "Cancún"],
  AR: ["Córdoba", "Rosario", "Mendoza"],
  EG: ["Alexandrie", "Louxor", "Gizeh"],
  JP: ["Kyoto", "Osaka", "Yokohama"],
  CN: ["Shanghai", "Hong Kong", "Canton"],
  IN: ["Mumbai", "Calcutta", "Bangalore"],
  RU: ["Saint-Pétersbourg", "Sotchi", "Kazan"],
  GR: ["Thessalonique", "Patras", "Héraklion"],
  AT: ["Salzbourg", "Graz", "Innsbruck"],
  IE: ["Cork", "Galway", "Limerick"],
  SE: ["Göteborg", "Malmö", "Uppsala"],
  NO: ["Bergen", "Trondheim", "Stavanger"],
  DK: ["Aarhus", "Odense", "Aalborg"],
  FI: ["Turku", "Tampere", "Espoo"],
  PL: ["Cracovie", "Gdańsk", "Wrocław"],
  CZ: ["Brno", "Ostrava", "Plzeň"],
  HU: ["Debrecen", "Szeged", "Pécs"],
  RO: ["Cluj-Napoca", "Brașov", "Timișoara"],
  HR: ["Split", "Dubrovnik", "Rijeka"],
  RS: ["Novi Sad", "Niš", "Kragujevac"],
  UA: ["Kharkiv", "Odessa", "Lviv"],
  MA: ["Casablanca", "Marrakech", "Tunis"],
  DZ: ["Oran", "Constantine", "Annaba"],
  TN: ["Sfax", "Sousse", "Hammamet"],
  SN: ["Saint-Louis", "Thiès", "Touba"],
  KE: ["Mombasa", "Kisumu", "Nakuru"],
  SA: ["Djeddah", "La Mecque", "Médine"],
  CH: ["Zurich", "Genève", "Bâle"],
  IL: ["Tel Aviv", "Haïfa", "Eilat"],
  TH: ["Chiang Mai", "Phuket", "Pattaya"],
  VN: ["Hô Chi Minh-Ville", "Da Nang", "Hué"],
  KR: ["Busan", "Incheon", "Daegu"],
  PK: ["Karachi", "Lahore", "Peshawar"],
  BD: ["Chittagong", "Sylhet", "Khulna"],
  LK: ["Colombo", "Kandy", "Malé"],
  MY: ["Putrajaya", "George Town", "Johor Bahru"],
  NZ: ["Auckland", "Christchurch", "Sydney"],
  AE: ["Dubaï", "Charjah", "Doha"],
};

const COUNTRY_TRAPS = {
  FR: ["Belgique", "Suisse", "Luxembourg"], GB: ["Irlande", "France", "Pays-Bas"],
  DE: ["Autriche", "Suisse", "Belgique"], IT: ["Espagne", "Grèce", "Portugal"],
  ES: ["Portugal", "Italie", "France"], PT: ["Espagne", "Italie", "Grèce"],
  BE: ["Pays-Bas", "Luxembourg", "France"], NL: ["Belgique", "Danemark", "Allemagne"],
  CH: ["Autriche", "Luxembourg", "Allemagne"], CA: ["États-Unis", "Australie", "Nouvelle-Zélande"],
  US: ["Canada", "Mexique", "Royaume-Uni"], RU: ["Ukraine", "Biélorussie", "Kazakhstan"],
  BR: ["Argentine", "Colombie", "Pérou"], JP: ["Corée du Sud", "Chine", "Taïwan"],
  CN: ["Japon", "Corée du Sud", "Mongolie"], IN: ["Pakistan", "Bangladesh", "Népal"],
  AU: ["Nouvelle-Zélande", "Canada", "Afrique du Sud"], MX: ["Guatemala", "Cuba", "Costa Rica"],
  AR: ["Uruguay", "Chili", "Brésil"], EG: ["Maroc", "Tunisie", "Jordanie"],
  GR: ["Chypre", "Italie", "Turquie"], AT: ["Allemagne", "Suisse", "Hongrie"],
  IE: ["Royaume-Uni", "Islande", "Danemark"], SE: ["Norvège", "Finlande", "Danemark"],
  NO: ["Suède", "Finlande", "Islande"], DK: ["Suède", "Norvège", "Pays-Bas"],
  FI: ["Suède", "Estonie", "Norvège"], PL: ["Tchéquie", "Slovaquie", "Hongrie"],
  CZ: ["Slovaquie", "Pologne", "Autriche"], HU: ["Roumanie", "Slovaquie", "Croatie"],
  RO: ["Bulgarie", "Hongrie", "Moldavie"], HR: ["Slovénie", "Serbie", "Monténégro"],
  RS: ["Croatie", "Bosnie-Herzégovine", "Bulgarie"], UA: ["Pologne", "Roumanie", "Moldavie"],
  MA: ["Algérie", "Tunisie", "Égypte"], CI: ["Ghana", "Sénégal", "Cameroun"],
  DZ: ["Maroc", "Tunisie", "Libye"], TN: ["Algérie", "Maroc", "Libye"],
  SN: ["Mali", "Mauritanie", "Gambie"], NG: ["Ghana", "Cameroun", "Niger"],
  KE: ["Tanzanie", "Ouganda", "Éthiopie"],
  ZA: ["Namibie", "Botswana", "Zimbabwe"], TR: ["Grèce", "Géorgie", "Arménie"],
  SA: ["Émirats arabes unis", "Qatar", "Jordanie"], AE: ["Qatar", "Bahreïn", "Koweït"],
  IL: ["Jordanie", "Liban", "Chypre"], TH: ["Cambodge", "Laos", "Malaisie"],
  VN: ["Thaïlande", "Laos", "Cambodge"], KR: ["Japon", "Corée du Nord", "Chine"],
  PK: ["Inde", "Afghanistan", "Iran"], BD: ["Inde", "Népal", "Sri Lanka"],
  LK: ["Maldives", "Inde", "Bangladesh"], MY: ["Singapour", "Indonésie", "Brunei"],
  NZ: ["Australie", "Fidji", "Papouasie-Nouvelle-Guinée"],
};

const EASY_RANK = [
  "FR","US","GB","DE","IT","ES","PT","BE","CH","CA","BR","JP","CN","IN","RU","AU","MX","AR","EG","ZA",
  "NL","IE","AT","GR","SE","NO","DK","FI","PL","UA","TR","MA","DZ","TN","SN","CI","NG","KE","SA","AE",
  "IL","TH","VN","ID","KR","KP","NZ","CL","CO","PE","CU","JM","IS","CZ","HU","RO","HR","RS","BG","SK",
  "SI","LU","MC","VA","AD","LI","MT","CY","GE","AM","AZ","KZ","PK","BD","LK","NP","MY","SG","PH","QA",
  "KW","IQ","IR","JO","LB","SY","ET","TZ","UG","GH","CM","CD","CG","MG","MU","SC","NA","BW","ZW","ZM",
  "BO","EC","UY","PY","VE","CR","PA","DO","HT","GT","HN","SV","NI","BS","BB","TT","BZ","GY","SR","FJ",
  "PG","WS","TO","VU","SB","MN","UZ","TM","TJ","KG","AF","MM","KH","LA","BT","MV","BN","TL","OM","YE",
  "BH","PS","AL","BA","ME","MK","MD","BY","LT","LV","EE","XK","SD","SS","LY","ML","NE","TD","BF","BJ",
  "TG","GM","GN","GW","SL","LR","GA","GQ","CF","ER","DJ","SO","RW","BI","MW","MZ","AO","LS","SZ","CV",
  "KM","ST","MR","DM","GD","LC","VC","AG","KN","PW","FM","MH","KI","NR","TV","SM"
];

const STORAGE_KEYS = ["wqc-classic", "wqc-training", "wqc-challenge", "wqc-wallet", "wqc-question-history", "wqc-continent-stats"];
const state = {
  countries: [], screen: "home", mode: null, region: null, type: null, level: null,
  challengeId: null, tier: null, pendingChallengeId: null,
  questions: [], questionIndex: 0, score: 0, locked: false, rewardEarned: 0,
  answerFactTimer: null,
  jokers: { switch: true, correct: true, erase: true },
  profile: null, profileToken: null, duelMatch: null, duelLocked: false, duelPoll: null, duelReviewIndex: 0, pendingReportMatchId: null,
  friends: [], randomMatchStatus: null,
};

let deferredInstallPrompt = null;

const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Le stockage privé peut être bloqué. */ }
  },
  remove(key) {
    try { localStorage.removeItem(key); } catch { /* Le stockage privé peut être bloqué. */ }
  },
  has(key) {
    try { return localStorage.getItem(key) !== null; } catch { return false; }
  },
};

const DUEL_ID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const PROFILE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;

function boundedInteger(value, minimum, maximum, fallback = minimum) {
  const number = Number(value);
  return Number.isFinite(number) ? Math.min(maximum, Math.max(minimum, Math.trunc(number))) : fallback;
}

function normalizedScoreMap(value, maximumKey) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, score]) => {
    const numberKey = Number(key);
    return Number.isInteger(numberKey) && numberKey >= 1 && numberKey <= maximumKey
      ? [[String(numberKey), boundedInteger(score, 0, 10, 0)]] : [];
  }));
}

function normalizedRewardMap(value, maximumKey) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, rewarded]) => {
    const numberKey = Number(key);
    return Number.isInteger(numberKey) && numberKey >= 1 && numberKey <= maximumKey && rewarded === true
      ? [[String(numberKey), true]] : [];
  }));
}

function isDuelId(value) { return typeof value === "string" && DUEL_ID_RE.test(value); }
function duelApiPath(id, action = "") {
  if (!isDuelId(id)) throw new Error("Identifiant de défi invalide.");
  return `matches/${encodeURIComponent(id)}${action ? `/${action}` : ""}`;
}

const els = {
  screens: [...document.querySelectorAll("[data-screen]")],
  regionGrid: document.querySelector("#region-grid"), typeGrid: document.querySelector("#type-grid"),
  levelsGrid: document.querySelector("#levels-grid"), progressSummary: document.querySelector("#progress-summary"),
  challengeTypeGrid: document.querySelector("#challenge-type-grid"), selectedRegionLabel: document.querySelector("#selected-region-label"),
  quizModeLabel: document.querySelector("#quiz-mode-label"), quizProgressLabel: document.querySelector("#quiz-progress-label"),
  liveScore: document.querySelector("#live-score"), progressBar: document.querySelector("#progress-bar"),
  questionKicker: document.querySelector("#question-kicker"), questionText: document.querySelector("#question-text"),
  answersGrid: document.querySelector("#answers-grid"), feedback: document.querySelector("#feedback"), jokerDock: document.querySelector("#joker-dock"),
  answerFactToast: document.querySelector("#answer-fact-toast"), answerFactCountry: document.querySelector("#answer-fact-country"),
  answerFactCapital: document.querySelector("#answer-fact-capital"), answerFactLeader: document.querySelector("#answer-fact-leader"),
  resultScore: document.querySelector("#result-score"), resultRing: document.querySelector("#result-ring"),
  resultEyebrow: document.querySelector("#result-eyebrow"), resultTitle: document.querySelector("#result-title"),
  resultMessage: document.querySelector("#result-message"), resultActions: document.querySelector("#result-actions"),
  scoresDialog: document.querySelector("#scores-dialog"), confirmDialog: document.querySelector("#confirm-dialog"),
  resetDialog: document.querySelector("#reset-dialog"), installDialog: document.querySelector("#install-dialog"),
  challengeEntryDialog: document.querySelector("#challenge-entry-dialog"), challengeEntryTitle: document.querySelector("#challenge-entry-title"),
  challengeEntryCopy: document.querySelector("#challenge-entry-copy"), challengeEntryConfirm: document.querySelector("#challenge-entry-confirm"),
  installButton: document.querySelector('[data-action="install"]'), scoresContent: document.querySelector("#scores-content"),
  balance: document.querySelector("#wqc-balance"), dataError: document.querySelector("#data-error"),
  profileName: document.querySelector("#profile-name"), profileSetupDialog: document.querySelector("#profile-setup-dialog"),
  profileDialog: document.querySelector("#profile-dialog"), profileDialogName: document.querySelector("#profile-dialog-name"),
  profileForm: document.querySelector("#profile-form"), profileFormMessage: document.querySelector("#profile-form-message"),
  profileDeleteDialog: document.querySelector("#profile-delete-dialog"), profileDeleteForm: document.querySelector("#profile-delete-form"),
  profileDeleteName: document.querySelector("#profile-delete-name"), profileDeleteMessage: document.querySelector("#profile-delete-message"),
  reportBlockDialog: document.querySelector("#report-block-dialog"), reportBlockForm: document.querySelector("#report-block-form"),
  reportBlockMessage: document.querySelector("#report-block-message"),
  notificationStatus: document.querySelector("#notification-status"), duelForm: document.querySelector("#duel-form"),
  duelFormMessage: document.querySelector("#duel-form-message"), duelLists: document.querySelector("#duel-lists"),
  randomDuelForm: document.querySelector("#random-duel-form"), randomDuelSubmit: document.querySelector("#random-duel-submit"),
  randomDuelCancel: document.querySelector("#random-duel-cancel"), randomDuelMessage: document.querySelector("#random-duel-message"),
  friendForm: document.querySelector("#friend-form"), friendFormMessage: document.querySelector("#friend-form-message"),
  friendsList: document.querySelector("#friends-list"), opponentName: document.querySelector("#opponent-name"),
  duelContext: document.querySelector("#duel-context"), duelProgress: document.querySelector("#duel-progress"),
  duelProgressBar: document.querySelector("#duel-progress-bar"), duelPlayerScore: document.querySelector("#duel-player-score"),
  duelOpponentScore: document.querySelector("#duel-opponent-score"), duelKicker: document.querySelector("#duel-kicker"),
  duelQuestion: document.querySelector("#duel-question"), duelAnswers: document.querySelector("#duel-answers"),
  duelFeedback: document.querySelector("#duel-feedback"), duelReveal: document.querySelector("#duel-reveal"),
  duelNext: document.querySelector("#duel-next"), duelErase: document.querySelector("#duel-erase"),
  duelResultCard: document.querySelector("#duel-result-card"), duelResultState: document.querySelector("#duel-result-state"),
  duelResultTitle: document.querySelector("#duel-result-title"), duelFinalScore: document.querySelector("#duel-final-score"),
  duelResultMessage: document.querySelector("#duel-result-message"), duelResultFeedback: document.querySelector("#duel-result-feedback"),
  duelReviewContext: document.querySelector("#duel-review-context"), duelReviewProgress: document.querySelector("#duel-review-progress"),
  duelReviewProgressBar: document.querySelector("#duel-review-progress-bar"), duelReviewPlayerScore: document.querySelector("#duel-review-player-score"),
  duelReviewOpponentScore: document.querySelector("#duel-review-opponent-score"), duelReviewKicker: document.querySelector("#duel-review-kicker"),
  duelReviewQuestion: document.querySelector("#duel-review-question"), duelReviewAnswers: document.querySelector("#duel-review-answers"),
  duelReviewLegend: document.querySelector("#duel-review-legend"), duelReviewPrevious: document.querySelector("#duel-review-previous"),
  duelReviewNext: document.querySelector("#duel-review-next"),
  continentProgressChart: document.querySelector("#continent-progress-chart"), worldProgressAverage: document.querySelector("#world-progress-average"),
};

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const clean = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i], next = clean[i + 1];
    if (char === '"' && quoted && next === '"') { field += '"'; i += 1; }
    else if (char === '"') quoted = !quoted;
    else if (char === ";" && !quoted) { row.push(field.trim()); field = ""; }
    else if ((char === "\n" || char === "\r") && !quoted) {
      if (char === "\r" && next === "\n") i += 1;
      row.push(field.trim());
      if (row.some(Boolean)) rows.push(row);
      row = []; field = "";
    } else field += char;
  }
  if (field || row.length) { row.push(field.trim()); rows.push(row); }
  return rows;
}

function normalizeCountries(rows) {
  return rows.slice(1).map((r) => ({
    continent: r[0], country: r[1], capital: r[2], leader: r[3], role: r[4], iso: r[9],
  })).filter((c) => c.country && c.capital && c.leader && c.iso);
}

function shuffle(items) {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function showScreen(name) {
  if (name !== "quiz" && name !== "duel-game") cancelAnswerFact();
  if (state.duelPoll) { clearInterval(state.duelPoll); state.duelPoll = null; }
  state.screen = name;
  els.screens.forEach((screen) => screen.classList.toggle("hidden", screen.dataset.screen !== name));
  if (name === "home") renderContinentProgress();
  document.querySelector("main").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function continentProgressKey(continent) {
  return continent?.startsWith("Amérique") ? "Amérique" : continent;
}

function getContinentStats() {
  const value = storage.get("wqc-continent-stats", {});
  const stored = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return Object.fromEntries(CONTINENT_PROGRESS.map((continent) => {
    const entry = stored[continent.id] || {};
    const total = boundedInteger(entry.total, 0, Number.MAX_SAFE_INTEGER, 0);
    const correct = boundedInteger(entry.correct, 0, total, 0);
    return [continent.id, { correct, total }];
  }));
}

function recordContinentAnswer(answerIso, isCorrect) {
  const country = state.countries.find((item) => item.iso === answerIso);
  const continent = continentProgressKey(country?.continent);
  if (!CONTINENT_PROGRESS.some((item) => item.id === continent)) return;
  const stats = getContinentStats();
  stats[continent].total += 1;
  if (isCorrect) stats[continent].correct += 1;
  storage.set("wqc-continent-stats", stats);
}

function renderContinentProgress() {
  if (!els.continentProgressChart || !els.worldProgressAverage) return;
  const stats = getContinentStats();
  const totals = Object.values(stats).reduce((sum, item) => ({ correct: sum.correct + item.correct, total: sum.total + item.total }), { correct: 0, total: 0 });
  els.worldProgressAverage.textContent = `${totals.total ? Math.round((totals.correct / totals.total) * 100) : 0}%`;
  els.continentProgressChart.innerHTML = CONTINENT_PROGRESS.map((continent) => {
    const entry = stats[continent.id], percent = entry.total ? Math.round((entry.correct / entry.total) * 100) : 0;
    const detail = entry.total ? `${entry.correct}/${entry.total}` : "À découvrir";
    return `<div class="continent-progress-row" style="--continent-color:${continent.color}">
      <div class="continent-progress-label"><strong>${continent.label}</strong><span>${detail}</span></div>
      <div class="continent-progress-track"><span style="width:${percent}%"></span></div>
      <strong class="continent-progress-percent">${percent}%</strong>
    </div>`;
  }).join("");
}

function getWallet() { return boundedInteger(storage.get("wqc-wallet", 0), 0, Number.MAX_SAFE_INTEGER, 0); }
function setWallet(value) { storage.set("wqc-wallet", boundedInteger(value, 0, Number.MAX_SAFE_INTEGER, 0)); updateBalance(); }
function addWallet(value) { setWallet(getWallet() + value); }
function updateBalance() { els.balance.textContent = new Intl.NumberFormat("fr-FR").format(getWallet()); }

function targetForLevel(level) {
  if (level <= 20) return 5;
  if (level <= 50) return 6;
  return 7;
}

function getClassicData() {
  const value = storage.get("wqc-classic", {});
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  return {
    unlocked: boundedInteger(raw.unlocked, 1, 100, 1),
    scores: normalizedScoreMap(raw.scores, 100),
    rewards: normalizedRewardMap(raw.rewards, 100),
  };
}

function getChallengeData() {
  const value = storage.get("wqc-challenge", {});
  const raw = value && typeof value === "object" && !Array.isArray(value) ? value : {};
  const normalized = {};
  CHALLENGE_TYPES.forEach((challenge) => {
    const valueEntry = raw[challenge.id];
    const entry = valueEntry && typeof valueEntry === "object" && !Array.isArray(valueEntry) ? valueEntry : {};
    normalized[challenge.id] = {
      joined: entry.joined === true,
      unlocked: boundedInteger(entry.unlocked, 1, 20, 1),
      scores: normalizedScoreMap(entry.scores, 20),
      rewards: normalizedRewardMap(entry.rewards, 20),
    };
  });
  return normalized;
}

function getTrainingScores() {
  const value = storage.get("wqc-training", {});
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).flatMap(([key, score]) => {
    const [region, typeId, extra] = key.split("|");
    const validRegion = REGION_OPTIONS.some((item) => item.id === region);
    const validType = QUESTION_TYPES.some((item) => item.id === typeId);
    return validRegion && validType && extra === undefined
      ? [[key, boundedInteger(score, 0, 10, 0)]] : [];
  }));
}

function migrateWallet() {
  if (storage.has("wqc-wallet")) { updateBalance(); return; }
  const classic = getClassicData();
  let retroactive = 0;
  Object.entries(classic.scores).forEach(([level, score]) => {
    if (Number(score) >= targetForLevel(Number(level))) {
      classic.rewards[level] = true;
      retroactive += Number(level) * 10;
    }
  });
  storage.set("wqc-classic", classic); setWallet(retroactive);
}

function getRegionCountries(region) {
  if (region === "international") return state.countries;
  if (region === "Amerique") return state.countries.filter((c) => c.continent.startsWith("Amérique"));
  return state.countries.filter((c) => c.continent === region);
}

function valueFor(country, field) {
  if (field === "country") return country.country;
  if (field === "capital") return country.capital;
  return `${country.leader} — ${country.role}`;
}

function questionPrompt(country, type) {
  if (type.from === "country" && type.to === "capital") return `Quelle est la capitale de ${country.country} ?`;
  if (type.from === "country" && type.to === "leader") return `Qui exerce le pouvoir à la tête de ${country.country} ?`;
  if (type.from === "capital" && type.to === "country") return `${country.capital} est la capitale de quel pays ?`;
  if (type.from === "capital" && type.to === "leader") return `Quel dirigeant exerce le pouvoir dans le pays dont la capitale est ${country.capital} ?`;
  if (type.from === "leader" && type.to === "country") return `Quel pays est dirigé par ${country.leader} (${country.role}) ?`;
  return `À quelle capitale est associé ${country.leader} (${country.role}) ?`;
}

function cancelAnswerFact() {
  if (state.answerFactTimer) clearTimeout(state.answerFactTimer);
  state.answerFactTimer = null;
  els.answerFactToast?.classList.add("hidden");
}

function showAnswerFact(answerIso, onComplete) {
  cancelAnswerFact();
  const country = state.countries.find((item) => item.iso === answerIso);
  if (country) {
    els.answerFactCountry.textContent = country.country;
    els.answerFactCapital.textContent = `Capitale : ${country.capital}`;
    els.answerFactLeader.textContent = `Dirigeant : ${country.leader} — ${country.role}`;
    els.answerFactToast.classList.remove("hidden");
  }
  state.answerFactTimer = setTimeout(() => {
    state.answerFactTimer = null;
    els.answerFactToast?.classList.add("hidden");
    onComplete();
  }, 2000);
}

function recentQuestionIsos() { return new Set(storage.get("wqc-question-history", []).slice(-120)); }

function rememberQuestions(questions) {
  const history = storage.get("wqc-question-history", []);
  questions.forEach((question) => history.push(question.answerIso));
  storage.set("wqc-question-history", history.slice(-120));
}

function makeQuestion(pool, type, usedIso = new Set(), avoidedIso = new Set()) {
  let source = pool.filter((c) => !usedIso.has(c.iso) && !avoidedIso.has(c.iso));
  if (!source.length) source = pool.filter((c) => !usedIso.has(c.iso));
  if (!source.length) source = pool;
  const answer = source[Math.floor(Math.random() * source.length)];
  const nearby = state.countries.filter((c) => c.iso !== answer.iso && c.continent === answer.continent);
  const allOthers = state.countries.filter((c) => c.iso !== answer.iso);
  const wrongPool = shuffle([...nearby, ...allOthers]).filter((country, index, items) =>
    valueFor(country, type.to) !== valueFor(answer, type.to)
    && items.findIndex((item) => valueFor(item, type.to) === valueFor(country, type.to)) === index);
  const traps = type.to === "capital" ? CAPITAL_TRAPS[answer.iso] || [] : type.to === "country" ? COUNTRY_TRAPS[answer.iso] || [] : [];
  const wrongs = [...traps, ...wrongPool.map((c) => valueFor(c, type.to))]
    .filter((value, index, items) => value !== valueFor(answer, type.to) && items.indexOf(value) === index)
    .slice(0, 3);
  return {
    answerIso: answer.iso, prompt: questionPrompt(answer, type), correct: valueFor(answer, type.to),
    options: shuffle([valueFor(answer, type.to), ...wrongs]), kicker: type.label, typeId: type.id, context: type,
  };
}

function typeSchedule() {
  const extra = Array.from({ length: 4 }, () => QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)]);
  return shuffle([...QUESTION_TYPES, ...extra]);
}

function generateQuestions(pool) {
  const used = new Set(), avoided = recentQuestionIsos(), types = typeSchedule();
  return Array.from({ length: 10 }, (_, index) => {
    const question = makeQuestion(pool, types[index], used, avoided);
    used.add(question.answerIso); return question;
  });
}

function generateTrainingQuestions() {
  const pool = getRegionCountries(state.region), type = QUESTION_TYPES.find((item) => item.id === state.type), used = new Set();
  return Array.from({ length: 10 }, () => {
    const question = makeQuestion(pool, type, used); used.add(question.answerIso); return question;
  });
}

function countryDifficulty(country) {
  const index = EASY_RANK.indexOf(country.iso);
  if (index < 0) return 10;
  return Math.min(10, Math.floor(index / 20) + 1);
}

function poolForStars(stars) {
  const minDifficulty = Math.max(1, stars - 1);
  let pool = state.countries.filter((country) => {
    const difficulty = countryDifficulty(country);
    return difficulty >= minDifficulty && difficulty <= stars;
  });
  if (pool.length < 16) pool = state.countries.filter((country) => countryDifficulty(country) <= stars);
  return pool;
}

function generateClassicQuestions(level) { return generateQuestions(poolForStars(Math.ceil(level / 10))); }

function challengeStars(challenge, index = state.questionIndex) {
  return challenge?.stars?.[Math.min(Math.max(index, 0), 9)] || challenge?.maxStars || 1;
}

function generateChallengeQuestions(challenge) {
  const used = new Set(), avoided = recentQuestionIsos(), types = typeSchedule();
  return challenge.stars.map((stars, index) => {
    const question = makeQuestion(poolForStars(stars), types[index], used, avoided);
    question.difficultyStars = stars;
    used.add(question.answerIso);
    return question;
  });
}
function challengeReward(challenge) { return 200 * challenge.multiplier; }

function renderRegions() {
  els.regionGrid.innerHTML = REGION_OPTIONS.map((region) => `
    <button class="choice-card" type="button" data-region="${region.id}">
      <span class="choice-code">${region.code}</span><strong>${region.label}</strong><small>${region.hint}</small>
    </button>`).join("");
}

function renderTypes() {
  els.typeGrid.innerHTML = QUESTION_TYPES.map((type, index) => `
    <button class="choice-card" type="button" data-type="${type.id}">
      <span class="choice-code">0${index + 1}</span><strong>${type.label}</strong><small>${type.hint}</small>
    </button>`).join("");
}

function renderLevels() {
  const data = getClassicData();
  const completed = Object.keys(data.scores).filter((level) => Number(data.scores[level]) >= targetForLevel(Number(level))).length;
  els.progressSummary.innerHTML = `<strong>${completed}/100</strong><span>niveaux réussis</span>`;
  els.levelsGrid.innerHTML = Array.from({ length: 100 }, (_, index) => {
    const level = index + 1, stars = Math.ceil(level / 10), score = data.scores[level], locked = level > data.unlocked;
    const passed = score >= targetForLevel(level);
    const classes = ["level-button", passed ? "completed" : "", level === data.unlocked ? "current" : ""].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-level="${level}" ${locked ? "disabled" : ""} aria-label="Niveau ${level}, difficulté ${stars} étoile${stars > 1 ? "s" : ""}${locked ? ", verrouillé" : ""}">
      <strong>${locked ? "" : level}</strong><small>${locked ? '<span class="level-lock">●</span>' : "★".repeat(stars)}</small>
    </button>`;
  }).join("");
}

function renderChallengeTypes() {
  const data = getChallengeData();
  els.challengeTypeGrid.innerHTML = CHALLENGE_TYPES.map((challenge) => {
    const entry = data[challenge.id];
    const scores = Object.values(entry.scores).map(Number);
    const best = scores.length ? Math.max(...scores) : 0;
    const completed = best >= 7;
    return `<button class="choice-card challenge-choice" type="button" data-challenge="${challenge.id}">
      <span class="choice-code">${challenge.code}</span><strong>${challenge.name}</strong>
      <small>${challenge.hint} • 10 questions • objectif 7/10 • gain ${challengeReward(challenge)} WQC</small>
      <span class="challenge-status">${completed ? `Meilleur : ${best}/10 • ` : best ? `Meilleur : ${best}/10 • ` : ""}${challenge.cost} WQC la partie</span>
    </button>`;
  }).join("");
}

function requestChallengeEntry(id) {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === id);
  if (!challenge) return;
  state.challengeId = id;
  state.pendingChallengeId = id;
  const enough = getWallet() >= challenge.cost;
  els.challengeEntryTitle.textContent = challenge.name;
  els.challengeEntryCopy.textContent = enough
    ? `Chaque partie coûte ${challenge.cost} WQC. La difficulté augmente de ${challenge.minStars}★ à ${challenge.maxStars}★ sur 10 questions. Objectif : 7/10 pour gagner ${challengeReward(challenge)} WQC.`
    : `Il faut ${challenge.cost} WQC pour participer. Ton solde actuel est de ${getWallet()} WQC.`;
  els.challengeEntryConfirm.disabled = !enough;
  els.challengeEntryConfirm.textContent = enough ? `Payer ${challenge.cost} WQC` : "Solde insuffisant";
  els.challengeEntryDialog.showModal();
}

function confirmChallengeEntry() {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.pendingChallengeId);
  if (!challenge || getWallet() < challenge.cost) return;
  setWallet(getWallet() - challenge.cost);
  state.challengeId = challenge.id; state.pendingChallengeId = null;
  els.challengeEntryDialog.close(); startChallenge();
}

function startTraining() {
  state.mode = "training"; state.level = null; state.challengeId = null; state.tier = null;
  state.questions = generateTrainingQuestions(); beginQuiz();
}

function startClassic(level) {
  state.mode = "classic"; state.level = level; state.challengeId = null; state.tier = null;
  state.questions = generateClassicQuestions(level); beginQuiz();
}

function startChallenge() {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId);
  if (!challenge) return;
  state.mode = "challenge"; state.level = null; state.tier = 20;
  state.questions = generateChallengeQuestions(challenge); beginQuiz();
}

function beginQuiz() {
  state.questionIndex = 0; state.score = 0; state.locked = false; state.rewardEarned = 0;
  state.jokers = { switch: true, correct: true, erase: true };
  els.jokerDock.classList.toggle("hidden", state.mode === "training");
  showScreen("quiz"); renderQuestion();
}

function renderQuestion() {
  state.locked = false;
  const question = state.questions[state.questionIndex];
  if (state.mode === "classic") els.quizModeLabel.textContent = `Niveau ${state.level} • ${Math.ceil(state.level / 10)}★ • Objectif ${targetForLevel(state.level)}/10`;
  else if (state.mode === "challenge") {
    const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId);
    const stars = state.questions[state.questionIndex]?.difficultyStars || challengeStars(challenge);
    els.quizModeLabel.textContent = `${challenge.name} • ${stars}★ • Difficulté progressive • Objectif 7/10`;
  } else els.quizModeLabel.textContent = `${regionLabel(state.region)} • Entraînement`;
  els.quizProgressLabel.textContent = `Question ${state.questionIndex + 1} / 10`;
  els.liveScore.textContent = String(state.score); els.progressBar.style.width = `${(state.questionIndex + 1) * 10}%`;
  els.questionKicker.textContent = question.kicker; els.questionText.textContent = question.prompt;
  els.feedback.textContent = ""; els.feedback.className = "feedback";
  els.answersGrid.innerHTML = question.options.map((option, index) => `
    <button class="answer-button" type="button" data-answer="${encodeURIComponent(option)}">
      <span class="answer-index">${index + 1}</span><span class="answer-text"></span>
    </button>`).join("");
  [...els.answersGrid.querySelectorAll(".answer-button")].forEach((button, index) => { button.querySelector(".answer-text").textContent = question.options[index]; });
  document.querySelectorAll("[data-joker]").forEach((button) => { button.disabled = !state.jokers[button.dataset.joker]; });
}

function answerQuestion(selected, auto = false) {
  if (state.locked) return;
  state.locked = true;
  const question = state.questions[state.questionIndex], isCorrect = selected === question.correct;
  if (isCorrect) state.score += 1;
  if (!auto) recordContinentAnswer(question.answerIso, isCorrect);
  [...els.answersGrid.querySelectorAll(".answer-button")].forEach((button) => {
    const value = decodeURIComponent(button.dataset.answer);
    button.disabled = true;
    if (value === question.correct) button.classList.add("correct");
    else if (value === selected && !isCorrect) button.classList.add("wrong");
  });
  els.liveScore.textContent = String(state.score);
  els.feedback.textContent = auto ? "Bonne réponse validée par le joker !" : isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${question.correct}`;
  els.feedback.classList.add(isCorrect ? "good" : "bad");
  showAnswerFact(question.answerIso, () => {
    state.questionIndex += 1;
    if (state.questionIndex >= 10) finishQuiz();
    else renderQuestion();
  });
}

function useJoker(name) {
  if (state.mode === "training" || state.locked || !state.jokers[name]) return;
  state.jokers[name] = false;
  if (name === "switch") {
    const stars = state.mode === "classic"
      ? Math.ceil(state.level / 10)
      : state.questions[state.questionIndex]?.difficultyStars || challengeStars(CHALLENGE_TYPES.find((item) => item.id === state.challengeId));
    const used = new Set(state.questions.map((question, index) => index === state.questionIndex ? null : question.answerIso).filter(Boolean));
    const type = QUESTION_TYPES[Math.floor(Math.random() * QUESTION_TYPES.length)];
    state.questions[state.questionIndex] = makeQuestion(poolForStars(stars), type, used, recentQuestionIsos()); renderQuestion();
  } else if (name === "correct") answerQuestion(state.questions[state.questionIndex].correct, true);
  else if (name === "erase") {
    const question = state.questions[state.questionIndex];
    const wrongButtons = [...els.answersGrid.querySelectorAll(".answer-button")].filter((button) => decodeURIComponent(button.dataset.answer) !== question.correct);
    shuffle(wrongButtons).slice(0, 2).forEach((button) => { button.classList.add("erased"); button.disabled = true; });
    document.querySelector('[data-joker="erase"]').disabled = true;
  }
}

function saveTrainingScore() {
  const scores = storage.get("wqc-training", {}), key = `${state.region}|${state.type}`;
  scores[key] = Math.max(Number(scores[key] || 0), state.score); storage.set("wqc-training", scores);
}

function saveClassicScore() {
  const data = getClassicData(), passed = state.score >= targetForLevel(state.level);
  data.scores[state.level] = Math.max(Number(data.scores[state.level] || 0), state.score);
  if (passed && state.level < 100) data.unlocked = Math.max(data.unlocked, state.level + 1);
  if (passed && !data.rewards[state.level]) {
    state.rewardEarned = state.level * 10; data.rewards[state.level] = true; addWallet(state.rewardEarned);
  }
  storage.set("wqc-classic", data);
}

function saveChallengeScore() {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId), data = getChallengeData(), entry = data[state.challengeId];
  const passed = state.score >= 7;
  const previousBest = Math.max(0, ...Object.values(entry.scores).map(Number));
  entry.scores[20] = Math.max(Number(entry.scores[20] || 0), previousBest, state.score);
  if (passed) {
    state.rewardEarned = challengeReward(challenge); entry.rewards[20] = true; addWallet(state.rewardEarned);
  }
  storage.set("wqc-challenge", data);
}

function finishQuiz() {
  if (state.mode === "training") saveTrainingScore();
  else {
    rememberQuestions(state.questions);
    if (state.mode === "classic") saveClassicScore(); else saveChallengeScore();
  }
  renderResult(); showScreen("result");
}

function rewardSentence() {
  return state.rewardEarned ? ` Tu remportes ${state.rewardEarned} WQC.` : ` La récompense de ce ${state.mode === "challenge" ? "challenge" : "niveau"} a déjà été encaissée.`;
}

function renderResult() {
  const target = state.mode === "classic" ? targetForLevel(state.level) : 7;
  const passed = state.mode === "training" || state.score >= target;
  els.resultScore.textContent = String(state.score); els.resultRing.style.borderColor = passed ? "var(--teal)" : "var(--red)";
  if (state.mode === "classic") {
    els.resultEyebrow.textContent = `Niveau ${state.level} terminé`; els.resultTitle.textContent = passed ? "Niveau réussi !" : "Presque !";
    els.resultMessage.textContent = passed
      ? (state.level === 100 ? `Tu as terminé les 100 niveaux.${rewardSentence()}` : `Objectif atteint : ${target}/10. Le niveau suivant est débloqué.${rewardSentence()}`)
      : `Il fallait obtenir ${target}/10 pour débloquer le niveau suivant. Tu peux retenter ta chance.`;
    const nextLevel = passed && state.level < 100 ? state.level + 1 : state.level;
    els.resultActions.innerHTML = `<button class="secondary-button" type="button" data-action="open-classic">Retour</button><button class="primary-button" type="button" data-next-level="${nextLevel}">${passed ? "Niveau suivant" : "Réessayer"}</button>`;
  } else if (state.mode === "challenge") {
    const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId);
    els.resultEyebrow.textContent = `${challenge.name} terminé`; els.resultTitle.textContent = passed ? "Challenge réussi !" : "Challenge manqué";
    els.resultMessage.textContent = passed
      ? `Objectif atteint avec ${state.score}/10.${rewardSentence()}`
      : "Il fallait obtenir 7/10. Tes jokers seront de nouveau disponibles à la prochaine tentative.";
    els.resultActions.innerHTML = `<button class="secondary-button" type="button" data-action="return-challenge">Retour</button><button class="primary-button" type="button" data-action="retry-challenge">Réessayer</button>`;
  } else {
    els.resultEyebrow.textContent = "Entraînement terminé";
    els.resultTitle.textContent = state.score >= 8 ? "Excellent !" : state.score >= 5 ? "Bien joué !" : "Continue à t’entraîner !";
    els.resultMessage.textContent = `Ton meilleur score pour ce quiz est enregistré. Tu as trouvé ${state.score} bonne${state.score > 1 ? "s" : ""} réponse${state.score > 1 ? "s" : ""}.`;
    els.resultActions.innerHTML = `<button class="secondary-button" type="button" data-action="return-training">Retour</button><button class="primary-button" type="button" data-action="retry-training">Quiz suivant</button>`;
  }
}

function regionLabel(id) { return REGION_OPTIONS.find((region) => region.id === id)?.label.replace("Quizz ", "") || "Monde"; }

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"]/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[char]);
}

async function api(path, options = {}) {
  const headers = { "content-type": "application/json", ...(options.headers || {}) };
  if (state.profileToken) headers.authorization = `Bearer ${state.profileToken}`;
  const method = String(options.method || "GET").toUpperCase();
  const freshPath = method === "GET" ? `${path}${path.includes("?") ? "&" : "?"}_=${Date.now()}` : path;
  const response = await fetch(`/api/game/${freshPath}`, { ...options, headers, cache: "no-store", credentials: "same-origin" });
  let payload = {};
  try { payload = await response.json(); } catch { /* Réponse sans JSON. */ }
  if (!response.ok) {
    const error = new Error(payload.error || "Impossible de contacter WQC.");
    error.status = response.status;
    throw error;
  }
  return payload;
}

async function initProfile() {
  state.profileToken = storage.get("wqc-profile-token", null);
  if (!PROFILE_TOKEN_RE.test(String(state.profileToken || ""))) state.profileToken = null;
  if (state.profileToken) {
    try {
      await api("session", { method: "POST", body: "{}" });
      storage.remove("wqc-profile-token"); state.profileToken = null;
    } catch (error) {
      if (error.status !== 401) return;
      storage.remove("wqc-profile-token"); storage.remove("wqc-profile"); state.profileToken = null;
    }
  }
  try {
    const data = await api("me");
    state.profile = data.profile;
    storage.set("wqc-profile", state.profile);
    updateProfileUI();
    const requested = new URLSearchParams(location.search).get("duel");
    if (isDuelId(requested)) openDuelMatch(requested).catch(() => openDuelHome());
    return;
  } catch (error) {
    if (error.status !== 401) return;
    storage.remove("wqc-profile");
  }
  if (!els.profileSetupDialog.open) els.profileSetupDialog.showModal();
}

function updateProfileUI() {
  const name = state.profile?.name || "Profil";
  els.profileName.textContent = name;
  els.profileDialogName.textContent = name;
  const permission = "Notification" in window ? Notification.permission : "unsupported";
  els.notificationStatus.textContent = permission === "granted" ? "Activées" : permission === "denied" ? "Refusées" : "Non activées";
}

async function createProfile(event) {
  event.preventDefault();
  const submit = els.profileForm.querySelector('button[type="submit"]');
  submit.disabled = true; els.profileFormMessage.textContent = "Création…";
  try {
    const formData = new FormData(els.profileForm);
    const name = formData.get("name");
    const acceptedTerms = formData.get("acceptedTerms") === "on";
    const data = await api("profile", { method: "POST", body: JSON.stringify({ name, acceptedTerms }) });
    state.profileToken = null; state.profile = data.profile;
    storage.remove("wqc-profile-token"); storage.set("wqc-profile", data.profile);
    updateProfileUI(); els.profileSetupDialog.close();
  } catch (error) { els.profileFormMessage.textContent = error.message; }
  finally { submit.disabled = false; }
}

async function exportProfile() {
  try {
    const response = await fetch(`/api/game/export-profile?_=${Date.now()}`, { cache: "no-store", credentials: "same-origin" });
    if (!response.ok) {
      let payload = {};
      try { payload = await response.json(); } catch { /* Réponse sans JSON. */ }
      throw new Error(payload.error || "Impossible d’exporter les données.");
    }
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url; link.download = `wqc-donnees-${state.profile?.name || "profil"}.json`;
    document.body.append(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  } catch (error) { els.notificationStatus.textContent = error.message; }
}

function requestProfileDeletion() {
  els.profileDeleteName.textContent = state.profile?.name || "ton pseudo";
  els.profileDeleteForm.reset(); els.profileDeleteMessage.textContent = "";
  els.profileDialog.close(); els.profileDeleteDialog.showModal();
}

async function deleteProfile(event) {
  event.preventDefault();
  const submit = els.profileDeleteForm.querySelector('button[type="submit"]');
  const confirmation = new FormData(els.profileDeleteForm).get("confirmation");
  submit.disabled = true; els.profileDeleteMessage.textContent = "Suppression…";
  try {
    await api("delete-profile", { method: "POST", body: JSON.stringify({ confirmation }) });
    STORAGE_KEYS.forEach((key) => storage.remove(key));
    storage.remove("wqc-profile"); storage.remove("wqc-profile-token");
    if (state.duelPoll) { clearInterval(state.duelPoll); state.duelPoll = null; }
    state.profile = null; state.profileToken = null; state.duelMatch = null;
    els.profileDeleteDialog.close(); els.profileForm.reset();
    els.profileFormMessage.textContent = "Profil supprimé. Tu peux créer un nouveau profil si tu le souhaites.";
    updateProfileUI(); updateBalance(); showScreen("home"); els.profileSetupDialog.showModal();
  } catch (error) { els.profileDeleteMessage.textContent = error.message; }
  finally { submit.disabled = false; }
}

const DUEL_LABELS = { easy: "Facile", medium: "Moyen", hard: "Difficile", ultimate: "Ultime" };

function duelCard(match, kind) {
  if (!isDuelId(match.id)) return "";
  const score = match.isPlayer1 ? `${match.player1.score}–${match.player2.score}` : `${match.player2.score}–${match.player1.score}`;
  let actions = `<button class="secondary-button" type="button" data-open-duel="${match.id}">${kind === "complete" ? "Résultat et réponses" : "Ouvrir"}</button>`;
  if (kind === "invitation") actions = `<button class="secondary-button" type="button" data-cancel-duel="${match.id}">Supprimer</button><button class="primary-button" type="button" data-accept-duel="${match.id}">Accepter</button><button class="duel-card-safety" type="button" data-report-duel="${match.id}">Signaler / bloquer</button>`;
  if (kind === "sent") actions = `<button class="secondary-button danger-outline" type="button" data-cancel-duel="${match.id}">Supprimer la demande</button><button class="duel-card-safety" type="button" data-report-duel="${match.id}">Bloquer</button>`;
  const status = kind === "turn" ? "À toi" : kind === "waiting" ? "En attente" : kind === "sent" ? "Invitation envoyée" : kind === "invitation" ? "Invitation" : score;
  return `<article class="duel-list-card"><div><span>${escapeHTML(DUEL_LABELS[match.difficulty] || match.difficulty)} • ${status}</span><strong>${escapeHTML(match.opponentName)}</strong></div><div class="duel-card-actions">${actions}</div></article>`;
}

function duelSection(title, matches, kind, empty) {
  return `<section class="duel-list-section"><h3>${title}<span>${matches.length}</span></h3>${matches.length ? matches.map((match) => duelCard(match, kind)).join("") : `<p class="duel-empty">${empty}</p>`}</section>`;
}

function renderFriends(friends) {
  state.friends = Array.isArray(friends) ? friends : [];
  els.friendsList.innerHTML = state.friends.length ? state.friends.map((friend) => {
    if (!isDuelId(friend.id)) return "";
    return `<article class="friend-row"><strong>${escapeHTML(friend.name)}</strong><div>
      <button class="secondary-button" type="button" data-select-friend="${encodeURIComponent(friend.name)}">Défier</button>
      <button class="friend-remove" type="button" data-remove-friend="${friend.id}" aria-label="Retirer ${escapeHTML(friend.name)} de mes amis">×</button>
    </div></article>`;
  }).join("") : '<p class="duel-empty">Ajoute un pseudo pour le retrouver ici.</p>';
}

function renderRandomMatchStatus(status) {
  state.randomMatchStatus = status?.waiting ? status : null;
  els.randomDuelCancel.classList.toggle("hidden", !status?.waiting);
  els.randomDuelSubmit.textContent = status?.waiting ? "Modifier la recherche" : "Inviter un adversaire aléatoire";
  if (status?.waiting) {
    const radio = els.randomDuelForm.querySelector(`input[name="randomDifficulty"][value="${status.difficulty}"]`);
    if (radio) radio.checked = true;
    const expires = status.expiresAt ? new Date(status.expiresAt).toLocaleDateString("fr-FR") : "";
    els.randomDuelMessage.textContent = `Recherche ${DUEL_LABELS[status.difficulty] || ""} en attente${expires ? ` jusqu’au ${expires}` : ""}.`;
  } else if (!els.randomDuelMessage.textContent.includes("Adversaire trouvé")) {
    els.randomDuelMessage.textContent = "";
  }
}

async function openDuelHome() {
  if (!state.profile) { if (!els.profileSetupDialog.open) els.profileSetupDialog.showModal(); return; }
  showScreen("duel-home");
  els.duelLists.innerHTML = '<div class="loading-card">Chargement des défis…</div>';
  try {
    const [{ matches }, { friends }, randomStatus] = await Promise.all([api("matches"), api("friends"), api("random-match")]);
    const invitations = matches.filter((match) => match.status === "pending" && !match.isPlayer1);
    const sent = matches.filter((match) => match.status === "pending" && match.isPlayer1);
    const turn = matches.filter((match) => match.status === "active" && match.isTurn);
    const waiting = matches.filter((match) => match.status === "active" && !match.isTurn);
    const completed = matches.filter((match) => match.status === "complete").slice(0, 10);
    els.duelLists.innerHTML = [
      duelSection("Invitations", invitations, "invitation", "Aucune invitation reçue."),
      duelSection("Demandes envoyées", sent, "sent", "Aucune demande en attente."),
      duelSection("À toi de jouer", turn, "turn", "Aucun tour en attente."),
      duelSection("En attente", waiting, "waiting", "Aucun défi en attente."),
      duelSection("Terminés", completed, "complete", "Aucun duel terminé."),
    ].join("");
    renderFriends(friends);
    renderRandomMatchStatus(randomStatus);
  } catch (error) { els.duelLists.innerHTML = `<div class="loading-card error-card">${escapeHTML(error.message)}</div>`; }
  state.duelPoll = setInterval(() => { if (state.screen === "duel-home") openDuelHome(); }, 30000);
}

async function submitRandomDuel(event) {
  event.preventDefault();
  const data = new FormData(els.randomDuelForm);
  els.randomDuelSubmit.disabled = true; els.randomDuelMessage.textContent = "Recherche…";
  try {
    const result = await api("random-match", { method: "POST", body: JSON.stringify({ difficulty: data.get("randomDifficulty") }) });
    await openDuelHome();
    els.randomDuelMessage.textContent = result.message;
  } catch (error) { els.randomDuelMessage.textContent = error.message; }
  finally { els.randomDuelSubmit.disabled = false; }
}

async function cancelRandomDuel() {
  els.randomDuelCancel.disabled = true;
  try {
    const result = await api("random-match/cancel", { method: "POST", body: "{}" });
    await openDuelHome(); els.randomDuelMessage.textContent = result.message;
  } catch (error) { els.randomDuelMessage.textContent = error.message; }
  finally { els.randomDuelCancel.disabled = false; }
}

async function submitFriend(event) {
  event.preventDefault();
  const submit = els.friendForm.querySelector('button[type="submit"]');
  const friendName = new FormData(els.friendForm).get("friendName");
  submit.disabled = true; els.friendFormMessage.textContent = "Ajout…";
  try {
    const result = await api("friends", { method: "POST", body: JSON.stringify({ friendName }) });
    els.friendForm.reset(); await openDuelHome(); els.friendFormMessage.textContent = result.message;
  } catch (error) { els.friendFormMessage.textContent = error.message; }
  finally { submit.disabled = false; }
}

async function removeFriend(id) {
  if (!isDuelId(id)) return;
  try {
    const result = await api(`friends/${encodeURIComponent(id)}/remove`, { method: "POST", body: "{}" });
    await openDuelHome(); els.friendFormMessage.textContent = result.message;
  } catch (error) { els.friendFormMessage.textContent = error.message; }
}

async function submitDuel(event) {
  event.preventDefault();
  const data = new FormData(els.duelForm), submit = els.duelForm.querySelector('button[type="submit"]');
  submit.disabled = true; els.duelFormMessage.textContent = "Envoi…";
  try {
    const result = await api("matches", { method: "POST", body: JSON.stringify({ opponentName: data.get("opponent"), difficulty: data.get("difficulty") }) });
    els.duelFormMessage.textContent = result.message; els.duelForm.reset(); await openDuelHome();
  } catch (error) {
    if (error.status === 409 && error.message.includes("défi est déjà")) {
      const message = error.message;
      await openDuelHome();
      els.duelFormMessage.textContent = `${message} La partie existante est affichée ci-contre.`;
    } else els.duelFormMessage.textContent = error.message;
  }
  finally { submit.disabled = false; }
}

async function changeInvitation(id, action) {
  try { await api(duelApiPath(id, action), { method: "POST" }); await openDuelHome(); }
  catch (error) { els.duelLists.insertAdjacentHTML("afterbegin", `<div class="loading-card error-card">${escapeHTML(error.message)}</div>`); }
}

function duelDisplayIndex(match) { return match.questionIndex + 1; }

async function openDuelMatch(id) {
  const { match } = await api(duelApiPath(id));
  state.duelMatch = match; state.duelLocked = false; renderDuelMatch();
  if (!match.isTurn && match.status === "active") state.duelPoll = setInterval(() => { if (state.screen === "duel-game") openDuelMatch(id); }, 30000);
}

function renderDuelMatch() {
  const match = state.duelMatch;
  if (match.status === "complete") { renderDuelResult(); return; }
  showScreen("duel-game");
  const me = match.isPlayer1 ? match.player1 : match.player2;
  const opponent = match.isPlayer1 ? match.player2 : match.player1;
  els.duelContext.textContent = `${me.name} vs ${opponent.name} • ${DUEL_LABELS[match.difficulty]}`;
  els.duelPlayerScore.textContent = String(me.score); els.duelOpponentScore.textContent = String(opponent.score);
  els.duelProgress.textContent = match.status === "complete" ? "Duel terminé" : `Question ${duelDisplayIndex(match)} / 20`;
  els.duelProgressBar.style.width = `${duelDisplayIndex(match) * 5}%`;
  els.duelFeedback.textContent = ""; els.duelFeedback.className = "feedback";
  els.duelReveal.classList.add("hidden"); els.duelNext.classList.add("hidden"); els.duelAnswers.innerHTML = "";
  els.duelErase.disabled = !match.eraseAvailable || !match.isTurn || match.status !== "active";
  if (match.status === "pending") {
    els.duelKicker.textContent = "Invitation envoyée"; els.duelQuestion.textContent = `En attente de la réponse de ${opponent.name}.`; return;
  }
  if (!match.isTurn) {
    els.duelKicker.textContent = "Tour de ton adversaire"; els.duelQuestion.textContent = `${opponent.name} doit maintenant répondre. Tu recevras une notification quand ce sera à toi.`; return;
  }
  els.duelKicker.textContent = match.question.kicker; els.duelQuestion.textContent = match.question.prompt;
  els.duelAnswers.innerHTML = match.question.options.map((option, index) => `<button class="answer-button" type="button" data-duel-answer="${encodeURIComponent(option)}"><span class="answer-index">${index + 1}</span><span class="answer-text">${escapeHTML(option)}</span></button>`).join("");
}

function renderDuelResult() {
  const match = state.duelMatch;
  if (!match) return;
  const me = match.isPlayer1 ? match.player1 : match.player2;
  const opponent = match.isPlayer1 ? match.player2 : match.player1;
  const result = !match.winnerId ? "draw" : match.winnerId === me.id ? "won" : "lost";
  const labels = { won: "Gagné", lost: "Perdu", draw: "Match nul" };
  els.duelResultCard.classList.remove("won", "lost", "draw"); els.duelResultCard.classList.add(result);
  els.duelResultState.textContent = labels[result]; els.duelResultTitle.textContent = labels[result];
  els.duelFinalScore.textContent = `${me.score} – ${opponent.score}`;
  els.duelResultMessage.textContent = `${me.name} contre ${opponent.name} • ${DUEL_LABELS[match.difficulty]}`;
  els.duelResultFeedback.textContent = "";
  showScreen("duel-result");
}

function renderDuelReview() {
  const match = state.duelMatch;
  if (!match?.review?.length) { renderDuelResult(); return; }
  const me = match.isPlayer1 ? match.player1 : match.player2;
  const opponent = match.isPlayer1 ? match.player2 : match.player1;
  const item = match.review[state.duelReviewIndex];
  const myAnswer = match.isPlayer1 ? item.player1Answer : item.player2Answer;
  const opponentAnswer = match.isPlayer1 ? item.player2Answer : item.player1Answer;
  els.duelReviewContext.textContent = `${me.name} vs ${opponent.name} • Réponses`;
  els.duelReviewProgress.textContent = `Question ${state.duelReviewIndex + 1} / ${match.review.length}`;
  els.duelReviewProgressBar.style.width = `${((state.duelReviewIndex + 1) / match.review.length) * 100}%`;
  els.duelReviewPlayerScore.textContent = String(me.score); els.duelReviewOpponentScore.textContent = String(opponent.score);
  els.duelReviewKicker.textContent = item.kicker; els.duelReviewQuestion.textContent = item.prompt;
  els.duelReviewAnswers.innerHTML = item.options.map((option, index) => {
    const classes = ["answer-button", option === item.correctAnswer ? "correct" : "", option === myAnswer && option !== item.correctAnswer ? "wrong" : "", option === opponentAnswer ? "opponent-choice" : ""].filter(Boolean).join(" ");
    const badges = `${option === myAnswer ? '<small class="answer-badge mine">Toi</small>' : ""}${option === opponentAnswer ? `<small class="answer-badge opponent">${escapeHTML(opponent.name)}</small>` : ""}`;
    return `<div class="${classes}"><span class="answer-index">${index + 1}</span><span class="answer-text">${escapeHTML(option)}</span><span class="answer-badges">${badges}</span></div>`;
  }).join("");
  els.duelReviewLegend.innerHTML = `<span><i class="legend-dot correct-dot"></i>Bonne réponse : <strong>${escapeHTML(item.correctAnswer)}</strong></span><span>Ta réponse : <strong>${escapeHTML(myAnswer || "Aucune")}</strong></span><span>${escapeHTML(opponent.name)} : <strong>${escapeHTML(opponentAnswer || "Aucune")}</strong></span>`;
  els.duelReviewPrevious.disabled = state.duelReviewIndex === 0;
  els.duelReviewNext.textContent = state.duelReviewIndex === match.review.length - 1 ? "Retour au résultat" : "Suivante →";
  showScreen("duel-review");
}

async function rematchDuel() {
  if (!state.duelMatch) return;
  const button = document.querySelector('[data-action="duel-rematch"]');
  button.disabled = true; els.duelResultFeedback.textContent = "Envoi du match retour…";
  try {
    const result = await api(duelApiPath(state.duelMatch.id, "rematch"), { method: "POST" });
    await openDuelHome(); els.duelFormMessage.textContent = result.message;
  } catch (error) { els.duelResultFeedback.textContent = error.message; button.disabled = false; }
}

async function reportAndBlockDuel(event) {
  event.preventDefault();
  const matchId = state.pendingReportMatchId || state.duelMatch?.id;
  if (!matchId) return;
  const submit = els.reportBlockForm.querySelector('button[type="submit"]');
  const reason = new FormData(els.reportBlockForm).get("reason");
  submit.disabled = true; els.reportBlockMessage.textContent = "Envoi du signalement…";
  try {
    const result = await api(duelApiPath(matchId, "report-block"), { method: "POST", body: JSON.stringify({ reason }) });
    els.reportBlockDialog.close(); state.pendingReportMatchId = null; state.duelMatch = null; await openDuelHome(); els.duelFormMessage.textContent = result.message;
  } catch (error) { els.reportBlockMessage.textContent = error.message; }
  finally { submit.disabled = false; }
}

async function answerDuel(answer) {
  if (state.duelLocked || !state.duelMatch?.isTurn) return;
  state.duelLocked = true;
  [...els.duelAnswers.querySelectorAll("button")].forEach((button) => { button.disabled = true; });
  try {
    const result = await api(duelApiPath(state.duelMatch.id, "answer"), { method: "POST", body: JSON.stringify({ answer }) });
    recordContinentAnswer(state.duelMatch.question.answerIso, result.reveal.correct);
    [...els.duelAnswers.querySelectorAll("button")].forEach((button) => {
      const value = decodeURIComponent(button.dataset.duelAnswer);
      if (value === result.reveal.correctAnswer) button.classList.add("correct");
      else if (value === answer) button.classList.add("wrong");
    });
    els.duelFeedback.textContent = result.reveal.correct ? "Bonne réponse !" : `La bonne réponse était : ${result.reveal.correctAnswer}`;
    els.duelFeedback.classList.add(result.reveal.correct ? "good" : "bad");
    if (result.reveal.opponentAnswer) {
      els.duelReveal.innerHTML = `<span>Réponse de ${escapeHTML(state.duelMatch.opponentName)}</span><strong>${escapeHTML(result.reveal.opponentAnswer)}</strong>`;
      els.duelReveal.classList.remove("hidden");
    }
    const matchId = state.duelMatch.id;
    showAnswerFact(state.duelMatch.question.answerIso, () => {
      openDuelMatch(matchId).catch(() => {
        els.duelNext.textContent = result.complete ? "Voir le résultat" : "Question suivante";
        els.duelNext.classList.remove("hidden");
      });
    });
  } catch (error) { els.duelFeedback.textContent = error.message; els.duelFeedback.classList.add("bad"); state.duelLocked = false; }
}

async function nextDuelQuestion() {
  if (!state.duelMatch) return;
  if (state.duelMatch.status === "complete") { renderDuelResult(); return; }
  try { await openDuelMatch(state.duelMatch.id); } catch { await openDuelHome(); }
}

async function eraseDuel() {
  if (!state.duelMatch?.isTurn || els.duelErase.disabled) return;
  try {
    const result = await api(duelApiPath(state.duelMatch.id, "erase"), { method: "POST" });
    [...els.duelAnswers.querySelectorAll("button")].filter((button) => result.removed.includes(decodeURIComponent(button.dataset.duelAnswer))).forEach((button) => { button.disabled = true; button.classList.add("erased"); });
    els.duelErase.disabled = true; state.duelMatch.eraseAvailable = false;
  } catch (error) { els.duelFeedback.textContent = error.message; els.duelFeedback.classList.add("bad"); }
}

function urlBase64ToUint8Array(base64String) {
  const padding = "=".repeat((4 - (base64String.length % 4)) % 4);
  const raw = atob((base64String + padding).replace(/-/g, "+").replace(/_/g, "/"));
  return Uint8Array.from([...raw].map((char) => char.charCodeAt(0)));
}

async function enableNotifications() {
  try {
    if (!("serviceWorker" in navigator) || !("PushManager" in window)) throw new Error("Les notifications ne sont pas prises en charge sur cet appareil.");
    const permission = await Notification.requestPermission();
    if (permission !== "granted") throw new Error("Autorisation de notification refusée.");
    const registration = await navigator.serviceWorker.ready;
    const { publicKey } = await api("push/public-key");
    const subscription = await registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: urlBase64ToUint8Array(publicKey) });
    await api("push/subscribe", { method: "POST", body: JSON.stringify(subscription.toJSON()) });
    updateProfileUI(); document.querySelectorAll('[data-action="enable-notifications"]').forEach((button) => { button.textContent = "Notifications activées"; button.disabled = true; });
  } catch (error) { els.notificationStatus.textContent = error.message; }
}

async function showScores(tab = "classic") {
  document.querySelectorAll("[data-score-tab]").forEach((button) => button.classList.toggle("active", button.dataset.scoreTab === tab));
  if (tab === "classic") {
    const data = getClassicData(), entries = Object.entries(data.scores).sort((a, b) => Number(a[0]) - Number(b[0]));
    const passed = entries.filter(([level, score]) => Number(score) >= targetForLevel(Number(level))).length;
    const best = entries.length ? Math.max(...entries.map(([, score]) => Number(score))) : 0;
    els.scoresContent.innerHTML = `<div class="score-overview"><div class="score-stat"><span>Niveaux réussis</span><strong>${passed}/100</strong></div><div class="score-stat"><span>Meilleur résultat</span><strong>${best}/10</strong></div></div>
      ${entries.length ? `<div class="score-list">${entries.map(([level, score]) => `<div class="score-row"><span>Niveau ${level} • ${Math.ceil(Number(level) / 10)}★</span><strong>${score}/10</strong></div>`).join("")}</div>` : '<div class="score-empty">Aucun niveau joué pour le moment.</div>'}`;
  } else if (tab === "training") {
    const scores = getTrainingScores(), entries = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]));
    const best = entries.length ? Math.max(...entries.map(([, score]) => Number(score))) : 0;
    els.scoresContent.innerHTML = `<div class="score-overview"><div class="score-stat"><span>Quiz joués</span><strong>${entries.length}</strong></div><div class="score-stat"><span>Meilleur résultat</span><strong>${best}/10</strong></div></div>
      ${entries.length ? `<div class="score-list">${entries.map(([key, score]) => { const [region, typeId] = key.split("|"); const type = QUESTION_TYPES.find((item) => item.id === typeId); return `<div class="score-row"><span>${regionLabel(region)} • ${type?.label || "Quiz"}</span><strong>${score}/10</strong></div>`; }).join("")}</div>` : '<div class="score-empty">Aucun entraînement joué pour le moment.</div>'}`;
  } else if (tab === "challenge") {
    const data = getChallengeData();
    const rows = CHALLENGE_TYPES.map((challenge) => {
      const entry = data[challenge.id], scores = Object.values(entry.scores).map(Number);
      const best = scores.length ? Math.max(...scores) : 0;
      return `<div class="score-row"><span>${challenge.name} • ${challenge.cost} WQC par partie</span><strong>${best}/10</strong></div>`;
    }).join("");
    const completed = CHALLENGE_TYPES.filter((challenge) => Object.values(data[challenge.id].scores).some((score) => Number(score) >= 7)).length;
    els.scoresContent.innerHTML = `<div class="score-overview"><div class="score-stat"><span>Solde disponible</span><strong>${getWallet()} WQC</strong></div><div class="score-stat"><span>Challenges réussis</span><strong>${completed}/3</strong></div></div><div class="score-list">${rows}</div>`;
  } else {
    els.scoresContent.innerHTML = '<div class="score-empty">Chargement des statistiques de duel…</div>';
    try {
      const response = await api("stats");
      const stats = Array.isArray(response.stats) ? response.stats.map((item) => ({
        opponent: String(item?.opponent || "Adversaire").slice(0, 20),
        wins: boundedInteger(item?.wins, 0, Number.MAX_SAFE_INTEGER, 0),
        losses: boundedInteger(item?.losses, 0, Number.MAX_SAFE_INTEGER, 0),
        draws: boundedInteger(item?.draws, 0, Number.MAX_SAFE_INTEGER, 0),
        played: boundedInteger(item?.played, 0, Number.MAX_SAFE_INTEGER, 0),
      })) : [];
      const totals = stats.reduce((sum, item) => ({ wins: sum.wins + item.wins, losses: sum.losses + item.losses, draws: sum.draws + item.draws }), { wins: 0, losses: 0, draws: 0 });
      els.scoresContent.innerHTML = `<div class="score-overview duel-score-overview"><div class="score-stat"><span>Victoires</span><strong>${totals.wins}</strong></div><div class="score-stat"><span>Défaites</span><strong>${totals.losses}</strong></div><div class="score-stat"><span>Nuls</span><strong>${totals.draws}</strong></div></div>
        ${stats.length ? `<div class="score-list">${stats.map((item) => `<div class="score-row"><span>${escapeHTML(item.opponent)} • ${item.played} duel${item.played > 1 ? "s" : ""}</span><strong>${item.wins}V · ${item.losses}D · ${item.draws}N</strong></div>`).join("")}</div>` : '<div class="score-empty">Aucun duel terminé pour le moment.</div>'}`;
    } catch (error) { els.scoresContent.innerHTML = `<div class="score-empty">${escapeHTML(error.message)}</div>`; }
  }
  if (!els.scoresDialog.open) els.scoresDialog.showModal();
}

async function resetGame() {
  STORAGE_KEYS.forEach((key) => storage.remove(key));
  if (state.profileToken) { try { await api("reset-stats", { method: "POST" }); } catch { /* Le jeu local reste réinitialisé. */ } }
  state.mode = null; state.level = null; state.tier = null; state.challengeId = null; state.pendingChallengeId = null;
  updateBalance(); els.resetDialog.close(); showScreen("home");
}

function handleAction(action) {
  if (action === "home") showScreen("home");
  if (action === "open-training") { renderRegions(); showScreen("training-region"); }
  if (action === "open-classic") { renderLevels(); showScreen("classic-levels"); }
  if (action === "open-challenge") { renderChallengeTypes(); showScreen("challenge-types"); }
  if (action === "open-duel") openDuelHome();
  if (action === "profile") { updateProfileUI(); if (!els.profileDialog.open) els.profileDialog.showModal(); }
  if (action === "close-profile") els.profileDialog.close();
  if (action === "export-profile") exportProfile();
  if (action === "request-profile-deletion") requestProfileDeletion();
  if (action === "cancel-profile-deletion") { els.profileDeleteDialog.close(); if (!els.profileDialog.open) els.profileDialog.showModal(); }
  if (action === "enable-notifications") enableNotifications();
  if (action === "cancel-random-duel") cancelRandomDuel();
  if (action === "duel-next") nextDuelQuestion();
  if (action === "duel-erase") eraseDuel();
  if (action === "duel-result") renderDuelResult();
  if (action === "duel-review") { state.duelReviewIndex = 0; renderDuelReview(); }
  if (action === "duel-review-previous") { state.duelReviewIndex = Math.max(0, state.duelReviewIndex - 1); renderDuelReview(); }
  if (action === "duel-review-next") {
    if (state.duelReviewIndex >= (state.duelMatch?.review?.length || 1) - 1) renderDuelResult();
    else { state.duelReviewIndex += 1; renderDuelReview(); }
  }
  if (action === "duel-rematch") rematchDuel();
  if (action === "request-report-block") { state.pendingReportMatchId = state.duelMatch?.id || null; els.reportBlockMessage.textContent = ""; if (!els.reportBlockDialog.open) els.reportBlockDialog.showModal(); }
  if (action === "cancel-report-block") { state.pendingReportMatchId = null; els.reportBlockDialog.close(); }
  if (action === "scores") showScores("classic");
  if (action === "close-scores") els.scoresDialog.close();
  if (action === "retry-training") startTraining();
  if (action === "return-training") { renderTypes(); showScreen("training-type"); }
  if (action === "return-challenge") { renderChallengeTypes(); showScreen("challenge-types"); }
  if (action === "retry-challenge" && state.challengeId) requestChallengeEntry(state.challengeId);
  if (action === "install") installApp();
  if (action === "close-install") els.installDialog.close();
  if (action === "reset") els.resetDialog.showModal();
  if (action === "cancel-reset") els.resetDialog.close();
  if (action === "confirm-reset") void resetGame();
  if (action === "cancel-challenge-entry") { state.pendingChallengeId = null; els.challengeEntryDialog.close(); }
  if (action === "confirm-challenge-entry") confirmChallengeEntry();
  if (action === "quit-quiz") els.confirmDialog.showModal();
  if (action === "cancel-quit") els.confirmDialog.close();
  if (action === "confirm-quit") {
    els.confirmDialog.close();
    if (state.mode === "classic") { renderLevels(); showScreen("classic-levels"); }
    else if (state.mode === "challenge") { renderChallengeTypes(); showScreen("challenge-types"); }
    else { renderRegions(); showScreen("training-region"); }
  }
}

function isStandalone() { return window.matchMedia("(display-mode: standalone)").matches || window.navigator.standalone === true; }

async function installApp() {
  if (isStandalone()) return;
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt(); await deferredInstallPrompt.userChoice; deferredInstallPrompt = null; return;
  }
  if (!els.installDialog.open) els.installDialog.showModal();
}

window.addEventListener("beforeinstallprompt", (event) => { event.preventDefault(); deferredInstallPrompt = event; });
window.addEventListener("appinstalled", () => { deferredInstallPrompt = null; els.installButton.classList.add("installed"); });
if (isStandalone()) els.installButton.classList.add("installed");
if ("serviceWorker" in navigator) window.addEventListener("load", () => {
  navigator.serviceWorker.register("./service-worker.js").then((registration) => registration.update()).catch(() => {});
});

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) { handleAction(actionButton.dataset.action); return; }
  const regionButton = event.target.closest("[data-region]");
  if (regionButton) { state.region = regionButton.dataset.region; els.selectedRegionLabel.textContent = `${regionLabel(state.region)} • Entraînement`; renderTypes(); showScreen("training-type"); return; }
  const typeButton = event.target.closest("[data-type]");
  if (typeButton) { state.type = typeButton.dataset.type; startTraining(); return; }
  const levelButton = event.target.closest("[data-level]");
  if (levelButton && !levelButton.disabled) { startClassic(Number(levelButton.dataset.level)); return; }
  const challengeButton = event.target.closest("[data-challenge]");
  if (challengeButton) { requestChallengeEntry(challengeButton.dataset.challenge); return; }
  const answerButton = event.target.closest("[data-answer]");
  if (answerButton) { answerQuestion(decodeURIComponent(answerButton.dataset.answer)); return; }
  const duelAnswerButton = event.target.closest("[data-duel-answer]");
  if (duelAnswerButton) { answerDuel(decodeURIComponent(duelAnswerButton.dataset.duelAnswer)); return; }
  const openDuelButton = event.target.closest("[data-open-duel]");
  if (openDuelButton) { openDuelMatch(openDuelButton.dataset.openDuel).catch((error) => { els.duelFormMessage.textContent = error.message; }); return; }
  const acceptDuelButton = event.target.closest("[data-accept-duel]");
  if (acceptDuelButton) { changeInvitation(acceptDuelButton.dataset.acceptDuel, "accept"); return; }
  const cancelDuelButton = event.target.closest("[data-cancel-duel]");
  if (cancelDuelButton) { changeInvitation(cancelDuelButton.dataset.cancelDuel, "cancel"); return; }
  const selectFriendButton = event.target.closest("[data-select-friend]");
  if (selectFriendButton) {
    els.opponentName.value = decodeURIComponent(selectFriendButton.dataset.selectFriend);
    els.opponentName.focus();
    els.duelForm.scrollIntoView({ behavior: "smooth", block: "center" });
    return;
  }
  const removeFriendButton = event.target.closest("[data-remove-friend]");
  if (removeFriendButton) { removeFriend(removeFriendButton.dataset.removeFriend); return; }
  const reportDuelButton = event.target.closest("[data-report-duel]");
  if (reportDuelButton && isDuelId(reportDuelButton.dataset.reportDuel)) { state.pendingReportMatchId = reportDuelButton.dataset.reportDuel; els.reportBlockMessage.textContent = ""; els.reportBlockDialog.showModal(); return; }
  const jokerButton = event.target.closest("[data-joker]");
  if (jokerButton) { useJoker(jokerButton.dataset.joker); return; }
  const nextButton = event.target.closest("[data-next-level]");
  if (nextButton) { startClassic(Number(nextButton.dataset.nextLevel)); return; }
});

document.addEventListener("keydown", (event) => {
  if (state.screen !== "quiz" || state.locked) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 4) els.answersGrid.querySelectorAll(".answer-button")[index]?.click();
});

document.querySelectorAll("[data-score-tab]").forEach((button) => button.addEventListener("click", () => showScores(button.dataset.scoreTab)));
els.scoresDialog.addEventListener("click", (event) => { if (event.target === els.scoresDialog) els.scoresDialog.close(); });
els.profileForm.addEventListener("submit", createProfile);
els.profileDeleteForm.addEventListener("submit", deleteProfile);
els.reportBlockForm.addEventListener("submit", reportAndBlockDuel);
els.duelForm.addEventListener("submit", submitDuel);
els.randomDuelForm.addEventListener("submit", submitRandomDuel);
els.friendForm.addEventListener("submit", submitFriend);
els.profileSetupDialog.addEventListener("cancel", (event) => event.preventDefault());

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = (tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch { /* Brouillon non pris en charge. */ } };
  register({
    name: "start_training_quiz", title: "Démarrer un entraînement",
    description: "Démarre un quiz d’entraînement de 10 questions pour une région et un type de question.",
    inputSchema: { type: "object", properties: { region: { type: "string", enum: REGION_OPTIONS.map((r) => r.id) }, questionType: { type: "string", enum: QUESTION_TYPES.map((t) => t.id) } }, required: ["region", "questionType"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      if (!REGION_OPTIONS.some((r) => r.id === input?.region) || !QUESTION_TYPES.some((t) => t.id === input?.questionType)) throw new Error("Région ou type de question invalide.");
      state.region = input.region; state.type = input.questionType; startTraining();
      return { mode: "training", region: input.region, questionType: input.questionType, questions: 10 };
    },
  });
  register({
    name: "start_classic_level", title: "Démarrer un niveau classique", description: "Démarre l’un des niveaux classiques déjà débloqués.",
    inputSchema: { type: "object", properties: { level: { type: "integer", minimum: 1, maximum: 100 } }, required: ["level"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const level = Number(input?.level);
      if (!Number.isInteger(level) || level < 1 || level > getClassicData().unlocked) throw new Error("Ce niveau n’est pas encore débloqué.");
      startClassic(level); return { mode: "classic", level, questions: 10, target: targetForLevel(level) };
    },
  });
}

fetch("data/countries.csv")
  .then((response) => { if (!response.ok) throw new Error("CSV unavailable"); return response.text(); })
  .then((text) => {
    state.countries = normalizeCountries(parseCSV(text));
    if (state.countries.length < 190) throw new Error("Incomplete country data");
    migrateWallet(); renderRegions(); renderTypes(); renderChallengeTypes(); renderContinentProgress(); registerWebMCP();
  })
  .catch(() => els.dataError.classList.remove("hidden"));

initProfile();
