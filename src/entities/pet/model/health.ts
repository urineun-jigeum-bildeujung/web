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
