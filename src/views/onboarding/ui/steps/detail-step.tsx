// 품종·나이·체구를 받는 두 번째 입력 단계.
// UI 시안 기준(onbo_003_체구선택전·체구선택후·체구툴팁·bcs툴팁)이다.

"use client";

import {
  BodyTypeGuide,
  BodyTypeSlider,
  SIZE_OPTIONS,
  SizeGuide,
  type PetProfileDraft,
} from "@/entities/pet";
import { cn } from "@/shared/lib/utils";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";

import { digitsOnly, formatBirthday } from "../../model/input-guards";
import { parseBirthDate, parseWeight } from "../../model/to-register-request";

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
  // 숫자를 못 뽑으면 등록 요청을 만들지 못한다. 다음 단계로 보내 놓고 마지막에 막지 않는다
  const weightError = draft.weight && parseWeight(draft.weight) === null;
  // 생일은 선택이라 비어 있어도 되지만, 적었는데 달력에 없는 날이면 알린다.
  // 그대로 보내면 서버가 본문을 통째로 거절한다
  const birthdayError =
    digitsOnly(draft.birthday).length === 8 && parseBirthDate(draft.birthday) === null;

  const canProceed = Boolean(
    draft.breedId && draft.size && draft.weight && !weightError && !birthdayError,
  );
  const who = draft.name || "아이";

  return (
    <>
      <main className="flex flex-1 flex-col gap-5 pt-5 pb-6">
        <h1 className="px-5 text-title-bold-20 text-foreground">{who}에 대해 더 알려주세요</h1>

        <div className="flex flex-col gap-6 px-5">
          <div className="flex flex-col gap-3">
            <p className="text-title-bold-16 text-foreground">어떤 종인지 알려주세요</p>
            {/* 목록이 길어 별도 화면에서 고른다 */}
            <button
              type="button"
              onClick={onOpenBreedPicker}
              aria-label={
                draft.breedName ? `품종 고르기. 지금은 ${draft.breedName}` : "품종 고르기"
              }
              className={cn(
                "flex min-h-11 items-center justify-between rounded-lg border bg-background px-3 text-body-medium-14 text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                draft.breedName ? "border-border-secondary" : "border-border",
              )}
            >
              <span>{draft.breedName}</span>
              <Icon name="right" className="text-icon-stroke-tertiary" />
            </button>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              <p className="text-title-bold-16 text-foreground">나이와 생일을 알려주세요</p>
              <p className="text-caption-regular-13 text-text-body-secondary">
                정확한 생일을 모른다면 가족이 처음 만난 날을 적어도 좋아요.
              </p>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <FormField
                label="나이"
                className="[&>label]:sr-only"
                placeholder="나이를 적어주세요"
                inputMode="numeric"
                value={draft.age}
                onChange={(event) => onChange({ age: digitsOnly(event.target.value) })}
              />
              <FormField
                label="생년월일"
                className="[&>label]:sr-only"
                placeholder="0000. 00. 00"
                inputMode="numeric"
                value={draft.birthday}
                error={birthdayError && "달력에 없는 날이에요"}
                onChange={(event) => onChange({ birthday: formatBirthday(event.target.value) })}
              />
            </div>
          </div>

          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <p className="text-title-bold-16 text-foreground">아이의 체구는 어느 정도인가요?</p>
              {/* 몇 kg부터 중형인지 모르면 고를 수 없다 */}
              <SizeGuide />
            </div>
            <ChipSelect
              label="아이의 체구"
              options={[...SIZE_OPTIONS]}
              value={draft.size}
              onValueChange={(size) => onChange({ size })}
            />
          </div>

          {draft.size && (
            <>
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-title-bold-16 text-foreground">
                    {who}의 대략적인 몸무게를 알려주세요
                  </p>
                  <p className="text-caption-regular-13 text-text-body-secondary">
                    정확하지 않아도 괜찮아요, 대략적으로 적어주세요
                  </p>
                </div>
                {/* 시안은 "말티즈의 평균 몸무게는 5kg이에요"처럼 품종별 평균을 적는데,
                    아직 그 데이터가 없어 일반 문구로 둔다 */}
                <FormField
                  label="대략적인 몸무게"
                  className="[&>label]:sr-only"
                  placeholder="평균 몸무게 5kg"
                  inputMode="decimal"
                  value={draft.weight}
                  error={weightError && "숫자로 적어주세요"}
                  onChange={(event) =>
                    onChange({ weight: digitsOnly(event.target.value, { decimal: true }) })
                  }
                  onClear={() => onChange({ weight: "" })}
                />
              </div>

              <div className="flex flex-col gap-3">
                <div className="flex items-center gap-1">
                  <p className="text-title-bold-16 text-foreground">{who}의 체형은 어떤 편인가요</p>
                  {/* 만져서 판단하는 기준이라 무엇을 보고 고르는지 알려 준다 */}
                  <BodyTypeGuide />
                </div>
                <BodyTypeSlider
                  value={draft.bodyTypeIndex}
                  onValueChange={(bodyTypeIndex) => onChange({ bodyTypeIndex })}
                />
              </div>
            </>
          )}
        </div>
      </main>

      <BottomActionBar>
        <Button variant="secondary" onClick={onPrev}>
          이전
        </Button>
        <Button disabled={!canProceed} onClick={onNext}>
          다음 단계 작성하기
        </Button>
      </BottomActionBar>
    </>
  );
}
