// 결제 내역 줄들. 결제금액 아래에 상품 금액·배송비가 붙고 결제수단이 따로 온다.
// UI 시안 기준(mypa_161 1238:10065, paym_002 532:17875)이다. 두 화면이 같은 값을 같은 모양으로 쓴다.

import { formatWon } from "@/shared/ui/price/price";

import { DetailRow } from "./detail-row";

type PaymentDetailProps = {
  /** 실제로 낸 금액 */
  total: number;
  /** 상품 금액. 시안이 이 자리를 "상품 옵션"이라 부른다 */
  itemPrice: number;
  shippingFee: number;
  /** "신한카드 ****-****-****-1234"나 "토스페이"처럼 이미 다듬어진 문자열 */
  payMethod: string;
};

/** 시안이 이름 쪽에 굵은 글씨를 쓰는 줄. 결제금액과 결제수단이 그렇다 */
const STRONG_TERM = "text-title-bold-16 text-foreground";
const VALUE = "text-body-medium-14 text-text-body-secondary";

export function PaymentDetail({ total, itemPrice, shippingFee, payMethod }: PaymentDetailProps) {
  return (
    <dl className="flex flex-col gap-2">
      <DetailRow
        term={<span className={STRONG_TERM}>결제금액</span>}
        description={
          <span className="text-title-bold-18 text-text-body-secondary">{formatWon(total)}</span>
        }
      />

      {/* 세부 항목끼리는 4px로 더 붙는다 */}
      <div className="flex flex-col gap-1">
        {/* 시안(`paym_001`·`paym_002`·`cart_001`) 세 화면 모두 이 자리를 "상품 옵션"이라 부른다.
            금액이 들어가는 줄이라 "상품 금액"이 맞아 보이지만, 화면에 그대로 나가는 문구라
            임의로 바꾸지 않고 PD팀에 확인을 요청해 뒀다. */}
        <DetailRow
          term={<span className={VALUE}>상품 옵션</span>}
          description={<span className={VALUE}>{formatWon(itemPrice)}</span>}
        />
        <DetailRow
          term={<span className={VALUE}>배송비</span>}
          description={<span className={VALUE}>{formatWon(shippingFee)}</span>}
        />
      </div>

      <DetailRow
        term={<span className={STRONG_TERM}>결제수단</span>}
        description={<span className={VALUE}>{payMethod}</span>}
      />
    </dl>
  );
}
