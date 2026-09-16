// 리뷰 작성 화면. 별점과 함께 아이의 실제 반응을 두 단계로 받는다.
// UI 시안 기준(리뷰작성 1884-29158·29400 1단계, 1884-29257·29325 2단계)이다.
//
// 이 화면이 이 서비스의 입력단이다. 기호성·배변·피부·활력·알러지는 보호자가 그동안
// 혼자 추측하던 신호이고, 여기서 모인 것이 다음 추천의 근거가 된다.
// 어느 아이가 먹었는지를 함께 받는 것도 같은 이유다 — 아이를 모르면 쓸 수 없는 답이다.
//
// 필수는 별점·사용 기간·아이·후기 글이고 반응 문항은 전부 선택이다. 문항을 필수로 묶으면
// 모르는 항목까지 아무 답이나 고르게 되어 근거가 흐려진다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useState } from "react";

import { PetSwitcher, type PetSummary } from "@/entities/pet";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppSuccess } from "@/shared/lib/app-toast";
import { Badge } from "@/shared/ui/badge/badge";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Rating } from "@/shared/ui/rating/rating";
import { Textarea } from "@/shared/ui/textarea";

import { answeredSummary, HANDLING_QUESTION, RATING_STEP_QUESTIONS } from "../model/questions";
import { PhotoPicker } from "./photo-picker";
import { ProductRow } from "./product-row";
import { RatingInput } from "./rating-input";
import { ResponseSelect } from "./response-select";

type ReviewWriteViewProps = {
  /** 리뷰를 달 구매 항목의 임시 식별자. API 계약 확정 전까지 쓴다 */
  orderItemId: string | undefined;
};

const STEPS = ["rating", "detail"] as const;

const PETS: PetSummary[] = [
  { id: "p1", name: "소리" },
  { id: "p2", name: "냥냥이" },
];

const MIN_TEXT = 10;
const MAX_TEXT = 300;

// 목 데이터. 실제로는 orderItemId로 무엇을 샀는지 받아온다
const PRODUCT = {
  name: "오메가3 피쉬오일 60캡슐",
  option: "[옵션] 60정 1병",
  repurchase: "재구매 2회",
};

/** 시안 섹션 제목 줄. 굵은 14 글자 옆에 필수·선택 배지 */
function SectionTitle({ children, required }: { children: string; required?: boolean }) {
  return (
    <h2 className="flex items-center gap-2 px-5 pt-3 text-label-bold-14 text-foreground">
      {children}
      <Badge tone={required ? "brand" : "default"}>{required ? "필수" : "선택"}</Badge>
    </h2>
  );
}

