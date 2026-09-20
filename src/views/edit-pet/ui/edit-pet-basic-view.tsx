// 아이 기본 정보 수정. 사진·이름·종·나이·성별·중성화를 한 화면에서 고친다.
// UI 시안 기준(정보 수정 기본, 1555-49797)이다.
//
// 입력 항목은 온보딩과 같지만 화면 구성이 다르다. 온보딩은 단계로 나뉘고 여기는 한 화면이다.

"use client";

import { useQueryState } from "nuqs";
import { useState } from "react";

import {
  BreedPickerStep,
  GENDER_OPTIONS,
  NEUTERED_OPTIONS,
  parseAge,
  parseBirthDate,
  SPECIES_PARAM,
  type PetDetail,
  type PetSpecies,
} from "@/entities/pet";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";
import { Icon } from "@/shared/ui/icon/icon";

import { useEditPet } from "../model/use-edit-pet";
import { EditPetScreen } from "./edit-pet-screen";
import { EditPetStatus } from "./edit-pet-status";

/** 항목 제목. 시안의 title/bold_16 */
function FieldTitle({ children }: { children: React.ReactNode }) {
  return <p className="text-title-bold-16 text-foreground">{children}</p>;
}

type BasicFormProps = {
  pet: PetDetail;
  isSaving: boolean;
  onSave: (patch: {
    name: string;
    species: "DOG" | "CAT";
    breedId: number;
    age: number;
    birthDate?: string;
    sex: "MALE" | "FEMALE";
    isNeutered: boolean;
  }) => void;
};

function BasicForm({ pet, isSaving, onSave }: BasicFormProps) {
  // 품종 고르기는 별도 라우트로 나가지 않는다. 나가면 이 화면이 언마운트되어
  // 입력하던 이름·나이·성별이 전부 저장값으로 되돌아간다. 온보딩과 같이 단계로 바꿔 끼운다.
  const [picking, setPicking] = useQueryState("picking");
  const [breedId, setBreedId] = useState(pet.breedId);
  const [breedName, setBreedName] = useState(pet.breedName);
  // 품종을 고르면 종도 함께 정해진다. 종은 저장 요청에 실어 보낸다
  const [species, setSpecies] = useState<PetSpecies>(pet.species);
  const [name, setName] = useState(pet.name);
  const [age, setAge] = useState(String(pet.age));
  const [birthday, setBirthday] = useState(pet.birthDate ?? "");
  const [gender, setGender] = useState<string>(pet.gender);
  const [neutered, setNeutered] = useState(pet.neutered ? "yes" : "no");

  const parsedAge = parseAge(age);
  // 생일은 선택이다. 비었으면 보내지 않고, 적었는데 못 알아들으면 저장을 막는다 —
  // 조용히 빼고 보내면 적은 사람은 저장된 줄 안다
  const parsedBirth = parseBirthDate(birthday);
  const birthdayBroken = birthday.trim().length > 0 && parsedBirth === null;

  const submit = () => {
    if (parsedAge === null || birthdayBroken) return;
    onSave({
      name: name.trim(),
      species: SPECIES_PARAM[species],
      breedId,
      age: parsedAge,
      ...(parsedBirth && { birthDate: parsedBirth }),
      sex: gender === "female" ? "FEMALE" : "MALE",
      isNeutered: neutered === "yes",
    });
  };

  if (picking === "breed") {
    return (
      <div className="flex min-h-dvh flex-col">
        {/* 머리말의 뒤로가기(onCancel)는 이 화면으로 돌아와야 한다.
            router.back()은 이 화면을 아예 벗어난다 — nuqs가 쿼리를
            replace로 넣어 picking이 히스토리에 쌓이지 않기 때문이다. */}
        <BreedPickerStep
          value={breedId}
          onConfirm={(next) => {
            setBreedId(next.id);
            setBreedName(next.breedName);
            setSpecies(next.species);
            void setPicking(null);
          }}
          onCancel={() => void setPicking(null)}
        />
      </div>
    );
  }

  return (
    <EditPetScreen
      submitDisabled={!name.trim() || parsedAge === null || birthdayBroken}
      submitting={isSaving}
      onSubmit={submit}
    >
      <div className="flex justify-center">
        <AvatarUploader
          size="lg"
          label="아이 사진"
          placeholder={<Icon name="dog" className="size-12 text-icon-fill-tertiary" />}
          onFileChange={() => {}}
        />
      </div>

      <div className="flex flex-col gap-4 px-5">
        <FormField
          label="아이의 이름을 알려주세요"
          value={name}
          onChange={(event) => setName(event.target.value)}
          onClear={() => setName("")}
        />

        <div className="flex flex-col gap-3">
          <FieldTitle>어떤 종인지 알려주세요</FieldTitle>
          {/* 목록이 길어 별도 단계에서 고른다. 시안은 입력칸 모양에 화살표다 */}
          <button
            type="button"
            onClick={() => void setPicking("breed")}
            aria-label={`품종 고르기. 지금은 ${breedName}`}
            className="flex min-h-11 items-center justify-between rounded-lg border border-border-secondary px-3 text-body-medium-14 text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span>{breedName}</span>
            <Icon name="right" className="text-icon-stroke-default" />
          </button>
        </div>

        <div className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <FieldTitle>나이와 생일을 알려주세요</FieldTitle>
            <p className="text-body-regular-14 text-text-body-secondary">
              정확한 생일을 모른다면 가족이 처음 만난 날을 적어도 좋아요.
            </p>
          </div>
          <div className="flex gap-2">
            <FormField
              label="나이"
              className="flex-1 [&>label]:sr-only"
              inputMode="numeric"
              value={age}
              onChange={(event) => setAge(event.target.value)}
            />
            <FormField
              label="생일"
              className="flex-1 [&>label]:sr-only"
              placeholder="0000. 00. 00"
              value={birthday}
              onChange={(event) => setBirthday(event.target.value)}
            />
          </div>
        </div>

        {/* 라벨을 화면에도 보인다. ChipSelect의 label은 스크린 리더 몫이다. */}
        <div className="flex flex-col gap-3">
          <FieldTitle>아이의 성별을 알려주세요</FieldTitle>
          <ChipSelect
            label="아이의 성별"
            options={[...GENDER_OPTIONS]}
            value={gender}
            onValueChange={setGender}
          />
        </div>

        <div className="flex flex-col gap-3">
          <FieldTitle>중성화 여부를 알려주세요</FieldTitle>
          <ChipSelect
            label="중성화 여부"
            options={[...NEUTERED_OPTIONS]}
            value={neutered}
            onValueChange={setNeutered}
          />
        </div>
      </div>
    </EditPetScreen>
  );
}

export function EditPetBasicView() {
  const { pet, missingPetId, isLoading, error, isSaving, save } = useEditPet();

  if (!pet) {
    return (
      <EditPetScreen submitDisabled>
        <EditPetStatus missingPetId={missingPetId} isLoading={isLoading} error={error} />
      </EditPetScreen>
    );
  }

  // 아이가 바뀌면 입력값도 그 아이의 것으로 새로 시작해야 한다
  return <BasicForm key={pet.id} pet={pet} isSaving={isSaving} onSave={save} />;
}
