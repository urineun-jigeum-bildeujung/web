// 헤더의 장바구니. 담아 둔 상품이 있으면 오른쪽 위에 그 가짓수를 뱃지로 붙인다.
// 헤더마다 각자 그리던 장바구니 링크를 이것 하나로 쓴다. 뱃지가 담은 것과 상관없이 "5"로 고정돼 있었다(#470).
// 슬롯 크기와 누르는 자리는 머리말 공용 슬롯(`HeaderIconLink`)을 따른다 (#513).
// 비로그인이 누르면 장바구니로 가지 않고 로그인 필요 토스트만 띄운다 (#542).

"use client";

import { useQueryCartCount } from "@/entities/cart";
import { useHasSession } from "@/shared/api/use-has-session";
import { useRequireSession } from "@/shared/api/use-require-session";
import { HeaderIconLink } from "@/shared/ui/page-header/header-icon-link";

export function CartLink() {
  // 로그인하지 않은 메인에도 헤더가 있다. 그때는 부르지 않고 뱃지도 없다
  const count = useQueryCartCount({ enabled: useHasSession() });
  const requireSession = useRequireSession();

  return (
    <HeaderIconLink
      href="/cart"
      label={count > 0 ? `장바구니에 ${count}개` : "장바구니"}
      icon="cart"
      onClick={(event) => {
        if (!requireSession()) event.preventDefault();
      }}
      badge={
        count > 0 && (
          // 시안(header, 카트 아이콘의 Notification Badge)의 18px·11px 값. 두 자리부터는 옆으로 늘어난다
          <span
            aria-hidden
            className="absolute -top-1 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-label-bold-11 text-brand-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )
      }
    />
  );
}
