// 이름 뒤에 붙는 조사를 받침에 맞춰 고른다.
//
// 아이 이름이 서버에서 오므로 "햇살는 어때요?" 같은 비문이 그대로 화면에 나간다.
// 문구를 쓰는 자리마다 판단하지 않도록 한곳에 모은다.

/** 조사 짝. 앞이 받침 있을 때, 뒤가 없을 때 */
const PAIRS = {
  "은/는": ["은", "는"],
  "이/가": ["이", "가"],
  "을/를": ["을", "를"],
  "과/와": ["과", "와"],
  "아/야": ["아", "야"],
  "이랑/랑": ["이랑", "랑"],
  "으로/로": ["으로", "로"],
} as const;

export type JosaKind = keyof typeof PAIRS;

const HANGUL_START = 0xac00;
const HANGUL_END = 0xd7a3;
/** ㄹ 받침. 조합형 한글에서 종성 인덱스 8이다 */
const RIEUL = 8;

/** 마지막 글자의 종성 인덱스. 한글이 아니면 null */
function finalConsonant(word: string) {
  const last = word.trim().at(-1);
  if (!last) return null;

  const code = last.charCodeAt(0);
  if (code < HANGUL_START || code > HANGUL_END) return null;

  return (code - HANGUL_START) % 28;
}

/** 마지막 글자에 받침이 있는지. 한글이 아니면 없는 것으로 본다 */
export function hasFinalConsonant(word: string) {
  return (finalConsonant(word) ?? 0) !== 0;
}

/**
 * 이름 뒤에 붙일 조사를 고른다.
 *
 * "으로/로"만 ㄹ 받침이 예외다 — "서울로"이지 "서울으로"가 아니다.
 */
export function josa(word: string, kind: JosaKind) {
  const [withFinal, withoutFinal] = PAIRS[kind];
  const final = finalConsonant(word);

  if (final === null || final === 0) return withoutFinal;
  if (kind === "으로/로" && final === RIEUL) return withoutFinal;

  return withFinal;
}

/** 이름과 조사를 붙여 돌려준다 */
export function withJosa(word: string, kind: JosaKind) {
  return `${word}${josa(word, kind)}`;
}
