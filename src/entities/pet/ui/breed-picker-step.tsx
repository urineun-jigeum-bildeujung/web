// 품종을 고르는 하위 화면. 머리말·검색창·목록으로 이루어지고, 줄을 누르면 부르던 화면으로 돌아간다.
// UI 시안 기준(onbo_011_품종선택)이다.
//
// 온보딩과 아이 정보 수정 두 곳에서 쓴다. 둘 다 같은 화면 안에서 이 단계로 바꿔 끼운다 —
// 별도 라우트로 나가면 입력하던 값이 언마운트로 날아간다.

"use client";

import { useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE, type AppMessage } from "@/shared/config/app-message";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";

import type { SpeciesBreed } from "../api/breeds";
import { useQueryBreeds } from "../api/use-query-breeds";
import { BreedPicker } from "./breed-picker";

type BreedPickerStepProps = {
  /** 지금 골라 둔 품종의 id. 목록에서 표시한다 */
  value: number | null;
  /** 줄을 누르면 고른 품종을 통째로 넘긴다. 시안에 확인 버튼이 없어 바로 확정이다 */
  onConfirm: (breed: SpeciesBreed) => void;
  /** 머리말의 뒤로가기 */
  onCancel: () => void;
};

/** 기다리는 동안 채워 둘 줄 수. 한 화면에 들어차는 만큼만 그린다 */
const PLACEHOLDER_ROWS = 8;

export function BreedPickerStep({ value, onConfirm, onCancel }: BreedPickerStepProps) {
  const [query, setQuery] = useState("");
  const { breeds, isLoading, error } = useQueryBreeds();

  const message: AppMessage | null = error ? APP_MESSAGE[toAppMessageCode(error)] : null;

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
        {message ? (
          <EmptyState role="alert" {...message} />
        ) : isLoading ? (
          // 목록을 처음 그리는 자리라 그릴 내용이 아직 없다. 문구 한 줄만 두면 검색창
          // 아래가 비었다가 갑자기 수십 줄로 차서 화면이 튄다. 줄 높이로 자리를 잡는다
          <ul aria-label="품종을 불러오는 중" role="status" className="flex flex-col gap-1 px-5">
            {Array.from({ length: PLACEHOLDER_ROWS }, (_, index) => (
              <li key={index} className="flex min-h-11 items-center">
                <Skeleton className="h-5 w-40 rounded-sm" />
              </li>
            ))}
          </ul>
        ) : (
          <BreedPicker breeds={breeds} query={query} currentId={value} onPick={onConfirm} />
        )}
      </main>
    </>
  );
}
