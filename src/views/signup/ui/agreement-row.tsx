// 약관 동의 한 줄. 공용 CheckboxRow에 약관 화면의 규칙(전체 동의·필수 표시·본문 링크)을 얹는다.
// UI 시안 기준(sign_001 약관 동의, 1117-5438·1117-5503)이다.
//
// 전체 동의 줄은 24px, 항목 줄은 16px 원형 체크이고 고르면 브랜드색으로 찬다.
// 오른쪽 화살표는 약관 본문으로 가는 링크라 체크와 다른 일을 한다.

"use client";

import Link from "next/link";
import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { Icon } from "@/shared/ui/icon/icon";

type AgreementRowProps = {
  label: string;
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
  return (
    <CheckboxRow
      size={master ? "m" : "s"}
      tone="brand"
      checked={checked}
      onCheckedChange={onCheckedChange}
      description={description}
      // 시안은 전체 동의 24px 줄, 항목 32px 줄이다
      className={cn(master ? "min-h-6 gap-2" : "min-h-8 gap-1", className)}
      labelClassName={cn(
        // 필수 점이 글자 위쪽에 붙도록 전체 동의 줄만 위로 맞춘다
        master && "items-start gap-0.5",
        master && required ? "text-label-bold-14" : "text-body-medium-14",
        required ? "text-foreground" : "text-text-body-secondary",
      )}
      label={
        <>
          {label}
          {/* 필수 묶음 표시. "[필수]" 글자가 이미 뜻을 전하므로 점은 장식이다 */}
          {master && required && (
            <span
              aria-hidden
              className="mt-0.75 size-1.25 shrink-0 rounded-full bg-surface-brand"
            />
          )}
        </>
      }
      trailing={
        href && (
          <Link
            href={href}
            aria-label={`${label} 본문 보기`}
            // 시안의 화살표는 24px이다. 누르는 자리만 44px로 넓혀 줄 높이는 그대로 둔다
            className="relative flex size-6 shrink-0 items-center justify-center rounded-md text-icon-stroke-default transition-colors after:absolute after:-inset-2.5 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <Icon name="right" />
          </Link>
        )
      }
    />
  );
}
