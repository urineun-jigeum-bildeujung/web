// 자유 입력을 등록·수정 API가 받는 값으로 옮긴다.
//
// 생년월일은 보호자 쪽도 같은 규칙이라 `shared/lib/birth-date`에 있다.
//
// **온보딩과 정보 수정이 같은 변환을 쓴다.** 둘 다 뷰라서 서로 import할 수 없어
// 엔티티에 둔다 (#268). 입력칸이 받는 글자를 거르는 것은 `profile-input`이다.

/**
 * 나이 상한 (QA No.196).
 *
 * **서버에는 상한이 없다.** `PetRegisterRequest.age`가 `@Positive Integer`뿐이라 999999세도
 * 받는다. 기록된 가장 오래 산 개가 약 30살이라 그 값으로 막는다. 고양이는 드물게 30을
 * 넘기도 하므로 기획이 값을 정하면 이 숫자만 바꾼다.
 */
export const MAX_PET_AGE = 30;

/** 몸무게는 소수 첫째 자리까지 다룬다 (QA No.242). 서버는 `double`이라 자리를 가리지 않는다 */
function roundWeight(weight: number): number {
  return Math.round(weight * 10) / 10;
}

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
 *
 * **소수 첫째 자리로 반올림한다.** 입력칸이 둘째 자리를 받지 않아도, 예전에 저장된
 * `10.11111`이나 기기에 남은 초안은 그대로 들어온다.
 */
export function parseWeight(text: string): number | null {
  const matched = /[+-]?(?:\d+(?:\.\d+)?|\.\d+)/.exec(text);
  if (!matched) {
    return null;
  }
  const weight = roundWeight(Number(matched[0]));
  // API가 @Positive다. 0은 거절당한다
  return weight > 0 ? weight : null;
}

/** 저장된 몸무게를 입력칸에 채울 글자로 옮긴다. 4.0은 "4", 10.11111은 "10.1"이다 */
export function formatWeight(weight: number): string {
  return String(roundWeight(weight));
}

/**
 * 나이에서 숫자만 뽑는다. "4세"·"4살"처럼 단위가 붙어 들어온다.
 *
 * **부호도 함께 읽는다.** 숫자만 찾으면 `-2세`가 `2`가 된다.
 *
 * 상한(`MAX_PET_AGE`)을 넘어도 `null`이다. 왜 막혔는지는 `describeAgeError`가 가른다.
 */
export function parseAge(text: string): number | null {
  const matched = /[+-]?\d+/.exec(text);
  if (!matched) {
    return null;
  }
  const age = Number(matched[0]);
  return age > 0 && age <= MAX_PET_AGE ? age : null;
}

/**
 * 나이 칸 아래 알릴 말. 비어 있거나 맞으면 `null`이다.
 *
 * **상한을 넘은 것과 못 알아들은 것을 가른다.** "나이를 적어주세요"만 띄우면 40을 적은
 * 사람은 무엇을 고쳐야 할지 모른다.
 */
export function describeAgeError(text: string): string | null {
  if (!text.trim() || parseAge(text) !== null) {
    return null;
  }
  return Number(/\d+/.exec(text)?.[0]) > MAX_PET_AGE
    ? `나이는 ${MAX_PET_AGE}살까지 적을 수 있어요`
    : "나이를 적어주세요";
}
