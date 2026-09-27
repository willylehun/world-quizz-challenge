import { env } from "cloudflare:workers";
import { getRawDb } from "@/db";
import { generateDuelQuestions, isDuelDifficulty, type DuelQuestion } from "@/lib/duel";
import { isSafePushEndpoint, sendGameNotification } from "@/lib/push";

export const runtime = "edge";

type Profile = { id: string; name: string; stats_reset_at: string | null; terms_accepted_at?: string | null; created_at: string };
type AuthContext = { profile: Profile; token: string; source: "cookie" | "bearer" };
type Answer = { index: number; answer: string; correct: boolean };
type MatchRow = {
  id: string; player1_id: string; player2_id: string; player1_name?: string; player2_name?: string;
  difficulty: string; status: string; phase: string; turn_player_id: string | null; question_index: number;
  questions_json: string; player1_answers_json: string; player2_answers_json: string;
  player1_erase_used: number; player2_erase_used: number; player1_score: number; player2_score: number;
  winner_id: string | null; created_at: string; updated_at: string;
};

const MAX_JSON_BODY_BYTES = 16 * 1024;
const SESSION_COOKIE = "__Host-wqc_session";
const PROFILE_TOKEN_RE = /^[A-Za-z0-9_-]{43}$/;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const WEB_PUSH_KEY_RE = /^[A-Za-z0-9_-]+$/;
const REPORT_REASONS = new Set(["offensive_name", "harassment", "spam", "other"]);
const JSON_HEADERS = {
  "content-type": "application/json; charset=utf-8",
  "cache-control": "no-store",
  "content-security-policy": "default-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'",
  "cross-origin-resource-policy": "same-origin",
  "referrer-policy": "no-referrer",
  "x-content-type-options": "nosniff",
  "x-frame-options": "DENY",
};

class RequestError extends Error {
  constructor(public status: number, public publicMessage: string, public retryAfter?: number) {
    super(publicMessage);
    this.name = "RequestError";
  }
}

