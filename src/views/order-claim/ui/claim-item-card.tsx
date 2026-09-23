// ① 상품 고르기의 상품 카드 한 장. 사진·이름·수량·금액 오른쪽에 체크가 붙고, 고르면 주황 테두리가 둘린다.
// UI 시안 기준(mypa_261_반품상품선택 3333:37039)이다. 안쪽 8, 모서리 16, 체크 24 (#408).
//
// **신청할 수 없는 상품도 빼지 않고 흐리게(30%) 남긴다.** 시안이 그렇다(3333:37052). 목록에서
// 사라지면 왜 그 상품만 없는지 알 수 없다 — 진행 중인 신청이 걸렸거나 남은 수량이 없는 상품이다.

"use client";

import { OrderProductRow, type OrderDetailItem } from "@/entities/order";
import { cn } from "@/shared/lib/utils";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

type ClaimItemCardProps = {
  item: OrderDetailItem;
  checked: boolean;
  /** 신청할 수 없는 상품이면 참이다 */
  disabled: boolean;
  onToggle: () => void;
};

export function ClaimItemCard({ item, checked, disabled, onToggle }: ClaimItemCardProps) {
  return (
    <CheckboxRow
      // 시안은 체크가 카드 오른쪽 끝에 있다
      reverse
      tone="brand"
      round={false}
      checked={checked}
      disabled={disabled}
      onCheckedChange={onToggle}
      // 테두리는 고르지 않았을 때도 투명하게 두어 고를 때 카드가 1px 움직이지 않게 한다
      className={cn(
        "gap-3 rounded-2xl border p-2",
        checked ? "border-border-brand" : "border-transparent",
        disabled && "opacity-30",
      )}
      labelClassName="text-foreground"
      label={
        // **폭을 묶어 둔다.** 레이블이 가로 flex라 상품 줄이 긴 이름만큼 늘어나 체크 밑으로
        // 삐져나갔다(393px 확인). 줄어들 수 있어야 이름이 말줄임으로 끝난다
        <div className="min-w-0 flex-1">
          <OrderProductRow
            name={item.productName}
            quantity={item.quantity}
            amount={item.unitPrice * item.quantity}
            imageUrl={item.thumbnailUrl}
          />
        </div>
      }
    />
  );
}
