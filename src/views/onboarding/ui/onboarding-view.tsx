// 온보딩 프로필 등록 화면. 단계 이동과 입력값 보관을 맡고 각 단계를 갈아 끼운다.
// UI 시안 기준(onbo_001~onbo_005, onbo_011)이다.
//
// 화면 안에서 온보딩을 떠나는 길은 두지 않는다. 시안에 건너뛰기도 닫기도 없다.
// 회원가입 직후 반드시 거치는 단계라는 뜻으로 읽힌다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useSyncExternalStore } from "react";

import { BreedPickerStep, type PetProfileDraft, type SpeciesBreed } from "@/entities/pet";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";
import {
  clearDraft,
  getDraft,
  getDraftOnServer,
  setDraft,
  subscribeDraft,
} from "../model/draft-storage";
import { getStepProgress, ONBOARDING_STEPS } from "../model/steps";
import { BasicStep } from "./steps/basic-step";
import { DetailStep } from "./steps/detail-step";
import { DoneStep } from "./steps/done-step";
import { HealthStep } from "./steps/health-step";
import { IntroStep } from "./steps/intro-step";

export function OnboardingView() {
  const router = useRouter();

  // 단계는 새로고침·뒤로가기에서 살아남아야 하므로 URL에 둔다.
  const [step, setStep] = useQueryState(
    "step",
    // 기기 뒤로가기로 이전 단계에 가야 한다. 기본값 replace로 두면 이름·품종까지
    // 입력하다 뒤로가기를 눌렀을 때 온보딩을 통째로 떠나 입력값이 사라진다.
    // WebView 앱으로 감쌀 예정이라 기기 뒤로가기가 실제 사용 경로다
    parseAsStringLiteral(ONBOARDING_STEPS).withDefault("intro").withOptions({ history: "push" }),
  );
  // 새로고침해도 남아야 한다. 단계만 URL에 있고 입력값이 사라지면
  // `?step=health`로 새로고침했을 때 고양이 보호자가 강아지 갈래를 만난다
  const draft = useSyncExternalStore(subscribeDraft, getDraft, getDraftOnServer);

  const patch = (next: Partial<PetProfileDraft>) => setDraft({ ...draft, ...next });
  const progress = getStepProgress(step);

  const pickBreed = (breed: SpeciesBreed) => {
    // 종이 바뀌면 앞서 고른 질환은 그 종의 갈래에 없는 것이 된다.
    // 강아지로 고른 "슬개골 탈구"가 고양이 프로필에 남으면 추천 근거가 거짓이 된다
    const speciesChanged = breed.species !== draft.species;
    patch({
      breedId: breed.id,
      breedName: breed.breedName,
      species: breed.species,
      ...(speciesChanged && { concern: [] }),
    });
    void setStep("detail");
  };

  // 등록을 마쳤으니 남겨 둔 초안을 지운다. 남기면 다음에 들어올 때
  // 앞 사람의 값이 채워져 보인다
  const finish = (next: () => void) => {
    clearDraft();
    next();
  };

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 입력 세 단계에만 진행 표시가 있다. 시안에 머리말은 따로 없다 */}
      {progress && (
        <div className="flex justify-center px-5 py-2">
          <StepProgress {...progress} />
        </div>
      )}

      {step === "intro" && <IntroStep onStart={() => void setStep("basic")} />}

      {step === "basic" && (
        <BasicStep draft={draft} onChange={patch} onNext={() => void setStep("detail")} />
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
          value={draft.breedId}
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
          onGoHome={() => finish(() => router.push("/"))}
          // 시안에 이어지는 화면이 없어 같은 흐름을 처음부터 다시 돈다
          onAddProfile={() => finish(() => void setStep("basic"))}
        />
      )}
    </div>
  );
}
