// 닉네임 변경. 한 항목만 받아 저장한다.
// UI 시안 기준(mypa_111, 1482-28361·1482-28634)이다.

"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

import { FormField } from "@/shared/ui/form-field/form-field";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

/** 지금 쓰는 닉네임. 시안(1482-28361)은 이 값을 채워 두지 않고 회색 자리 표시로만 보인다 */
const CURRENT_NICKNAME = "졸린고양이 17";

export function EditNicknameView() {
  const router = useRouter();
  const [nickname, setNickname] = useState("");

  return (
    <SingleInputScreen
      question="어떤 이름으로 불러드릴까요?"
      submitDisabled={!nickname.trim()}
      onSubmit={() => router.back()}
    >
      <FormField
        label="닉네임"
        variant="underline"
        className="[&>label]:sr-only"
        placeholder={CURRENT_NICKNAME}
        value={nickname}
        onChange={(event) => setNickname(event.target.value)}
        onClear={() => setNickname("")}
      />
    </SingleInputScreen>
  );
}
