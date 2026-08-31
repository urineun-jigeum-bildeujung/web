// 품종을 고르는 하위 화면. 고르면 이전 단계로 돌아간다.
// 와이어프레임 기준(onbo_013_품종선택)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useState } from "react";

import { BREEDS, BreedPicker, PET_SPECIES, type PetSpecies } from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";

type BreedStepProps = {
  value: string;
  onConfirm: (breed: string, species: PetSpecies) => void;
  onCancel: () => void;
};

/** 고른 품종이 어느 종의 것인지 되찾는다. 종을 강아지로 고정하면 고양이 선택이 뒤집힌다 */
function findSpecies(breed: string): PetSpecies {
  const found = PET_SPECIES.find((species) => BREEDS[species].includes(breed));
  return found ?? "dog";
}

export function BreedStep({ value, onConfirm, onCancel }: BreedStepProps) {
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
