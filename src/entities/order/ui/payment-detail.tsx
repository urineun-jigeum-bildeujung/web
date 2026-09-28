// 결제 내역 줄들. 결제금액 아래에 상품 금액(과 배송비)이 붙고 결제수단이 따로 온다.
// UI 페이지 시안 기준 — 주문 상세 3324:37275·3610:59567, 주문 완료 1117:4759.
//
// **두 화면이 함께 쓰지만 시안이 다르다.** 주문 상세는 둘째 줄이 "상품 옵션"이고 결제금액 값이
// 18px 흐린 색이다. 주문 완료는 둘째 줄이 "판매 금액"이고 결제금액 값이 16px 진한 색이다. 그래서
// 어느 화면인지를 `variant`로 받는다 (#439).
//
// **배송비 줄은 두 화면 모두 그린다.** 주문 완료 시안에는 없지만, 없으면 결제금액과 판매 금액이
// 배송비만큼 달라 보여 PD팀이 넣기로 했다(2026-09-28, #448).

import { formatWon } from "@/shared/ui/price/price";

import { DetailRow } from "./detail-row";
import { TossPayLogo } from "./toss-pay-logo";

type PaymentDetailProps = {
  /** 실제로 낸 금액 */
  total: number;
  /**
   * 상품 금액. 주문 상세 시안은 이 자리를 "상품 옵션", 주문 완료 시안은 "판매 금액"이라 부른다.
   *
   * **배송비와 함께 없을 수 있다.** 주문을 못 받아 온 자리에서는 결제 금액만 알고 그 안을
   * 가를 수 없다 — `0원`으로 그리면 실제로 0원인 것처럼 보인다 (#308 리뷰)
   */
  itemPrice?: number;
  shippingFee?: number;
  /** 어느 화면의 시안을 따르나. 기본은 주문 상세다 */
  variant?: "detail" | "complete";
};

/** 시안이 이름 쪽에 굵은 글씨를 쓰는 줄. 결제금액과 결제수단이 그렇다 */
const STRONG_TERM = "text-title-bold-16 text-foreground";
const VALUE = "text-body-medium-14 text-text-body-secondary";

export function PaymentDetail({
  total,
  itemPrice,
  shippingFee,
  variant = "detail",
}: PaymentDetailProps) {
  const complete = variant === "complete";
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
          <span
            className={
              complete
                ? "text-title-bold-16 text-foreground"
                : "text-title-bold-18 text-text-body-secondary"
            }
          >
            {formatWon(total)}
          </span>
        }
      />

      {/* 세부 항목끼리는 4px(기본 gap)로 붙고, 위 결제금액과는 8px 떨어진다 */}
      {hasBreakdown && (
        <>
          {/* 같은 자리를 화면마다 다르게 부른다 — 주문 상세 "상품 옵션", 주문 완료 "판매 금액" */}
          <DetailRow
            className="mt-1"
            term={<span className={VALUE}>{complete ? "판매 금액" : "상품 옵션"}</span>}
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
