// 닉네임 변경. 한 항목만 받아 저장한다.
// 와이어프레임 기준(mypa_111, mypa_111_입력중)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

const CURRENT_NICKNAME = "청주 불주먹";

export function EditNicknameView() {
  const router = useRouter();
  const [nickname, setNickname] = useState(CURRENT_NICKNAME);

  return (
    <SingleInputScreen
      question="어떤 이름으로 불러드릴까요?"
      submitDisabled={!nickname.trim()}
      onSubmit={() => router.back()}
    >
      <FormField
        label="닉네임"
        className="[&>label]:sr-only"
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        onClear={() => setNickname("")}
      />
    </SingleInputScreen>
  );
}
