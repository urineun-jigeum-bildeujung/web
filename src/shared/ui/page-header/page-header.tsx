// 화면 상단 머리말. 왼쪽·가운데·오른쪽 세 자리를 열어 두고 뒤로가기와 닫기를 기본으로 제공한다.
// 와이어프레임 기준(onbo_002, mypa_011, mypa_021)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";
import { IoChevronBack, IoClose } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

type PageHeaderProps = {
  /** 가운데 제목. 없으면 자리만 비운다 */
  title?: ReactNode;
  /** 왼쪽 자리를 직접 채운다. 지정하면 back·close 기본 버튼을 대체한다 */
  left?: ReactNode;
  /** 오른쪽 자리. 장바구니·알림처럼 화면마다 다른 것을 넣는다 */
  right?: ReactNode;
  /** 왼쪽 기본 버튼 모양. 뒤로가기 화살표인지 닫기 X인지 */
  leading?: "back" | "close" | "none";
  /** 기본 버튼을 눌렀을 때. 없으면 브라우저 뒤로가기 */
  onLeadingClick?: () => void;
} & Omit<ComponentProps<"header">, "title">;

const LEADING_LABEL = {
  back: "이전 화면으로",
  close: "닫기",
} as const;

export function PageHeader({
  title,
  left,
  right,
  leading = "back",
  onLeadingClick,
  className,
  ...props
}: PageHeaderProps) {
  const router = useRouter();
  const Icon = leading === "close" ? IoClose : IoChevronBack;

  return (
    <header
      className={cn("flex h-14 items-center justify-between gap-2 px-2", className)}
      {...props}
    >
      {/* 좌우 자리를 같은 폭으로 잡아야 가운데 제목이 화면 중앙에 온다 */}
      <div className="flex min-w-11 items-center justify-start">
        {left ??
          (leading !== "none" && (
            <button
              type="button"
              aria-label={LEADING_LABEL[leading]}
              onClick={onLeadingClick ?? (() => router.back())}
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon aria-hidden className="size-6" />
            </button>
          ))}
      </div>

      {title ? (
        <h1 className="truncate text-base font-semibold text-foreground">{title}</h1>
      ) : (
        <span className="sr-only" />
      )}

      <div className="flex min-w-11 items-center justify-end gap-1">{right}</div>
    </header>
  );
}