export function ReviewWriteView({ orderItemId }: ReviewWriteViewProps) {
  const router = useRouter();
  const daysId = useId();
  // 단계는 뒤로가기로 되돌아와야 하므로 URL에 두고 push한다. 온보딩과 같은 판단이다
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("rating").withOptions({ history: "push" }),
  );
  const [score, setScore] = useState(0);
  const [days, setDays] = useState("");
  const [responses, setResponses] = useState<Record<string, string | undefined>>({});
  const [petId, setPetId] = useState<string>();
  const [photos, setPhotos] = useState<File[]>([]);
  const [text, setText] = useState("");

  const answer = (key: string, value: string) =>
    setResponses((prev) => ({ ...prev, [key]: value }));

  // 사진과 반응 문항은 선택이다. 나머지는 없으면 다음 추천에 쓸 수 없어 받아야 한다
  const ratingReady = score > 0 && days.length > 0;
  const ready = ratingReady && petId !== undefined && text.trim().length >= MIN_TEXT;

  const submit = () => {
    // API 계약 확정 전이라 보내지 않는다. 시안에 완료 화면이 없어 토스트로 알리고 목록으로 간다
    void orderItemId;
    toastAppSuccess(APP_MESSAGE_CODE.review.submitted);
    router.push("/mypage/reviews?tab=written");
  };

  return (
    // 흰 섹션 사이로 회색 바탕이 8px 띠로 비친다
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      <PageHeader title="리뷰 작성" className="bg-background" />

      {step === "rating" ? (
        <>
          <main className="flex flex-1 flex-col gap-2">
            <section className="flex flex-col bg-background">
              <ProductRow {...PRODUCT} />

              <div className="flex flex-col items-center gap-2 px-5 pt-2 pb-4">
                <h2 className="flex items-start gap-2 text-title-bold-16 text-foreground">
                  상품은 만족스러우셨나요?
                  <Badge tone="brand">필수</Badge>
                </h2>
                <RatingInput value={score} onChange={setScore} label="상품 만족도" />
              </div>

              <SectionTitle required>사용 기간</SectionTitle>
              <div className="px-5 pt-2 pb-5">
                {/* 회색 상자 안에 작은 흰 입력칸. 어디를 눌러도 입력칸에 초점이 간다 */}
                <label
                  htmlFor={daysId}
                  className="flex items-center gap-2 rounded-xl bg-surface-secondary px-3 py-2 text-body-medium-14 text-foreground"
                >
                  <Input
                    id={daysId}
                    // 감싼 label의 글자("일째 사용 중")가 이름에 섞이지 않게 따로 준다
                    aria-label="사용 기간"
                    // 숫자만 받는 칸이라 모바일에서 숫자 키패드가 뜨게 한다
                    inputMode="numeric"
                    pattern="[0-9]*"
                    maxLength={3}
                    value={days}
                    onChange={(event) => setDays(event.target.value.replace(/\D/g, ""))}
                    className="h-8 w-12 border-border-default bg-background p-1.5 text-center text-body-medium-14"
                  />
                  일째 사용 중
                </label>
              </div>
            </section>

            <section className="flex flex-col bg-background">
              <div className="flex flex-col gap-1 px-5 py-4">
                <h2 className="flex items-center gap-2 text-title-bold-16 text-foreground">
                  A 추천을 위해 알려주세요
                  <Badge>선택</Badge>
                </h2>
                <p className="text-label-medium-12 text-text-body-secondary">
                  해당하는 항목만 골라 답변해주세요
                </p>
              </div>
              {RATING_STEP_QUESTIONS.map((question) => (
                <ResponseSelect
                  key={question.key}
                  question={question}
                  value={responses[question.key]}
                  onValueChange={(value) => answer(question.key, value)}
                />
              ))}
            </section>
          </main>

          <BottomActionBar>
            <Button disabled={!ratingReady} onClick={() => void setStep("detail")}>
              다음
            </Button>
          </BottomActionBar>
        </>
      ) : (
        <>
          <main className="flex flex-1 flex-col gap-2">
            <section className="flex flex-col bg-background">
              <ProductRow {...PRODUCT} />

              {/* 1단계에서 답한 것을 되짚어 준다. 답한 문항만 배지로 보인다 */}
              <div className="px-5 py-3">
                <div className="flex flex-col gap-2 rounded-lg border border-border-default p-4">
                  <Rating value={score} size="md" showValue />
                  <p className="text-label-medium-11 text-foreground">{days}일째 사용 중</p>
                  {answeredSummary(responses).length > 0 && (
                    <ul className="flex flex-wrap gap-2">
                      {answeredSummary(responses).map((item) => (
                        <li key={item.key}>
                          <Badge>
                            {item.short}&nbsp;&nbsp;<b>{item.label}</b>
                          </Badge>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </section>

            <section className="flex flex-col bg-background">
              <SectionTitle required>사용 반려동물 프로필 선택</SectionTitle>
              <div className="px-5 pt-2 pb-4">
                <PetSwitcher
                  pets={PETS}
                  selectedId={petId}
                  onSelect={setPetId}
                  withNames
                  className="gap-4 p-0"
                />
              </div>

              <ResponseSelect
                question={HANDLING_QUESTION}
                value={responses[HANDLING_QUESTION.key]}
                onValueChange={(value) => answer(HANDLING_QUESTION.key, value)}
                className="pt-4"
              />

              <SectionTitle>사진 첨부</SectionTitle>
              <div className="flex flex-col gap-3 px-5 py-2">
                <PhotoPicker files={photos} onChange={setPhotos} />

                <div className="flex flex-col gap-1">
                  <Label htmlFor="review-text" className="sr-only">
                    후기
                  </Label>
                  <Textarea
                    id="review-text"
                    maxLength={MAX_TEXT}
                    value={text}
                    onChange={(event) => setText(event.target.value)}
                    placeholder={`사용 후 달라진 점을 자유롭게 남겨주세요 (최소 ${MIN_TEXT}자)`}
                    className="h-27.5 rounded-xl border-border-default bg-background p-4 text-body-medium-14 placeholder:text-text-body-tertiary"
                  />
                  <p className="text-right text-label-medium-12 text-text-body-secondary">
                    {text.length}/{MAX_TEXT}
                  </p>
                </div>
              </div>
            </section>
          </main>

          <BottomActionBar>
            <Button variant="outline" onClick={() => router.back()}>
              이전
            </Button>
            <Button disabled={!ready} onClick={submit}>
              등록하기
            </Button>
          </BottomActionBar>
        </>
      )}
    </div>
  );
}
