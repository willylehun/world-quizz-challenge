import { env } from "cloudflare:workers";
import { getRawDb } from "@/db";
import { generateDuelQuestions, isDuelDifficulty, type DuelQuestion } from "@/lib/duel";
import { sendGameNotification } from "@/lib/push";

export const runtime = "edge";

type Profile = { id: string; name: string; stats_reset_at: string | null; created_at: string };
type Answer = { index: number; answer: string; correct: boolean };
type MatchRow = {
  id: string; player1_id: string; player2_id: string; player1_name?: string; player2_name?: string;
  difficulty: string; status: string; phase: string; turn_player_id: string | null; question_index: number;
  questions_json: string; player1_answers_json: string; player2_answers_json: string;
  player1_erase_used: number; player2_erase_used: number; player1_score: number; player2_score: number;
  winner_id: string | null; created_at: string; updated_at: string;
};

const JSON_HEADERS = { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" };

function json(data: unknown, status = 200) {
  return new Response(JSON.stringify(data), { status, headers: JSON_HEADERS });
}

function normalizeName(value: unknown) {
  return typeof value === "string" ? value.normalize("NFKC").trim().replace(/\s+/g, " ") : "";
}

function validName(value: string) {
  return value.length >= 3 && value.length <= 20 && /^[\p{L}\p{N}_ -]+$/u.test(value);
}

function encodeBytes(bytes: Uint8Array) {
  let binary = "";
  bytes.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
}

async function hashToken(token: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(token));
  return encodeBytes(new Uint8Array(digest));
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  try { return await request.json() as Record<string, unknown>; } catch { return {}; }
}

async function authenticate(request: Request): Promise<Profile | null> {
  const header = request.headers.get("authorization") || "";
  if (!header.startsWith("Bearer ")) return null;
  const token = header.slice(7).trim();
  if (token.length < 20) return null;
  const row = await getRawDb().prepare(
    "SELECT id, name, stats_reset_at, created_at FROM profiles WHERE token_hash = ? LIMIT 1",
  ).bind(await hashToken(token)).first<Profile>();
  return row || null;
}

function pathParts(request: Request) {
  const pathname = new URL(request.url).pathname;
  const suffix = pathname.split("/api/game/")[1] || "";
  return suffix.split("/").filter(Boolean).map(decodeURIComponent);
}

function parseQuestions(row: MatchRow) { return JSON.parse(row.questions_json) as DuelQuestion[]; }
function parseAnswers(value: string) { try { return JSON.parse(value) as Answer[]; } catch { return []; } }

async function loadMatch(id: string) {
  return await getRawDb().prepare(`
    SELECT m.*, p1.name AS player1_name, p2.name AS player2_name
    FROM matches m JOIN profiles p1 ON p1.id = m.player1_id JOIN profiles p2 ON p2.id = m.player2_id
    WHERE m.id = ? LIMIT 1
  `).bind(id).first<MatchRow>();
}

function isParticipant(row: MatchRow, profile: Profile) {
  return row.player1_id === profile.id || row.player2_id === profile.id;
}

