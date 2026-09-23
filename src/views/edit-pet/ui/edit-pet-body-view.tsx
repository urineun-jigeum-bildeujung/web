// 아이 체형 수정. 체구와 몸무게, 체형을 고친다.
// UI 시안 기준(정보 수정 체형, 1507-43555)이다.
//
// 저장된 값은 상세 조회에서 온다(#268). 고치는 것만 보내므로 이름·나이는 건드리지 않는다.
//
// **값이 도착한 뒤에 입력 폼을 마운트한다.** 효과 안에서 setState로 채우면 React가 연쇄
// 렌더로 잡고(`react-hooks/set-state-in-effect`), 아이를 바꿨을 때 옛 값이 남을 여지도 생긴다.

"use client";

import { useState } from "react";

import {
  BodyTypeGuide,
  BodyTypeSlider,
  parseWeight,
  SIZE_OPTIONS,
  SizeGuide,
  type PetDetail,
} from "@/entities/pet";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";

import { useEditPet } from "../model/use-edit-pet";
import { EditPetScreen } from "./edit-pet-screen";
import { EditPetStatus } from "./edit-pet-status";

const SIZE_PARAM = { small: "SMALL", medium: "MEDIUM", large: "LARGE" } as const;

type BodyFormProps = {
  pet: PetDetail;
  isSaving: boolean;
  onSave: (patch: { size?: "SMALL" | "MEDIUM" | "LARGE"; weight: number; bcs: number }) => void;
};

function BodyForm({ pet, isSaving, onSave }: BodyFormProps) {
  // 고양이는 체구를 묻지 않는다(#391). 서버도 고양이의 size를 null로 둔다
  const isCat = pet.species === "cat";
  const [size, setSize] = useState(pet.size);
  const [weight, setWeight] = useState(String(pet.weight));
  // 서버는 체형을 1부터, 화면 눈금은 0부터 센다
  const [bodyType, setBodyType] = useState(pet.bcs - 1);

  const parsedWeight = parseWeight(weight);

  return (
    <EditPetScreen
      submitDisabled={(!isCat && !size) || parsedWeight === null}
      submitting={isSaving}
      onSubmit={() =>
        parsedWeight !== null &&
        onSave({
          ...(!isCat && size && { size: SIZE_PARAM[size] }),
          weight: parsedWeight,
          bcs: bodyType + 1,
        })
      }
    >
      <div className="flex flex-col gap-4 px-5">
        {!isCat && (
          <div className="flex flex-col gap-3">
            <div className="flex items-center gap-1">
              <p className="text-title-bold-16 text-foreground">아이의 체구는 어느 정도인가요?</p>
              {/* 몇 kg이 소형인지 보호자가 알 수 없어 기준을 열어 보인다 */}
              <SizeGuide />
            </div>
            <ChipSelect
              label="아이의 체구"
              options={[...SIZE_OPTIONS]}
              value={size ?? ""}
              onValueChange={(next) => setSize(next as PetDetail["size"])}
            />
          </div>
        )}

        <FormField
          label={`${pet.name}의 대략적인 몸무게를 알려주세요`}
          hint="정확하지 않아도 괜찮아요, 대략적으로 적어주세요"
          value={weight}
          onChange={(event) => setWeight(event.target.value)}
          onClear={() => setWeight("")}
        />

        <div className="flex flex-col gap-3">
          <div className="flex items-center gap-1">
            <p className="text-title-bold-16 text-foreground">{pet.name}의 체형은 어떤 편인가요</p>
            {/* 만져서 판단하는 기준이라 무엇을 보고 고르는지 알려 준다 */}
            <BodyTypeGuide />
          </div>
          <BodyTypeSlider value={bodyType} onValueChange={setBodyType} />
        </div>
      </div>
    </EditPetScreen>
  );
}

export function EditPetBodyView() {
  const { pet, missingPetId, isLoading, error, isSaving, save } = useEditPet();

  if (!pet) {
    return (
      <EditPetScreen submitDisabled>
        <EditPetStatus missingPetId={missingPetId} isLoading={isLoading} error={error} />
      </EditPetScreen>
    );
  }

  // 아이가 바뀌면 입력값도 그 아이의 것으로 새로 시작해야 한다
  return <BodyForm key={pet.id} pet={pet} isSaving={isSaving} onSave={save} />;
}
