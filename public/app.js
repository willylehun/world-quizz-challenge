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
  { id: "small", name: "Petit Challenge", cost: 50, multiplier: 1, minStars: 3, maxStars: 8, code: "PETIT", hint: "Dès 3★ • gains ×1" },
  { id: "standard", name: "Challenge", cost: 100, multiplier: 2, minStars: 3, maxStars: 10, code: "CHALLENGE", hint: "Dès 3★ • gains ×2" },
  { id: "ultimate", name: "Challenge ultime", cost: 500, multiplier: 10, minStars: 5, maxStars: 10, code: "ULTIME", hint: "Dès 5★ • gains ×10" },
];

const FIELD_LABELS = {
  country: "Quel est le pays correspondant ?",
  capital: "Quelle est la capitale correspondante ?",
  leader: "Qui est le dirigeant effectif correspondant ?",
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

const STORAGE_KEYS = ["wqc-classic", "wqc-training", "wqc-challenge", "wqc-wallet", "wqc-question-history"];
const state = {
  countries: [], screen: "home", mode: null, region: null, type: null, level: null,
  challengeId: null, tier: null, pendingChallengeId: null,
  questions: [], questionIndex: 0, score: 0, locked: false, rewardEarned: 0,
  jokers: { switch: true, correct: true, erase: true },
  profile: null, profileToken: null, duelMatch: null, duelLocked: false, duelPoll: null,
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

const els = {
  screens: [...document.querySelectorAll("[data-screen]")],
  regionGrid: document.querySelector("#region-grid"), typeGrid: document.querySelector("#type-grid"),
  levelsGrid: document.querySelector("#levels-grid"), progressSummary: document.querySelector("#progress-summary"),
  challengeTypeGrid: document.querySelector("#challenge-type-grid"), challengeTiersGrid: document.querySelector("#challenge-tiers-grid"),
  challengeProgressSummary: document.querySelector("#challenge-progress-summary"), challengeRules: document.querySelector("#challenge-rules"),
  selectedChallengeLabel: document.querySelector("#selected-challenge-label"), selectedRegionLabel: document.querySelector("#selected-region-label"),
  quizModeLabel: document.querySelector("#quiz-mode-label"), quizProgressLabel: document.querySelector("#quiz-progress-label"),
  liveScore: document.querySelector("#live-score"), progressBar: document.querySelector("#progress-bar"),
  questionKicker: document.querySelector("#question-kicker"), questionText: document.querySelector("#question-text"),
  answersGrid: document.querySelector("#answers-grid"), feedback: document.querySelector("#feedback"), jokerDock: document.querySelector("#joker-dock"),
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
  notificationStatus: document.querySelector("#notification-status"), duelForm: document.querySelector("#duel-form"),
  duelFormMessage: document.querySelector("#duel-form-message"), duelLists: document.querySelector("#duel-lists"),
  duelContext: document.querySelector("#duel-context"), duelProgress: document.querySelector("#duel-progress"),
  duelProgressBar: document.querySelector("#duel-progress-bar"), duelPlayerScore: document.querySelector("#duel-player-score"),
  duelOpponentScore: document.querySelector("#duel-opponent-score"), duelKicker: document.querySelector("#duel-kicker"),
  duelQuestion: document.querySelector("#duel-question"), duelAnswers: document.querySelector("#duel-answers"),
  duelFeedback: document.querySelector("#duel-feedback"), duelReveal: document.querySelector("#duel-reveal"),
  duelNext: document.querySelector("#duel-next"), duelErase: document.querySelector("#duel-erase"),
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
  if (state.duelPoll) { clearInterval(state.duelPoll); state.duelPoll = null; }
  state.screen = name;
  els.screens.forEach((screen) => screen.classList.toggle("hidden", screen.dataset.screen !== name));
  document.querySelector("main").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getWallet() { return Math.max(0, Number(storage.get("wqc-wallet", 0)) || 0); }
function setWallet(value) { storage.set("wqc-wallet", Math.max(0, Math.round(value))); updateBalance(); }
function addWallet(value) { setWallet(getWallet() + value); }
function updateBalance() { els.balance.textContent = new Intl.NumberFormat("fr-FR").format(getWallet()); }

function targetForLevel(level) {
  if (level <= 20) return 5;
  if (level <= 50) return 6;
  return 7;
}

function getClassicData() {
  const raw = storage.get("wqc-classic", {});
  return { unlocked: Math.max(1, Number(raw.unlocked) || 1), scores: raw.scores || {}, rewards: raw.rewards || {} };
}

function getChallengeData() {
  const raw = storage.get("wqc-challenge", {}), normalized = {};
  CHALLENGE_TYPES.forEach((challenge) => {
    const entry = raw[challenge.id] || {};
    normalized[challenge.id] = {
      joined: Boolean(entry.joined), unlocked: Math.max(1, Number(entry.unlocked) || 1),
      scores: entry.scores || {}, rewards: entry.rewards || {},
    };
  });
  return normalized;
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
  const wrongPool = pool.filter((c) => c.iso !== answer.iso && valueFor(c, type.to) !== valueFor(answer, type.to));
  const wrongs = shuffle(wrongPool).slice(0, 3).map((c) => valueFor(c, type.to));
  return {
    answerIso: answer.iso, prompt: valueFor(answer, type.from), correct: valueFor(answer, type.to),
    options: shuffle([valueFor(answer, type.to), ...wrongs]), kicker: FIELD_LABELS[type.to], typeId: type.id, context: type,
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

function challengeStars(challenge, tier) {
  const progress = (tier - 1) / 19;
  return Math.min(10, Math.max(challenge.minStars, Math.round(challenge.minStars + progress * (challenge.maxStars - challenge.minStars))));
}

function generateChallengeQuestions(challenge, tier) { return generateQuestions(poolForStars(challengeStars(challenge, tier))); }
function challengeBaseReward(tier) { return tier >= 10 ? tier * 10 : tier * 5; }
function challengeReward(challenge, tier) { return challengeBaseReward(tier) * challenge.multiplier; }

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
    const joined = data[challenge.id].joined;
    return `<button class="choice-card challenge-choice" type="button" data-challenge="${challenge.id}">
      <span class="choice-code">${challenge.code}</span><strong>${challenge.name}</strong>
      <small>${challenge.hint} • ${joined ? `inscrit, palier ${data[challenge.id].unlocked}` : `${challenge.cost} WQC pour participer`}</small>
      <span class="challenge-status ${joined ? "joined" : ""}">${joined ? "Inscrit" : `${challenge.cost} WQC`}</span>
    </button>`;
  }).join("");
}

function renderChallengeTiers() {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId), data = getChallengeData()[state.challengeId];
  if (!challenge || !data?.joined) { renderChallengeTypes(); showScreen("challenge-types"); return; }
  const completed = Object.keys(data.scores).filter((tier) => Number(data.scores[tier]) >= 7).length;
  els.selectedChallengeLabel.textContent = `${challenge.name} • gains ×${challenge.multiplier}`;
  els.challengeProgressSummary.innerHTML = `<strong>${completed}/20</strong><span>paliers réussis</span>`;
  els.challengeRules.innerHTML = `<span>Objectif 7/10 • difficulté de ${challenge.minStars}★ à ${challenge.maxStars}★</span><span class="legend-stars">3 jokers par palier</span>`;
  els.challengeTiersGrid.innerHTML = Array.from({ length: 20 }, (_, index) => {
    const tier = index + 1, score = data.scores[tier], locked = tier > data.unlocked, passed = score >= 7, stars = challengeStars(challenge, tier);
    const classes = ["level-button", passed ? "completed" : "", tier === data.unlocked ? "current" : ""].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-challenge-tier="${tier}" ${locked ? "disabled" : ""} aria-label="Palier ${tier}, ${stars} étoiles, gain ${challengeReward(challenge, tier)} WQC${locked ? ", verrouillé" : ""}">
      <strong>${locked ? "" : tier}</strong><small>${locked ? '<span class="level-lock">●</span>' : `${stars}★ · ${challengeReward(challenge, tier)}◆`}</small>
    </button>`;
  }).join("");
}

function requestChallengeEntry(id) {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === id), entry = getChallengeData()[id];
  if (!challenge) return;
  state.challengeId = id;
  if (entry.joined) { renderChallengeTiers(); showScreen("challenge-tiers"); return; }
  state.pendingChallengeId = id;
  const enough = getWallet() >= challenge.cost;
  els.challengeEntryTitle.textContent = challenge.name;
  els.challengeEntryCopy.textContent = enough
    ? `L’inscription coûte ${challenge.cost} WQC. Elle est définitive et donne accès aux 20 paliers de ce défi.`
    : `Il faut ${challenge.cost} WQC pour participer. Ton solde actuel est de ${getWallet()} WQC.`;
  els.challengeEntryConfirm.disabled = !enough;
  els.challengeEntryConfirm.textContent = enough ? `Payer ${challenge.cost} WQC` : "Solde insuffisant";
  els.challengeEntryDialog.showModal();
}

function confirmChallengeEntry() {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.pendingChallengeId);
  if (!challenge || getWallet() < challenge.cost) return;
  const data = getChallengeData();
  data[challenge.id].joined = true; storage.set("wqc-challenge", data);
  setWallet(getWallet() - challenge.cost);
  state.challengeId = challenge.id; state.pendingChallengeId = null;
  els.challengeEntryDialog.close(); renderChallengeTiers(); showScreen("challenge-tiers");
}

function startTraining() {
  state.mode = "training"; state.level = null; state.challengeId = null; state.tier = null;
  state.questions = generateTrainingQuestions(); beginQuiz();
}

function startClassic(level) {
  state.mode = "classic"; state.level = level; state.challengeId = null; state.tier = null;
  state.questions = generateClassicQuestions(level); beginQuiz();
}

function startChallenge(tier) {
  const challenge = CHALLENGE_TYPES.find((item) => item.id === state.challengeId), data = getChallengeData()[state.challengeId];
  if (!challenge || !data?.joined || tier > data.unlocked) return;
  state.mode = "challenge"; state.level = null; state.tier = tier;
  state.questions = generateChallengeQuestions(challenge, tier); beginQuiz();
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
    els.quizModeLabel.textContent = `${challenge.name} • Palier ${state.tier} • ${challengeStars(challenge, state.tier)}★ • Objectif 7/10`;
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
  [...els.answersGrid.querySelectorAll(".answer-button")].forEach((button) => {
    const value = decodeURIComponent(button.dataset.answer);
    button.disabled = true;
    if (value === question.correct) button.classList.add("correct");
    else if (value === selected && !isCorrect) button.classList.add("wrong");
  });
  els.liveScore.textContent = String(state.score);
  els.feedback.textContent = auto ? "Bonne réponse validée par le joker !" : isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${question.correct}`;
  els.feedback.classList.add(isCorrect ? "good" : "bad");
  setTimeout(() => { state.questionIndex += 1; if (state.questionIndex >= 10) finishQuiz(); else renderQuestion(); }, 1050);
}

function useJoker(name) {
  if (state.mode === "training" || state.locked || !state.jokers[name]) return;
  state.jokers[name] = false;
  if (name === "switch") {
    const stars = state.mode === "classic" ? Math.ceil(state.level / 10) : challengeStars(CHALLENGE_TYPES.find((item) => item.id === state.challengeId), state.tier);
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
  entry.scores[state.tier] = Math.max(Number(entry.scores[state.tier] || 0), state.score);
  if (passed && state.tier < 20) entry.unlocked = Math.max(entry.unlocked, state.tier + 1);
  if (passed && !entry.rewards[state.tier]) {
    state.rewardEarned = challengeReward(challenge, state.tier); entry.rewards[state.tier] = true; addWallet(state.rewardEarned);
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
  return state.rewardEarned ? ` Tu remportes ${state.rewardEarned} WQC.` : " La récompense de ce niveau a déjà été encaissée.";
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
    els.resultEyebrow.textContent = `${challenge.name} • Palier ${state.tier}`; els.resultTitle.textContent = passed ? "Palier réussi !" : "Challenge manqué";
    els.resultMessage.textContent = passed
      ? `${state.score}/10 : ${state.tier === 20 ? "le dernier palier est accompli" : `le palier ${state.tier + 1} est maintenant débloqué`}.${rewardSentence()}`
      : "Il fallait obtenir 7/10. Tes jokers seront de nouveau disponibles à la prochaine tentative.";
    const nextTier = passed && state.tier < 20 ? state.tier + 1 : state.tier;
    els.resultActions.innerHTML = `<button class="secondary-button" type="button" data-action="return-challenge">Retour</button><button class="primary-button" type="button" data-next-challenge-tier="${nextTier}">${passed && state.tier < 20 ? "Palier suivant" : "Réessayer"}</button>`;
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
  const response = await fetch(`/api/game/${path}`, { ...options, headers, cache: "no-store" });
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
  if (state.profileToken) {
    try {
      const data = await api("me");
      state.profile = data.profile;
      storage.set("wqc-profile", state.profile);
      updateProfileUI();
      const requested = new URLSearchParams(location.search).get("duel");
      if (requested) openDuelMatch(requested).catch(() => openDuelHome());
      return;
    } catch (error) {
      if (error.status !== 401) return;
      storage.remove("wqc-profile-token"); storage.remove("wqc-profile"); state.profileToken = null;
    }
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
    const name = new FormData(els.profileForm).get("name");
    const data = await api("profile", { method: "POST", body: JSON.stringify({ name }) });
    state.profileToken = data.token; state.profile = data.profile;
    storage.set("wqc-profile-token", data.token); storage.set("wqc-profile", data.profile);
    updateProfileUI(); els.profileSetupDialog.close();
  } catch (error) { els.profileFormMessage.textContent = error.message; }
  finally { submit.disabled = false; }
}

const DUEL_LABELS = { easy: "Facile", medium: "Moyen", hard: "Difficile", ultimate: "Ultime" };

function duelCard(match, kind) {
  const score = match.isPlayer1 ? `${match.player1.score}–${match.player2.score}` : `${match.player2.score}–${match.player1.score}`;
  let actions = `<button class="secondary-button" type="button" data-open-duel="${match.id}">Ouvrir</button>`;
  if (kind === "invitation") actions = `<button class="secondary-button" type="button" data-decline-duel="${match.id}">Refuser</button><button class="primary-button" type="button" data-accept-duel="${match.id}">Accepter</button>`;
  const status = kind === "turn" ? "À toi" : kind === "waiting" ? "En attente" : kind === "invitation" ? "Invitation" : score;
  return `<article class="duel-list-card"><div><span>${escapeHTML(DUEL_LABELS[match.difficulty] || match.difficulty)} • ${status}</span><strong>${escapeHTML(match.opponentName)}</strong></div><div class="duel-card-actions">${actions}</div></article>`;
}

function duelSection(title, matches, kind, empty) {
  return `<section class="duel-list-section"><h3>${title}<span>${matches.length}</span></h3>${matches.length ? matches.map((match) => duelCard(match, kind)).join("") : `<p class="duel-empty">${empty}</p>`}</section>`;
}

async function openDuelHome() {
  if (!state.profile) { if (!els.profileSetupDialog.open) els.profileSetupDialog.showModal(); return; }
  showScreen("duel-home");
  els.duelLists.innerHTML = '<div class="loading-card">Chargement des défis…</div>';
  try {
    const { matches } = await api("matches");
    const invitations = matches.filter((match) => match.status === "pending" && !match.isPlayer1);
    const sent = matches.filter((match) => match.status === "pending" && match.isPlayer1);
    const turn = matches.filter((match) => match.status === "active" && match.isTurn);
    const waiting = [...sent, ...matches.filter((match) => match.status === "active" && !match.isTurn)];
    const completed = matches.filter((match) => match.status === "complete").slice(0, 10);
    els.duelLists.innerHTML = [
      duelSection("Invitations", invitations, "invitation", "Aucune invitation reçue."),
      duelSection("À toi de jouer", turn, "turn", "Aucun tour en attente."),
      duelSection("En attente", waiting, "waiting", "Aucun défi en attente."),
      duelSection("Terminés", completed, "complete", "Aucun duel terminé."),
    ].join("");
  } catch (error) { els.duelLists.innerHTML = `<div class="loading-card error-card">${escapeHTML(error.message)}</div>`; }
  state.duelPoll = setInterval(() => { if (state.screen === "duel-home") openDuelHome(); }, 30000);
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
  try { await api(`matches/${id}/${action}`, { method: "POST" }); await openDuelHome(); }
  catch (error) { els.duelLists.insertAdjacentHTML("afterbegin", `<div class="loading-card error-card">${escapeHTML(error.message)}</div>`); }
}

function duelDisplayIndex(match) { return match.questionIndex + 1; }

async function openDuelMatch(id) {
  const { match } = await api(`matches/${id}`);
  state.duelMatch = match; state.duelLocked = false; showScreen("duel-game"); renderDuelMatch();
  if (!match.isTurn && match.status === "active") state.duelPoll = setInterval(() => { if (state.screen === "duel-game") openDuelMatch(id); }, 30000);
}

function renderDuelMatch() {
  const match = state.duelMatch;
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
  if (match.status === "complete") {
    const winner = match.winnerId ? (match.winnerId === me.id ? "Tu as gagné !" : `${opponent.name} gagne ce duel.`) : "Match nul !";
    els.duelKicker.textContent = `Score final ${me.score}–${opponent.score}`; els.duelQuestion.textContent = winner;
    els.duelNext.textContent = "Retour aux défis"; els.duelNext.classList.remove("hidden"); return;
  }
  if (!match.isTurn) {
    els.duelKicker.textContent = "Tour de ton adversaire"; els.duelQuestion.textContent = `${opponent.name} doit maintenant répondre. Tu recevras une notification quand ce sera à toi.`; return;
  }
  els.duelKicker.textContent = match.question.kicker; els.duelQuestion.textContent = match.question.prompt;
  els.duelAnswers.innerHTML = match.question.options.map((option, index) => `<button class="answer-button" type="button" data-duel-answer="${encodeURIComponent(option)}"><span class="answer-index">${index + 1}</span><span class="answer-text">${escapeHTML(option)}</span></button>`).join("");
}

async function answerDuel(answer) {
  if (state.duelLocked || !state.duelMatch?.isTurn) return;
  state.duelLocked = true;
  [...els.duelAnswers.querySelectorAll("button")].forEach((button) => { button.disabled = true; });
  try {
    const result = await api(`matches/${state.duelMatch.id}/answer`, { method: "POST", body: JSON.stringify({ answer }) });
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
    els.duelNext.textContent = result.complete ? "Voir le résultat" : "Question suivante"; els.duelNext.classList.remove("hidden");
  } catch (error) { els.duelFeedback.textContent = error.message; els.duelFeedback.classList.add("bad"); state.duelLocked = false; }
}

async function nextDuelQuestion() {
  if (!state.duelMatch) return;
  if (state.duelMatch.status === "complete") { await openDuelHome(); return; }
  try { await openDuelMatch(state.duelMatch.id); } catch { await openDuelHome(); }
}

async function eraseDuel() {
  if (!state.duelMatch?.isTurn || els.duelErase.disabled) return;
  try {
    const result = await api(`matches/${state.duelMatch.id}/erase`, { method: "POST" });
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
    const scores = storage.get("wqc-training", {}), entries = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]));
    const best = entries.length ? Math.max(...entries.map(([, score]) => Number(score))) : 0;
    els.scoresContent.innerHTML = `<div class="score-overview"><div class="score-stat"><span>Quiz joués</span><strong>${entries.length}</strong></div><div class="score-stat"><span>Meilleur résultat</span><strong>${best}/10</strong></div></div>
      ${entries.length ? `<div class="score-list">${entries.map(([key, score]) => { const [region, typeId] = key.split("|"); const type = QUESTION_TYPES.find((item) => item.id === typeId); return `<div class="score-row"><span>${regionLabel(region)} • ${type?.label || "Quiz"}</span><strong>${score}/10</strong></div>`; }).join("")}</div>` : '<div class="score-empty">Aucun entraînement joué pour le moment.</div>'}`;
  } else if (tab === "challenge") {
    const data = getChallengeData();
    const rows = CHALLENGE_TYPES.map((challenge) => {
      const entry = data[challenge.id], passed = Object.values(entry.scores).filter((score) => Number(score) >= 7).length;
      return `<div class="score-row"><span>${challenge.name}${entry.joined ? "" : " • non inscrit"}</span><strong>${passed}/20</strong></div>`;
    }).join("");
    els.scoresContent.innerHTML = `<div class="score-overview"><div class="score-stat"><span>Solde disponible</span><strong>${getWallet()} WQC</strong></div><div class="score-stat"><span>Défis rejouables</span><strong>3 jokers</strong></div></div><div class="score-list">${rows}</div>`;
  } else {
    els.scoresContent.innerHTML = '<div class="score-empty">Chargement des statistiques de duel…</div>';
    try {
      const { stats } = await api("stats");
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
  if (action === "enable-notifications") enableNotifications();
  if (action === "duel-next") nextDuelQuestion();
  if (action === "duel-erase") eraseDuel();
  if (action === "scores") showScores("classic");
  if (action === "close-scores") els.scoresDialog.close();
  if (action === "retry-training") startTraining();
  if (action === "return-training") { renderTypes(); showScreen("training-type"); }
  if (action === "return-challenge") { renderChallengeTiers(); showScreen("challenge-tiers"); }
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
    else if (state.mode === "challenge") { renderChallengeTiers(); showScreen("challenge-tiers"); }
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
  const tierButton = event.target.closest("[data-challenge-tier]");
  if (tierButton && !tierButton.disabled) { startChallenge(Number(tierButton.dataset.challengeTier)); return; }
  const answerButton = event.target.closest("[data-answer]");
  if (answerButton) { answerQuestion(decodeURIComponent(answerButton.dataset.answer)); return; }
  const duelAnswerButton = event.target.closest("[data-duel-answer]");
  if (duelAnswerButton) { answerDuel(decodeURIComponent(duelAnswerButton.dataset.duelAnswer)); return; }
  const openDuelButton = event.target.closest("[data-open-duel]");
  if (openDuelButton) { openDuelMatch(openDuelButton.dataset.openDuel).catch((error) => { els.duelFormMessage.textContent = error.message; }); return; }
  const acceptDuelButton = event.target.closest("[data-accept-duel]");
  if (acceptDuelButton) { changeInvitation(acceptDuelButton.dataset.acceptDuel, "accept"); return; }
  const declineDuelButton = event.target.closest("[data-decline-duel]");
  if (declineDuelButton) { changeInvitation(declineDuelButton.dataset.declineDuel, "decline"); return; }
  const jokerButton = event.target.closest("[data-joker]");
  if (jokerButton) { useJoker(jokerButton.dataset.joker); return; }
  const nextButton = event.target.closest("[data-next-level]");
  if (nextButton) { startClassic(Number(nextButton.dataset.nextLevel)); return; }
  const nextChallengeButton = event.target.closest("[data-next-challenge-tier]");
  if (nextChallengeButton) startChallenge(Number(nextChallengeButton.dataset.nextChallengeTier));
});

document.addEventListener("keydown", (event) => {
  if (state.screen !== "quiz" || state.locked) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 4) els.answersGrid.querySelectorAll(".answer-button")[index]?.click();
});

document.querySelectorAll("[data-score-tab]").forEach((button) => button.addEventListener("click", () => showScores(button.dataset.scoreTab)));
els.scoresDialog.addEventListener("click", (event) => { if (event.target === els.scoresDialog) els.scoresDialog.close(); });
els.profileForm.addEventListener("submit", createProfile);
els.duelForm.addEventListener("submit", submitDuel);
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
    migrateWallet(); renderRegions(); renderTypes(); renderChallengeTypes(); registerWebMCP();
  })
  .catch(() => els.dataError.classList.remove("hidden"));

initProfile();
