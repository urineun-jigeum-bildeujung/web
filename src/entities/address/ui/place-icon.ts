// 장소 이름으로 아이콘을 고르는 표.
//
// **집·회사는 서버에 없는 개념이다.** 종류를 내려주지 않으므로 `addressName`으로 골라
// 아이콘을 붙인다(명세 행의 화면 대조 메모, 2026-09-09).

import type { IconName } from "@/shared/ui/icon/icon-shapes";

/**
 * 이 이름으로 저장한 곳에만 아이콘이 붙는다.
 *
 * **시안은 주소를 아직 안 넣은 "회사" 자리도 그린다.** 등록 API가 주소를 필수로 받아
 * 빈 자리는 만들어지지 않으므로 그 상태는 오지 않는다. PD 확인 대상이다.
 */
export const ICON_BY_NAME: Record<string, IconName> = {
  집: "home",
  회사: "building",
};
