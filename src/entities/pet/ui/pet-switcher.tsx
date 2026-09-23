// 아이 고르기 줄. 마지막 칸은 새 아이를 들이는 자리다.
// UI 시안 기준(mypa_021 내 아이 관리의 avator 줄, 리뷰 작성 1884-29325의 프로필 선택,
// 메인 홈화면 1758-68897)이다.
//
// 세 모양이 있다. `default`(리뷰 작성)는 48px 원이 같은 크기로 늘어서고 고른 아이만
// 브랜드색 테두리 링이 원 밖에 붙는다. `main`(메인 홈화면)은 60px 원이 늘어서고 고른
// 아이만 원 안쪽에 브랜드색 테두리가 붙는다 — 같은 "고른 아이 표시"도 화면마다 다르게
// 그려져 있어 그대로 옮긴다. `hero`(마이페이지 아이 관리)는 고른 아이만 90px로 커진다.

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
  /** 여러 마리를 고르는 모드. 주면 라디오가 아니라 체크박스로 동작한다(리뷰 작성 — 한 상품을 두 아이에게 함께 먹인다) */
  selectedIds?: string[];
  onToggle?: (id: string) => void;
  /** 새 아이를 들이는 자리를 누른다. 없으면 그 칸을 그리지 않는다. */
  onAdd?: () => void;
  /** 원 아래에 이름을 함께 보인다. 메인처럼 처음 보는 화면에서는 이름이 있어야 고를 수 있다 */
  withNames?: boolean;
  /** `default`는 48px(리뷰 작성), `main`은 60px(메인 홈화면), `hero`는 고른 아이만
   * 90px·나머지 48px(마이페이지 아이 관리)다 */
  variant?: "default" | "hero" | "main";
  className?: string;
};

export function PetSwitcher({
  pets,
  selectedId,
  onSelect,
  selectedIds,
  onToggle,
  onAdd,
  withNames,
  variant = "default",
  className,
}: PetSwitcherProps) {
  const hero = variant === "hero";
  const main = variant === "main";
  const multiple = selectedIds !== undefined;

  const circleSize = (selected: boolean) => {
    if (hero) return selected ? "size-22.5" : "size-12";
    if (main) return "size-15";
    // 리뷰 작성 기준. hero도 고르지 않은 아이는 같은 48px이다
    return "size-12";
  };

  return (
    <div
      role={multiple ? "group" : "radiogroup"}
      aria-label="아이 고르기"
      className={cn(
        "flex items-center gap-3 px-4 py-3",
        // 크기가 다른 원을 아래 선에 맞춘다
        hero && "items-end gap-4 px-5 py-0",
        main && "gap-4 px-5 py-0",
        className,
      )}
    >
      {pets.map((pet) => {
        const selected = multiple ? selectedIds.includes(pet.id) : pet.id === selectedId;
        return (
          <button
            key={pet.id}
            type="button"
            role={multiple ? "checkbox" : "radio"}
            aria-checked={selected}
            aria-label={pet.name}
            onClick={() => (multiple ? onToggle?.(pet.id) : onSelect?.(pet.id))}
            className={cn(
              "flex flex-col items-center gap-1 rounded-full transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            <span
              aria-hidden
              className={cn(
                "flex shrink-0 items-center justify-center rounded-full",
                circleSize(selected),
                main
                  ? // 메인은 60px 전체 중 원 안쪽에 1px 테두리+2px 여백을 둔다
                    cn("border p-0.5", selected ? "border-brand" : "border-transparent")
                  : cn(
                      "bg-surface-disable",
                      // hero는 크기로 고른 것을 알린다. 기본은 시안대로 1px 브랜드 테두리를 원 밖에 두른다
                      !hero &&
                        selected &&
                        "ring-1 ring-border-brand ring-offset-1 ring-offset-background",
                    ),
              )}
            >
              {/* 사진은 next/image로 그려 크기에 맞는 파일을 받는다. 없으면 회색 원만 남는다.
                  시안(메인 1758-68897)은 사진 없으면 색+이름을 원 안에 넣지만, 그 색이
                  서버 값일 가능성이 커 API 확정 전까지는 보류한다 */}
              <span
                className={cn(
                  "relative size-full overflow-hidden rounded-full",
                  main && "bg-surface-disable",
                )}
              >
                {pet.photoUrl && (
                  <Image
                    src={pet.photoUrl}
                    alt=""
                    fill
                    sizes={hero && selected ? "90px" : main ? "56px" : "48px"}
                    className="object-cover"
                  />
                )}
              </span>
            </span>
            {withNames && (
              <span
                aria-hidden
                // 시안의 이름은 12px semibold다. 안 고른 아이는 흐린 글자색이다
                className={cn(
                  "text-label-bold-12",
                  selected ? "text-foreground" : "text-text-body-unselect",
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
              main ? "size-15" : "size-12",
            )}
          >
            <Icon name="plus" className="size-7" />
          </span>
          {withNames && (
            <span aria-hidden className="text-label-bold-12">
              추가
            </span>
          )}
        </button>
      )}
    </div>
  );
}
