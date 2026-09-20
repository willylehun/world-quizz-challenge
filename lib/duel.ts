import { COUNTRIES } from "@/lib/countries.generated";

export type DuelDifficulty = "easy" | "medium" | "hard" | "ultimate";
export type DuelQuestion = {
  prompt: string;
  correct: string;
  options: string[];
  kicker: string;
  answerIso: string;
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

export function generateDuelQuestions(difficulty: DuelDifficulty): DuelQuestion[] {
  const [start, end] = rangeForDifficulty(difficulty);
  const allowed = new Set(EASY_RANK.slice(start, end));
  let pool = COUNTRIES.filter((country) => allowed.has(country.iso as (typeof EASY_RANK)[number]));
  if (pool.length < 24) pool = [...COUNTRIES];
  const countries = shuffle(pool).slice(0, 20);
  const typePool = difficulty === "easy" ? QUESTION_TYPES.slice(0, 3) : QUESTION_TYPES;
  return countries.map((country, index) => {
    const type = typePool[index % typePool.length];
    const wrongs = shuffle(pool.filter((item) => item.iso !== country.iso && valueFor(item, type.to) !== valueFor(country, type.to)))
      .slice(0, 3)
      .map((item) => valueFor(item, type.to));
    return {
      prompt: valueFor(country, type.from),
      correct: valueFor(country, type.to),
      options: shuffle([valueFor(country, type.to), ...wrongs]),
      kicker: LABELS[type.to],
      answerIso: country.iso,
    };
  });
}

export function isDuelDifficulty(value: unknown): value is DuelDifficulty {
  return value === "easy" || value === "medium" || value === "hard" || value === "ultimate";
}
