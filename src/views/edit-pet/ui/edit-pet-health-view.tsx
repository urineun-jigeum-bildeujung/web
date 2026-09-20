// 아이 건강 정보 수정. 신경 쓰이는 곳과 피해야 할 성분을 고친다.
// UI 시안 기준(정보 수정 건강, 1507-43640)이다.
//
// 온보딩에서 고른 값을 여기서 고친다. 한쪽만 자유 입력이면 같은 질환이
// 여러 표기로 쌓여 추천에 쓸 수 없어, 고르는 자리를 온보딩과 같은 것으로 쓴다.

"use client";

import { useState } from "react";

import { HealthPickerField, useQueryHealthOptions, type PetDetail } from "@/entities/pet";
import { CheckboxRow } from "@/shared/ui/checkbox-row/checkbox-row";

import { useEditPet } from "../model/use-edit-pet";
import { EditPetScreen } from "./edit-pet-screen";
import { EditPetStatus } from "./edit-pet-status";

type HealthFormProps = {
  pet: PetDetail;
  isSaving: boolean;
  onSave: (patch: { healthConcerns: string[]; allergies: string[] }) => void;
};

function HealthForm({ pet, isSaving, onSave }: HealthFormProps) {
  // 갈래도 항목도 종마다 다르다. 저장된 아이의 종으로 받는다
  const { options, isLoading, error } = useQueryHealthOptions(pet.species);
  // 빈 배열은 "해당 없음"으로 답한 것이다 — 안 고른 것과 없다고 답한 것을 서버가
  // 가리지 못해, 비어 있으면 켠 것으로 읽는다
  const [concern, setConcern] = useState(pet.healthConcerns);
  const [noConcern, setNoConcern] = useState(pet.healthConcerns.length === 0);
  const [allergy, setAllergy] = useState(pet.allergies.map((item) => item.code));
  const [noAllergy, setNoAllergy] = useState(pet.allergies.length === 0);

  const concernAnswered = concern.length > 0 || noConcern;
  const allergyAnswered = allergy.length > 0 || noAllergy;

  // **선택지를 못 받았으면 고치지 못하게 막는다.** 빈 목록으로 두면 고를 것이 없어
  // "해당 사항이 없어요"를 켜고 저장하게 되고, 그것이 답으로 남는다
  const optionsReady = Boolean(options) && !error;

  return (
    <EditPetScreen
      submitDisabled={!optionsReady || !concernAnswered || !allergyAnswered}
      submitting={isSaving}
      onSubmit={() =>
        onSave({
          healthConcerns: noConcern ? [] : concern,
          allergies: noAllergy ? [] : allergy,
        })
      }
    >
      <div className="flex flex-col gap-5 px-5">
        {/* 대기 표시 없음 — 고르는 자리가 잠긴 채 회색으로 차 있어 자리가 무너지지 않는다.
            Skeleton으로 덮으면 "왜 못 고치는지"를 말해 주는 이 문구가 사라진다.
            선택지가 없으면 왜 못 고치는지 알려야 한다. 잠긴 자리만 보이면 고장으로 읽힌다 */}
        {!optionsReady && (
          <p
            role={error ? "alert" : "status"}
            className="text-body-medium-14 text-text-body-secondary"
          >
            {isLoading ? "선택지를 불러오는 중이에요" : "선택지를 불러오지 못했어요"}
          </p>
        )}
        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-bold-16 text-foreground">
              아이가 튼튼할 수 있도록
              <br />
              평소 신경 쓰이는 곳을 알려주세요
            </h2>
            <p className="text-body-medium-14 text-text-body-secondary">
              걱정되는 부분을 알려주시면 꼭 맞는 상품을 찾아드릴게요.
            </p>
          </div>
          <HealthPickerField
            title="걱정되는 질환"
            groups={options?.concerns ?? []}
            value={concern}
            onChange={setConcern}
            disabled={noConcern || !optionsReady}
          />
          <CheckboxRow
            label="해당 사항이 없어요"
            className="min-h-8"
            checked={noConcern}
            onCheckedChange={(next) => {
              setNoConcern(next);
              // 켠 채로 값을 남겨 두면 체크를 껐을 때 그것이 답으로 되살아난다
              if (next) setConcern([]);
            }}
          />
        </section>

        <section className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <h2 className="text-title-bold-16 text-foreground">피해야 할 알러지 성분이 있나요</h2>
            <p className="text-body-medium-14 text-text-body-secondary">
              안심하고 먹을 수 있도록 알러지 유발 성분은 미리 걸러낼게요.
            </p>
          </div>
          <div className="flex flex-col gap-2">
            <HealthPickerField
              title="피해야 할 성분"
              groups={options?.allergies ?? []}
              value={allergy}
              onChange={setAllergy}
              disabled={noAllergy || !optionsReady}
            />
            {/* 시안이 알러지 쪽에만 예시를 남긴다 */}
            <p className="text-caption-regular-12 text-text-body-tertiary">
              ex) 복숭아, 닭, 연어, 밀가루 등
            </p>
          </div>
          <CheckboxRow
            label="해당 사항이 없어요"
            className="min-h-8"
            checked={noAllergy}
            onCheckedChange={(next) => {
              setNoAllergy(next);
              if (next) setAllergy([]);
            }}
          />
        </section>
      </div>
    </EditPetScreen>
  );
}

export function EditPetHealthView() {
  const { pet, missingPetId, isLoading, error, isSaving, save } = useEditPet();

  if (!pet) {
    return (
      <EditPetScreen submitDisabled>
        <EditPetStatus missingPetId={missingPetId} isLoading={isLoading} error={error} />
      </EditPetScreen>
    );
  }

  // 아이가 바뀌면 고른 값도 그 아이의 것으로 새로 시작해야 한다
  return <HealthForm key={pet.id} pet={pet} isSaving={isSaving} onSave={save} />;
}
