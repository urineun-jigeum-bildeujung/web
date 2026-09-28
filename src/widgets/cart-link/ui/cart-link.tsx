// 헤더의 장바구니. 담아 둔 상품이 있으면 오른쪽 위에 그 가짓수를 뱃지로 붙인다.
// 헤더마다 각자 그리던 장바구니 링크를 이것 하나로 쓴다. 뱃지가 담은 것과 상관없이 "5"로 고정돼 있었다(#470).

"use client";

import Link from "next/link";

import { useQueryCartCount } from "@/entities/cart";
import { useHasSession } from "@/shared/api/use-has-session";
import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

type CartLinkProps = {
  /** 링크 자리 모양. 기본은 보이는 28px에 안 보이는 터치 자리만 넓힌 헤더 아이콘 방식이다(알림 종과 같다) */
  className?: string;
};

export function CartLink({ className }: CartLinkProps) {
  // 로그인하지 않은 메인에도 헤더가 있다. 그때는 부르지 않고 뱃지도 없다
  const count = useQueryCartCount({ enabled: useHasSession() });

  return (
    <Link
      href="/cart"
      aria-label={count > 0 ? `장바구니에 ${count}개` : "장바구니"}
      className={cn(
        "after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2",
        className,
      )}
    >
      {/* 뱃지는 링크가 아니라 아이콘 모서리에 붙인다 — 링크 자리가 44px인 헤더에서도 같은 자리다 */}
      <span className="relative size-7">
        <Icon name="cart" className="size-7" />
        {count > 0 && (
          // 시안(header, 카트 아이콘의 Notification Badge)의 18px·11px 값. 두 자리부터는 옆으로 늘어난다
          <span
            aria-hidden
            className="absolute -top-1 -right-2 flex h-4.5 min-w-4.5 items-center justify-center rounded-full bg-brand px-1 text-label-bold-11 text-brand-foreground"
          >
            {count > 99 ? "99+" : count}
          </span>
        )}
      </span>
    </Link>
  );
}
