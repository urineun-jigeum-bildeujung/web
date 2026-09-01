// 아이 정보를 고치는 화면들의 공통 골격. 헤더와 하단 완료 버튼이 같다.
// 와이어프레임 기준(mypa_121, mypa_221, mypa_321)이라 디자인 확정 시 바뀔 수 있다.

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

      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-4">{children}</main>

      <BottomActionBar>
        <Button className="min-h-11" disabled={submitDisabled} onClick={() => router.back()}>
          수정 완료
        </Button>
      </BottomActionBar>
    </div>
  );
}
