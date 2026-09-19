// 리뷰 필터 바텀시트. 조건을 직접 골라 후기를 좁힌다.
// UI 시안(1716:46878·1755:53110)과 PD팀의 범위 슬라이더 확인을 기준으로 한다.
//
// 리뷰가 128개면 그중 우리 아이와 비슷한 조건의 후기만 골라 읽어야 판단이 된다.
// 4kg 말티즈 보호자에게 28kg 리트리버의 후기는 참고가 되지 않는다.
//
// 고르는 동안에는 화면 안 상태로 들고, 적용을 눌러야 바깥으로 넘긴다. 슬라이더를
// 움직일 때마다 목록이 바뀌면 무엇을 고르는 중인지 알 수 없다.

"use client";

import { useId, useState } from "react";

import { toLabels, useQueryBreeds, useQueryHealthOptions, type PetSpecies } from "@/entities/pet";
import { cn } from "@/shared/lib/utils";
import { BottomSheet } from "@/shared/ui/bottom-sheet/bottom-sheet";
import { Button } from "@/shared/ui/button";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { DrawerDescription, DrawerTitle } from "@/shared/ui/drawer";
import { Icon } from "@/shared/ui/icon/icon";
import { Slider } from "@/shared/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import {
  AGE_RANGE,
  DEFAULT_FILTER,
  PERIOD_RANGE,
  WEIGHT_RANGE,
  ageLabel,
  periodLabel,
  weightLabel,
  type Neutered,
  type ReviewFilter,
  type Species,
} from "../model/review-filter";
import { ReviewFilterPicker, type PickerGroup } from "./review-filter-picker";

/** 시안의 종·중성화 칩은 완전한 필 모양에 32px로, 온보딩(40px)과 다르다.
    ChipSelect는 온보딩과 함께 쓰는 공용 컴포넌트라 기본 모양은 그대로 두고
    여기서만 덮어쓴다. 시각 높이는 32px로 시안을 따르되, 터치 영역은 보이지
    않게 44px까지 넓힌다 */
const REVIEW_CHIP_CLASS =
  "relative min-h-0 h-8 rounded-full px-3 py-0 text-label-medium-12 after:absolute after:-inset-y-1.5 after:inset-x-0";

/** 시안(1716:48026)의 "품종 선택하기"·"건강 관심사 선택하기" 줄. 골라 둔 것이
    있으면 그 이름을, 없으면 안내 문구를 보인다. 눌러야 여는 전체화면은
    review-filter-picker.tsx다(#264) */
function PickerRow({
  label,
  placeholder,
  onClick,
}: {
  label: string | null;
  placeholder: string;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex h-11 w-full items-center justify-between rounded-lg border border-border px-3 text-left"
    >
      <span
        className={cn(
          "truncate text-body-medium-14",
          label ? "text-text-body-default" : "text-text-body-tertiary",
        )}
      >
        {label ?? placeholder}
      </span>
      <Icon name="right" aria-hidden className="size-6 shrink-0 text-text-body-tertiary" />
    </button>
  );
}

/** 여러 개 고른 값을 줄 하나로 요약한다. "말티즈 외 1개"처럼 */
function summarize(labels: string[]) {
  if (labels.length === 0) return null;
  return labels.length === 1 ? labels[0] : `${labels[0]} 외 ${labels.length - 1}개`;
}

type ReviewFilterSheetProps = {
  filter: ReviewFilter;
  onApply: (filter: ReviewFilter) => void;
  /** 지금 조건으로 걸러지는 후기 수를 미리 세어 버튼에 적는다 */
  countOf: (filter: ReviewFilter) => number;
};

/**
 * 슬라이더 아래 눈금.
 *
 * 사용 기한(1·3·6·12)처럼 중간값이 있는 눈금은 `flex justify-between`으로 등분해서
 * 늘어놓으면 안 된다 — 그 넷은 1~12 구간에서 실제로 균등한 간격이 아니라서, 화면에
 * "3개월" 글자가 놓인 자리와 슬라이더가 실제로 3을 가리키는 지점이 서로 어긋난다
 * (예: "3개월" 라벨이 시각적으로 33% 지점에 있지만 실제 33%는 값 ~5다). 그래서
 * 각 눈금을 `min`~`max` 안에서 실제 값 비율(`left: X%`)로 절대 위치시킨다.
 */
