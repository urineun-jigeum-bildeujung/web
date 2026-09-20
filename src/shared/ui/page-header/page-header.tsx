// 화면 상단 머리말. 왼쪽·가운데·오른쪽 세 자리를 열어 두고 뒤로가기와 닫기를 기본으로 제공한다.
// UI 시안 기준(공용 header, sign_001 회원가입)이다. 높이 48에 제목은 title/bold_18이다.

"use client";

import { useRouter } from "next/navigation";
import type { ComponentProps, ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

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

  return (
    <header
      // 좌우 슬롯 폭이 달라도 제목이 화면 중앙에 오도록 3열 그리드로 잡는다.
      // justify-between으로 두면 오른쪽에 버튼을 더할 때마다 제목이 밀린다.
      className={cn(
        "grid h-12 grid-cols-[minmax(2.75rem,1fr)_auto_minmax(2.75rem,1fr)] items-center gap-2 px-2",
        className,
      )}
      {...props}
    >
      {/* 좌우 자리를 같은 폭으로 잡아야 가운데 제목이 화면 중앙에 온다 */}
      <div className="flex items-center justify-start">
        {left ??
          (leading !== "none" && (
            <button
              type="button"
              aria-label={LEADING_LABEL[leading]}
              onClick={onLeadingClick ?? (() => router.back())}
              // 시안의 아이콘은 24px이고 누르는 자리는 44px로 넓힌다
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <Icon name={leading === "close" ? "cancel" : "left"} />
            </button>
          ))}
      </div>

      {/* 제목이 없어도 가운데 칸을 비워 둔다. sr-only는 position:absolute라
          그리드 배치에서 빠지고, 그러면 오른쪽 슬롯이 가운데 칸으로 올라온다. */}
      {title ? (
        // 시안의 공용 header가 title/bold_18을 쓴다 (#172)
        <h1 className="truncate text-title-bold-18 text-foreground">{title}</h1>
      ) : (
        <span />
      )}

      {/* 시안(1758-69162)의 알림·장바구니 등 오른쪽 아이콘은 회색(#868b94, icon-stroke-tertiary)이다.
          자식이 스스로 색을 정하면(예: 닫기 X) 그대로 우선한다 — 여기 색은 물려주는 기본값일 뿐이다 */}
      <div className="flex items-center justify-end gap-1 text-icon-stroke-tertiary">{right}</div>
    </header>
  );
}
