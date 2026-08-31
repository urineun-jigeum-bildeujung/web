// 한 가지만 묻고 아래 완료 버튼으로 끝내는 화면의 골격.
// 와이어프레임 기준(mypa_111, mypa_212, mypa_311, mypa_312)이라 디자인 확정 시 바뀔 수 있다.
//
// 네 화면이 "뒤로가기 헤더 → 질문 → 입력 → 하단 완료" 로 같아 레이아웃만 뽑았다.

import type { ReactNode } from "react";

import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header/page-header";

type SingleInputScreenProps = {
  /** 헤더 가운데 제목. 없으면 비운다 */
  headerTitle?: ReactNode;
  /** 본문 맨 위 질문 */
  question: ReactNode;
  /** 질문 아래 보충 설명 */
  description?: ReactNode;
  children: ReactNode;
  /** 하단 버튼 문구 */
  submitLabel?: string;
  submitDisabled?: boolean;
  onSubmit?: () => void;
  className?: string;
};

export function SingleInputScreen({
  headerTitle,
  question,
  description,
  children,
  submitLabel = "입력 완료",
  submitDisabled,
  onSubmit,
  className,
}: SingleInputScreenProps) {
  return (
    <div className={cn("flex min-h-dvh flex-col", className)}>
      <PageHeader title={headerTitle} />

      <main className="flex flex-1 flex-col gap-4 px-4 pt-2 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg font-bold text-foreground">{question}</h1>
          {description && <p className="text-sm text-muted-foreground">{description}</p>}
        </div>
        {children}
      </main>

      <BottomActionBar>
        <Button className="min-h-11" disabled={submitDisabled} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </BottomActionBar>
    </div>
  );
}
