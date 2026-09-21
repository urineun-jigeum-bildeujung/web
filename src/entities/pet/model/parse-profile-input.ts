// 자유 입력을 등록·수정 API가 받는 값으로 옮긴다.
//
// 생년월일은 보호자 쪽도 같은 규칙이라 `shared/lib/birth-date`에 있다.
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
 *
 * **부호도 함께 읽는다.** 숫자만 찾으면 `-4kg`이 `4`가 되어, 잘못 친 값이 그럴듯한
 * 몸무게로 저장된다. 읽은 뒤 `> 0`으로 거른다.
 */
export function parseWeight(text: string): number | null {
  const matched = /[+-]?(?:\d+(?:\.\d+)?|\.\d+)/.exec(text);
  if (!matched) {
    return null;
  }
  const weight = Number(matched[0]);
  // API가 @Positive다. 0은 거절당한다
  return weight > 0 ? weight : null;
}

/**
 * 나이에서 숫자만 뽑는다. "4세"·"4살"처럼 단위가 붙어 들어온다.
 *
 * **부호도 함께 읽는다.** 숫자만 찾으면 `-2세`가 `2`가 된다.
 */
export function parseAge(text: string): number | null {
  const matched = /[+-]?\d+/.exec(text);
  if (!matched) {
    return null;
  }
  const age = Number(matched[0]);
  return age > 0 ? age : null;
}
