// 화면 하단에 고정되는 전역 이동 줄. 홈·상품비교·좋아요·마이페이지를 오간다.
// UI 시안 기준(1758-68976)이다.
//
// 네 아이콘 다 선택 여부와 상관없이 같은 그림을 쓰고, 색으로만 선택 상태를 알린다
// (하트도 항상 채워진 모양이고 색만 바뀐다 — 다른 셋과 같은 규칙이다).
//
// 시안 높이(94px)는 아이폰 홈 인디케이터 세이프 에어리어를 포함한 값으로 보여,
// 고정 px 대신 env(safe-area-inset-bottom)으로 기기가 알아서 더하게 둔다.
//
// 눌렀을 때 배경(#eeeff1, surface/secondary)은 시안의 pressed 상태 그대로 반영한다.
// 이 시안은 마우스 hover가 아니라 손가락으로 누르는 동안(active)만 나오는 터치
// 피드백이라, hover가 아니라 active로 건다.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";
import type { IconName } from "@/shared/ui/icon/icon-shapes";

type NavItem = {
  label: string;
  icon: IconName;
  /** 갈 화면이 아직 없으면 비운다. */
  href?: string;
};

const ITEMS: NavItem[] = [
  { label: "홈", icon: "home", href: "/" },
  { label: "상품비교", icon: "graph", href: "/compare" },
  { label: "좋아요", icon: "heart_fill", href: "/likes" },
  { label: "마이페이지", icon: "user", href: "/mypage" },
];

/** 루트는 정확히 같을 때만 현재 화면이다. startsWith로 보면 모든 경로가 걸린다. */
function isCurrent(pathname: string, href: string) {
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

const ITEM_CLASS =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 rounded-lg text-label-medium-12";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 화면"
      className="sticky bottom-0 flex items-center justify-between border-t border-border bg-background px-5 pt-2 pb-[calc(0.5rem+env(safe-area-inset-bottom))]"
    >
      {ITEMS.map((item) => {
        const current = Boolean(item.href) && isCurrent(pathname, item.href!);
        const tone = current ? "text-foreground" : "text-text-body-unselect";

        if (!item.href) {
          // 갈 곳이 없는 항목. 누를 수 있게 두면 눌러도 아무 일이 없어 고장으로 읽힌다.
          return (
            <span key={item.label} aria-hidden className={cn(ITEM_CLASS, tone)}>
              <Icon name={item.icon} className="size-7" />
              {item.label}
            </span>
          );
        }

        return (
          <Link
            key={item.label}
            href={item.href}
            aria-current={current ? "page" : undefined}
            className={cn(
              ITEM_CLASS,
              tone,
              "transition-colors focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none active:bg-surface-secondary",
            )}
          >
            <Icon name={item.icon} className="size-7" />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
