// 약관 동의 항목과 전체 동의 규칙.
// 와이어프레임 기준(sign_011)이라 디자인 확정 시 바뀔 수 있다.

export type AgreementItem = {
  id: string;
  label: string;
  /** 필수 항목은 다 채워야 다음으로 갈 수 있다 */
  required: boolean;
  /** 레이블 아래 붙는 설명 */
  description?: string;
  /** 약관 본문 화면 */
  href?: string;
};

export const AGREEMENTS: AgreementItem[] = [
  { id: "age", label: "만 14세 이상입니다.", required: true },
  {
    id: "terms",
    label: "서비스 이용약관 동의",
    required: true,
    href: "/mypage/service/terms",
  },
  {
    id: "privacy",
    label: "개인정보 수집 및 이용 동의",
    required: true,
    // 왜 필요한지 밝히는 자리다. 이 서비스는 아이의 건강 데이터로 추천을 만든다
    description: "아이의 건강 데이터 활용을 위해 꼭 필요해요",
    href: "/mypage/service/privacy",
  },
  { id: "marketing", label: "맞춤 혜택 및 이벤트 알림 수신 동의", required: false },
  {
    id: "thirdParty",
    label: "맞춤형 제품 혜택을 위한 개인정보 제3자 제공 동의",
    required: false,
  },
];

export const REQUIRED_IDS = AGREEMENTS.filter((item) => item.required).map((item) => item.id);
export const OPTIONAL_IDS = AGREEMENTS.filter((item) => !item.required).map((item) => item.id);

/** 그 묶음이 전부 체크됐는가. 전체 동의 줄의 체크 상태가 된다 */
export function isAllChecked(checked: string[], ids: string[]) {
  return ids.length > 0 && ids.every((id) => checked.includes(id));
}

/** 묶음을 한꺼번에 켜고 끈다. 시안의 "해당 항목 터치시 아래 항목 전부 자동으로 체크" */
export function toggleGroup(checked: string[], ids: string[], next: boolean) {
  if (next) {
    return [...checked, ...ids.filter((id) => !checked.includes(id))];
  }
  return checked.filter((id) => !ids.includes(id));
}

/** 필수를 다 채웠는가. 다음 버튼이 켜지는 조건 */
export function canProceed(checked: string[]) {
  return REQUIRED_IDS.every((id) => checked.includes(id));
}
