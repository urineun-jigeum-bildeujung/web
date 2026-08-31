// 품종·나이·체구를 받는 두 번째 입력 단계.
// 와이어프레임 기준(onbo_003_체구선택전·체구선택후)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { IoChevronForward } from "react-icons/io5";

import { BODY_TYPE_OPTIONS, SIZE_OPTIONS, type PetProfileDraft } from "@/entities/pet";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Slider } from "@/shared/ui/slider";

type DetailStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onOpenBreedPicker: () => void;
  onPrev: () => void;
  onNext: () => void;
};

export function DetailStep({
  draft,
  onChange,
  onOpenBreedPicker,
  onPrev,
  onNext,
}: DetailStepProps) {
  // 체구를 골라야 몸무게·체질 항목이 나타난다. 시안 onbo_003_체구선택후.
  const canProceed = Boolean(draft.breed && draft.size && draft.weight);

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-4">
        <h1 className="text-xl font-bold text-foreground">
          {draft.name ? `${draft.name}에 대해 더 알려주세요` : "아이에 대해 더 알려주세요"}
        </h1>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">어떤 종인지 알려주세요</p>
          {/* 목록이 길어 별도 화면에서 고른다 */}
          <button
            type="button"
            onClick={onOpenBreedPicker}
            className="flex min-h-11 items-center justify-between rounded-lg border border-input px-3 text-sm transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className={draft.breed ? "text-foreground" : "text-muted-foreground"}>
              {draft.breed || "품종 선택"}
            </span>
            <IoChevronForward aria-hidden className="size-4 text-muted-foreground" />
          </button>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">나이와 생일을 알려주세요</p>
          <p className="text-xs text-muted-foreground">
            정확한 생일을 모른다면 가족이 처음 만난 날을 적어도 좋아요.
          </p>
          <div className="grid grid-cols-2 gap-2">
            <FormField
              label="나이"
              className="[&>label]:sr-only"
              placeholder="4세"
              inputMode="numeric"
              value={draft.age}
              onChange={(event) => onChange({ age: event.target.value })}
            />
            <FormField
              label="생년월일"
              className="[&>label]:sr-only"
              placeholder="0000.00.00"
              inputMode="numeric"
              value={draft.birthday}
              onChange={(event) => onChange({ birthday: event.target.value })}
            />
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">아이의 체구는 어느 정도인가요?</p>
          <ChipSelect
            label="아이의 체구"
            options={[...SIZE_OPTIONS]}
            value={draft.size}
            onValueChange={(size) => onChange({ size })}
          />
        </div>

        {draft.size && (
          <>
            <div className="flex flex-col gap-1.5">
              <p className="text-sm font-medium text-foreground">
                {draft.name ? `${draft.name}의` : "아이의"} 대략적인 몸무게를 알려주세요
              </p>
              <p className="text-xs text-muted-foreground">
                정확하지 않아도 괜찮아요. 대략적으로 적어주세요.
              </p>
              <FormField
                label="대략적인 몸무게"
                className="[&>label]:sr-only"
                placeholder="평균 몸무게 5kg"
                inputMode="decimal"
                value={draft.weight}
                onChange={(event) => onChange({ weight: event.target.value })}
                onClear={() => onChange({ weight: "" })}
              />
            </div>

            <div className="flex flex-col gap-3">
              <p className="text-sm font-medium text-foreground">
                {draft.name ? `${draft.name}의` : "아이의"} 체질은 어떤 편인가요
              </p>
              <Slider
                aria-label="체질"
                min={0}
                max={BODY_TYPE_OPTIONS.length - 1}
                step={1}
                value={[draft.bodyTypeIndex]}
                onValueChange={([bodyTypeIndex]) => onChange({ bodyTypeIndex })}
              />
              {/* 손잡이 위치만으로는 어떤 값인지 알 수 없어 눈금 문구를 함께 둔다 */}
              <div className="flex justify-between text-xs text-muted-foreground">
                {BODY_TYPE_OPTIONS.map((label, index) => (
                  <span
                    key={label}
                    className={index === draft.bodyTypeIndex ? "font-semibold text-foreground" : ""}
                  >
                    {label}
                  </span>
                ))}
              </div>
            </div>
          </>
        )}
      </main>

      <BottomActionBar>
        <Button variant="outline" className="min-h-11" onClick={onPrev}>
          이전
        </Button>
        <Button className="min-h-11" disabled={!canProceed} onClick={onNext}>
          다음 단계 작성하기
        </Button>
      </BottomActionBar>
    </>
  );
}
