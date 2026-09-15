// 아이 체형 수정. 체구와 몸무게, 체형을 고친다.
// UI 시안 기준(정보 수정 체형, 1507-43555)이다.

"use client";

import { useState } from "react";

import {
  BodyTypeGuide,
  BodyTypeSlider,
  DEFAULT_BODY_TYPE_INDEX,
  SIZE_OPTIONS,
  SizeGuide,
} from "@/entities/pet";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";

import { EditPetScreen } from "./edit-pet-screen";

/** API 연동 전까지 화면 확인용 값 */
const SAVED = { name: "코코", size: "small", weight: "4키로", bodyType: DEFAULT_BODY_TYPE_INDEX };

export function EditPetBodyView() {
  const [size, setSize] = useState(SAVED.size);
  const [weight, setWeight] = useState(SAVED.weight);
  const [bodyType, setBodyType] = useState(SAVED.bodyType);

  return (
    <EditPetScreen submitDisabled={!size || !weight.trim()}>
      <div className="flex flex-col gap-4 px-5">
        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <p className="text-title-bold-16 text-foreground">아이의 체구는 어느 정도인가요?</p>
            {/* 몇 kg이 소형인지 보호자가 알 수 없어 기준을 열어 보인다 */}
            <SizeGuide />
          </div>
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
          <div className="flex items-center gap-1">
            <p className="text-title-bold-16 text-foreground">
              {SAVED.name}의 체형은 어떤 편인가요
            </p>
            {/* 만져서 판단하는 기준이라 무엇을 보고 고르는지 알려 준다 */}
            <BodyTypeGuide />
          </div>
          <BodyTypeSlider value={bodyType} onValueChange={setBodyType} />
        </div>
      </div>
    </EditPetScreen>
  );
}
