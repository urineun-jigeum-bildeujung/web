// 회원가입 화면. 약관 동의와 닉네임을 차례로 받는다.
// 와이어프레임 기준(sign_011, sign_011_동의완료, sign_012, sign_012_입력중)이라
// 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { FormField } from "@/shared/ui/form-field/form-field";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { SingleInputScreen } from "@/shared/ui/single-input-screen/single-input-screen";

import {
  AGREEMENTS,
  canProceed,
  isAllChecked,
  OPTIONAL_IDS,
  REQUIRED_IDS,
  toggleGroup,
} from "../model/agreements";
import { AgreementRow } from "./agreement-row";

const STEPS = ["terms", "nickname"] as const;

const MIN_NICKNAME = 2;

export function SignupView() {
  const router = useRouter();
  // 뒤로가기로 이전 단계에 가야 한다. 기본값 replace로 두면 회원가입을 통째로 떠난다
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("terms").withOptions({ history: "push" }),
  );

  const [checked, setChecked] = useState<string[]>([]);
  // 가입 경로에서 받은 닉네임이 미리 채워져 있는 상태다(시안 메모). 실제로는 서버가 준다
  const [nickname, setNickname] = useState("훈련고양이 17");

  const toggleOne = (id: string, next: boolean) =>
    setChecked((prev) => (next ? [...prev, id] : prev.filter((entry) => entry !== id)));

  if (step === "nickname") {
    return (
      <SingleInputScreen
        question="닉네임을 적어주세요"
        submitLabel="다음으로"
        submitDisabled={nickname.trim().length < MIN_NICKNAME}
        // 시안 메모대로 가입을 마치면 별도 과정 없이 바로 들어간다
        onSubmit={() => router.push("/onboarding")}
      >
        <FormField
          label="닉네임"
          className="[&>label]:sr-only"
          value={nickname}
          onChange={(event) => setNickname(event.target.value)}
          onClear={() => setNickname("")}
          maxLength={20}
        />
      </SingleInputScreen>
    );
  }

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader />

      <main className="flex flex-1 flex-col gap-1 px-4 pt-2">
        <h1 className="text-xl font-bold text-balance text-foreground">
          우리 아이의 맞춤 관리를 위해
          <br />
          안전하게 약관에 동의해 주세요.
        </h1>

        <section className="flex flex-col pt-4">
          <AgreementRow
            master
            label="[필수] 서비스 이용약관 전체 동의"
            checked={isAllChecked(checked, REQUIRED_IDS)}
            onCheckedChange={(next) => setChecked((prev) => toggleGroup(prev, REQUIRED_IDS, next))}
          />
          {AGREEMENTS.filter((item) => item.required).map((item) => (
            <AgreementRow
              key={item.id}
              label={item.label}
              description={item.description}
              href={item.href}
              checked={checked.includes(item.id)}
              onCheckedChange={(next) => toggleOne(item.id, next)}
              className="pl-6"
            />
          ))}
        </section>

        <section className="flex flex-col pt-4">
          <AgreementRow
            master
            label="[선택] 서비스 이용약관 전체 동의"
            checked={isAllChecked(checked, OPTIONAL_IDS)}
            onCheckedChange={(next) => setChecked((prev) => toggleGroup(prev, OPTIONAL_IDS, next))}
          />
          {AGREEMENTS.filter((item) => !item.required).map((item) => (
            <AgreementRow
              key={item.id}
              label={item.label}
              href={item.href}
              checked={checked.includes(item.id)}
              onCheckedChange={(next) => toggleOne(item.id, next)}
              className="pl-6"
            />
          ))}
        </section>
      </main>

      <BottomActionBar>
        <Button
          className="min-h-12 w-full"
          disabled={!canProceed(checked)}
          onClick={() => void setStep("nickname")}
        >
          다음으로
        </Button>
      </BottomActionBar>
    </div>
  );
}
