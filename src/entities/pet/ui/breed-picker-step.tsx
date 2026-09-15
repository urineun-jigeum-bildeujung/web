// 품종을 고르는 하위 화면. 머리말·검색창·목록으로 이루어지고, 줄을 누르면 부르던 화면으로 돌아간다.
// UI 시안 기준(onbo_011_품종선택)이다.
//
// 온보딩과 아이 정보 수정 두 곳에서 쓴다. 둘 다 같은 화면 안에서 이 단계로 바꿔 끼운다 —
// 별도 라우트로 나가면 입력하던 값이 언마운트로 날아간다.

"use client";

import { useState } from "react";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import type { PetSpecies } from "../model/breeds";
import { BreedPicker } from "./breed-picker";

type BreedPickerStepProps = {
  /** 지금 골라 둔 품종. 목록에서 표시한다 */
  value: string;
  /** 골라 둔 품종의 종. 같은 이름("기타")이 양쪽에 있어 함께 받아야 한 줄만 표시한다 */
  species: PetSpecies;
  /** 줄을 누르면 품종과 그 종을 함께 넘긴다. 시안에 확인 버튼이 없어 바로 확정이다 */
  onConfirm: (breed: string, species: PetSpecies) => void;
  /** 머리말의 뒤로가기 */
  onCancel: () => void;
};

export function BreedPickerStep({ value, species, onConfirm, onCancel }: BreedPickerStepProps) {
  const [query, setQuery] = useState("");

  return (
    <>
      <PageHeader title="품종선택" onLeadingClick={onCancel} />

      <div className="px-5 pt-3">
        <FormField
          label="품종 검색"
          className="gap-0 [&_input]:border-0 [&_input]:bg-surface-secondary [&>label]:sr-only"
          placeholder="품종을 검색해주세요"
          leading={<Icon name="search" />}
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onClear={() => setQuery("")}
        />
      </div>

      <main className="flex-1 overflow-y-auto pt-5 pb-4">
        <BreedPicker query={query} current={value} currentSpecies={species} onPick={onConfirm} />
      </main>
    </>
  );
}
