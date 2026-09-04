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
  // 시안은 가입 경로에서 받은 닉네임이 미리 채워진 상태를 그렸다. 그 경로가 아직 없어
  // 가짜 값을 넣어 두면 아무것도 하지 않아도 다음으로 넘어가 이 단계가 무의미해진다
  const [nickname, setNickname] = useState("");

  const toggleOne = (id: string, next: boolean) =>
    setChecked((prev) => (next ? [...prev, id] : prev.filter((entry) => entry !== id)));

  // 주소로 단계를 건너뛸 수 있다. 필수 약관 없이 닉네임 단계에 들어오면 그대로
  // 가입이 끝나므로, 채우지 않았으면 약관부터 보여준다
  if (step === "nickname" && canProceed(checked)) {
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
