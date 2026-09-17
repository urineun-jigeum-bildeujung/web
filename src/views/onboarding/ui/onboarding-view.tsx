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
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";
import {
  clearDraft,
  getDraft,
  getDraftOnServer,
  setDraft,
  subscribeDraft,
} from "../model/draft-storage";
import { useMutateRegisterPet } from "../api/use-mutate-register-pet";
import { getStepProgress, ONBOARDING_STEPS } from "../model/steps";
import { parseBirthDate, toRegisterRequest } from "../model/to-register-request";
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
  const { registerPet, isSubmitting } = useMutateRegisterPet();
  const progress = getStepProgress(step);

  const pickBreed = (breed: SpeciesBreed) => {
    // 종이 바뀌면 앞서 고른 질환도 알레르기도 그 종의 목록에 없는 것이 된다.
    // 강아지로 고른 "슬개골 탈구"가 고양이 프로필에 남으면 추천 근거가 거짓이 되고,
    // 알레르기는 종별로 갈리는 코드가 있어(고양이 전용 BONITO, 강아지 전용 INSECT)
    // 그대로 두면 새 종에 없는 코드를 등록 요청에 실어 보낸다
    const speciesChanged = breed.species !== draft.species;
    patch({
      breedId: breed.id,
      breedName: breed.breedName,
      species: breed.species,
      ...(speciesChanged && { concern: [], allergy: [] }),
    });
    void setStep("detail");
  };

  // 등록을 마쳤으니 남겨 둔 초안을 지운다. 남기면 다음에 들어올 때
  // 앞 사람의 값이 채워져 보인다
  const finish = (next: () => void) => {
    clearDraft();
    next();
  };

  /**
   * 마지막 단계의 "작성 완료". 여기서 프로필이 서버에 등록된다.
   *
   * **실패하면 초안을 지우지 않는다.** 지우면 여섯 단계를 처음부터 다시 채워야 한다.
   * 완료 화면으로도 보내지 않는다 — 등록되지 않았는데 됐다고 알리는 셈이다.
   */
  const submit = () => {
    // 적었는데 못 알아들은 생일은 조용히 빼지 않는다. 입력 단계가 막고 있지만
    // 초안이 기기에 남아 `?step=health`로 바로 들어오면 그 가드를 거치지 않는다.
    // 빼고 보내면 사용자는 적었으니 저장된 줄 안다 — 고치라고 그 칸으로 돌려보낸다
    if (draft.birthday.trim() && parseBirthDate(draft.birthday) === null) {
      toastAppError(APP_MESSAGE_CODE.common.invalidInput);
      void setStep("detail");
      return;
    }

    const request = toRegisterRequest(draft);
    if (!request) {
      // 단계마다 다음 버튼이 막고 있어 여기까지 오면 화면이 못 잡은 값이다
      toastAppError(APP_MESSAGE_CODE.common.invalidInput);
      return;
    }

    registerPet(request)
      .then(() => void setStep("done"))
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
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
          onSubmit={submit}
          isSubmitting={isSubmitting}
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
