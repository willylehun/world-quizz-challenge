import { COUNTRIES } from "@/lib/countries.generated";

export type DuelDifficulty = "easy" | "medium" | "hard" | "ultimate";
export type DuelQuestion = {
  prompt: string;
  correct: string;
  options: string[];
  kicker: string;
  answerIso: string;
  difficulty: DuelDifficulty;
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
  "KM","ST","MR","DM","GD","LC","VC","AG","KN","PW","FM","MH","KI","NR","TV","SM",
] as const;

const QUESTION_TYPES = [
  { from: "country", to: "capital" }, { from: "capital", to: "country" },
  { from: "country", to: "leader" }, { from: "capital", to: "leader" },
  { from: "leader", to: "country" }, { from: "leader", to: "capital" },
] as const;

const LABELS = {
  country: "Quel est le pays correspondant ?",
  capital: "Quelle est la capitale correspondante ?",
  leader: "Qui est le dirigeant effectif correspondant ?",
} as const;

const CAPITAL_TRAPS: Record<string, string[]> = {
  ES: ["Rome", "Barcelone", "Séville"],
  CI: ["Abidjan", "Bouaké", "Accra"],
  ZA: ["Le Cap", "Bloemfontein", "Johannesburg"],
  TZ: ["Dar es Salaam", "Arusha", "Mwanza"],
  NG: ["Lagos", "Kano", "Ibadan"],
  TR: ["Istanbul", "Izmir", "Antalya"],
  BR: ["Rio de Janeiro", "São Paulo", "Salvador"],
  AU: ["Sydney", "Melbourne", "Brisbane"],
  CA: ["Toronto", "Montréal", "Vancouver"],
  US: ["New York", "Los Angeles", "Chicago"],
  MA: ["Casablanca", "Marrakech", "Fès"],
  CH: ["Zurich", "Genève", "Bâle"],
  LK: ["Colombo", "Kandy", "Galle"],
  NZ: ["Auckland", "Christchurch", "Hamilton"],
  AE: ["Dubaï", "Charjah", "Al-Aïn"],
};

function shuffle<T>(items: readonly T[]): T[] {
  const copy = [...items];
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

function valueFor(country: (typeof COUNTRIES)[number], field: "country" | "capital" | "leader") {
  if (field === "country") return country.country;
  if (field === "capital") return country.capital;
  return `${country.leader} — ${country.role}`;
}

function rangeForDifficulty(difficulty: DuelDifficulty): [number, number] {
  if (difficulty === "easy") return [0, 40];
  if (difficulty === "medium") return [35, 100];
  if (difficulty === "hard") return [90, 160];
  return [135, EASY_RANK.length];
}

function poolForDifficulty(difficulty: DuelDifficulty) {
  const [start, end] = rangeForDifficulty(difficulty);
  const allowed = new Set(EASY_RANK.slice(start, end));
  const pool = COUNTRIES.filter((country) => allowed.has(country.iso as (typeof EASY_RANK)[number]));
  return pool.length >= 20 ? pool : [...COUNTRIES];
}

function plausibleWrongs(country: (typeof COUNTRIES)[number], to: "country" | "capital" | "leader", pool: typeof COUNTRIES) {
  const sameContinent = pool.filter((item) => item.iso !== country.iso && item.continent === country.continent);
  const allOthers = pool.filter((item) => item.iso !== country.iso);
  const candidates = shuffle([...sameContinent, ...allOthers]).filter(
    (item, index, list) => list.findIndex((candidate) => valueFor(candidate, to) === valueFor(item, to)) === index,
  );
  if (to !== "capital") return candidates.slice(0, 3).map((item) => valueFor(item, to));
  const traps = shuffle(CAPITAL_TRAPS[country.iso] || []);
  const capitals = candidates.map((item) => item.capital);
  return [...traps, ...capitals].filter((value, index, list) => value !== country.capital && list.indexOf(value) === index).slice(0, 3);
}

export function generateDuelQuestions(difficulty: DuelDifficulty): DuelQuestion[] {
  const difficulties: DuelDifficulty[] = ["easy", "medium", "hard", "ultimate"];
  const schedule = shuffle([
    ...Array.from({ length: 17 }, () => difficulty),
    ...difficulties.filter((item) => item !== difficulty),
  ]);
  const used = new Set<string>();
  const typePool = difficulty === "easy" ? QUESTION_TYPES.slice(0, 3) : QUESTION_TYPES;
  return schedule.map((questionDifficulty, index) => {
    const pool = poolForDifficulty(questionDifficulty);
    const available = pool.filter((country) => !used.has(country.iso));
    const country = shuffle(available.length ? available : pool)[0];
    used.add(country.iso);
    const type = typePool[index % typePool.length];
    const wrongs = plausibleWrongs(country, type.to, COUNTRIES);
    return {
      prompt: valueFor(country, type.from),
      correct: valueFor(country, type.to),
      options: shuffle([valueFor(country, type.to), ...wrongs]),
      kicker: LABELS[type.to],
      answerIso: country.iso,
      difficulty: questionDifficulty,
    };
  });
}

export function isDuelDifficulty(value: unknown): value is DuelDifficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "ultimate";
}
