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
  { id: "country-leader", label: "Trouver le chef d’État", hint: "Le pays est donné", from: "country", to: "leader" },
  { id: "capital-country", label: "Trouver le pays", hint: "La capitale est donnée", from: "capital", to: "country" },
  { id: "capital-leader", label: "Trouver le chef d’État", hint: "La capitale est donnée", from: "capital", to: "leader" },
  { id: "leader-country", label: "Trouver le pays", hint: "Le chef d’État est donné", from: "leader", to: "country" },
  { id: "leader-capital", label: "Trouver la capitale", hint: "Le chef d’État est donné", from: "leader", to: "capital" },
];

const FIELD_LABELS = {
  country: "Quel est le pays correspondant ?",
  capital: "Quelle est la capitale correspondante ?",
  leader: "Qui est le chef d’État correspondant ?",
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

const state = {
  countries: [],
  screen: "home",
  mode: null,
  region: null,
  type: null,
  level: null,
  questions: [],
  questionIndex: 0,
  score: 0,
  locked: false,
  jokers: { switch: true, correct: true, erase: true },
};

const storage = {
  get(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key)) ?? fallback; } catch { return fallback; }
  },
  set(key, value) {
    try { localStorage.setItem(key, JSON.stringify(value)); } catch { /* Private browsing may block storage. */ }
  },
};

const els = {
  screens: [...document.querySelectorAll("[data-screen]")],
  regionGrid: document.querySelector("#region-grid"),
  typeGrid: document.querySelector("#type-grid"),
  levelsGrid: document.querySelector("#levels-grid"),
  progressSummary: document.querySelector("#progress-summary"),
  selectedRegionLabel: document.querySelector("#selected-region-label"),
  quizModeLabel: document.querySelector("#quiz-mode-label"),
  quizProgressLabel: document.querySelector("#quiz-progress-label"),
  liveScore: document.querySelector("#live-score"),
  progressBar: document.querySelector("#progress-bar"),
  questionKicker: document.querySelector("#question-kicker"),
  questionText: document.querySelector("#question-text"),
  answersGrid: document.querySelector("#answers-grid"),
  feedback: document.querySelector("#feedback"),
  jokerDock: document.querySelector("#joker-dock"),
  resultScore: document.querySelector("#result-score"),
  resultEyebrow: document.querySelector("#result-eyebrow"),
  resultTitle: document.querySelector("#result-title"),
  resultMessage: document.querySelector("#result-message"),
  resultActions: document.querySelector("#result-actions"),
  scoresDialog: document.querySelector("#scores-dialog"),
  confirmDialog: document.querySelector("#confirm-dialog"),
  scoresContent: document.querySelector("#scores-content"),
  dataError: document.querySelector("#data-error"),
};

