// 등록 요청이 받을 수 있는 값만 입력칸에 남긴다.
//
// **잘못 적어도 조용히 빠지게 두지 않는다.** 생일을 `2003.10.92`로 적으면 서버가 본문을
// 통째로 거절하고(`Failed to read request`), 몸무게에 "모르겠어요"를 적으면 등록이 막힌다.
// 그런데 사용자는 적었으니 저장된 줄 안다. 칠 때 걸러 내고 그래도 어긋나면 알린다.

/** 숫자만 남긴다. 몸무게는 소수점도 받는다 */
export function digitsOnly(text: string, { decimal = false } = {}): string {
  const cleaned = text.replace(decimal ? /[^\d.]/g : /\D/g, "");
  if (!decimal) {
    return cleaned;
  }
  // 소수점이 둘 이상이면 첫 번째만 남긴다. "4.2.3"은 숫자가 아니다
  const [whole, ...rest] = cleaned.split(".");
  return rest.length > 0 ? `${whole}.${rest.join("")}` : cleaned;
}

/**
 * 생년월일을 치는 대로 `0000. 00. 00`으로 맞춘다.
 *
 * 여덟 자를 넘기지 않아 `2003.10.92` 같은 값이 애초에 안 만들어지는 자리까지는 못 간다 —
 * 92일은 여덟 자 안에 들어가기 때문이다. 그것은 `parseBirthDate`가 보고 화면이 알린다.
 */
export function formatBirthday(text: string): string {
  const digits = digitsOnly(text).slice(0, 8);
  if (digits.length <= 4) {
    return digits;
  }
  if (digits.length <= 6) {
    return `${digits.slice(0, 4)}. ${digits.slice(4)}`;
  }
  return `${digits.slice(0, 4)}. ${digits.slice(4, 6)}. ${digits.slice(6)}`;
}
