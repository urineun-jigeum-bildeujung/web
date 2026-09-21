// 생년월일 변경. 한 항목만 받아 저장한다.
// 닉네임 변경(`views/edit-nickname`)과 같은 골격이다 — 시안이 따로 없어 그쪽에 맞춘다.
//
// **치는 대로 `0000. 00. 00`으로 맞춘다.** 아이 생일 입력과 같은 규칙을 쓴다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMutateMyProfile, useQueryMyProfile } from "@/entities/member";
import { toAppMessageCode } from "@/shared/api/error-message";
import { formatBirthDateInput, parseBirthDate } from "@/shared/lib/birth-date";
import { toastAppError } from "@/shared/lib/app-toast";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

export function EditBirthView() {
  const router = useRouter();
  const [birth, setBirth] = useState("");
  const { profile } = useQueryMyProfile();
  const { updateProfile, isSaving } = useMutateMyProfile();

  // 여덟 자를 다 쳤는데 달력에 없는 날이면 알린다. 그대로 보내면 서버가 본문을 통째로 거절한다
  const parsed = parseBirthDate(birth);
  const broken = birth.replace(/\D/g, "").length === 8 && parsed === null;

  // **생년월일만 보낸다.** 닉네임·이름까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
  const submit = () => {
    if (parsed === null) return;
    updateProfile({ birth: parsed })
      .then(() => router.back())
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  return (
    <SingleInputScreen
      headerTitle="내 정보"
      question="생년월일을 알려주세요"
      submitDisabled={parsed === null}
      submitting={isSaving}
      onSubmit={submit}
    >
      <FormField
        label="생년월일"
        variant="underline"
        className="[&>label]:sr-only"
        inputMode="numeric"
        placeholder={profile?.birth?.replaceAll("-", ". ") ?? "0000. 00. 00"}
        value={birth}
        onChange={(event) => setBirth(formatBirthDateInput(event.target.value))}
        onClear={() => setBirth("")}
        error={broken ? "달력에 없는 날이에요" : undefined}
      />
    </SingleInputScreen>
  );
}
