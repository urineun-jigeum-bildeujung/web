// 상품 카드의 단가 줄을 만든다. 서버는 정규화 단위의 기호와 그 한 단위의 가격을 준다.
//
// 서버(`PriceCalculator.unitPrice`)는 `g`·`ml`·`개` 한 단위의 가격을 원 단위로 반올림해 준다.
// 시안(타임딜 카드 1905-32428)이 "1개당 약 680원"이라 같은 꼴로 옮긴다. 기호를 그대로 앞에 붙이면
// "g 11원"처럼 읽힌다 (#479).

import { formatWon } from "@/shared/ui/price/price";

/** `("g", 11)` → `1g당 약 11원` */
export function formatUnitPrice(unitLabel: string, unitPrice: number): string {
  return `1${unitLabel}당 약 ${formatWon(unitPrice)}`;
}
