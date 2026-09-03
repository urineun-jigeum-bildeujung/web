// 화면 아래에 놓이는 아이 고르기 줄. 마지막 칸은 새 아이를 들이는 자리다.
// 와이어프레임 기준(mypa_021)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { IoAdd } from "react-icons/io5";

import { cn } from "@/shared/lib/utils";

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
  className?: string;
};

const CIRCLE = "size-11 shrink-0 rounded-full";

export function PetSwitcher({
  pets,
  selectedId,
  onSelect,
  onAdd,
  withNames,
  className,
}: PetSwitcherProps) {
  return (
    <div
      role="radiogroup"
      aria-label="아이 고르기"
      className={cn("flex items-center gap-3 px-4 py-3", className)}
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
              "flex flex-col items-center gap-1 transition-colors",
              "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
            )}
          >
            <span
              aria-hidden
              className={cn(
                CIRCLE,
                "bg-muted",
                // 고른 아이를 테두리로 알린다. 색만으로는 어느 것이 골라졌는지 알 수 없다.
                selected && "ring-2 ring-foreground ring-offset-2 ring-offset-background",
              )}
              style={
                pet.photoUrl
                  ? { backgroundImage: `url(${pet.photoUrl})`, backgroundSize: "cover" }
                  : undefined
              }
            />
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
          className="flex flex-col items-center gap-1 text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          <span
            aria-hidden
            className={cn(
              CIRCLE,
              "flex items-center justify-center border-2 border-dashed border-border",
            )}
          >
            <IoAdd aria-hidden className="size-5" />
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
