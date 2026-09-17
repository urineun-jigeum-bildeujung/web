// 품종 목록. 검색어가 없으면 종별로 전부 보이고, 있으면 걸러진 것만 보인다.
// UI 시안 기준(onbo_011_품종선택)이다.

"use client";

import { cn } from "@/shared/lib/utils";

import type { SpeciesBreed } from "../api/breeds";
import { PET_SPECIES, SPECIES_LABEL, type PetSpecies } from "../model/breeds";

type BreedPickerProps = {
  /** 두 종을 편 목록. 서버에서 받은 그대로다 */
  breeds: SpeciesBreed[];
  /** 검색어. 비어 있으면 전체 목록이다 */
  query: string;
  /** 지금 골라 둔 품종의 id. 목록에서 표시만 하고 고르는 것은 막지 않는다 */
  currentId?: number | null;
  /** 줄을 누르면 바로 확정된다. 시안에 확인 버튼이 없다 */
  onPick: (breed: SpeciesBreed) => void;
  className?: string;
};

/** 띄어쓰기와 대소문자를 무시하고 견준다. "말티 즈"로 쳐도 말티즈가 나온다 */
function normalize(text: string) {
  return text.replace(/\s+/g, "").toLowerCase();
}

type RowProps = {
  breed: SpeciesBreed;
  current: boolean;
  /** "기타"처럼 양쪽에 다 있는 이름은 종을 덧붙여 가른다 */
  showSpecies: boolean;
  onPick: (breed: SpeciesBreed) => void;
};

function Row({ breed, current, showSpecies, onPick }: RowProps) {
  return (
    <li>
      <button
        type="button"
        aria-current={current || undefined}
        onClick={() => onPick(breed)}
        className={cn(
          "flex min-h-11 w-full items-center gap-1 text-left text-body-medium-16 text-foreground transition-colors",
          "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
          current && "font-bold",
        )}
      >
        {breed.breedName}
        {showSpecies && (
          <span className="text-caption-regular-13 text-text-body-tertiary">
            {SPECIES_LABEL[breed.species]}
          </span>
        )}
      </button>
    </li>
  );
}

export function BreedPicker({ breeds, query, currentId, onPick, className }: BreedPickerProps) {
  const keyword = normalize(query);

  /** 같은 이름이 두 종에 다 있는가. 검색 결과에서만 종을 덧붙인다 */
  const isShared = (name: string) =>
    new Set(breeds.filter((breed) => breed.breedName === name).map((breed) => breed.species)).size >
    1;

  if (keyword) {
    const matched = breeds.filter((breed) => normalize(breed.breedName).includes(keyword));

    if (matched.length === 0) {
      return (
        <p className={cn("px-5 py-6 text-center text-sm text-text-body-secondary", className)}>
          찾는 품종이 없어요. 목록에 없다면 &ldquo;기타&rdquo;를 골라 주세요.
        </p>
      );
    }

    return (
      <ul className={cn("mx-5 divide-y divide-border", className)}>
        {matched.map((breed) => (
          <Row
            key={breed.id}
            breed={breed}
            current={currentId === breed.id}
            showSpecies={isShared(breed.breedName)}
            onPick={onPick}
          />
        ))}
      </ul>
    );
  }

  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {PET_SPECIES.map((species: PetSpecies) => (
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
            {breeds
              .filter((breed) => breed.species === species)
              .map((breed) => (
                <Row
                  key={breed.id}
                  breed={breed}
                  current={currentId === breed.id}
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
