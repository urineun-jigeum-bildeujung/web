// 사진·이름·성별·중성화 여부를 받는 첫 입력 단계.
// 와이어프레임 기준(onbo_002)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { GENDER_OPTIONS, NEUTERED_OPTIONS, type PetProfileDraft } from "@/entities/pet";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";

type BasicStepProps = {
  draft: PetProfileDraft;
  onChange: (patch: Partial<PetProfileDraft>) => void;
  onPrev: () => void;
  onNext: () => void;
};

export function BasicStep({ draft, onChange, onPrev, onNext }: BasicStepProps) {
  // 시안에서 세 항목이 모두 차야 다음 버튼이 켜진다
  const canProceed = Boolean(draft.name && draft.gender && draft.neutered);

  return (
    <>
      <main className="flex flex-1 flex-col gap-6 px-4 pt-2 pb-4">
        <h1 className="text-xl font-bold text-foreground">아이를 소개해 주세요</h1>

        <div className="flex flex-col items-center gap-2">
          <AvatarUploader onFileChange={(photo) => onChange({ photo })} />
          <p className="text-xs text-muted-foreground">
            사진도 함께 등록해 주시면 더 알아보기 쉬워요.
          </p>
        </div>

        <FormField
          label="아이의 이름을 알려주세요"
          hint="ex) 코코, 보리"
          value={draft.name}
          onChange={(event) => onChange({ name: event.target.value })}
          onClear={() => onChange({ name: "" })}
        />

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">아이의 성별을 알려주세요</p>
          <ChipSelect
            label="아이의 성별"
            options={[...GENDER_OPTIONS]}
            value={draft.gender}
            onValueChange={(gender) => onChange({ gender })}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <p className="text-sm font-medium text-foreground">중성화 여부를 알려주세요</p>
          <ChipSelect
            label="중성화 여부"
            options={[...NEUTERED_OPTIONS]}
            value={draft.neutered}
            onValueChange={(neutered) => onChange({ neutered })}
          />
        </div>
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
