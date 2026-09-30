// 닉네임 변경. 한 항목만 받아 저장한다.
// UI 시안 기준(mypa_111, 1482-28361·1482-28634)이다.
//
// **지금 닉네임을 채운 채로 연다**(QA No.143, #594). 시안(1482-28361)은 회색 자리 표시로만
// 보이는데, 빈 칸이라 비활성처럼 보이고 한 글자만 고치려 해도 전부 다시 쳐야 했다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { useMutateMyProfile, useQueryMyProfile } from "@/entities/member";
import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

export function EditNicknameView() {
  const router = useRouter();
  /**
   * 사용자가 친 값. 아직 손대지 않았으면 `null`이고, 그동안은 받은 닉네임을 보인다.
   *
   * **받은 값을 상태에 옮겨 담지 않는다.** 조회는 화면이 뜬 뒤에 도착하므로 `useState`
   * 초기값으로는 빈 칸이 된다. 받기 전에 친 값은 도착한 닉네임에 덮이지 않는다.
   */
  const [typed, setTyped] = useState<string | null>(null);
  const { profile } = useQueryMyProfile();
  const { updateProfile, isSaving } = useMutateMyProfile();

  const nickname = typed ?? profile?.nickname ?? "";
  const trimmed = nickname.trim();

  // **닉네임만 보낸다.** 이름·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
  const submit = () => {
    updateProfile({ nickname: trimmed })
      .then(() => router.back())
      // 실패 토스트는 전역 MutationCache가 띄운다(#359). 여기서는 거부만 삼킨다
      .catch(() => {});
  };

  return (
    <SingleInputScreen
      question="어떤 이름으로 불러드릴까요?"
      // 채운 채로 열리므로 손대지 않은 값도 제출할 수 있게 된다. 지금 닉네임을 그대로 보내면
      // 고칠 것 없는 요청이고 서버가 "사용 중인 닉네임"으로 거절할 수도 있어 막는다
      submitDisabled={!trimmed || trimmed === profile?.nickname}
      submitting={isSaving}
      onSubmit={submit}
    >
      <FormField
        label="닉네임"
        variant="underline"
        className="[&>label]:sr-only"
        // 들어오자마자 고칠 수 있게 커서를 둔다. 모바일은 문자 키패드가 뜬다
        // eslint-disable-next-line jsx-a11y/no-autofocus -- 한 칸만 묻는 화면이라 커서가 갈 곳이 여기뿐이다
        autoFocus
        inputMode="text"
        value={nickname}
        onChange={(event) => setTyped(event.target.value)}
        onClear={() => setTyped("")}
      />
    </SingleInputScreen>
  );
}
