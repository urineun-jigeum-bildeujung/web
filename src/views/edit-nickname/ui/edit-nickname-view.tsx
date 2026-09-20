// 닉네임 변경. 한 항목만 받아 저장한다.
// UI 시안 기준(mypa_111, 1482-28361·1482-28634)이다.
//
// 시안(1482-28361)은 지금 쓰는 닉네임을 채워 두지 않고 회색 자리 표시로만 보인다.
// 그래서 조회한 값은 입력 초기값이 아니라 placeholder로 들어간다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMutateMyProfile, useQueryMyProfile } from "@/entities/member";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

export function EditNicknameView() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");
  const { profile } = useQueryMyProfile();
  const { updateProfile, isSaving } = useMutateMyProfile();

  // **닉네임만 보낸다.** 이름·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
  const submit = () => {
    updateProfile({ nickname: nickname.trim() })
      .then(() => router.back())
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  return (
    <SingleInputScreen
      question="어떤 이름으로 불러드릴까요?"
      submitDisabled={!nickname.trim()}
      submitting={isSaving}
      onSubmit={submit}
    >
      <FormField
        label="닉네임"
        variant="underline"
        className="[&>label]:sr-only"
        placeholder={profile?.nickname}
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        onClear={() => setNickname("")}
      />
    </SingleInputScreen>
  );
}
