// 한 가지만 묻고 아래 완료 버튼으로 끝내는 화면의 골격.
// UI 시안 기준(sign_001 닉네임)이다. 마이페이지의 닉네임·휴대폰·배송지 화면도 같은 골격을 쓴다.
//
// "뒤로가기 헤더 → 질문 → 입력 → 하단 완료"로 같아 레이아웃만 뽑았다.

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

      <main className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-title-bold-20 text-foreground">{question}</h1>
          {description && (
            <p className="text-body-medium-14 text-text-body-secondary">{description}</p>
          )}
        </div>
        {children}
      </main>

      <BottomActionBar>
        <Button disabled={submitDisabled} onClick={onSubmit}>
          {submitLabel}
        </Button>
      </BottomActionBar>
    </div>
  );
}
