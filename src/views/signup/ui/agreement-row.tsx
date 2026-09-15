// 약관 동의 한 줄. 왼쪽은 체크, 오른쪽 화살표는 약관 본문으로 간다.
// UI 시안 기준(sign_001 약관 동의, 1117-5438·1117-5503)이다.
//
// 시안의 체크는 원이고 안 골랐을 때도 체크 모양이 회색으로 보인다. shadcn Checkbox는
// 골랐을 때만 표시를 그리므로, 표시는 숨기고 체크 모양을 뒤에 따로 둔다 (checkbox-row와 같다).
// 전체 동의 줄은 24px, 항목 줄은 16px이고 고르면 브랜드색으로 찬다.
//
// 한 줄에 동작이 둘이라 영역을 나눈다. 설명 문구를 눌렀을 때 체크가 토글되면 실수로
// 동의가 풀리므로 설명은 레이블 밖에 둔다.

"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";
import { Icon } from "@/shared/ui/icon/icon";

type AgreementRowProps = {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** 레이블 아래 붙는 설명. 이 영역을 눌러도 체크가 바뀌지 않는다 */
  description?: ReactNode;
  /** 약관 본문으로 가는 길. 없으면 화살표를 그리지 않는다 */
  href?: string;
  /** 전체 동의 줄인지. 체크가 크고 레이블이 굵다 */
  master?: boolean;
  /** 필수 묶음인지. 전체 동의 줄에 주황 점이 붙고 글자색이 진하다 */
  required?: boolean;
  className?: string;
};

export function AgreementRow({
  label,
  checked,
  onCheckedChange,
  description,
  href,
  master,
  required,
  className,
}: AgreementRowProps) {
  const id = useId();

  return (
    <div
      className={cn(
        "flex gap-1",
        // 시안은 전체 동의 24px 줄, 항목 32px 줄이다. 설명이 붙으면 위로 맞춘다
        master ? "min-h-6 gap-2" : "min-h-8",
        description ? "items-start" : "items-center",
        className,
      )}
    >
      <span
        className={cn(
          "relative flex shrink-0 items-center justify-center",
          master ? "size-6" : "size-4",
          // 설명이 있는 줄에서 체크가 첫 줄 글자와 나란히 오도록 한 줄 높이만큼 내린다
          description && !master && "mt-0.75",
        )}
      >
        {/* 보이는 크기는 시안대로 두고 누를 수 있는 자리만 44px로 넓힌다 */}
        <Checkbox
          id={id}
          checked={checked}
          onCheckedChange={(next) => onCheckedChange(next === true)}
          className={cn(
            "rounded-full border-0 bg-surface-disable after:absolute after:-inset-3.5 dark:bg-surface-disable data-checked:bg-surface-brand dark:data-checked:bg-surface-brand [&_[data-slot=checkbox-indicator]]:hidden",
            master ? "size-6" : "size-4",
          )}
        />
        <Icon
          name="check"
          className={cn(
            "pointer-events-none absolute text-icon-fill-static-white",
            master ? "size-4" : "size-2.5",
          )}
        />
      </span>

      <div className="flex min-w-0 flex-1 flex-col gap-1">
        {/* 레이블만 체크와 이어 둔다. 아래 설명은 htmlFor 밖이라 눌러도 토글되지 않는다 */}
        <label
          htmlFor={id}
          className={cn(
            "flex cursor-pointer items-start gap-0.5",
            master && required ? "text-label-bold-14" : "text-body-medium-14",
            required ? "text-foreground" : "text-text-body-secondary",
          )}
        >
          {label}
          {/* 필수 묶음 표시. "[필수]" 글자가 이미 뜻을 전하므로 점은 장식이다 */}
          {master && required && (
            <span
              aria-hidden
              className="mt-0.75 size-1.25 shrink-0 rounded-full bg-surface-brand"
            />
          )}
        </label>
        {description && (
          <p className="text-caption-regular-12 text-text-body-tertiary">{description}</p>
        )}
      </div>

      {href && (
        <Link
          href={href}
          aria-label={`${typeof label === "string" ? label : "약관"} 본문 보기`}
          // 시안의 화살표는 24px이다. 누르는 자리만 44px로 넓혀 줄 높이는 그대로 둔다
          className="relative flex size-6 shrink-0 items-center justify-center rounded-md text-icon-stroke-default transition-colors after:absolute after:-inset-2.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon name="right" />
        </Link>
      )}
    </div>
  );
}
