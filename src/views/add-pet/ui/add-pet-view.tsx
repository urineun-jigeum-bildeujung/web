// 새 아이 등록 도입부. 무엇을 물어볼지 알리는 자리다.
// 와이어프레임 기준(mypa_021_등록)이라 디자인 확정 시 바뀔 수 있다.
//
// 등록 뒤에 이어지는 화면이 시안에 없다. 정보 수정 화면은 이미 있는 아이를 고치는 곳이라
// 새 아이를 저장하지 못하므로, 그 길을 잇지 않고 잠가 둔다.

"use client";

import { useRouter } from "next/navigation";
import { IoImageOutline } from "react-icons/io5";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

export function AddPetView() {
  const router = useRouter();

  return (
    <div className="flex min-h-dvh flex-col">
      <main className="flex flex-1 flex-col gap-4 px-4 pt-6 pb-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-xl font-bold text-foreground">새로운 가족을 소개해 주세요</h1>
          <p className="text-sm text-muted-foreground">
            아이에 대해 알려주시면 꼭 맞는 식탁을 준비해 드릴게요
          </p>
        </div>

        <div className="flex flex-1 items-center justify-center rounded-lg bg-muted">
          <IoImageOutline aria-hidden className="size-12 text-muted-foreground" />
        </div>
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={() => router.back()}>
          다음에 할게요
        </Button>
        <Button className="min-h-11" disabled>
          아이 추가하기
        </Button>
      </BottomActionBar>
    </div>
  );
}
