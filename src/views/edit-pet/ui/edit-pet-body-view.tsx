// 아이 체형 수정. 체구와 몸무게, 체형을 고친다.
// 와이어프레임 기준(mypa_221)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useState } from "react";

import { BODY_TYPE_OPTIONS, DEFAULT_BODY_TYPE_INDEX, SIZE_OPTIONS } from "@/entities/pet";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Slider } from "@/shared/ui/slider";

import { EditPetScreen } from "./edit-pet-screen";

/** API 연동 전까지 화면 확인용 값 */
const SAVED = { name: "코코", size: "small", weight: "5kg", bodyType: DEFAULT_BODY_TYPE_INDEX };

export function EditPetBodyView() {
  const [size, setSize] = useState(SAVED.size);
  const [weight, setWeight] = useState(SAVED.weight);
  const [bodyType, setBodyType] = useState(SAVED.bodyType);

  return (
    <EditPetScreen submitDisabled={!size || !weight.trim()}>
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">아이의 체구는 어느 정도인가요?</p>
        <ChipSelect
          label="아이의 체구"
          options={[...SIZE_OPTIONS]}
          value={size}
          onValueChange={setSize}
        />
      </div>

      <FormField
        label={`${SAVED.name}의 대략적인 몸무게를 알려주세요`}
        hint="정확하지 않아도 괜찮아요, 대략적으로 적어주세요"
        value={weight}
        onChange={(event) => setWeight(event.target.value)}
        onClear={() => setWeight("")}
      />

      <div className="flex flex-col gap-3">
        <p className="text-sm font-medium text-foreground">{SAVED.name}의 체형은 어떤 편인가요</p>
        <Slider
          aria-label="체형"
          value={[bodyType]}
          onValueChange={([next]) => setBodyType(next)}
          max={BODY_TYPE_OPTIONS.length - 1}
          step={1}
        />
        <div className="flex justify-between text-xs">
          {BODY_TYPE_OPTIONS.map((label, index) => (
            <span
              key={label}
              className={
                index === bodyType ? "font-medium text-foreground" : "text-muted-foreground"
              }
            >
              {label}
            </span>
          ))}
        </div>
      </div>
    </EditPetScreen>
  );
}