function json(data: unknown, status = 200, extraHeaders: HeadersInit = {}) {
  const headers = new Headers(JSON_HEADERS);
  new Headers(extraHeaders).forEach((value, key) => headers.set(key, value));
  return new Response(JSON.stringify(data), { status, headers });
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

function readCookie(request: Request, name: string) {
  for (const part of (request.headers.get("cookie") || "").split(";")) {
    const separator = part.indexOf("=");
    if (separator < 0 || part.slice(0, separator).trim() !== name) continue;
    return part.slice(separator + 1).trim();
  }
  return "";
}

function sessionCookie(token: string) {
  return `${SESSION_COOKIE}=${token}; Path=/; Max-Age=31536000; HttpOnly; Secure; SameSite=Strict`;
}

function expiredSessionCookie() {
  return `${SESSION_COOKIE}=; Path=/; Max-Age=0; HttpOnly; Secure; SameSite=Strict`;
}

function clientNetworkIdentity(request: Request) {
  const address = (request.headers.get("cf-connecting-ip") || "").trim();
  return address && address.length <= 64 ? address : "unavailable";
}

async function rateLimitKey(scope: string, identity: string) {
  const input = new TextEncoder().encode(`${scope}\0${identity}`);
  const secret = env.RATE_LIMIT_SECRET;
  if (secret && secret.length >= 32) {
    const key = await crypto.subtle.importKey(
      "raw",
      new TextEncoder().encode(secret),
      { name: "HMAC", hash: "SHA-256" },
      false,
      ["sign"],
    );
    return encodeBytes(new Uint8Array(await crypto.subtle.sign("HMAC", key, input)));
  }
  return encodeBytes(new Uint8Array(await crypto.subtle.digest("SHA-256", input)));
}

async function enforceRateLimit(scope: string, identity: string, limit: number, windowSeconds: number) {
  const now = Math.floor(Date.now() / 1000);
  const windowStart = Math.floor(now / windowSeconds) * windowSeconds;
  const expiresAt = windowStart + windowSeconds + 24 * 60 * 60;
  const row = await getRawDb().prepare(`
    INSERT INTO api_rate_limits (bucket_key, window_start, request_count, expires_at)
    VALUES (?, ?, 1, ?)
    ON CONFLICT(bucket_key) DO UPDATE SET
      window_start = excluded.window_start,
      request_count = CASE WHEN api_rate_limits.window_start = excluded.window_start
        THEN api_rate_limits.request_count + 1 ELSE 1 END,
      expires_at = excluded.expires_at
    RETURNING request_count
  `).bind(await rateLimitKey(scope, identity), windowStart, expiresAt).first<{ request_count: number }>();
  if (!row || row.request_count > limit) {
    throw new RequestError(429, "Trop de tentatives. Réessaie dans quelques instants.", Math.max(1, windowStart + windowSeconds - now));
  }
  const random = crypto.getRandomValues(new Uint8Array(1))[0];
  if (scope === "profile-create" || random === 0) {
    await getRawDb().prepare("DELETE FROM api_rate_limits WHERE expires_at < ?").bind(now).run();
  }
}

async function readBody(request: Request): Promise<Record<string, unknown>> {
  const contentType = request.headers.get("content-type") || "";
  if (!contentType.toLowerCase().startsWith("application/json")) {
    throw new RequestError(415, "Cette requête doit être envoyée au format JSON.");
  }
  const declaredLength = Number(request.headers.get("content-length"));
  if (Number.isFinite(declaredLength) && declaredLength > MAX_JSON_BODY_BYTES) {
    throw new RequestError(413, "La requête est trop volumineuse.");
  }
  const text = await request.text();
  if (new TextEncoder().encode(text).byteLength > MAX_JSON_BODY_BYTES) {
    throw new RequestError(413, "La requête est trop volumineuse.");
  }
  if (!text) return {};
  try {
    const value = JSON.parse(text) as unknown;
    if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error("invalid shape");
    return value as Record<string, unknown>;
  } catch {
    throw new RequestError(400, "Le contenu JSON de la requête est invalide.");
  }
}

async function authenticate(request: Request): Promise<AuthContext | null> {
  const cookieToken = readCookie(request, SESSION_COOKIE);
  const header = request.headers.get("authorization") || "";
  const bearerToken = header.startsWith("Bearer ") ? header.slice(7).trim() : "";
  const candidates = [
    { token: cookieToken, source: "cookie" as const },
    { token: bearerToken, source: "bearer" as const },
  ].filter((candidate, index, values) => PROFILE_TOKEN_RE.test(candidate.token)
    && values.findIndex((value) => value.token === candidate.token) === index);
  for (const candidate of candidates) {
    const row = await getRawDb().prepare(
      "SELECT id, name, stats_reset_at, terms_accepted_at, created_at FROM profiles WHERE token_hash = ? LIMIT 1",
    ).bind(await hashToken(candidate.token)).first<Profile>();
    if (row) return { profile: row, token: candidate.token, source: candidate.source };
  }
  return null;
}

function pathParts(request: Request) {
  const pathname = new URL(request.url).pathname;
  const suffix = pathname.split("/api/game/")[1] || "";
  try {
    return suffix.split("/").filter(Boolean).map((part) => {
      const decoded = decodeURIComponent(part);
      if (decoded.length > 128) throw new Error("path segment too long");
      return decoded;
    });
  } catch {
    throw new RequestError(400, "Chemin de requête invalide.");
  }
}

function isTrustedMutation(request: Request) {
  const expectedOrigin = new URL(request.url).origin;
  const origin = request.headers.get("origin");
  if (origin && origin !== expectedOrigin) return false;
  const fetchSite = request.headers.get("sec-fetch-site");
  return !fetchSite || fetchSite === "same-origin" || fetchSite === "none";
}

function isMatchId(value: string | undefined): value is string {
  return typeof value === "string" && UUID_RE.test(value);
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
  if (body.acceptedTerms !== true) return json({ error: "Tu dois accepter les règles d’utilisation pour créer un profil." }, 400);
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const token = encodeBytes(tokenBytes);
  const now = new Date().toISOString();
  const profile: Profile = { id: crypto.randomUUID(), name, stats_reset_at: null, terms_accepted_at: now, created_at: now };
  try {
    await getRawDb().prepare(
      "INSERT INTO profiles (id, name, name_norm, token_hash, terms_accepted_at, created_at) VALUES (?, ?, ?, ?, ?, ?)",
    ).bind(profile.id, name, name.toLocaleLowerCase("fr"), await hashToken(token), now, now).run();
  } catch (error) {
    if (String(error).toLowerCase().includes("unique")) return json({ error: "Ce pseudo est déjà utilisé. Essaie une variante." }, 409);
    throw error;
  }
  return json(
    { profile: { id: profile.id, name, createdAt: now }, token },
    201,
    { "set-cookie": sessionCookie(token) },
  );
}

async function rotateLegacySession(auth: AuthContext) {
  if (auth.source === "cookie") {
    return json({ message: "Session sécurisée active." }, 200, { "set-cookie": sessionCookie(auth.token) });
  }
  const tokenBytes = crypto.getRandomValues(new Uint8Array(32));
  const nextToken = encodeBytes(tokenBytes);
  const result = await getRawDb().prepare(
    "UPDATE profiles SET token_hash = ? WHERE id = ? AND token_hash = ?",
  ).bind(await hashToken(nextToken), auth.profile.id, await hashToken(auth.token)).run();
  if (!result.meta.changes) return json({ error: "La session doit être reconnectée." }, 401);
  return json({ message: "Session sécurisée active." }, 200, { "set-cookie": sessionCookie(nextToken) });
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
  if (!validName(opponentName) || !isDuelDifficulty(body.difficulty)) return json({ error: "Adversaire ou difficulté invalide." }, 400);
  const opponent = await getRawDb().prepare(
    "SELECT id, name, stats_reset_at, terms_accepted_at, created_at FROM profiles WHERE name_norm = ? LIMIT 1",
  ).bind(opponentName.toLocaleLowerCase("fr")).first<Profile>();
  if (!opponent) return json({ error: "Aucun profil WQC ne porte ce pseudo." }, 404);
  if (opponent.id === profile.id) return json({ error: "Tu ne peux pas te défier toi-même." }, 400);
  const blocked = await getRawDb().prepare(`
    SELECT id FROM profile_blocks
    WHERE (blocker_id = ? AND blocked_id = ?) OR (blocker_id = ? AND blocked_id = ?) LIMIT 1
  `).bind(profile.id, opponent.id, opponent.id, profile.id).first<{ id: string }>();
  if (blocked) return json({ error: "Ce joueur n’est pas disponible pour un défi." }, 403);
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
  const notifyBody = "C’est à toi de jouer !";
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

async function reportAndBlockMatch(request: Request, id: string, profile: Profile) {
  const row = await loadMatch(id);
  if (!row || !isParticipant(row, profile)) return json({ error: "Défi introuvable." }, 404);
  const body = await readBody(request);
  const reason = typeof body.reason === "string" && REPORT_REASONS.has(body.reason) ? body.reason : "other";
  const reportedId = row.player1_id === profile.id ? row.player2_id : row.player1_id;
  const now = new Date().toISOString();
  const db = getRawDb();
  await db.batch([
    db.prepare(`
      INSERT INTO profile_reports (id, reporter_id, reported_id, match_id, reason, created_at)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(crypto.randomUUID(), profile.id, reportedId, id, reason, now),
    db.prepare(`
      INSERT INTO profile_blocks (id, blocker_id, blocked_id, created_at) VALUES (?, ?, ?, ?)
      ON CONFLICT(blocker_id, blocked_id) DO NOTHING
    `).bind(crypto.randomUUID(), profile.id, reportedId, now),
    db.prepare(`
      UPDATE matches SET status = 'cancelled', phase = 'cancelled', turn_player_id = NULL, updated_at = ?
      WHERE status IN ('pending', 'active')
        AND ((player1_id = ? AND player2_id = ?) OR (player1_id = ? AND player2_id = ?))
    `).bind(now, profile.id, reportedId, reportedId, profile.id),
  ]);
  return json({ message: "Le joueur a été signalé et bloqué. Aucun nouveau défi ne sera possible entre ces profils." });
}

async function exportProfileData(profile: Profile) {
  const result = await getRawDb().prepare(`
    SELECT m.*, p1.name AS player1_name, p2.name AS player2_name
    FROM matches m JOIN profiles p1 ON p1.id = m.player1_id JOIN profiles p2 ON p2.id = m.player2_id
    WHERE m.player1_id = ? OR m.player2_id = ? ORDER BY m.created_at ASC
  `).bind(profile.id, profile.id).all<MatchRow>();
  const push = await getRawDb().prepare(
    "SELECT COUNT(*) AS count FROM push_subscriptions WHERE profile_id = ?",
  ).bind(profile.id).first<{ count: number }>();
  const reports = await getRawDb().prepare(`
    SELECT reason, match_id, created_at FROM profile_reports WHERE reporter_id = ? ORDER BY created_at ASC
  `).bind(profile.id).all<{ reason: string; match_id: string | null; created_at: string }>();
  const blocks = await getRawDb().prepare(`
    SELECT p.name AS blocked_name, b.created_at
    FROM profile_blocks b JOIN profiles p ON p.id = b.blocked_id
    WHERE b.blocker_id = ? ORDER BY b.created_at ASC
  `).bind(profile.id).all<{ blocked_name: string; created_at: string }>();
  return json({
    exportedAt: new Date().toISOString(),
    profile: {
      id: profile.id,
      name: profile.name,
      createdAt: profile.created_at,
      statsResetAt: profile.stats_reset_at,
      termsAcceptedAt: profile.terms_accepted_at || null,
    },
    notifications: { activeSubscriptions: Number(push?.count || 0) },
    reports: reports.results || [],
    blockedProfiles: blocks.results || [],
    matches: (result.results || []).map((row) => publicMatch(row, profile)),
  }, 200, {
    "content-disposition": `attachment; filename="wqc-data-${profile.id}.json"`,
  });
}

async function deleteProfile(request: Request, profile: Profile) {
  const body = await readBody(request);
  const confirmation = normalizeName(body.confirmation);
  if (confirmation !== profile.name) {
    return json({ error: "Recopie exactement ton pseudo pour confirmer la suppression." }, 400);
  }
  const db = getRawDb();
  const rateLimitScopes = ["profile-write", "match-proposal", "stats-reset", "push-subscribe", "profile-report", "profile-delete"];
  const rateLimitKeys = await Promise.all(rateLimitScopes.map((scope) => rateLimitKey(scope, profile.id)));
  const placeholders = rateLimitKeys.map(() => "?").join(", ");
  await db.batch([
    db.prepare("DELETE FROM push_subscriptions WHERE profile_id = ?").bind(profile.id),
    db.prepare("DELETE FROM profile_reports WHERE reporter_id = ? OR reported_id = ?").bind(profile.id, profile.id),
    db.prepare("DELETE FROM profile_blocks WHERE blocker_id = ? OR blocked_id = ?").bind(profile.id, profile.id),
    db.prepare("DELETE FROM matches WHERE player1_id = ? OR player2_id = ?").bind(profile.id, profile.id),
    db.prepare(`DELETE FROM api_rate_limits WHERE bucket_key IN (${placeholders})`).bind(...rateLimitKeys),
    db.prepare("DELETE FROM profiles WHERE id = ?").bind(profile.id),
  ]);
  return json(
    { message: "Ton profil WQC et toutes ses données serveur ont été supprimés." },
    200,
    { "set-cookie": expiredSessionCookie() },
  );
}

async function subscribePush(request: Request, profile: Profile) {
  const body = await readBody(request);
  const endpoint = typeof body.endpoint === "string" ? body.endpoint : "";
  const keys = body.keys && typeof body.keys === "object" ? body.keys as Record<string, unknown> : {};
  const p256dh = typeof keys.p256dh === "string" ? keys.p256dh : "";
  const auth = typeof keys.auth === "string" ? keys.auth : "";
  const validKeys = p256dh.length >= 40 && p256dh.length <= 256 && auth.length >= 16 && auth.length <= 128
    && WEB_PUSH_KEY_RE.test(p256dh) && WEB_PUSH_KEY_RE.test(auth);
  if (!isSafePushEndpoint(endpoint) || !validKeys) return json({ error: "Abonnement de notification invalide." }, 400);
  await getRawDb().prepare(`
    INSERT INTO push_subscriptions (id, profile_id, endpoint, p256dh, auth, created_at) VALUES (?, ?, ?, ?, ?, ?)
    ON CONFLICT(endpoint) DO UPDATE SET profile_id = excluded.profile_id, p256dh = excluded.p256dh, auth = excluded.auth
  `).bind(crypto.randomUUID(), profile.id, endpoint, p256dh, auth, new Date().toISOString()).run();
  return json({ message: "Notifications activées." });
}

async function handle(request: Request) {
  try {
    const parts = pathParts(request);
    if (request.method === "POST" && !isTrustedMutation(request)) return json({ error: "Origine de requête non autorisée." }, 403);
    if (request.method === "POST" && parts[0] === "profile") {
      await enforceRateLimit("profile-create", clientNetworkIdentity(request), 6, 15 * 60);
      return await createProfile(request);
    }
    if (request.method === "GET" && parts[0] === "push" && parts[1] === "public-key") {
      return env.VAPID_SERVER_PUBLIC_KEY ? json({ publicKey: env.VAPID_SERVER_PUBLIC_KEY }) : json({ error: "Notifications non configurées." }, 503);
    }
    const auth = await authenticate(request);
    if (!auth) return json({ error: "Profil WQC non reconnu sur cet appareil." }, 401);
    const profile = auth.profile;
    if (request.method === "POST") await enforceRateLimit("profile-write", profile.id, 120, 60);
    if (request.method === "POST" && parts[0] === "session") return await rotateLegacySession(auth);
    if (request.method === "GET" && parts[0] === "me") return json({ profile: { id: profile.id, name: profile.name, createdAt: profile.created_at } });
    if (request.method === "GET" && parts[0] === "matches" && !parts[1]) return await listMatches(profile);
    if (request.method === "POST" && parts[0] === "matches" && !parts[1]) {
      await enforceRateLimit("match-proposal", profile.id, 20, 60 * 60);
      return await createMatch(request, profile);
    }
    if (parts[0] === "matches" && parts[1] && !isMatchId(parts[1])) return json({ error: "Défi introuvable." }, 404);
    if (request.method === "GET" && parts[0] === "matches" && parts[1] && !parts[2]) return await getMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "accept") return await acceptMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "decline") return await declineMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "cancel") return await cancelMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "rematch") {
      await enforceRateLimit("match-proposal", profile.id, 20, 60 * 60);
      return await rematchMatch(parts[1], profile);
    }
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "answer") return await answerMatch(request, parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "erase") return await eraseMatch(parts[1], profile);
    if (request.method === "POST" && parts[0] === "matches" && parts[1] && parts[2] === "report-block") {
      await enforceRateLimit("profile-report", profile.id, 10, 24 * 60 * 60);
      return await reportAndBlockMatch(request, parts[1], profile);
    }
    if (request.method === "GET" && parts[0] === "stats") return await stats(profile);
    if (request.method === "GET" && parts[0] === "export-profile") return await exportProfileData(profile);
    if (request.method === "POST" && parts[0] === "reset-stats") {
      await enforceRateLimit("stats-reset", profile.id, 5, 60 * 60);
      return await resetStats(profile);
    }
    if (request.method === "POST" && parts[0] === "delete-profile") {
      await enforceRateLimit("profile-delete", profile.id, 3, 60 * 60);
      return await deleteProfile(request, profile);
    }
    if (request.method === "POST" && parts[0] === "push" && parts[1] === "subscribe") {
      await enforceRateLimit("push-subscribe", profile.id, 10, 60 * 60);
      return await subscribePush(request, profile);
    }
    return json({ error: "Route introuvable." }, 404);
  } catch (error) {
    if (error instanceof RequestError) {
      return json(
        { error: error.publicMessage },
        error.status,
        error.retryAfter ? { "retry-after": String(error.retryAfter) } : {},
      );
    }
    console.error("WQC API error", error instanceof Error ? error.name : "UnknownError");
    return json({ error: "Une erreur serveur est survenue. Réessaie dans un instant." }, 500);
  }
}

export const GET = handle;
export const POST = handle;
