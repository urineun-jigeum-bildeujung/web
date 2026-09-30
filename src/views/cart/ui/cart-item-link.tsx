// 장바구니 줄의 상품 이름. 누르면 그 상품의 상세로 간다 (#563).
//
// **줄 전체를 누르는 자리로 쓴다.** 이름 링크의 `::after`가 줄(`li`, `relative`)을 통째로 덮어 사진이나
// 가격을 눌러도 상세로 간다. 체크박스·빼기·수량은 링크 안에 넣으면 "링크 속 버튼"이 되어 눌리지 않아
// 링크 밖에 두고 덮개 위로 올린다(`relative z-10`) — 상품 카드(`product-grid-card`)가 찜 하트를 링크
// 밖에 두는 것과 같은 까닭이다.

import Link from "next/link";

import type { CartItem } from "@/entities/cart";
import { useQueryDealProductId } from "@/entities/product";

/**
 * 상세 주소. 일반 줄은 줄 번호가 곧 상품 번호다. **타임딜 줄은 딜가로 보이게 딜 아이템 번호를 붙인다**
 * (`?dealItem=`, #484) — 붙이지 않으면 상세가 정가로 보인다.
 *
 * 갈 곳을 모르면 `null`이다. 상품 정보가 없는 줄(`NOT_FOUND`·`TEMPORARILY_UNAVAILABLE`)과, 딜 상세에서
 * 상품 번호를 아직 못 받았거나 못 받는 줄이다.
 */
function toDetailPath(item: CartItem, dealProductId: number | undefined): string | null {
  if (item.productName === null) return null;
  if (item.itemType === "NORMAL") return `/products/${item.itemId}`;
  return dealProductId === undefined ? null : `/products/${dealProductId}?dealItem=${item.itemId}`;
}

type CartItemLinkProps = {
  item: CartItem;
  /** 화면에 보일 이름. 이름이 안 오는 줄은 까닭이 대신 선다 */
  name: string;
  className?: string;
};

export function CartItemLink({ item, name, className }: CartItemLinkProps) {
  // **끝난 딜은 부르지 않는다.** 딜 상세가 진행 중·예정 딜만 보여 주고 끝난 딜은 404라
  // (`TimeDealDetailService`) 받을 것이 없는데 요청만 나가고, 브라우저 콘솔에 실패가 찍힌다
  const dealProductId = useQueryDealProductId(
    item.itemType === "TIME_DEAL" &&
      item.productName !== null &&
      item.unavailableReason !== "DEAL_ENDED"
      ? item.itemId
      : null,
  );
  const href = toDetailPath(item, dealProductId);

  return (
    <p className={className}>
      {href ? (
        <Link
          href={href}
          className="after:absolute after:inset-0 focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring focus-visible:after:ring-inset"
        >
          {name}
        </Link>
      ) : (
        name
      )}
    </p>
  );
}
