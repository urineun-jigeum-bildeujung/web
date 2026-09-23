// ① 상품 고르기. "전체선택"과 상품 카드들. 바탕은 흰색이다.
// UI 시안 기준(mypa_261_반품상품선택 3333:36951·37027, mypa_261_교환상품선택 3333:36989·37065)이다 (#408).

"use client";

import type { OrderDetailItem } from "@/entities/order";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

import { selectAll, toggleSelection, type ClaimSelection } from "../model/claim-selection";
import { ClaimItemCard } from "./claim-item-card";

type ClaimItemsStepProps = {
  /** 주문의 상품 전부. 신청할 수 없는 상품도 흐리게 그린다 */
  items: OrderDetailItem[];
  /** 신청할 수 있는 상품의 번호 */
  claimableIds: number[];
  selection: ClaimSelection;
  onSelectionChange: (next: ClaimSelection) => void;
};

export function ClaimItemsStep({
  items,
  claimableIds,
  selection,
  onSelectionChange,
}: ClaimItemsStepProps) {
  // 신청할 수 없는 상품은 세지 않는다. 세면 전체선택이 끝까지 켜지지 않는다 (장바구니와 같다)
  const allChecked =
    claimableIds.length > 0 && claimableIds.every((id) => selection[id] !== undefined);

  return (
    // 시안은 머리말 아래 12에 전체선택(24), 그 아래 20에 목록이다. 줄이 누르는 자리 44를 차지해
    // 위아래로 10씩 늘어난 만큼 빼서 맞춘다
    <div className="flex flex-col gap-2.5 pt-0.5">
      <CheckboxRow
        className="px-5"
        tone="brand"
        round={false}
        label="전체선택"
        labelClassName="text-body-medium-16 text-foreground"
        checked={allChecked}
        disabled={claimableIds.length === 0}
        onCheckedChange={(checked) =>
          onSelectionChange(selectAll(selection, claimableIds, checked))
        }
      />

      <ul className="flex flex-col gap-3 px-5">
        {items.map((item) => (
          <li key={item.orderItemId}>
            <ClaimItemCard
              item={item}
              checked={selection[item.orderItemId] !== undefined}
              disabled={!claimableIds.includes(item.orderItemId)}
              onToggle={() => onSelectionChange(toggleSelection(selection, item.orderItemId))}
            />
          </li>
        ))}
      </ul>
    </div>
  );
}
