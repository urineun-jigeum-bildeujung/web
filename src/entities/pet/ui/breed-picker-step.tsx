// 품종을 고르는 하위 화면. 고르면 부르던 화면으로 돌아간다.
// 와이어프레임 기준(onbo_013_품종선택)이라 디자인 확정 시 바뀔 수 있다.
//
// 온보딩과 아이 정보 수정 두 곳에서 쓴다. 둘 다 같은 화면 안에서 이 단계로 바꿔 끼운다 —
// 별도 라우트로 나가면 입력하던 값이 언마운트로 날아간다.

"use client";

import { useState } from "react";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

import { findSpecies, type PetSpecies } from "../model/breeds";
import { BreedPicker } from "./breed-picker";

type BreedPickerStepProps = {
  value: string;
  onConfirm: (breed: string, species: PetSpecies) => void;
  onCancel: () => void;
};

export function BreedPickerStep({ value, onConfirm, onCancel }: BreedPickerStepProps) {
  // 고른 값을 바로 반영하지 않고 "선택 완료"를 누를 때 넘긴다.
  // 시안에 돌아가기·선택 완료 두 버튼이 있어 취소가 가능해야 한다.
  const [picked, setPicked] = useState<{ breed: string; species: PetSpecies } | null>(
    value ? { breed: value, species: findSpecies(value) } : null,
  );

  return (
    <>
      <main className="flex-1 overflow-y-auto px-4 pt-2 pb-4">
        <BreedPicker
          value={picked?.breed}
          onChange={(breed, species) => setPicked({ breed, species })}
        />
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={onCancel}>
          돌아가기
        </Button>
        <Button
          className="min-h-11"
          disabled={!picked}
          onClick={() => picked && onConfirm(picked.breed, picked.species)}
        >
          선택 완료
        </Button>
      </BottomActionBar>
    </>
  );
}
