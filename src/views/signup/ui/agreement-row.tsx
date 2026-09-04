// 약관 동의 한 줄. 왼쪽은 체크, 오른쪽 화살표는 약관 본문으로 간다.
// 와이어프레임 기준(sign_011)이라 디자인 확정 시 바뀔 수 있다.
//
// 한 줄에 동작이 둘이라 영역을 나눈다. 시안 메모가 "체크에 영향 없는 터치 영역"을
// 따로 표시해 두었는데, 설명 문구를 눌렀을 때 체크가 토글되면 실수로 동의가 풀린다.

"use client";

import Link from "next/link";
import { useId, type ReactNode } from "react";
import { IoChevronForward } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";
import { Checkbox } from "@/shared/ui/checkbox";

type AgreementRowProps = {
  label: ReactNode;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  /** 레이블 아래 붙는 설명. 이 영역을 눌러도 체크가 바뀌지 않는다 */
  description?: ReactNode;
  /** 약관 본문으로 가는 길. 없으면 화살표를 그리지 않는다 */
  href?: string;
  /** 전체 동의 줄인지. 굵게 보이고 위아래 여백이 넓다 */
  master?: boolean;
  className?: string;
};

export function AgreementRow({
  label,
  checked,
  onCheckedChange,
  description,
  href,
  master,
  className,
}: AgreementRowProps) {
  const id = useId();

  return (
    <div className={cn("flex min-h-11 items-center gap-2", className)}>
      {/* 보이는 크기는 16px로 두고 누를 수 있는 자리만 44px로 넓힌다.
          네모를 키우면 시안과 달라지고, 줄마다 높이가 들쭉날쭉해진다 */}
      <Checkbox
        id={id}
        checked={checked}
        onCheckedChange={(next) => onCheckedChange(next === true)}
        className="after:absolute after:-inset-3.5"
      />

      <div className="flex min-w-0 flex-1 flex-col">
        {/* 레이블만 체크와 이어 둔다. 아래 설명은 htmlFor 밖이라 눌러도 토글되지 않는다 */}
        <label
          htmlFor={id}
          className={cn(
            "cursor-pointer text-sm text-foreground",
            master ? "font-semibold" : "font-normal",
          )}
        >
          {label}
        </label>
        {description && <p className="text-xs text-muted-foreground">{description}</p>}
      </div>

      {href && (
        <Link
          href={href}
          aria-label={`${typeof label === "string" ? label : "약관"} 본문 보기`}
          className="flex size-11 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <IoChevronForward aria-hidden className="size-4" />
        </Link>
      )}
    </div>
  );
}
