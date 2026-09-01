// 화면 하단에 고정되는 전역 이동 줄. 홈·상품비교·좋아요·마이페이지를 오간다.
// 와이어프레임 기준(comp_001, comp_001_empty)이라 디자인 확정 시 바뀔 수 있다.
//
// 홈과 좋아요는 아직 화면이 없다. 링크를 걸면 404가 되므로 그 전까지 표시만 한다.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { IoBarChartOutline, IoHeartOutline, IoHomeOutline, IoPersonOutline } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type NavItem = {
  label: string;
  icon: ReactNode;
  /** 갈 화면이 아직 없으면 비운다 */
  href?: string;
};

const ITEMS: NavItem[] = [
  { label: "홈", icon: <IoHomeOutline /> },
  { label: "상품비교", icon: <IoBarChartOutline />, href: "/compare" },
  { label: "좋아요", icon: <IoHeartOutline /> },
  { label: "마이페이지", icon: <IoPersonOutline />, href: "/mypage" },
];

const ITEM_CLASS =
  "flex min-h-14 flex-1 flex-col items-center justify-center gap-1 text-xs [&>svg]:size-5";

export function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      aria-label="주요 화면"
      className="sticky bottom-0 flex border-t border-border bg-background"
    >
      {ITEMS.map((item) => {
        const current = Boolean(item.href) && pathname.startsWith(item.href!);
        const tone = current ? "text-foreground" : "text-muted-foreground";

        if (!item.href) {
          // 갈 곳이 없는 항목. 누를 수 있게 두면 눌러도 아무 일이 없어 고장으로 읽힌다.
          return (
            <span key={item.label} aria-hidden className={cn(ITEM_CLASS, tone)}>
              {item.icon}
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
              "transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            {item.icon}
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
