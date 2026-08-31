// 강아지·고양이 품종을 종별로 나눠 고르는 화면 본문.
// 와이어프레임 기준(onbo_003_품종선택)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { cn } from "@/shared/lib/utils";
import { BREEDS, SPECIES_LABEL, type PetSpecies } from "../model/breeds";

type BreedPickerProps = {
  value?: string;
  onChange: (breed: string, species: PetSpecies) => void;
  className?: string;
};

export function BreedPicker({ value, onChange, className }: BreedPickerProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      {(Object.keys(BREEDS) as PetSpecies[]).map((species) => (
        <section key={species} className="flex flex-col gap-3">
          <h2 className="text-base font-semibold text-foreground">{SPECIES_LABEL[species]}</h2>
          <div className="flex flex-wrap gap-2">
            {BREEDS[species].map((breed) => {
              const selected = value === breed;
              return (
                <button
                  key={breed}
                  type="button"
                  // 목록이 길어 라디오 그룹의 화살표 이동이 오히려 번거롭다.
                  // 누르면 곧바로 이전 화면으로 돌아가는 흐름이라 버튼으로 둔다.
                  aria-pressed={selected}
                  onClick={() => onChange(breed, species)}
                  className={cn(
                    "flex min-h-11 items-center rounded-full border px-4 text-sm transition-colors",
                    "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-background text-foreground hover:bg-muted",
                  )}
                >
                  {breed}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
