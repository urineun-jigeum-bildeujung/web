// 리뷰 필터의 품종·건강 관심사를 고르는 전체화면. 둘 다 "왼쪽에서 갈래를 좁히고
// 오른쪽에서 여러 개를 고른다"는 같은 구조라 데이터만 갈아끼워 하나로 쓴다.
// UI 시안 기준(품종 1651-48070, 건강 관심사 1755-52074, #150·#264)이다.
//
// 사진 리뷰 뷰어(photo-viewer.tsx)와 같은 방식으로 nuqs가 여닫는 전체화면
// Dialog다. 품종·질환 모두 고를 것이 많아 바텀시트 안에 못 넣는다(#150).

"use client";

import { useState } from "react";

import { PET_SPECIES, SPECIES_LABEL, type PetSpecies } from "@/entities/pet";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/shared/ui/dialog";
import { Icon } from "@/shared/ui/icon/icon";
import { Skeleton } from "@/shared/ui/skeleton";

export type PickerGroup = {
  label: string;
  items: { value: string; label: string }[];
};

type ReviewFilterPickerProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** 화면 낭독기용 제목. 시안은 뒤로가기만 두고 화면에 글자로 띄우지 않는다 */
  title: string;
  /** "품종"·"관심사" — 하단 "선택한 OO N" 문구에 쓴다 */
  itemNoun: string;
  species: PetSpecies;
  onSpeciesChange: (species: PetSpecies) => void;
  groups: PickerGroup[];
  isLoading?: boolean;
  /** 지금 골라 둔 값들 */
  value: string[];
  onApply: (next: string[]) => void;
};

