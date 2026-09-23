// 결제 내역 줄들. 결제금액 아래에 상품 금액·배송비가 붙고 결제수단이 따로 온다.
// UI 시안 기준(mypa_161 1238:10065, paym_002 532:17875)이다. 두 화면이 같은 값을 같은 모양으로 쓴다.

import { formatWon } from "@/shared/ui/price/price";

import { DetailRow } from "./detail-row";
import { TossPayLogo } from "./toss-pay-logo";

type PaymentDetailProps = {
  /** 실제로 낸 금액 */
  total: number;
  /**
   * 상품 금액. 시안이 이 자리를 "상품 옵션"이라 부른다.
   *
   * **배송비와 함께 없을 수 있다.** 주문을 못 받아 온 자리에서는 결제 금액만 알고 그 안을
   * 가를 수 없다 — `0원`으로 그리면 실제로 0원인 것처럼 보인다 (#308 리뷰)
   */
  itemPrice?: number;
  shippingFee?: number;
};

/** 시안이 이름 쪽에 굵은 글씨를 쓰는 줄. 결제금액과 결제수단이 그렇다 */
const STRONG_TERM = "text-title-bold-16 text-foreground";
const VALUE = "text-body-medium-14 text-text-body-secondary";

export function PaymentDetail({ total, itemPrice, shippingFee }: PaymentDetailProps) {
  // 둘은 늘 함께 온다. 하나만 있는 경우는 없어 같이 묶어 판단한다
  const hasBreakdown = itemPrice !== undefined && shippingFee !== undefined;

  // **줄을 `<div>`로 더 감싸지 않는다.** `<dl>`의 자식 `<div>`는 `dt`·`dd`만 담을 수 있어서,
  // 간격을 주려고 한 겹 더 넣으면 그 안의 `dt`·`dd`가 `dl` 소속으로 읽히지 않는다. 스크린
  // 리더가 이름과 값을 짝으로 읽지 못하고 Lighthouse도 잡는다 (#341). 그래서 간격을 4px로
  // 깔고 묶음이 시작되는 줄에만 `mt-1`을 더해 8px을 만든다.
  return (
    <dl className="flex flex-col gap-1">
      <DetailRow
        term={<span className={STRONG_TERM}>결제금액</span>}
        description={
          <span className="text-title-bold-18 text-text-body-secondary">{formatWon(total)}</span>
        }
      />

      {/* 세부 항목끼리는 4px(기본 gap)로 붙고, 위 결제금액과는 8px 떨어진다 */}
      {hasBreakdown && (
        <>
          {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
            금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
            임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
          <DetailRow
            className="mt-1"
            term={<span className={VALUE}>상품 옵션</span>}
            description={<span className={VALUE}>{formatWon(itemPrice)}</span>}
          />
          <DetailRow
            term={<span className={VALUE}>배송비</span>}
            description={<span className={VALUE}>{formatWon(shippingFee)}</span>}
          />
        </>
      )}

      {/* **수단 이름 대신 로고를 둔다.** PD팀이 두 화면을 `paym_002`의 토스페이 로고로
          통일하라고 확정했다 (2026-09-21, #304). 서버가 주는 `payment.method`는 그리지 않는다.

          위 금액 묶음과 12px 떨어진다(기본 gap 4 + 8). UI 페이지의 `mypa_161`(3324:36737)과
          `paym_002`(1117:4759)가 같다 — 와이어프레임 때는 8px이었다 (#405) */}
      <DetailRow
        className="mt-2"
        term={<span className={STRONG_TERM}>결제수단</span>}
        // 로고를 그리는 까닭과 `unoptimized`인 까닭은 toss-pay-logo.tsx에 있다
        description={<TossPayLogo />}
      />
    </dl>
  );
}
