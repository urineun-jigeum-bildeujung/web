// 아이 정보를 고치는 화면들의 공통 골격. 머리말과 하단 완료 버튼이 같다.
// UI 시안 기준(정보 수정 1555-49797 · 1507-43555 · 1507-43640)이다.
//
// **어느 아이를 고치는지 쿼리로 받는다.** 라우트가 `/mypage/pets/basic`처럼 아이를
// 가리지 않아서, 아이 관리 카드의 화살표가 `?petId=`를 실어 보낸다(#268).

"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";

type EditPetScreenProps = {
  children: ReactNode;
  /** 채워야 할 것이 남았으면 완료를 잠근다. */
  submitDisabled?: boolean;
  /** 저장이 서버를 기다리는 중 */
  submitting?: boolean;
  /** 고친 값을 저장한다. 끝나면 부르는 쪽이 돌아간다 */
  onSubmit?: () => void;
};

export function EditPetScreen({
  children,
  submitDisabled,
  submitting = false,
  onSubmit,
}: EditPetScreenProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="정보 수정" />

      <main className="flex flex-1 flex-col gap-4 pt-3 pb-6">{children}</main>

      <BottomActionBar>
        <Button disabled={submitDisabled || submitting} onClick={onSubmit ?? (() => router.back())}>
          {/* 라벨만 바꾼다. 버튼째 갈아치우면 폭이 줄었다 늘어난다 */}
          <LoadingSwap loading={submitting}>수정완료</LoadingSwap>
        </Button>
      </BottomActionBar>
    </div>
  );
}
