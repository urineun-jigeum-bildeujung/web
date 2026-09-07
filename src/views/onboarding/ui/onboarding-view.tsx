// 온보딩 프로필 등록 화면. 단계 이동과 입력값 보관을 맡고 각 단계를 갈아 끼운다.
// 와이어프레임 기준(onbo_001~onbo_005)이라 디자인 확정 시 바뀔 수 있다.
//
// 화면 안에서 온보딩을 떠나는 길은 두지 않는다. 확정본에 건너뛰기도 닫기도 없다.
// 회원가입 직후 반드시 거치는 단계라는 뜻으로 읽힌다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import {
  BreedPickerStep,
  EMPTY_PROFILE_DRAFT,
  type PetProfileDraft,
  type PetSpecies,
} from "@/entities/pet";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";
import { getStepProgress, ONBOARDING_STEPS } from "../model/steps";
import { BasicStep } from "./steps/basic-step";
import { DetailStep } from "./steps/detail-step";
import { DoneStep } from "./steps/done-step";
import { HealthStep } from "./steps/health-step";
import { IntroStep } from "./steps/intro-step";

export function OnboardingView() {
  const router = useRouter();

  // 단계는 새로고침·뒤로가기에서 살아남아야 하므로 URL에 둔다.
  // 입력값은 시안의 이탈 모달이 "저장되지 않아요"라고 알리므로 컴포넌트 상태로 든다.
  const [step, setStep] = useQueryState(
    "step",
    // 기기 뒤로가기로 이전 단계에 가야 한다. 기본값 replace로 두면 이름·품종까지
    // 입력하다 뒤로가기를 눌렀을 때 온보딩을 통째로 떠나 입력값이 사라진다.
    // WebView 앱으로 감쌀 예정이라 기기 뒤로가기가 실제 사용 경로다
    parseAsStringLiteral(ONBOARDING_STEPS).withDefault("intro").withOptions({ history: "push" }),
  );
  const [draft, setDraft] = useState<PetProfileDraft>(EMPTY_PROFILE_DRAFT);

  const patch = (next: Partial<PetProfileDraft>) => setDraft((prev) => ({ ...prev, ...next }));
  const progress = getStepProgress(step);

  const pickBreed = (breed: string, species: PetSpecies) => {
    patch({ breed, species });
    void setStep("detail");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 도입부와 완료 화면에는 상단 바가 없다 */}
      {step !== "intro" && step !== "done" && (
        // 확정본 머리말에는 진행 표시만 있다. 닫기 버튼은 두지 않는다
        <PageHeader
          leading="none"
          left={progress ? <StepProgress {...progress} className="w-32" /> : undefined}
        />
      )}

      {step === "intro" && <IntroStep onStart={() => void setStep("basic")} />}

      {step === "basic" && (
        <BasicStep
          draft={draft}
          onChange={patch}
          onPrev={() => void setStep("intro")}
          onNext={() => void setStep("detail")}
        />
      )}

      {step === "detail" && (
        <DetailStep
          draft={draft}
          onChange={patch}
          onOpenBreedPicker={() => void setStep("breed")}
          onPrev={() => void setStep("basic")}
          onNext={() => void setStep("health")}
        />
      )}

      {step === "breed" && (
        <BreedPickerStep
          value={draft.breed}
          species={draft.species}
          onConfirm={pickBreed}
          onCancel={() => void setStep("detail")}
        />
      )}

      {step === "health" && (
        <HealthStep
          draft={draft}
          onChange={patch}
          onPrev={() => void setStep("detail")}
          onSubmit={() => void setStep("done")}
        />
      )}

      {step === "done" && (
        <DoneStep
          petName={draft.name}
          onGoHome={() => router.push("/")}
          onGoRecommendation={() => router.push("/")}
        />
      )}
    </div>
  );
}
