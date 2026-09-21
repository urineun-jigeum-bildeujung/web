// 이름 변경. 한 항목만 받아 저장한다.
// 닉네임 변경(`views/edit-nickname`)과 같은 골격이다 — 시안이 따로 없어 그쪽에 맞춘다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMutateMyProfile, useQueryMyProfile } from "@/entities/member";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

export function EditNameView() {
  const router = useRouter();
  const [name, setName] = useState("");
  const { profile } = useQueryMyProfile();
  const { updateProfile, isSaving } = useMutateMyProfile();

  // **이름만 보낸다.** 닉네임·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
  const submit = () => {
    updateProfile({ name: name.trim() })
      .then(() => router.back())
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  return (
    <SingleInputScreen
      headerTitle="내 정보"
      question="이름을 알려주세요"
      submitDisabled={!name.trim()}
      submitting={isSaving}
      onSubmit={submit}
    >
      <FormField
        label="이름"
        variant="underline"
        className="[&>label]:sr-only"
        // 닉네임 화면과 같이 지금 값을 초기값이 아니라 자리 표시로 둔다
        placeholder={profile?.name ?? "홍길동"}
        value={name}
        onChange={(event) => setName(event.target.value)}
        onClear={() => setName("")}
      />
    </SingleInputScreen>
  );
}
