// 자유 입력을 등록·수정 API가 받는 값으로 옮긴다.
//
// **온보딩과 정보 수정이 같은 변환을 쓴다.** 둘 다 뷰라서 서로 import할 수 없어
// 엔티티에 둔다 (#268).

/**
 * 몸무게에서 숫자만 뽑는다.
 *
 * **자유 입력이라 "4키로"·"5 kg"처럼 단위가 섞여 들어온다.** API는 `double`이라
 * 그대로 보낼 수 없다. 숫자를 못 찾으면 `null`이고, 부르는 쪽이 보내지 않는다.
 *
 * **앞자리 0이 없는 소수도 받는다.** `.5`를 `5`로 읽으면 0.5kg 고양이가 5kg으로 저장된다.
 */
export function parseWeight(text: string): number | null {
  const matched = /(?:\d+(?:\.\d+)?|\.\d+)/.exec(text);
  if (!matched) {
    return null;
  }
  const weight = Number(matched[0]);
  // API가 @Positive다. 0은 거절당한다
  return weight > 0 ? weight : null;
}

/**
 * 생년월일을 `YYYY-MM-DD`로 맞춘다.
 *
 * 화면이 `0000. 00. 00` 꼴을 자리 표시로 주지만 자유 입력이라 `2022-03-15`,
 * `2022.3.15`, `20220315`이 다 들어온다. 생일은 선택이라 못 알아들으면 안 보내면 그만이다.
 *
 * **자리 수만 세면 안 된다.** `2003-10-92` 같은 값이 그대로 나가면 서버가 `LocalDate`로
 * 읽지 못해 본문을 통째로 거절한다(`Failed to read request`). 다른 칸까지 함께 죽는다.
 * 앞날도 막는다 — API가 `@PastOrPresent`라 거절당한다.
 */
export function parseBirthDate(text: string): string | null {
  const digits = text.replace(/\D/g, "");
  if (digits.length !== 8) {
    return null;
  }

  const year = Number(digits.slice(0, 4));
  const month = Number(digits.slice(4, 6));
  const day = Number(digits.slice(6));

  // 달력에 없는 날인지 본다. Date는 2월 30일을 3월 2일로 넘겨 버리므로 되읽어 견준다
  const date = new Date(Date.UTC(year, month - 1, day));
  const real =
    date.getUTCFullYear() === year && date.getUTCMonth() === month - 1 && date.getUTCDate() === day;
  if (!real || date.getTime() > Date.now()) {
    return null;
  }

  return `${digits.slice(0, 4)}-${digits.slice(4, 6)}-${digits.slice(6)}`;
}

/** 나이에서 숫자만 뽑는다. "4세"·"4살"처럼 단위가 붙어 들어온다 */
export function parseAge(text: string): number | null {
  const matched = /\d+/.exec(text);
  if (!matched) {
    return null;
  }
  const age = Number(matched[0]);
  return age > 0 ? age : null;
}
