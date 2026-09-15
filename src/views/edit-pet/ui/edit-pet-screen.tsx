// 아이 정보를 고치는 화면들의 공통 골격. 머리말과 하단 완료 버튼이 같다.
// UI 시안 기준(정보 수정 1555-49797 · 1507-43555 · 1507-43640)이다.

"use client";

import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header/page-header";

type EditPetScreenProps = {
  children: ReactNode;
  /** 채워야 할 것이 남았으면 완료를 잠근다. */
  submitDisabled?: boolean;
};

export function EditPetScreen({ children, submitDisabled }: EditPetScreenProps) {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="정보 수정" />

      <main className="flex flex-1 flex-col gap-4 pt-3 pb-6">{children}</main>

      <BottomActionBar>
        <Button disabled={submitDisabled} onClick={() => router.back()}>
          수정완료
        </Button>
      </BottomActionBar>
    </div>
  );
}