function Ticks({
  items,
  min,
  max,
}: {
  items: { value: number; label: string }[];
  min: number;
  max: number;
}) {
  return (
    <div aria-hidden className="relative h-5 text-caption-regular-13 text-text-body-secondary">
      {items.map((item) => {
        const percent = ((item.value - min) / (max - min)) * 100;
        return (
          <span
            key={item.label}
            // left:100%로 두면 오른쪽 눈금은 (100%→컨테이너 끝)만큼만 레이아웃 폭을
            // 받아 0px가 되고, translateX(-100%)로 되돌리기 전에 이미 글자가 세로로
            // 쪼개져 줄바꿈된다. whitespace-nowrap으로 줄바꿈 자체를 막는다
            className="absolute top-0 whitespace-nowrap"
            style={{
              left: `${percent}%`,
              transform:
                percent === 0 ? "none" : percent === 100 ? "translateX(-100%)" : "translateX(-50%)",
            }}
          >
            {item.label}
          </span>
        );
      })}
    </div>
  );
}

/**
 * 조건 한 칸.
 *
 * radix Slider는 실제 `role="slider"`가 Thumb에 붙고 그 이름이 "Minimum"·"Maximum"으로
 * 고정된다. Root에 `aria-label`을 줘도 Thumb까지 닿지 않아, 제목과 묶은 group으로
 * 감싸 무엇을 고르는 중인지 함께 읽히게 한다. shadcn 생성 파일은 건드리지 않는다.
 */
function Field({ title, children }: { title: string; children: React.ReactNode }) {
  const id = useId();

  return (
    <section className="flex flex-col gap-3">
      <h3 id={id} className="text-title-bold-16 text-text-body-default">
        {title}
      </h3>
      <div role="group" aria-labelledby={id} className="flex flex-col gap-1">
        {children}
      </div>
    </section>
  );
}

/** 고른 구간이 무엇을 뜻하는지. 고르지 않았으면 나오지 않는다 */
function Summary({ text }: { text: string | null }) {
  if (!text) return null;
  return <p className="text-body-medium-14 text-text-body-brand-default">{text}</p>;
}

