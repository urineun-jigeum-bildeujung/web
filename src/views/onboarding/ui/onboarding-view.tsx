// 온보딩 프로필 등록 화면. 단계 이동과 입력값 보관을 맡고 각 단계를 갈아 끼운다.
// 와이어프레임 기준(onbo_001~onbo_005)이라 디자인 확정 시 바뀔 수 있다.

"use client";

import { useRouter } from "next/navigation";
import { IoClose } from "react-icons/io5";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { EMPTY_PROFILE_DRAFT, type PetProfileDraft, type PetSpecies } from "@/entities/pet";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogTitle,
} from "@/shared/ui/alert-dialog";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { StepProgress } from "@/shared/ui/step-progress/step-progress";
import { getStepProgress, ONBOARDING_STEPS } from "../model/steps";
import { BasicStep } from "./steps/basic-step";
import { BreedStep } from "./steps/breed-step";
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
    parseAsStringLiteral(ONBOARDING_STEPS).withDefault("intro"),
  );
  const [draft, setDraft] = useState<PetProfileDraft>(EMPTY_PROFILE_DRAFT);
  const [exitOpen, setExitOpen] = useState(false);

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
        // 시안은 진행 표시가 왼쪽, 닫기가 오른쪽이다.
        // left를 주면 기본 leading 버튼이 대체되므로 닫기는 right에 둔다.
        <PageHeader
          leading="none"
          left={progress ? <StepProgress {...progress} className="w-32" /> : undefined}
          right={
            <button
              type="button"
              aria-label="닫기"
              onClick={() => setExitOpen(true)}
              className="flex size-11 items-center justify-center rounded-md text-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <IoClose aria-hidden className="size-6" />
            </button>
          }
        />
      )}

      {step === "intro" && (
        <IntroStep onStart={() => void setStep("basic")} onSkip={() => router.push("/")} />
      )}

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
        <BreedStep
          value={draft.breed}
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

      <AlertDialog open={exitOpen} onOpenChange={setExitOpen}>
        <AlertDialogContent>
          <AlertDialogTitle>프로필 작성을 그만둘까요?</AlertDialogTitle>
          <AlertDialogDescription>
            지금까지 알려주신 내용은 저장되지 않아요. 나중에 다시 작성할 수 있어요.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel className="min-h-11">취소</AlertDialogCancel>
            <AlertDialogAction className="min-h-11" onClick={() => router.push("/")}>
              그만두기
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