function parseCSV(text) {
  const rows = [];
  let row = [], field = "", quoted = false;
  const clean = text.replace(/^\uFEFF/, "");
  for (let i = 0; i < clean.length; i += 1) {
    const char = clean[i];
    const next = clean[i + 1];
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
  state.screen = name;
  els.screens.forEach((screen) => screen.classList.toggle("hidden", screen.dataset.screen !== name));
  document.querySelector("main").focus({ preventScroll: true });
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function getRegionCountries(region) {
  if (region === "international") return state.countries;
  if (region === "Amerique") return state.countries.filter((c) => c.continent.startsWith("Amérique"));
  return state.countries.filter((c) => c.continent === region);
}

function valueFor(country, field) {
  return field === "country"
    ? country.country
    : field === "capital"
      ? country.capital
      : `${country.leader} — ${country.role}`;
}

function makeQuestion(pool, type, usedIso = new Set()) {
  const available = pool.filter((c) => !usedIso.has(c.iso));
  const source = available.length >= 4 ? available : pool;
  const answer = source[Math.floor(Math.random() * source.length)];
  const wrongPool = pool.filter((c) => c.iso !== answer.iso && valueFor(c, type.to) !== valueFor(answer, type.to));
  const wrongs = shuffle(wrongPool).slice(0, 3).map((c) => valueFor(c, type.to));
  return {
    answerIso: answer.iso,
    prompt: valueFor(answer, type.from),
    correct: valueFor(answer, type.to),
    options: shuffle([valueFor(answer, type.to), ...wrongs]),
    kicker: FIELD_LABELS[type.to],
    context: type,
  };
}

function generateTrainingQuestions() {
  const pool = getRegionCountries(state.region);
  const type = QUESTION_TYPES.find((t) => t.id === state.type);
  const used = new Set();
  return Array.from({ length: 10 }, () => {
    const q = makeQuestion(pool, type, used);
    used.add(q.answerIso);
    return q;
  });
}

function countryDifficulty(country) {
  const index = EASY_RANK.indexOf(country.iso);
  if (index < 0) return 10;
  return Math.min(10, Math.floor(index / 20) + 1);
}

function typesForStars(stars) {
  if (stars <= 2) return QUESTION_TYPES.filter((t) => !t.id.includes("leader"));
  if (stars <= 4) return QUESTION_TYPES.filter((t) => t.from !== "leader");
  return QUESTION_TYPES;
}

function generateClassicQuestions(level) {
  const stars = Math.ceil(level / 10);
  const minDifficulty = Math.max(1, stars - 1);
  let pool = state.countries.filter((c) => {
    const d = countryDifficulty(c);
    return d >= minDifficulty && d <= stars;
  });
  if (pool.length < 12) pool = state.countries.filter((c) => countryDifficulty(c) <= stars);
  const types = typesForStars(stars);
  const used = new Set();
  return Array.from({ length: 10 }, (_, index) => {
    const type = types[(index + Math.floor(Math.random() * types.length)) % types.length];
    const q = makeQuestion(pool, type, used);
    used.add(q.answerIso);
    return q;
  });
}

function renderRegions() {
  els.regionGrid.innerHTML = REGION_OPTIONS.map((region) => `
    <button class="choice-card" type="button" data-region="${region.id}">
      <span class="choice-code">${region.code}</span>
      <strong>${region.label}</strong>
      <small>${region.hint}</small>
    </button>`).join("");
}

function renderTypes() {
  els.typeGrid.innerHTML = QUESTION_TYPES.map((type, index) => `
    <button class="choice-card" type="button" data-type="${type.id}">
      <span class="choice-code">0${index + 1}</span>
      <strong>${type.label}</strong>
      <small>${type.hint}</small>
    </button>`).join("");
}

function getClassicData() {
  return storage.get("wqc-classic", { unlocked: 1, scores: {} });
}

function renderLevels() {
  const data = getClassicData();
  const completed = Object.keys(data.scores).filter((key) => Number(data.scores[key]) >= targetForLevel(Number(key))).length;
  els.progressSummary.innerHTML = `<strong>${completed}/100</strong><span>niveaux réussis</span>`;
  els.levelsGrid.innerHTML = Array.from({ length: 100 }, (_, i) => {
    const level = i + 1;
    const stars = Math.ceil(level / 10);
    const score = data.scores[level];
    const locked = level > data.unlocked;
    const passed = score >= targetForLevel(level);
    const classes = ["level-button", passed ? "completed" : "", level === data.unlocked ? "current" : ""].filter(Boolean).join(" ");
    return `<button class="${classes}" type="button" data-level="${level}" ${locked ? "disabled" : ""} aria-label="Niveau ${level}, difficulté ${stars} étoile${stars > 1 ? "s" : ""}${locked ? ", verrouillé" : ""}">
      <strong>${locked ? "" : level}</strong>
      <small>${locked ? `<span class="level-lock">●</span>` : "★".repeat(stars)}</small>
    </button>`;
  }).join("");
}

function targetForLevel(level) {
  if (level <= 20) return 5;
  if (level <= 50) return 6;
  return 7;
}

function startTraining() {
  state.mode = "training";
  state.level = null;
  state.questions = generateTrainingQuestions();
  beginQuiz();
}

function startClassic(level) {
  state.mode = "classic";
  state.level = level;
  state.questions = generateClassicQuestions(level);
  state.jokers = { switch: true, correct: true, erase: true };
  beginQuiz();
}

function beginQuiz() {
  state.questionIndex = 0;
  state.score = 0;
  state.locked = false;
  els.jokerDock.classList.toggle("hidden", state.mode !== "classic");
  showScreen("quiz");
  renderQuestion();
}

function renderQuestion() {
  state.locked = false;
  const q = state.questions[state.questionIndex];
  els.quizModeLabel.textContent = state.mode === "classic"
    ? `Niveau ${state.level} • ${Math.ceil(state.level / 10)}★ • Objectif ${targetForLevel(state.level)}/10`
    : `${regionLabel(state.region)} • Entraînement`;
  els.quizProgressLabel.textContent = `Question ${state.questionIndex + 1} / 10`;
  els.liveScore.textContent = String(state.score);
  els.progressBar.style.width = `${(state.questionIndex + 1) * 10}%`;
  els.questionKicker.textContent = q.kicker;
  els.questionText.textContent = q.prompt;
  els.feedback.textContent = "";
  els.feedback.className = "feedback";
  els.answersGrid.innerHTML = q.options.map((option, index) => `
    <button class="answer-button" type="button" data-answer="${encodeURIComponent(option)}">
      <span class="answer-index">${index + 1}</span><span class="answer-text"></span>
    </button>`).join("");
  [...els.answersGrid.querySelectorAll(".answer-button")].forEach((button, index) => {
    button.querySelector(".answer-text").textContent = q.options[index];
  });
  document.querySelectorAll("[data-joker]").forEach((button) => {
    button.disabled = !state.jokers[button.dataset.joker];
  });
}

function answerQuestion(selected, auto = false) {
  if (state.locked) return;
  state.locked = true;
  const q = state.questions[state.questionIndex];
  const isCorrect = selected === q.correct;
  if (isCorrect) state.score += 1;
  [...els.answersGrid.querySelectorAll(".answer-button")].forEach((button) => {
    const value = decodeURIComponent(button.dataset.answer);
    button.disabled = true;
    if (value === q.correct) button.classList.add("correct");
    else if (value === selected && !isCorrect) button.classList.add("wrong");
  });
  els.liveScore.textContent = String(state.score);
  els.feedback.textContent = auto ? "Bonne réponse validée par le joker !" : isCorrect ? "Bonne réponse !" : `La bonne réponse était : ${q.correct}`;
  els.feedback.classList.add(isCorrect ? "good" : "bad");
  setTimeout(() => {
    state.questionIndex += 1;
    if (state.questionIndex >= 10) finishQuiz();
    else renderQuestion();
  }, 1050);
}

function useJoker(name) {
  if (state.mode !== "classic" || state.locked || !state.jokers[name]) return;
  state.jokers[name] = false;
  if (name === "switch") {
    const stars = Math.ceil(state.level / 10);
    const pool = state.countries.filter((c) => countryDifficulty(c) <= Math.min(10, stars + 1));
    const types = typesForStars(stars);
    const type = types[Math.floor(Math.random() * types.length)];
    state.questions[state.questionIndex] = makeQuestion(pool, type);
    renderQuestion();
  } else if (name === "correct") {
    answerQuestion(state.questions[state.questionIndex].correct, true);
  } else if (name === "erase") {
    const q = state.questions[state.questionIndex];
    const wrongButtons = [...els.answersGrid.querySelectorAll(".answer-button")]
      .filter((button) => decodeURIComponent(button.dataset.answer) !== q.correct);
    shuffle(wrongButtons).slice(0, 2).forEach((button) => {
      button.classList.add("erased");
      button.disabled = true;
    });
    document.querySelector('[data-joker="erase"]').disabled = true;
  }
}

function finishQuiz() {
  if (state.mode === "training") saveTrainingScore();
  else saveClassicScore();
  renderResult();
  showScreen("result");
}

function saveTrainingScore() {
  const scores = storage.get("wqc-training", {});
  const key = `${state.region}|${state.type}`;
  scores[key] = Math.max(Number(scores[key] || 0), state.score);
  storage.set("wqc-training", scores);
}

function saveClassicScore() {
  const data = getClassicData();
  data.scores[state.level] = Math.max(Number(data.scores[state.level] || 0), state.score);
  if (state.score >= targetForLevel(state.level) && state.level < 100) {
    data.unlocked = Math.max(data.unlocked, state.level + 1);
  }
  storage.set("wqc-classic", data);
}

function renderResult() {
  const passed = state.mode === "training" || state.score >= targetForLevel(state.level);
  els.resultScore.textContent = String(state.score);
  els.resultRing.style.borderColor = passed ? "var(--teal)" : "var(--red)";
  els.resultEyebrow.textContent = state.mode === "classic" ? `Niveau ${state.level} terminé` : "Entraînement terminé";
  if (state.mode === "classic") {
    const target = targetForLevel(state.level);
    els.resultTitle.textContent = passed ? "Niveau réussi !" : "Presque !";
    els.resultMessage.textContent = passed
      ? state.level === 100 ? "Tu as terminé les 100 niveaux de World Quizz Challenge." : `Objectif atteint : ${target}/10. Le niveau suivant est maintenant débloqué.`
      : `Il fallait obtenir ${target}/10 pour débloquer le niveau suivant. Tu peux retenter ta chance.`;
    els.resultActions.innerHTML = `
      ${passed && state.level < 100 ? `<button class="primary-button" type="button" data-next-level="${state.level + 1}">Niveau suivant</button>` : `<button class="primary-button" type="button" data-retry-level="${state.level}">Rejouer</button>`}
      <button class="secondary-button" type="button" data-action="open-classic">Voir les niveaux</button>`;
  } else {
    els.resultTitle.textContent = state.score >= 8 ? "Excellent !" : state.score >= 5 ? "Bien joué !" : "Continue à t’entraîner !";
    els.resultMessage.textContent = `Ton meilleur score pour ce quiz est enregistré. Tu as trouvé ${state.score} bonne${state.score > 1 ? "s" : ""} réponse${state.score > 1 ? "s" : ""}.`;
    els.resultActions.innerHTML = `
      <button class="primary-button" type="button" data-action="retry-training">Rejouer</button>
      <button class="secondary-button" type="button" data-action="open-training">Changer de quiz</button>`;
  }
}

function regionLabel(id) {
  return REGION_OPTIONS.find((r) => r.id === id)?.label.replace("Quizz ", "") || "Monde";
}

function showScores(tab = "classic") {
  document.querySelectorAll("[data-score-tab]").forEach((button) => button.classList.toggle("active", button.dataset.scoreTab === tab));
  if (tab === "classic") {
    const data = getClassicData();
    const entries = Object.entries(data.scores).sort((a, b) => Number(a[0]) - Number(b[0]));
    const passed = entries.filter(([level, score]) => Number(score) >= targetForLevel(Number(level))).length;
    const best = entries.length ? Math.max(...entries.map(([, score]) => Number(score))) : 0;
    els.scoresContent.innerHTML = `
      <div class="score-overview"><div class="score-stat"><span>Niveaux réussis</span><strong>${passed}/100</strong></div><div class="score-stat"><span>Meilleur résultat</span><strong>${best}/10</strong></div></div>
      ${entries.length ? `<div class="score-list">${entries.map(([level, score]) => `<div class="score-row"><span>Niveau ${level} • ${Math.ceil(Number(level) / 10)}★</span><strong>${score}/10</strong></div>`).join("")}</div>` : `<div class="score-empty">Aucun niveau joué pour le moment.</div>`}`;
  } else {
    const scores = storage.get("wqc-training", {});
    const entries = Object.entries(scores).sort((a, b) => Number(b[1]) - Number(a[1]));
    const best = entries.length ? Math.max(...entries.map(([, score]) => Number(score))) : 0;
    els.scoresContent.innerHTML = `
      <div class="score-overview"><div class="score-stat"><span>Quiz joués</span><strong>${entries.length}</strong></div><div class="score-stat"><span>Meilleur résultat</span><strong>${best}/10</strong></div></div>
      ${entries.length ? `<div class="score-list">${entries.map(([key, score]) => { const [region, typeId] = key.split("|"); const type = QUESTION_TYPES.find((t) => t.id === typeId); return `<div class="score-row"><span>${regionLabel(region)} • ${type?.label || "Quiz"}</span><strong>${score}/10</strong></div>`; }).join("")}</div>` : `<div class="score-empty">Aucun entraînement joué pour le moment.</div>`}`;
  }
  if (!els.scoresDialog.open) els.scoresDialog.showModal();
}

function handleAction(action) {
  if (action === "home") showScreen("home");
  if (action === "open-training") { renderRegions(); showScreen("training-region"); }
  if (action === "open-classic") { renderLevels(); showScreen("classic-levels"); }
  if (action === "scores") showScores("classic");
  if (action === "close-scores") els.scoresDialog.close();
  if (action === "retry-training") startTraining();
  if (action === "quit-quiz") els.confirmDialog.showModal();
  if (action === "cancel-quit") els.confirmDialog.close();
  if (action === "confirm-quit") { els.confirmDialog.close(); state.mode === "classic" ? (renderLevels(), showScreen("classic-levels")) : (renderRegions(), showScreen("training-region")); }
}

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (actionButton) { handleAction(actionButton.dataset.action); return; }
  const regionButton = event.target.closest("[data-region]");
  if (regionButton) {
    state.region = regionButton.dataset.region;
    els.selectedRegionLabel.textContent = `${regionLabel(state.region)} • Entraînement`;
    renderTypes(); showScreen("training-type"); return;
  }
  const typeButton = event.target.closest("[data-type]");
  if (typeButton) { state.type = typeButton.dataset.type; startTraining(); return; }
  const levelButton = event.target.closest("[data-level]");
  if (levelButton && !levelButton.disabled) { startClassic(Number(levelButton.dataset.level)); return; }
  const answerButton = event.target.closest("[data-answer]");
  if (answerButton) { answerQuestion(decodeURIComponent(answerButton.dataset.answer)); return; }
  const jokerButton = event.target.closest("[data-joker]");
  if (jokerButton) { useJoker(jokerButton.dataset.joker); return; }
  const nextButton = event.target.closest("[data-next-level]");
  if (nextButton) { startClassic(Number(nextButton.dataset.nextLevel)); return; }
  const retryButton = event.target.closest("[data-retry-level]");
  if (retryButton) { startClassic(Number(retryButton.dataset.retryLevel)); }
});