function publicMatch(row: MatchRow, profile: Profile) {
  const isPlayer1 = row.player1_id === profile.id;
  const questions = parseQuestions(row);
  const player1Answers = parseAnswers(row.player1_answers_json);
  const player2Answers = parseAnswers(row.player2_answers_json);
  const question = row.status === "active" ? questions[row.question_index] : null;
  return {
    id: row.id,
    difficulty: row.difficulty,
    status: row.status,
    phase: row.phase,
    questionIndex: row.question_index,
    totalQuestions: 20,
    isTurn: row.turn_player_id === profile.id,
    isPlayer1,
    opponentName: isPlayer1 ? row.player2_name : row.player1_name,
    player1: { id: row.player1_id, name: row.player1_name, score: row.player1_score },
    player2: { id: row.player2_id, name: row.player2_name, score: row.player2_score },
    eraseAvailable: isPlayer1 ? !row.player1_erase_used : !row.player2_erase_used,
    winnerId: row.winner_id,
    question: question ? { prompt: question.prompt, options: question.options, kicker: question.kicker, answerIso: question.answerIso, index: row.question_index } : null,
    review: row.status === "complete" ? questions.map((item, index) => ({
      index,
      prompt: item.prompt,
      options: item.options,
      kicker: item.kicker,
      correctAnswer: item.correct,
      player1Answer: player1Answers.find((answer) => answer.index === index)?.answer || null,
      player2Answer: player2Answers.find((answer) => answer.index === index)?.answer || null,
    })) : null,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

async function createProfile(request: Request) {
  const body = await readBody(request);
  const name = normalizeName(body.name);
  if (!validName(name)) return json({ error: "Choisis un pseudo de 3 à 20 caractères (lettres, chiffres, espace, _ ou -)." }, 400);
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = encodeBytes(tokenBytes);
  const now = new Date().toISOString();
  const profile: Profile = { id: crypto.randomUUID(), name, stats_reset_at: null, created_at: now };
  try {
    await getRawDb().prepare(
      "INSERT INTO profiles (id, name, name_norm, token_hash, created_at) VALUES (?, ?, ?, ?, ?)",
    ).bind(profile.id, name, name.toLocaleLowerCase("fr"), await hashToken(token), now).run();
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return json({ error: "Ce pseudo est déjà utilisé. Essaie une variante." }, 409);
    throw error;
  }
  return json({ profile: { id: profile.id, name, createdAt: now }, token }, 201);
}

async function listMatches(profile: Profile) {
  const result = await getRawDb().prepare(`
    SELECT m.*, p1.name AS player1_name, p2.name AS player2_name
    FROM matches m JOIN profiles p1 ON p1.id = m.player1_id JOIN profiles p2 ON p2.id = m.player2_id
    WHERE m.player1_id = ? OR m.player2_id = ? ORDER BY m.updated_at DESC LIMIT 100
  `).bind(profile.id, profile.id).all<MatchRow>();
  return json({ matches: (result.results || []).map((row) => publicMatch(row, profile)) });
}

async function createMatch(request: Request, profile: Profile) {
  const body = await readBody(request);
  const opponentName = normalizeName(body.opponentName);
  if (!opponentName || !isDuelDifficulty(body.difficulty)) return json({ error: "Adversaire ou difficulté invalide." }, 400);
  const opponent = await getRawDb().prepare(
    "SELECT id, name, stats_reset_at, created_at FROM profiles WHERE name_norm = ? LIMIT 1",
  ).bind(opponentName.toLocaleLowerCase("fr")).first<Profile>();
  if (!opponent) return json({ error: "Aucun profil WQC ne porte ce pseudo." }, 404);
  if (opponent.id === profile.id) return json({ error: "Tu ne peux pas te défier toi-même." }, 400);
  const duplicate = await getRawDb().prepare(`
    SELECT id FROM matches WHERE status IN ('pending','active')
    AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?)) LIMIT 1
  `).bind(profile.id, opponent.id, opponent.id, profile.id).first<{ id: string }>();
  if (duplicate) return json({ error: "Un défi est déjà en attente ou en cours avec ce joueur." }, 409);
  const id = crypto.randomUUID();
  const now = new Date().toISOString();
  const questions = generateDuelQuestions(body.difficulty);
  await getRawDb().prepare(`
    INSERT INTO matches (id, player1_id, player2_id, difficulty, status, phase, turn_player_id, question_index,
      questions_json, player1_answers_json, player2_answers_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', 'awaiting_acceptance', ?, 0, ?, '[]', '[]', ?, ?)
  `).bind(id, profile.id, opponent.id, body.difficulty, opponent.id, JSON.stringify(questions), now, now).run();
  await sendGameNotification(opponent.id, "Nouveau défi WQC", `${profile.name} t’invite à un duel.`, `/game.html?duel=${id}`);
  return json({ id, message: `Invitation envoyée à ${opponent.name}.` }, 201);
}

async function acceptMatch(id: string, profile: Profile) {
  const row = await loadMatch(id);
  if (!row || row.player2_id !== profile.id || row.status !== "pending") return json({ error: "Cette invitation n’est plus disponible." }, 409);
  const now = new Date().toISOString();
  const result = await getRawDb().prepare(`
    UPDATE matches SET status = 'active', phase = 'p1_first', turn_player_id = player1_id, question_index = 0, updated_at = ?
    WHERE id = ? AND player2_id = ? AND status = 'pending'
  `).bind(now, id, profile.id).run();
  if (!result.meta.changes) return json({ error: "Cette invitation a déjà été traitée." }, 409);
  await sendGameNotification(row.player1_id, "Défi accepté", `${profile.name} a accepté. C’est à toi de jouer !`, `/game.html?duel=${id}`);
  return json({ message: "Défi accepté." });
}

async function declineMatch(id: string, profile: Profile) {
  const now = new Date().toISOString();
  const result = await getRawDb().prepare(
    "UPDATE matches SET status = 'declined', phase = 'declined', turn_player_id = NULL, updated_at = ? WHERE id = ? AND player2_id = ? AND status = 'pending'",
  ).bind(now, id, profile.id).run();
  if (!result.meta.changes) return json({ error: "Cette invitation n’est plus disponible." }, 409);
  return json({ message: "Invitation refusée." });
}

async function cancelMatch(id: string, profile: Profile) {
  const now = new Date().toISOString();
  const result = await getRawDb().prepare(
    "UPDATE matches SET status = 'cancelled', phase = 'cancelled', turn_player_id = NULL, updated_at = ? WHERE id = ? AND status = 'pending' AND (player1_id = ? OR player2_id = ?)",
  ).bind(now, id, profile.id, profile.id).run();
  if (!result.meta.changes) return json({ error: "Cette demande n’est plus disponible." }, 409);
  return json({ message: "Demande supprimée." });
}

async function rematchMatch(id: string, profile: Profile) {
  const previous = await loadMatch(id);
  if (!previous || !isParticipant(previous, profile) || previous.status !== "complete") return json({ error: "Ce match retour n’est pas disponible." }, 409);
  const opponentId = previous.player1_id === profile.id ? previous.player2_id : previous.player1_id;
  const opponentName = previous.player1_id === profile.id ? previous.player2_name : previous.player1_name;
  const duplicate = await getRawDb().prepare(`
    SELECT id FROM matches WHERE status IN ('pending','active')
    AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?)) LIMIT 1
  `).bind(profile.id, opponentId, opponentId, profile.id).first<{ id: string }>();
  if (duplicate) return json({ error: "Un défi est déjà en attente ou en cours avec ce joueur." }, 409);
  const rematchId = crypto.randomUUID();
  const now = new Date().toISOString();
  const questions = generateDuelQuestions(previous.difficulty as Parameters<typeof generateDuelQuestions>[0]);
  await getRawDb().prepare(`
    INSERT INTO matches (id, player1_id, player2_id, difficulty, status, phase, turn_player_id, question_index,
      questions_json, player1_answers_json, player2_answers_json, created_at, updated_at)
    VALUES (?, ?, ?, ?, 'pending', 'awaiting_acceptance', ?, 0, ?, '[]', '[]', ?, ?)
  `).bind(rematchId, profile.id, opponentId, previous.difficulty, opponentId, JSON.stringify(questions), now, now).run();
  await sendGameNotification(opponentId, "Match retour WQC", `${profile.name} te propose un match retour.`, `/game.html?duel=${rematchId}`);
  return json({ id: rematchId, message: `Match retour proposé à ${opponentName}.` }, 201);
}

async function getMatch(id: string, profile: Profile) {
  const row = await loadMatch(id);
  if (!row || !isParticipant(row, profile)) return json({ error: "Défi introuvable." }, 404);
  return json({ match: publicMatch(row, profile) });
}

async function eraseMatch(id: string, profile: Profile) {
  const row = await loadMatch(id);
  if (!row || !isParticipant(row, profile)) return json({ error: "Défi introuvable." }, 404);
  if (row.status !== "active" || row.turn_player_id !== profile.id) return json({ error: "Ce n’est pas ton tour." }, 409);
  const isP1 = row.player1_id === profile.id;
  if (isP1 ? row.player1_erase_used : row.player2_erase_used) return json({ error: "Ton joker Erase a déjà été utilisé." }, 409);
  const question = parseQuestions(row)[row.question_index];
  const wrong = question.options.filter((option) => option !== question.correct).sort(() => Math.random() - 0.5).slice(0, 2);
  const column = isP1 ? "player1_erase_used" : "player2_erase_used";
  const result = await getRawDb().prepare(
    `UPDATE matches SET ${column} = 1, updated_at = ? WHERE id = ? AND turn_player_id = ? AND ${column} = 0`,
  ).bind(new Date().toISOString(), id, profile.id).run();
  if (!result.meta.changes) return json({ error: "Ton joker Erase a déjà été utilisé." }, 409);
  return json({ removed: wrong });
}

async function answerMatch(request: Request, id: string, profile: Profile) {
  const row = await loadMatch(id);
  if (!row || !isParticipant(row, profile)) return json({ error: "Défi introuvable." }, 404);
  if (row.status !== "active" || row.turn_player_id !== profile.id) return json({ error: "Ce n’est pas ton tour." }, 409);
  const body = await readBody(request);
  const questions = parseQuestions(row);
  const question = questions[row.question_index];
  const selected = typeof body.answer === "string" ? body.answer : "";
  if (!question?.options.includes(selected)) return json({ error: "Réponse invalide." }, 400);
  const isP1 = row.player1_id === profile.id;
  const myAnswers = parseAnswers(isP1 ? row.player1_answers_json : row.player2_answers_json);
  if (myAnswers.some((answer) => answer.index === row.question_index)) return json({ error: "Cette question a déjà été répondue." }, 409);
  const correct = selected === question.correct;
  myAnswers.push({ index: row.question_index, answer: selected, correct });

  let phase = row.phase;
  let nextIndex = row.question_index + 1;
  let turnPlayerId: string | null = profile.id;
  let status = "active";
  let notifyId: string | null = null;
  let notifyBody = "C’est à toi de jouer !";
  if (row.phase === "p1_first" && row.question_index === 9) {
    phase = "p2_reply_first"; nextIndex = 0; turnPlayerId = row.player2_id; notifyId = row.player2_id;
  } else if (row.phase === "p2_reply_first" && row.question_index === 9) {
    phase = "p2_first_second"; nextIndex = 10; turnPlayerId = row.player2_id;
  } else if (row.phase === "p2_first_second" && row.question_index === 19) {
    phase = "p1_reply_second"; nextIndex = 10; turnPlayerId = row.player1_id; notifyId = row.player1_id;
  } else if (row.phase === "p1_reply_second" && row.question_index === 19) {
    phase = "complete"; nextIndex = 19; turnPlayerId = null; status = "complete";
  }

  const p1Answers = isP1 ? myAnswers : parseAnswers(row.player1_answers_json);
  const p2Answers = isP1 ? parseAnswers(row.player2_answers_json) : myAnswers;
  const p1Score = p1Answers.filter((answer) => answer.correct).length;
  const p2Score = p2Answers.filter((answer) => answer.correct).length;
  const winnerId = status === "complete" ? (p1Score === p2Score ? null : p1Score > p2Score ? row.player1_id : row.player2_id) : row.winner_id;
  const answerColumn = isP1 ? "player1_answers_json" : "player2_answers_json";
  const scoreColumn = isP1 ? "player1_score" : "player2_score";
  const now = new Date().toISOString();
  const result = await getRawDb().prepare(`
    UPDATE matches SET ${answerColumn} = ?, ${scoreColumn} = ?, status = ?, phase = ?, turn_player_id = ?, question_index = ?, winner_id = ?, updated_at = ?
    WHERE id = ? AND turn_player_id = ? AND phase = ? AND question_index = ?
  `).bind(JSON.stringify(myAnswers), isP1 ? p1Score : p2Score, status, phase, turnPlayerId, nextIndex, winnerId, now, id, profile.id, row.phase, row.question_index).run();
  if (!result.meta.changes) return json({ error: "La partie vient d’être mise à jour. Recharge le défi." }, 409);

  let reveal: null | { correctAnswer: string; opponentAnswer: string | null; yourAnswer: string; correct: boolean } = null;
  if (row.phase === "p2_reply_first" || row.phase === "p1_reply_second") {
    const opponentAnswers = isP1 ? p2Answers : p1Answers;
    reveal = { correctAnswer: question.correct, opponentAnswer: opponentAnswers.find((answer) => answer.index === row.question_index)?.answer || null, yourAnswer: selected, correct };
  } else {
    reveal = { correctAnswer: question.correct, opponentAnswer: null, yourAnswer: selected, correct };
  }
  if (notifyId) await sendGameNotification(notifyId, "À ton tour sur WQC", notifyBody, `/game.html?duel=${id}`);
  if (status === "complete") {
    const resultText = p1Score === p2Score ? "Match nul !" : "Le duel est terminé.";
    await Promise.all([
      sendGameNotification(row.player1_id, "Duel WQC terminé", resultText, `/game.html?duel=${id}`),
      sendGameNotification(row.player2_id, "Duel WQC terminé", resultText, `/game.html?duel=${id}`),
    ]);
  }
  return json({ reveal, complete: status === "complete", scores: { player1: p1Score, player2: p2Score } });
}

async function stats(profile: Profile) {
  const result = await getRawDb().prepare(`
    SELECT m.*, p1.name AS player1_name, p2.name AS player2_name
    FROM matches m JOIN profiles p1 ON p1.id = m.player1_id JOIN profiles p2 ON p2.id = m.player2_id
    WHERE (m.player1_id = ? OR m.player2_id = ?) AND m.status = 'complete' AND m.updated_at >= COALESCE(?, '')
    ORDER BY m.updated_at DESC
  `).bind(profile.id, profile.id, profile.stats_reset_at).all<MatchRow>();
  const byOpponent = new Map<string, { opponent: string; wins: number; losses: number; draws: number; played: number }>();
  for (const row of result.results || []) {
    const isP1 = row.player1_id === profile.id;
    const opponent = (isP1 ? row.player2_name : row.player1_name) || "Adversaire";
    const entry = byOpponent.get(opponent) || { opponent, wins: 0, losses: 0, draws: 0, played: 0 };
    entry.played += 1;
    if (!row.winner_id) entry.draws += 1;
    else if (row.winner_id === profile.id) entry.wins += 1;
    else entry.losses += 1;
    byOpponent.set(opponent, entry);
  }
  return json({ stats: [...byOpponent.values()].sort((a, b) => b.played - a.played) });
}

async function resetStats(profile: Profile) {
  const now = new Date().toISOString();
  await getRawDb().prepare("UPDATE profiles SET stats_reset_at = ? WHERE id = ?").bind(now, profile.id).run();
  return json({ message: "Statistiques de duel réinitialisées." });
}

async function subscribePush(request: Request, profile: Profile) {
  const body = await readBody(request);
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const keys = body.keys && typeof body.keys === "object" ? body.keys as Record<string, unknown> : {};
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh : "";
  const auth = typeof keys.auth === "string" ? keys.auth : "";
  if (!endpoint.startsWith("https://") || !p256dh || !auth) return json({ error: "Abonnement de notification invalide." }, 400);
  await getRawDb().prepare(`
    INSERT INTO push_subscriptions (id, profile_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET profile_id = excluded.profile_id, p256dh = excluded.p256dh, auth = excluded.auth
  `).bind(crypto.randomUUID(), profile.id, endpoint, p256dh, auth, new Date().toISOString()).run();
  return json({ message: "Notifications activées." });
}

async function handle(request: Request) {
  try {
    const parts = pathParts(request);
    if (request.method === "POST" && parts[0] === "profile") return await createProfile(request);
    if (request.method === "GET" && parts[0] === "push" && parts[1] === "public-key") {
      return env.VAPID_SERVER_PUBLIC_KEY ? json({ publicKey: env.VAPID_SERVER_PUBLIC_KEY }) : json({ error: "Notifications non configurées." }, 503);
    }
    const profile = await authenticate(request);
    if (!profile) return json({ error: "Profil WQC non reconnu sur cet appareil." }, 401);
    if (request.method === "GET" && parts[0] === "me") return json({ profile: { id: profile.id, name: profile.name, createdAt: profile.created_at } });
    if (request.method === "GET" && parts[0] === "matches" && !parts[1]) return await listMatches(profile);
    if (request.method === "POST" && parts[0] === "matches" && !parts[1]) return await createMatch(request, profile);
    if (request.method === "GET" && parts[0] === "matches" && parts[1] && !parts[2]) return await getMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "accept") return await acceptMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "decline") return await declineMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "cancel") return await cancelMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "rematch") return await rematchMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "answer") return await answerMatch(request, parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[2] === "erase") return await eraseMatch(parts[1], profile);
    if (request.method === "GET" && parts[0] === "stats") return await stats(profile);
    if (request.method === "POST" && parts[0] === "reset-stats") return await resetStats(profile);
    if (request.method === "POST" && parts[0] === "push" && parts[1] === "subscribe") return await subscribePush(request, profile);
    return json({ error: "Route introuvable." }, 404);
  } catch (error) {
    console.error("WQC API error", error);
    return json({ error: "Une erreur serveur est survenue. Réessaie dans un instant." }, 500);
  }
}

export const GET = handle;
export const POST = handle;
