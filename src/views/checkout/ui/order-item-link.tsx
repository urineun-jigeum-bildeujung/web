// 결제할 상품 줄의 이름. 누르면 그 상품의 상세로 간다 (QA No.47, #595).
//
// **줄 전체를 누르는 자리로 쓴다.** 이름 링크의 `::after`가 줄(`li`, `relative`)을 통째로 덮어 사진이나
// 금액을 눌러도 상세로 간다 — 장바구니 줄(`views/cart`의 `cart-item-link`, #563)과 같은 방식이다.
// 결제 줄에는 그 안에 누를 것이 따로 없어 덮개 위로 올릴 것도 없다.

import Link from "next/link";

import { useQueryDealProductId } from "@/entities/product";

import type { OrderLine } from "../model/order-items";

/**
 * 상세 주소. 일반 줄은 줄 번호가 곧 상품 번호다. **타임딜 줄은 딜가로 보이게 딜 아이템 번호를 붙인다**
 * (`?dealItem=`, #484) — 붙이지 않으면 상세가 정가로 보인다. 상품 번호를 아직 못 받았으면 `null`이다.
 */
function toDetailPath(item: OrderLine, dealProductId: number | undefined): string | null {
  if (item.itemType === "NORMAL") return `/products/${item.itemId}`;
  return dealProductId === undefined ? null : `/products/${dealProductId}?dealItem=${item.itemId}`;
}

type OrderItemLinkProps = {
  item: OrderLine;
  className?: string;
};

export function OrderItemLink({ item, className }: OrderItemLinkProps) {
  // 타임딜 줄은 장바구니 응답에 상품 번호가 없어 딜 상세에서 받는다. 바로 구매는 같은 키로 이미
  // 받아 둔 딜 상세를 그대로 쓴다
  const dealProductId = useQueryDealProductId(item.itemType === "TIME_DEAL" ? item.itemId : null);
  const href = toDetailPath(item, dealProductId);

  return (
    <p className={className}>
      {href ? (
        <Link
          href={href}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {item.productName}
        </Link>
      ) : (
        item.productName
      )}
    </p>
  );
}
