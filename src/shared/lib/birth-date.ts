// 생년월일을 치는 대로 다듬고, 서버가 받는 `YYYY-MM-DD`로 옮긴다.
//
// **아이 생일과 보호자 생년월일이 같은 규칙을 쓴다.** 둘 다 자유 입력이고 둘 다
// `LocalDate`로 나가서, 달력에 없는 날이 그대로 가면 서버가 본문을 통째로 거절한다.

/**
 * 치는 대로 `0000. 00. 00` 꼴로 맞춘다.
 *
 * 여덟 자를 넘기지 않지만 `2003. 10. 92`까지 막지는 못한다 — 92일도 여덟 자 안에
 * 들어가기 때문이다. 그것은 `parseBirthDate`가 보고 화면이 알린다.
 */
export function formatBirthDateInput(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, 8);
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}. ${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}. ${digits.slice(4, 6)}. ${digits.slice(6)}`;
}

/**
 * `YYYY-MM-DD`로 옮긴다. 못 알아들으면 `null`이다.
 *
 * **자리 수만 세면 안 된다.** `2003-10-92`가 그대로 나가면 서버가 `LocalDate`로 읽지
 * 못해 본문을 통째로 거절한다(`Failed to read request`). 앞날도 막는다 — API가
 * `@PastOrPresent`라 거절당한다.
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