document.addEventListener("keydown", (event) => {
  if (state.screen !== "quiz" || state.locked) return;
  const index = Number(event.key) - 1;
  if (index >= 0 && index < 4) els.answersGrid.querySelectorAll(".answer-button")[index]?.click();
});

document.querySelectorAll("[data-score-tab]").forEach((button) => {
  button.addEventListener("click", () => showScores(button.dataset.scoreTab));
});

els.scoresDialog.addEventListener("click", (event) => {
  if (event.target === els.scoresDialog) els.scoresDialog.close();
});

function registerWebMCP() {
  const context = document.modelContext;
  if (!context?.registerTool) return;
  const register = (tool) => { try { void Promise.resolve(context.registerTool(tool)).catch(() => {}); } catch { /* Unsupported draft implementation. */ } };
  register({
    name: "start_training_quiz",
    title: "Démarrer un entraînement",
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
    name: "start_classic_level",
    title: "Démarrer un niveau classique",
    description: "Démarre l’un des niveaux classiques déjà débloqués.",
    inputSchema: { type: "object", properties: { level: { type: "integer", minimum: 1, maximum: 100 } }, required: ["level"], additionalProperties: false },
    annotations: { readOnlyHint: false, untrustedContentHint: false },
    execute(input) {
      const level = Number(input?.level);
      if (!Number.isInteger(level) || level < 1 || level > getClassicData().unlocked) throw new Error("Ce niveau n’est pas encore débloqué.");
      startClassic(level);
      return { mode: "classic", level, questions: 10, target: targetForLevel(level) };
    },
  });
}

fetch("data/countries.csv")
  .then((response) => { if (!response.ok) throw new Error("CSV unavailable"); return response.text(); })
  .then((text) => {
    state.countries = normalizeCountries(parseCSV(text));
    if (state.countries.length < 190) throw new Error("Incomplete country data");
    renderRegions(); renderTypes(); registerWebMCP();
  })
  .catch(() => els.dataError.classList.remove("hidden"));
