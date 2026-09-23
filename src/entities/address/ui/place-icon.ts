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
const ICON_BY_NAME: Record<string, IconName> = {
  집: "home",
  회사: "building",
};

/**
 * 장소 이름에 붙는 아이콘. 없으면 `undefined`다.
 *
 * **표의 제 키만 본다.** 표는 일반 객체라 `constructor`·`toString` 같은 이름으로 찾으면 물려받은
 * 함수가 나온다. 그 값이 아이콘 이름으로 흘러가면 `Icon`이 모양을 못 찾아 배송지 화면이 통째로
 * 깨지고, 다시 시도해도 같은 데이터로 또 깨진다. 이름은 사용자가 짓고 서버도 막지 않는다 (#423).
 */
export function placeIconOf(name: string): IconName | undefined {
  return Object.hasOwn(ICON_BY_NAME, name) ? ICON_BY_NAME[name] : undefined;
}