export function ReviewFilterSheet({ filter, onApply, countOf }: ReviewFilterSheetProps) {
  const [open, setOpen] = useState(false);
  // 시트를 열 때마다 바깥 값에서 다시 시작한다. 닫고 다시 열면 적용된 조건이 보여야 한다
  const [draft, setDraft] = useState(filter);

  const openSheet = (next: boolean) => {
    if (next) setDraft(filter);
    setOpen(next);
  };

  const patch = (part: Partial<ReviewFilter>) => setDraft((prev) => ({ ...prev, ...part }));

  // 품종·건강 관심사 전체화면(#264). 종 필터와 별개로, 화면 안에서 강아지·고양이를
  // 오갈 수 있어 각자 자기 종 상태를 든다 — 위 "종" 칩이 비어 있으면 강아지로 시작한다
  // 대기 표시 없음 — isLoading은 여기서 그리지 않고 ReviewFilterPicker에 그대로
  // 넘긴다. 그 전체화면이 열릴 때 자기 자리에 Skeleton을 그린다
  const [breedOpen, setBreedOpen] = useState(false);
  const [breedSpecies, setBreedSpecies] = useState<PetSpecies>(draft.species ?? "dog");
  const { breeds, isLoading: breedsLoading } = useQueryBreeds();
  const breedGroups: PickerGroup[] = [
    {
      // #264: 체구 5분류(소형·중형·대형·초소형·믹스)는 PD·백엔드 어디에도 값이
      // 없어 확정표를 받을 때까지 한 묶음으로 둔다. 분류가 오면 그룹만 나누면 된다
      label: "전체",
      items: breeds
        .filter((breed) => breed.species === breedSpecies)
        .map((breed) => ({ value: String(breed.id), label: breed.breedName })),
    },
  ];
  const breedLabels = draft.breedIds
    .map((id) => breeds.find((breed) => breed.id === id)?.breedName)
    .filter((name): name is string => Boolean(name));

  const [healthOpen, setHealthOpen] = useState(false);
  const [healthSpecies, setHealthSpecies] = useState<PetSpecies>(draft.species ?? "dog");
  const { options: healthOptions, isLoading: healthLoading } = useQueryHealthOptions(healthSpecies);
  const healthGroups: PickerGroup[] = healthOptions?.concerns ?? [];
  const healthLabels = healthOptions ? toLabels(draft.healthConcerns, healthOptions.concerns) : [];

  return (
    <>
      {/* 시안(1716-34322)의 칩은 32px 알약 모양이다. 보이는 높이는 그대로 두고
          누르는 자리만 after로 44px까지 넓힌다 */}
      <button
        type="button"
        onClick={() => openSheet(true)}
        className="relative flex h-8 items-center gap-1 rounded-full border border-border px-3 py-2 text-label-medium-12 text-text-body-default after:absolute after:inset-x-0 after:-inset-y-1.5"
      >
        기본 맞춤 필터
        <Icon name="down" aria-hidden className="size-5 text-icon-stroke-tertiary" />
      </button>

      <BottomSheet open={open} onOpenChange={openSheet} className="max-h-[85dvh]">
        <DrawerTitle className="sr-only">리뷰 거르기</DrawerTitle>
        <DrawerDescription className="sr-only">
          사용 기한과 반려동물 조건으로 후기를 좁힙니다
        </DrawerDescription>

        <Tabs defaultValue="type" className="flex min-h-0 flex-1 flex-col gap-3 px-5">
          {/* 시안(1716:46878)은 고른 탭만 밑줄 1px, 굵게가 붙고 나머지는 회색·중간
              굵기다. 밑줄이 5px 아래 뜨는 line 기본 모양은 다른 화면에서 이미 쓰고
              있어 그대로 두고, 이 시트에서만 밑줄을 글자 바로 아래로 당겨 덮는다 */}
          <TabsList variant="line" className="w-full shrink-0">
            <TabsTrigger
              value="type"
              className="h-8 flex-1 rounded-none text-label-medium-14 text-text-body-tertiary after:bottom-0 after:h-px after:bg-border-strong data-active:text-label-bold-14 data-active:text-text-body-default"
            >
              리뷰 유형
            </TabsTrigger>
            <TabsTrigger
              value="pet"
              className="h-8 flex-1 rounded-none text-label-medium-14 text-text-body-tertiary after:bottom-0 after:h-px after:bg-border-strong data-active:text-label-bold-14 data-active:text-text-body-default"
            >
              반려동물 필터
            </TabsTrigger>
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto">
            <TabsContent value="type" className="flex flex-col gap-4 pb-3">
              <Field title="사용 기한">
                {/* PD팀 확인으로 사용 기한도 체중처럼 양쪽 손잡이로 범위를 고른다 */}
                <Slider
                  active={
                    draft.period[0] !== PERIOD_RANGE[0] || draft.period[1] !== PERIOD_RANGE[1]
                  }
                  min={PERIOD_RANGE[0]}
                  max={PERIOD_RANGE[1]}
                  step={1}
                  value={draft.period}
                  onValueChange={([min, max]) => patch({ period: [min, max] })}
                />
                <Ticks
                  min={PERIOD_RANGE[0]}
                  max={PERIOD_RANGE[1]}
                  items={[
                    { value: 1, label: "1개월" },
                    { value: 3, label: "3개월" },
                    { value: 6, label: "6개월" },
                    { value: 12, label: "1년+" },
                  ]}
                />
                <Summary text={periodLabel(draft)} />
              </Field>

              <CheckboxRow
                label="재구매 여부만 보기"
                checked={draft.repeatOnly}
                onCheckedChange={(checked) => patch({ repeatOnly: checked })}
                round={false}
                reverse
                tone="brand"
                className="min-h-9"
                labelClassName="text-label-medium-14 text-text-body-default"
              />
            </TabsContent>

            <TabsContent value="pet" className="flex flex-col gap-4">
              <Field title="종">
                <ChipSelect
                  label="종"
                  options={[
                    { value: "dog", label: "강아지" },
                    { value: "cat", label: "고양이" },
                  ]}
                  value={draft.species ?? ""}
                  onValueChange={(value) => patch({ species: value as Species })}
                  columns={2}
                  className="w-40"
                  chipClassName={REVIEW_CHIP_CLASS}
                />
              </Field>

              <Field title="품종">
                <PickerRow
                  label={summarize(breedLabels)}
                  placeholder="품종 선택하기"
                  onClick={() => setBreedOpen(true)}
                />
              </Field>

              <Field title="나이">
                <Slider
                  active={draft.age[0] !== AGE_RANGE[0] || draft.age[1] !== AGE_RANGE[1]}
                  min={AGE_RANGE[0]}
                  max={AGE_RANGE[1]}
                  step={1}
                  value={draft.age}
                  onValueChange={([min, max]) => patch({ age: [min, max] })}
                />
                <Ticks
                  min={AGE_RANGE[0]}
                  max={AGE_RANGE[1]}
                  items={[
                    { value: AGE_RANGE[0], label: "0세" },
                    { value: AGE_RANGE[1], label: "15세+" },
                  ]}
                />
                <Summary text={ageLabel(draft)} />
              </Field>

              <Field title="중성화 여부">
                <ChipSelect
                  label="중성화 여부"
                  options={[
                    { value: "yes", label: "중성화 O" },
                    { value: "no", label: "중성화 X" },
                  ]}
                  value={draft.neutered ?? ""}
                  onValueChange={(value) => patch({ neutered: value as Neutered })}
                  columns={2}
                  className="w-48"
                  chipClassName={REVIEW_CHIP_CLASS}
                />
              </Field>

              <Field title="체중">
                {/* 손잡이가 둘이라 구간 자체(양 끝 사이)가 채워진다. "이상"이 아니라
                    양 끝이 다 의미가 있어 inverted도, 눈금 강조도 쓰지 않는다 */}
                <Slider
                  active={
                    draft.weight[0] !== WEIGHT_RANGE[0] || draft.weight[1] !== WEIGHT_RANGE[1]
                  }
                  min={WEIGHT_RANGE[0]}
                  max={WEIGHT_RANGE[1]}
                  step={1}
                  value={draft.weight}
                  onValueChange={([min, max]) => patch({ weight: [min, max] })}
                />
                <Ticks
                  min={WEIGHT_RANGE[0]}
                  max={WEIGHT_RANGE[1]}
                  items={[
                    { value: 1, label: "1kg" },
                    { value: 30, label: "30kg+" },
                  ]}
                />
                <Summary text={weightLabel(draft)} />
              </Field>

              <Field title="건강 관심사">
                <PickerRow
                  label={summarize(healthLabels)}
                  placeholder="건강 관심사 선택하기"
                  onClick={() => setHealthOpen(true)}
                />
              </Field>
            </TabsContent>
          </div>
        </Tabs>

        {/* 시안(1716:46878)은 버튼 줄 위에 구분선이 없다 */}
        <div className="flex shrink-0 gap-3 px-5 pb-4">
          <Button
            variant="ghost"
            className="h-10 flex-1 text-label-bold-14"
            onClick={() => setDraft(DEFAULT_FILTER)}
          >
            초기화
          </Button>
          <Button
            variant="secondary"
            className="h-10 flex-1 text-label-bold-14"
            onClick={() => {
              onApply(draft);
              setOpen(false);
            }}
          >
            리뷰 {countOf(draft)}개 보기
          </Button>
        </div>
      </BottomSheet>

      <ReviewFilterPicker
        open={breedOpen}
        onOpenChange={setBreedOpen}
        title="품종 선택"
        itemNoun="품종"
        species={breedSpecies}
        onSpeciesChange={setBreedSpecies}
        groups={breedGroups}
        isLoading={breedsLoading}
        value={draft.breedIds.map(String)}
        onApply={(next) => patch({ breedIds: next.map(Number) })}
      />

      <ReviewFilterPicker
        open={healthOpen}
        onOpenChange={setHealthOpen}
        title="건강 관심사 선택"
        itemNoun="관심사"
        species={healthSpecies}
        onSpeciesChange={setHealthSpecies}
        groups={healthGroups}
        isLoading={healthLoading}
        value={draft.healthConcerns}
        onApply={(next) => patch({ healthConcerns: next })}
      />
    </>
  );
}
