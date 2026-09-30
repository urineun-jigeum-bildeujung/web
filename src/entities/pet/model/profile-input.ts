// 아이 정보 입력칸이 받는 글자를 거른다. 온보딩과 정보 수정이 같은 규칙을 쓴다 (#524).
//
// **칠 때 걸러 낸다.** 받은 뒤 알리기만 하면 정보 수정에서처럼 이모티콘 섞인 이름이
// 그대로 저장되고, 두 화면이 규칙을 따로 들면 한쪽만 고쳐진다(QA No.230·233).
// 걸러도 남는 잘못(상한을 넘는 나이 등)은 `parse-profile-input`이 읽고 화면이 알린다.

/**
 * 이모티콘을 이루는 글자. 그림 문자 자체와, 그것에 붙어 모양을 바꾸는 글자(피부색·
 * 이어 붙이기·변형 선택자·국기·키캡)까지 걷어 낸다 — 그림만 지우면 `🙇‍♂️`에서 보이지 않는
 * 이음 글자가 이름에 남는다.
 *
 * **숫자는 남긴다.** `\p{Emoji}`는 0~9도 이모티콘으로 치므로 쓰지 않는다.
 */
const EMOJI =
  /[\p{Extended_Pictographic}\p{Emoji_Modifier}\p{Regional_Indicator}‍︎️⃣\u{E0020}-\u{E007F}]/gu;

/**
 * 이름 길이 상한 (QA 온보딩, #602). 입력칸의 `maxLength`도 이 값이다.
 *
 * **서버에는 상한이 없다.** `PetRegisterRequest.name`이 `@NotBlank`뿐이다. PM QA 기대 결과를 따랐다.
 */
export const PET_NAME_MAX = 10;

/**
 * 이름에서 이모티콘을 걷어 내고 10자로 자른다. 한글·영문·숫자는 그대로 둔다 (QA No.187·230, #602).
 *
 * **이모티콘을 먼저 걷고 센다.** 거꾸로 하면 이모티콘이 자리를 차지했다가 빠져 10자가 못 된다.
 *
 * **`maxLength`만으로는 한글이 한 자 넘친다.** 조합 중인 글자는 길이 제한을 거치지 않는다 — 배송
 * 요청사항(#526)과 같다. 길이는 `maxLength`와 같이 UTF-16 단위로 세고, 두 단위로 된 글자가 경계에
 * 걸리면 반만 남기지 않고 통째로 뺀다.
 */
export function toPetNameInput(text: string): string {
  const name = text.replace(EMOJI, "");
  if (name.length <= PET_NAME_MAX) {
    return name;
  }
  const cut = name.slice(0, PET_NAME_MAX);
  const last = cut.charCodeAt(cut.length - 1);
  // 앞 단위(high surrogate)로 끝났으면 뒤 단위가 잘려 나간 것이다
  return last >= 0xd800 && last <= 0xdbff ? cut.slice(0, -1) : cut;
}

/**
 * 나이는 숫자만, 두 자리까지 받는다 (QA No.196·233).
 *
 * 두 자리 안에서 상한을 넘는 값(31~99)은 막지 못한다. 그것은 `describeAgeError`가 알린다.
 */
export function toAgeInput(text: string): string {
  return text.replace(/\D/g, "").slice(0, 2);
}

/**
 * 몸무게 정수부 자릿수 상한 (QA 온보딩, #602). 999.9kg까지 적을 수 있다.
 *
 * **근거 값이 없어 둔 값이다.** 서버(`PetRegisterRequest.weight`)는 `@Positive double`뿐이고 기획에도
 * 상한이 없다. 기록된 가장 무거운 개도 150kg대라 세 자리면 실제 몸무게는 다 받고 잘못 친 값만 막는다.
 * 기획이 정하면 이 숫자만 바꾼다.
 */
const WEIGHT_WHOLE_DIGITS = 3;

/**
 * 몸무게는 숫자와 소수점 하나, 정수부 세 자리·소수 첫째 자리까지 받는다 (QA No.206·242, #602).
 *
 * **소수점이 둘 이상이면 첫 소수부까지만 남긴다.** "4.2.3"을 "4.23"으로 이어 붙이면
 * 사용자가 적지 않은 몸무게가 된다. 잘못 친 뒤는 버리고 앞은 살린다. 넘친 자리도 같다.
 */
export function toWeightInput(text: string): string {
  const cleaned = text.replace(/[^\d.]/g, "");
  const [whole, fraction] = cleaned.split(".");
  const limited = whole.slice(0, WEIGHT_WHOLE_DIGITS);
  return fraction === undefined ? limited : `${limited}.${fraction.slice(0, 1)}`;
}
