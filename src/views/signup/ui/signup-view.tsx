// 회원가입 화면. 약관 동의와 닉네임을 차례로 받는다.
// UI 시안 기준(sign_001 약관 동의 1117-5438·1117-5503, 닉네임 1117-5567·1117-5582)이다.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { hasSession } from "@/shared/api/token-store";
import { toastAppError } from "@/shared/lib/app-toast";
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
import { signUp } from "../api/signup";
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
  // 시안대로 백엔드가 만든 추천 닉네임이 미리 채워진 상태로 시작한다. 콜백 화면이
  // 교환 응답의 `nickname`을 쿼리에 실어 넘긴다. 주소창으로 바로 들어오면 비어 있다
  const suggested = useSearchParams().get("nickname") ?? "";
  const [nickname, setNickname] = useState(suggested);
  const [submitting, setSubmitting] = useState(false);

  // 소셜 인증을 거치지 않고 들어오면 가입을 마칠 수 없다. 가입 요청은 토큰의 `authId`로
  // "누구의 가입인지"를 알기 때문에(`@AuthId`), 토큰이 없으면 마지막에 401이 난다.
  // 약관과 닉네임을 다 채운 뒤에 막히지 않도록 들어오는 자리에서 돌려보낸다.
  // 서버에서는 보관소가 비어 있어 늘 참이므로 효과 안에서만 본다.
  useEffect(() => {
    if (!hasSession()) {
      router.replace("/login");
    }
  }, [router]);

  const submit = () => {
    setSubmitting(true);
    signUp({ nickname: nickname.trim(), checkedIds: checked })
      // 시안 메모대로 가입을 마치면 별도 과정 없이 바로 들어간다.
      // 뒤로가기로 가입 화면에 되돌아오지 않게 replace로 둔다
      .then(() => router.replace("/onboarding"))
      .catch((error: unknown) => {
        toastAppError(toAppMessageCode(error), error);
        setSubmitting(false);
      });
  };

  const toggleOne = (id: string, next: boolean) =>
    setChecked((prev) => (next ? [...prev, id] : prev.filter((entry) => entry !== id)));

  // 주소로 단계를 건너뛸 수 있다. 필수 약관 없이 닉네임 단계에 들어오면 그대로
  // 가입이 끝나므로, 채우지 않았으면 약관부터 보여준다
  if (step === "nickname" && canProceed(checked)) {
    return (
      <SingleInputScreen
        headerTitle="회원가입"
        question="닉네임을 적어주세요"
        submitLabel="다음으로"
        submitDisabled={nickname.trim().length < MIN_NICKNAME || submitting}
        onSubmit={submit}
      >
        <FormField
          label="닉네임"
          variant="underline"
          className="[&>label]:sr-only"
          // 시안의 예시 닉네임. 회색이라 초기값이 아니라 자리 표시다
          placeholder="졸린고양이 17"
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
      <PageHeader title="회원가입" />

      <main className="flex flex-1 flex-col px-5 pt-10">
        <h1 className="text-body-medium-18 text-balance text-foreground">
          우리 아이의 맞춤 관리를 위해
          <br />
          안전하게 약관에 동의해 주세요.
        </h1>

        <section className="flex flex-col gap-3 pt-6">
          <AgreementRow
            master
            required
            label="[필수] 서비스 이용약관 전체 동의"
            checked={isAllChecked(checked, REQUIRED_IDS)}
            onCheckedChange={(next) => setChecked((prev) => toggleGroup(prev, REQUIRED_IDS, next))}
          />
          <div className="flex flex-col gap-1">
            {AGREEMENTS.filter((item) => item.required).map((item) => (
              <AgreementRow
                key={item.id}
                required
                label={item.label}
                description={item.description}
                href={item.href}
                checked={checked.includes(item.id)}
                onCheckedChange={(next) => toggleOne(item.id, next)}
              />
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-3 pt-7">
          <AgreementRow
            master
            label="[선택] 서비스 이용약관 전체 동의"
            checked={isAllChecked(checked, OPTIONAL_IDS)}
            onCheckedChange={(next) => setChecked((prev) => toggleGroup(prev, OPTIONAL_IDS, next))}
          />
          <div className="flex flex-col gap-1">
            {/* 시안은 선택 항목에도 본문 화살표가 있으나 갈 화면이 없어 그리지 않는다 */}
            {AGREEMENTS.filter((item) => !item.required).map((item) => (
              <AgreementRow
                key={item.id}
                label={item.label}
                description={item.description}
                href={item.href}
                checked={checked.includes(item.id)}
                onCheckedChange={(next) => toggleOne(item.id, next)}
              />
            ))}
          </div>
        </section>
      </main>

      <BottomActionBar>
        <Button disabled={!canProceed(checked)} onClick={() => void setStep("nickname")}>
          다음으로
        </Button>
      </BottomActionBar>
    </div>
  );
}
