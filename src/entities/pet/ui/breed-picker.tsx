// 품종 목록. 검색어가 없으면 종별로 전부 보이고, 있으면 걸러진 것만 보인다.
// UI 시안 기준(onbo_011_품종선택)이다.

"use client";

import { cn } from "@/shared/lib/utils";

import { BREEDS, PET_SPECIES, SPECIES_LABEL, type PetSpecies } from "../model/breeds";

type BreedPickerProps = {
  /** 검색어. 비어 있으면 전체 목록이다 */
  query: string;
  /** 지금 골라 둔 품종. 목록에서 표시만 하고 고르는 것은 막지 않는다 */
  current?: string;
  /** 줄을 누르면 바로 확정된다. 시안에 확인 버튼이 없다 */
  onPick: (breed: string, species: PetSpecies) => void;
  className?: string;
};

/** 띄어쓰기와 대소문자를 무시하고 견준다. "말티 즈"로 쳐도 말티즈가 나온다 */
function normalize(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

/** "기타"처럼 양쪽 목록에 다 있는 이름. 검색 결과에서는 종을 덧붙여 가른다 */
function isShared(breed: string) {
  return PET_SPECIES.every((species) => BREEDS[species].includes(breed));
}

type RowProps = {
  breed: string;
  species: PetSpecies;
  current: boolean;
  showSpecies: boolean;
  onPick: (breed: string, species: PetSpecies) => void;
};

function Row({ breed, species, current, showSpecies, onPick }: RowProps) {
  return (
    <li>
      <button
        type="button"
        aria-current={current || undefined}
        onClick={() => onPick(breed, species)}
        className={cn(
          "flex min-h-11 w-full items-center gap-1 text-left text-body-medium-16 text-foreground transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          current && "font-bold",
        )}
      >
        {breed}
        {showSpecies && (
          <span className="text-caption-regular-13 text-text-body-tertiary">
            {SPECIES_LABEL[species]}
          </span>
        )}
      </button>
    </li>
  );
}

export function BreedPicker({ query, current, onPick, className }: BreedPickerProps) {
  const keyword = normalize(query);

  if (keyword) {
    const matched = PET_SPECIES.flatMap((species) =>
      BREEDS[species]
        .filter((breed) => normalize(breed).includes(keyword))
        .map((breed) => ({ breed, species })),
    );

    if (matched.length === 0) {
      return (
        <p className={cn("px-5 py-6 text-center text-sm text-text-body-secondary", className)}>
          찾는 품종이 없어요. 목록에 없다면 &ldquo;기타&rdquo;를 골라 주세요.
        </p>
      );
    }

    return (
      <ul className={cn("mx-5 divide-y divide-border", className)}>
        {matched.map(({ breed, species }) => (
          <Row
            key={`${species}-${breed}`}
            breed={breed}
            species={species}
            current={current === breed}
            showSpecies={isShared(breed)}
            onPick={onPick}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {PET_SPECIES.map((species) => (
        // 같은 이름의 품종이 양쪽에 있다("기타"). 묶음에 이름을 붙여
        // 스크린 리더가 어느 종의 목록인지 알 수 있게 한다
        <section key={species} aria-labelledby={`breed-${species}`}>
          <h2
            id={`breed-${species}`}
            className="px-5 pb-1 text-label-bold-14 text-text-body-secondary"
          >
            {SPECIES_LABEL[species]}
          </h2>
          <ul className="mx-5 divide-y divide-border">
            {BREEDS[species].map((breed) => (
              <Row
                key={breed}
                breed={breed}
                species={species}
                current={current === breed}
                showSpecies={false}
                onPick={onPick}
              />
            ))}
          </ul>
        </section>
      ))}
    </div>
  );
}