function PickerBody({
  title,
  itemNoun,
  species,
  onSpeciesChange,
  groups,
  isLoading,
  value,
  onApply,
  onClose,
}: Omit<ReviewFilterPickerProps, "open" | "onOpenChange"> & { onClose: () => void }) {
  // 적용하기를 눌러야 밖으로 나간다. 그전까지는 화면 안에서만 오간다
  const [picked, setPicked] = useState<string[]>(value);
  const [activeGroup, setActiveGroup] = useState(0);

  const toggle = (item: string) =>
    setPicked((prev) => (prev.includes(item) ? prev.filter((v) => v !== item) : [...prev, item]));

  const current = groups[activeGroup] ?? groups[0];
  const pickedItems = groups
    .flatMap((group) => group.items)
    .filter((item) => picked.includes(item.value));

  return (
    <div className="flex h-dvh flex-col">
      <DialogTitle className="sr-only">{title}</DialogTitle>

      <header className="flex h-12 shrink-0 items-center px-2">
        <button
          type="button"
          aria-label="닫기"
          onClick={onClose}
          className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <Icon name="left" aria-hidden className="size-6" />
        </button>
      </header>

      {/* 종에 따라 갈래·항목이 갈린다(#226). 여기서 바꾸면 왼쪽 갈래 목록부터 다시 받는다 */}
      <div role="group" aria-label="종" className="flex shrink-0 gap-2 px-5 pb-3">
        {PET_SPECIES.map((option) => (
          <button
            key={option}
            type="button"
            aria-pressed={species === option}
            onClick={() => {
              onSpeciesChange(option);
              setActiveGroup(0);
            }}
            className={cn(
              // 시각 높이(36px)는 시안대로 두고, 보이지 않는 세로 영역만 44px까지
              // 넓힌다(review-filter-sheet.tsx의 REVIEW_CHIP_CLASS와 같은 규칙).
              // 가로는 옆 칩과 8px밖에 안 떨어져 있어 넓히지 않는다
              "relative flex h-9 items-center justify-center rounded-full px-3 text-label-medium-14 transition-colors after:absolute after:inset-x-0 after:-inset-y-1",
              species === option
                ? "bg-primary text-primary-foreground"
                : "border border-border text-foreground",
            )}
          >
            {SPECIES_LABEL[option]}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex flex-1 flex-col gap-2 px-5 py-3">
          {Array.from({ length: 6 }, (_, index) => (
            <Skeleton key={index} className="h-11 w-full" />
          ))}
        </div>
      ) : (
        <div className="flex min-h-0 flex-1">
          <ul className="w-39 shrink-0 overflow-y-auto bg-surface-secondary">
            {groups.map((group, index) => (
              <li key={group.label}>
                <button
                  type="button"
                  aria-current={index === activeGroup || undefined}
                  onClick={() => setActiveGroup(index)}
                  className={cn(
                    "flex h-12 w-full items-center px-5 text-left text-body-medium-14 text-text-body-default transition-colors",
                    index === activeGroup && "bg-surface-default-react",
                  )}
                >
                  {group.label}
                </button>
              </li>
            ))}
          </ul>

          <ul className="flex-1 overflow-y-auto">
            {current?.items.map((item) => {
              const selected = picked.includes(item.value);
              return (
                <li key={item.value}>
                  <button
                    type="button"
                    aria-pressed={selected}
                    onClick={() => toggle(item.value)}
                    className="flex h-11 w-full items-center justify-between px-4 text-left"
                  >
                    <span
                      className={cn(
                        "text-body-medium-14",
                        selected ? "text-text-body-brand-default" : "text-text-body-default",
                      )}
                    >
                      {item.label}
                    </span>
                    <Icon
                      name="check"
                      aria-hidden
                      className={cn(
                        "size-6",
                        selected ? "text-icon-fill-brand" : "text-icon-fill-tertiary",
                      )}
                    />
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      )}

      <div className="flex shrink-0 flex-col gap-2 border-t border-border px-5 py-3">
        <div className="flex items-center justify-between">
          <p className="text-label-bold-14 text-text-body-default">
            선택한 {itemNoun} {picked.length}
          </p>
          {picked.length > 0 && (
            <button
              type="button"
              onClick={() => setPicked([])}
              // 글자 자체는 44px에 한참 못 미쳐 보이지 않는 영역을 사방으로 넓힌다.
              // 아래로는 칩 줄과 8px밖에 안 떨어져 있어 4px만 내리고(칩 쪽도 위로
              // 4px 넓히니 합쳐서 딱 8px, 겹치지 않는다), 위는 스크롤 영역이라
              // 넉넉히 20px까지 넓혀도 다른 버튼과 안 겹친다
              className="relative text-body-medium-14 text-text-body-secondary after:absolute after:-inset-x-3 after:-top-5 after:-bottom-1"
            >
              초기화
            </button>
          )}
        </div>

        {pickedItems.length > 0 && (
          <ul className="flex gap-2 overflow-x-auto">
            {pickedItems.map((item) => (
              <li key={item.value} className="shrink-0">
                <button
                  type="button"
                  onClick={() => toggle(item.value)}
                  aria-label={`${item.label} 빼기`}
                  // 칩끼리 가로로 8px밖에 안 떨어져 있어 세로만 넓힌다. 위로 4px는
                  // "초기화" 줄이 아래로 4px 넓힌 것과 맞닿기만 하고 겹치지 않는다
                  className="relative flex h-9 items-center gap-1 rounded-full border border-border px-3 text-label-medium-14 text-text-body-default after:absolute after:inset-x-0 after:-inset-y-1"
                >
                  {item.label}
                  <Icon name="cancel" aria-hidden className="size-6" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="shrink-0 px-5 pb-4">
        {/* 대기 표시 없음 — 적용은 화면 안 상태(picked)를 밖으로 올리기만 하는 동기
            동작이라 기다릴 비동기 왕복이 없다. 오래 걸리는 건 groups 조회뿐이고
            그건 위에서 이미 Skeleton으로 막았다 */}
        <Button
          className="min-h-11 w-full"
          onClick={() => {
            onApply(picked);
            onClose();
          }}
        >
          적용하기
        </Button>
      </div>
    </div>
  );
}

export function ReviewFilterPicker({ open, onOpenChange, ...body }: ReviewFilterPickerProps) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // 데스크톱처럼 넓은 뷰포트에서도 layout.tsx의 앱 기둥(420px, mx-auto max-w-105)
        // 폭에 맞춰야 한다. 기본 DialogContent의 `sm:max-w-sm`은 접두사가 없는
        // `max-w-*`로는 안 지워져(tailwind-merge가 변형 체인이 다르면 충돌로 안 봄)
        // `sm:max-w-105`를 똑같이 붙여야 실제로 이긴다
        className="inset-0 mx-auto flex h-dvh max-w-105 translate-0 flex-col gap-0 overflow-hidden rounded-none p-0 ring-0 sm:max-w-105"
      >
        {/* 열 때마다 새로 그려 지금 값에서 시작한다. 열린 채 갈래를 넘나들며
            고른 것이 다음에 열 때도 그대로 있어야 한다 */}
        {open && <PickerBody key={body.title} {...body} onClose={() => onOpenChange(false)} />}
      </DialogContent>
    </Dialog>
  );
}
