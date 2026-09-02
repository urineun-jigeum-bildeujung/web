// 아이 정보를 고칠 때 견종·묘종을 고르는 화면.
// 와이어프레임 기준(onbo_013_품종선택)이라 디자인 확정 시 바뀔 수 있다.
//
// 온보딩은 한 라우트 안에서 단계를 쿼리로 넘기지만 정보 수정은 별도 화면에서 들어온다.
// 고른 값은 주소창으로 돌려준다 — 비교 화면에서 상품을 고를 때와 같은 방식이다.

"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import { BreedPicker, findSpecies, type PetSpecies } from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { PageHeader } from "@/shared/ui/page-header/page-header";

export function SelectBreedView() {
  const router = useRouter();
  const [current] = useQueryState("value");
  // 고른 값을 바로 넘기지 않고 "선택 완료"를 누를 때 돌려준다.
  // 시안에 돌아가기·선택 완료 두 버튼이 있어 취소가 가능해야 한다.
  const [picked, setPicked] = useState<{ breed: string; species: PetSpecies } | null>(
    current ? { breed: current, species: findSpecies(current) } : null,
  );

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="품종 선택" />

      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
        <BreedPicker
          value={picked?.breed}
          onChange={(breed, species) => setPicked({ breed, species })}
        />
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={() => router.back()}>
          돌아가기
        </Button>
        <Button
          className="min-h-11"
          disabled={!picked}
          onClick={() =>
            picked &&
            router.push(
              `/mypage/pets/basic?breed=${encodeURIComponent(picked.breed)}&species=${picked.species}`,
            )
          }
        >
          선택 완료
        </Button>
      </BottomActionBar>
    </div>
  );
}
