// 아이 고르기 줄. 마지막 칸은 새 아이를 들이는 자리다.
// UI 시안 기준(mypa_021 내 아이 관리의 avator 줄)이다. 메인의 줄은 아직 와이어프레임 기준이다.
//
// 두 모양이 있다. 기본은 같은 크기의 원이 늘어서고, `hero`는 고른 아이만 90px로 크게 보인다.

"use client";

import Image from "next/image";

import { cn } from "@/shared/lib/utils";
import { Icon } from "@/shared/ui/icon/icon";

export type PetSummary = {
  id: string;
  name: string;
  photoUrl?: string;
};

type PetSwitcherProps = {
  pets: PetSummary[];
  selectedId?: string;
  onSelect?: (id: string) => void;
  /** 새 아이를 들이는 자리를 누른다. 없으면 그 칸을 그리지 않는다. */
  onAdd?: () => void;
  /** 원 아래에 이름을 함께 보인다. 메인처럼 처음 보는 화면에서는 이름이 있어야 고를 수 있다 */
  withNames?: boolean;
  /** `hero`는 고른 아이 90px, 나머지 48px. 아이 관리 화면의 줄이다 */
  variant?: "default" | "hero";
  className?: string;
};

export function PetSwitcher({
  pets,
  selectedId,
  onSelect,
  onAdd,
  withNames,
  variant = "default",
  className,
}: PetSwitcherProps) {
  const hero = variant === "hero";
  // hero는 고른 아이만 90px로 크고 나머지는 48px이다. 기본은 전부 44px이다
  const circleSize = (selected: boolean) =>
    hero ? (selected ? "size-22.5" : "size-12") : "size-11";

  return (
    <div
      role="radiogroup"
      aria-label="아이 고르기"
      className={cn(
        "flex gap-3 px-4 py-3",
        // 크기가 다른 원을 아래 선에 맞춘다
        hero ? "items-end gap-4 px-5 py-0" : "items-center",
        className,
      )}
    >
      {pets.map((pet) => {
        const selected = pet.id === selectedId;
        return (
          <button
            key={pet.id}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={pet.name}
            onClick={() => onSelect?.(pet.id)}
            className={cn(
              "flex flex-col items-center gap-1 rounded-full transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full bg-surface-disable",
                circleSize(selected),
                // hero는 크기로 고른 것을 알린다. 기본은 테두리로 알린다 — 색만으로는 알 수 없다
                !hero && selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
            >
              {/* 사진은 next/image로 그려 크기에 맞는 파일을 받는다. 없으면 회색 원만 남는다 */}
              <span className="relative size-full overflow-hidden rounded-full">
                {pet.photoUrl && (
                  <Image
                    src={pet.photoUrl}
                    alt=""
                    fill
                    sizes={hero ? (selected ? "90px" : "48px") : "44px"}
                    className="object-cover"
                  />
                )}
              </span>
            </span>
            {withNames && (
              <span
                aria-hidden
                className={cn(
                  "text-xs",
                  selected ? "font-medium text-foreground" : "text-muted-foreground",
                )}
              >
                {pet.name}
              </span>
            )}
          </button>
        );
      })}

      {onAdd && (
        <button
          type="button"
          aria-label="새 아이 추가"
          onClick={onAdd}
          className="flex flex-col items-center gap-1 rounded-full text-icon-fill-tertiary transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={cn(
              "flex shrink-0 items-center justify-center rounded-full border-2 border-dashed border-current",
              hero ? "size-12" : "size-11",
            )}
          >
            <Icon name="plus" className={hero ? "size-7" : "size-5"} />
          </span>
          {withNames && (
            <span aria-hidden className="text-xs">
              추가
            </span>
          )}
        </button>
      )}
    </div>
  );
}
