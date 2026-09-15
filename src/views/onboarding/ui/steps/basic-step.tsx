// 사진·이름·성별·중성화 여부를 받는 첫 입력 단계.
// UI 시안 기준(onbo_002_미입력·입력완료)이다.
//
// "이전"은 잠겨 있다. 시안이 첫 단계에서 비활성으로 그려 도입부로 돌아가는 길을 두지 않는다.

"use client";

import { GENDER_OPTIONS, NEUTERED_OPTIONS, type PetProfileDraft } from "@/entities/pet";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";

type BasicStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onNext: () => void;
};

export function BasicStep({ draft, onChange, onNext }: BasicStepProps) {
  // 시안에서 세 항목이 모두 차야 다음 버튼이 켜진다
  const canProceed = Boolean(draft.name && draft.gender && draft.neutered);

  return (
    <>
      <main className="flex flex-1 flex-col gap-5 pb-6">
        <h1 className="px-5 text-title-bold-20 text-foreground">아이를 소개해 주세요</h1>

        <div className="flex flex-col items-center gap-3">
          <AvatarUploader
            placeholder={<Icon name="dog" className="size-12 text-icon-fill-tertiary" />}
            onFileChange={(photo) => onChange({ photo })}
          />
          <p className="flex items-center gap-1 text-caption-regular-13 text-text-body-secondary">
            <span aria-hidden className="size-1.25 rounded-full bg-primary" />
            사진도 함께 등록해 주시면 더 알아보기 쉬워요.
          </p>
        </div>

        <div className="flex flex-col gap-4 px-5">
          <FormField
            label="아이의 이름을 알려주세요"
            value={draft.name}
            onChange={(event) => onChange({ name: event.target.value })}
            onClear={() => onChange({ name: "" })}
          />

          <div className="flex flex-col gap-3">
            <p className="text-title-bold-16 text-foreground">아이의 성별을 알려주세요</p>
            <ChipSelect
              label="아이의 성별"
              options={[...GENDER_OPTIONS]}
              value={draft.gender}
              onValueChange={(gender) => onChange({ gender })}
            />
          </div>

          <div className="flex flex-col gap-3">
            <p className="text-title-bold-16 text-foreground">중성화 여부를 알려주세요</p>
            <ChipSelect
              label="중성화 여부"
              options={[...NEUTERED_OPTIONS]}
              value={draft.neutered}
              onValueChange={(neutered) => onChange({ neutered })}
            />
          </div>
        </div>
      </main>

      <BottomActionBar>
        <Button variant="secondary" disabled>
          이전
        </Button>
        <Button disabled={!canProceed} onClick={onNext}>
          다음 단계 작성하기
        </Button>
      </BottomActionBar>
    </>
  );
}
