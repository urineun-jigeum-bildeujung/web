// 신청 화면의 상품 한 줄. 체크 옆에 주문 상품 줄이 오고, 고르면 수량 조절이 아래에 붙는다.
//
// **시안이 없다.** 주문 상세(`mypa_161`)의 상품 줄을 그대로 쓰고 고르는 부분만 장바구니
// (`cart_001`)의 체크·스테퍼 배치를 따랐다. 시안이 오면 교체 대상이다 (#327).

"use client";

import { OrderProductRow, type OrderDetailItem } from "@/entities/order";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { QuantityStepper } from "@/shared/ui/quantity-stepper/quantity-stepper";

type ClaimItemRowProps = {
  item: OrderDetailItem;
  /** 고르지 않았으면 `undefined`다 */
  quantity: number | undefined;
  onToggle: () => void;
  onQuantityChange: (next: number) => void;
};

export function ClaimItemRow({ item, quantity, onToggle, onQuantityChange }: ClaimItemRowProps) {
  const picked = quantity !== undefined;

  return (
    <div className="flex flex-col gap-2">
      <CheckboxRow
        checked={picked}
        onCheckedChange={onToggle}
        round={false}
        labelClassName="w-full"
        label={
          <OrderProductRow
            name={item.productName}
            option={`${item.quantity}개`}
            amount={item.unitPrice * item.quantity}
            imageUrl={item.thumbnailUrl}
          />
        }
      />

      {/* 고르기 전에는 수량을 물을 일이 없다. 미리 띄워 두면 무엇을 눌러야 하는지 흐려진다 */}
      {picked && (
        <div className="flex items-center justify-between">
          <span className="text-body-regular-14 text-text-body-secondary">신청 수량</span>
          <QuantityStepper
            label={`${item.productName} 신청 수량`}
            value={quantity}
            onChange={onQuantityChange}
            // 주문 수량이 상한이다. 이미 취소·반품된 몫을 뺀 값(`effectiveQuantity`)은 응답에
            // 오지 않아 그보다 크게 잡히는데, 넘으면 서버가 거절한다 (#327)
            max={item.quantity}
          />
        </div>
      )}
    </div>
  );
}
