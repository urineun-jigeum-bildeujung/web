// 건강 관심사·알레르기 선택지의 모양.
//
// **목록은 여기 없다.** 백엔드가 `GET /pets/health-options`로 종별로 준다. 종에 따라 갈래도
// 항목도 다르다 — 고양이에게 십자인대 질환을, 강아지에게 헤어볼을 보이면 "우리 아이 기준"이라는
// 이 서비스의 전제가 무너진다. 조회와 변환은 `api/health-options.ts`에 있다.

/** 고르는 한 항목. 알레르기는 저장 코드와 표시명이 다르고, 건강 고민은 둘이 같다 */
export type HealthOption = {
  /** 서버에 저장할 값. 알레르기는 `CHICKEN` 같은 코드다 */
  value: string;
  /** 화면에 보일 이름 */
  label: string;
};

export type HealthGroup = {
  /** 탭에 보이는 이름 */
  label: string;
  items: HealthOption[];
};

/**
 * 고른 값을 표시명으로 되돌린다.
 *
 * **상세 조회가 알레르기를 코드로만 준다.** `CHICKEN`을 그대로 찍으면 사람이 읽지 못한다.
 * 선택지(`GET /pets/health-options`)가 `{ code, displayName }`을 주므로 거기서 짝을 찾는다.
 * 백엔드가 상세에도 표시명을 실어 주면 이 자리는 걷어낸다(#230).
 *
 * 선택지가 아직 안 왔거나 서버에서 빠진 항목이면 값을 그대로 보인다 — 자리를 비우면
 * 알레르기가 없는 아이로 읽힌다.
 */
export function toLabels(values: string[], groups: HealthGroup[]): string[] {
  const items = groups.flatMap((group) => group.items);
  return values.map((value) => items.find((item) => item.value === value)?.label ?? value);
}
