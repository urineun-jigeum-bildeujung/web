// 아이 기본 정보 수정. 사진·이름·품종·나이·성별·중성화를 한 화면에서 고친다.
// 와이어프레임 기준(mypa_121)이라 디자인 확정 시 바뀔 수 있다.
//
// 입력 항목은 온보딩과 같지만 화면 구성이 다르다. 온보딩은 단계로 나뉘고 여기는 한 화면이다.

"use client";

import { useState } from "react";
import { IoChevronForward } from "react-icons/io5";

import { GENDER_OPTIONS, NEUTERED_OPTIONS } from "@/entities/pet";
import { AvatarUploader } from "@/shared/ui/avatar-uploader/avatar-uploader";
import { ChipSelect } from "@/shared/ui/chip-select/chip-select";
import { FormField } from "@/shared/ui/form-field/form-field";

import { EditPetScreen } from "./edit-pet-screen";

/** API 연동 전까지 화면 확인용 값 */
const SAVED = {
  name: "코코",
  breed: "믹스견 (기타)",
  age: "4세",
  birthday: "",
  gender: "",
  neutered: "yes",
};

export function EditPetBasicView() {
  const [name, setName] = useState(SAVED.name);
  const [age, setAge] = useState(SAVED.age);
  const [birthday, setBirthday] = useState(SAVED.birthday);
  const [gender, setGender] = useState(SAVED.gender);
  const [neutered, setNeutered] = useState(SAVED.neutered);

  return (
    <EditPetScreen submitDisabled={!name.trim()}>
      <div className="flex justify-center">
        <AvatarUploader label="아이 사진" onFileChange={() => {}} />
      </div>

      <FormField
        label="아이의 이름을 알려주세요"
        value={name}
        onChange={(event) => setName(event.target.value)}
        onClear={() => setName("")}
      />

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">어떤 견종인지 알려주세요</p>
        {/* 목록이 길어 별도 화면에서 고른다. 그 화면으로 가는 길은 라우터 구조 확정 후 잇는다. */}
        <button
          type="button"
          disabled
          className="flex min-h-11 items-center justify-between rounded-lg border border-input px-3 text-sm disabled:opacity-100"
        >
          <span className="text-foreground">{SAVED.breed}</span>
          <IoChevronForward aria-hidden className="size-4 text-muted-foreground" />
        </button>
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">나이와 생일을 알려주세요</p>
        <p className="text-xs text-muted-foreground">
          정확한 생일을 모른다면 가족이 처음 만난 날을 적어도 좋아요.
        </p>
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
      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">아이의 성별을 알려주세요</p>
        <ChipSelect
          label="아이의 성별"
          options={[...GENDER_OPTIONS]}
          value={gender}
          onValueChange={setGender}
        />
      </div>

      <div className="flex flex-col gap-1.5">
        <p className="text-sm font-medium text-foreground">중성화 여부를 알려주세요</p>
        <ChipSelect
          label="중성화 여부"
          options={[...NEUTERED_OPTIONS]}
          value={neutered}
          onValueChange={setNeutered}
        />
      </div>
    </EditPetScreen>
  );
}
