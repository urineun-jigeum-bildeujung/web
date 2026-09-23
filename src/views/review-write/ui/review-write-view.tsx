// 리뷰 작성 화면. 별점과 함께 아이의 실제 반응을 두 단계로 받는다.
// UI 시안 기준(리뷰작성 1884-29158·29400 1단계, 1884-29257·29325 2단계, 1884-29801 완료)이다.
// 완료 프레임은 Figma에서 "타임딜"로 이름이 잘못 붙어 있다.
//
// 이 화면이 이 서비스의 입력단이다. 기호성·배변·피부·활력·알러지는 보호자가 그동안
// 혼자 추측하던 신호이고, 여기서 모인 것이 다음 추천의 근거가 된다.
// 어느 아이가 먹었는지를 함께 받는 것도 같은 이유다 — 아이를 모르면 쓸 수 없는 답이다.
//
// 필수는 별점·사용 기간·아이·후기 글과 **반응 문항 둘**이다 — 기호성(1단계)과 급여 편의성(2단계).
// 시안이 문항마다 필수·선택 배지를 그렸고 그 둘만 필수다(#302). 나머지 넷은 선택으로 둔다 —
// 다 묶으면 모르는 항목까지 아무 답이나 고르게 되어 근거가 흐려진다.
//
// 그전에는 "반응 문항 하나 이상"이라는 임시 규칙이었다. 서버가 `answerValues`에 하나 이상을
// 요구해(`@NotEmpty`) 백엔드 확인이 올 때까지 막아 둔 것인데(#291), 시안이 정한 필수 둘이
// 그 조건을 함께 채운다.

"use client";

import Link from "next/link";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useId, useState, useSyncExternalStore } from "react";

import { useQueryMyProfile } from "@/entities/member";
import { PetSwitcher, useQueryPets } from "@/entities/pet";
import { useQueryProductSummary } from "@/entities/product";
import { useMutateCreateReview } from "@/entities/review";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { Badge } from "@/shared/ui/badge/badge";
import { BottomActionBar } from "@/shared/ui/bottom-action-bar/bottom-action-bar";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { Input } from "@/shared/ui/input";
import { Label } from "@/shared/ui/label";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Rating } from "@/shared/ui/rating/rating";
import { Skeleton } from "@/shared/ui/skeleton";
import { Textarea } from "@/shared/ui/textarea";

import {
  clearReviewDraft,
  getReviewDraft,
  getReviewDraftOnServer,
  setReviewDraft,
  subscribeReviewDraft,
  type ReviewDraft,
} from "../model/draft-storage";
import {
  answeredSummary,
  HANDLING_QUESTION,
  RATING_STEP_QUESTIONS,
  type Question,
} from "../model/questions";
import { toCreateRequest } from "../model/to-create-request";
import { PhotoPicker } from "./photo-picker";
import { ProductRow } from "./product-row";
import { RatingInput } from "./rating-input";
import { ResponseSelect } from "./response-select";

type ReviewWriteViewProps = {
  /** 리뷰를 달 상품. 백엔드가 회원+상품당 한 건만 받아 구매 건이 아니라 상품이 단위다 */
  productId: string | undefined;
};

/** 어느 상품의 후기인지 모르면 쓸 수 없다. 초안도 상품별로 나뉘어야 해서 여기서 막는다 */
function MissingProduct() {
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <PageHeader title="리뷰 작성" />
      <EmptyState
        className="flex-1"
        title="어떤 상품의 후기인지 알 수 없어요"
        description="나의 상품 후기에서 후기 남기기를 눌러 들어와 주세요."
        action={
          <Button asChild variant="outline">
            <Link href="/mypage/reviews">나의 상품 후기로 가기</Link>
          </Button>
        }
      />
    </div>
  );
}

const STEPS = ["rating", "detail"] as const;

const MIN_TEXT = 10;
const MAX_TEXT = 300;

/** 조회에 실패한 자리. 스켈레톤으로 덮어 두면 기다리는 줄 안다 — 까닭과 다시 시도할 길을 준다 */
function QueryFailed({
  message,
  isRetrying,
  onRetry,
}: {
  message: string;
  isRetrying: boolean;
  onRetry: () => void;
}) {
  return (
    <div
      role="alert"
      className="flex min-h-11 items-center justify-between gap-3 rounded-lg bg-surface-secondary px-3 py-2"
    >
      <p className="text-body-medium-14 text-text-body-secondary">{message}</p>
      <Button variant="outline" size="sm" disabled={isRetrying} onClick={onRetry}>
        <LoadingSwap loading={isRetrying} label="다시 불러오는 중">
          다시 시도
        </LoadingSwap>
      </Button>
    </div>
  );
}

/** 두 단계 머리의 상품 줄. 받는 동안은 같은 높이의 자리만 잡아 아래가 밀리지 않게 한다 */
function ProductHeader({ productId }: { productId: string }) {
  const { product, isLoading, isRetrying, refetch } = useQueryProductSummary(productId);
  if (product) return <ProductRow name={product.name} imageUrl={product.imageUrl} />;
  return (
    <div className="px-5 pt-1 pb-3">
      {isLoading ? (
        <Skeleton className="h-16 w-full rounded-lg" />
      ) : (
        <QueryFailed
          message="상품 정보를 불러오지 못했어요"
          isRetrying={isRetrying}
          onRetry={() => void refetch()}
        />
      )}
    </div>
  );
}

/** 시안 섹션 제목 줄. 굵은 14 글자 옆에 필수·선택 배지 */
function SectionTitle({ children, required }: { children: string; required?: boolean }) {
  return (
    <h2 className="flex items-center gap-2 px-5 pt-3 text-label-bold-14 text-foreground">
      {children}
      <Badge tone={required ? "brand" : "default"}>{required ? "필수" : "선택"}</Badge>
    </h2>
  );
}

export function ReviewWriteView({ productId }: ReviewWriteViewProps) {
  return productId ? <ReviewWriteForm productId={productId} /> : <MissingProduct />;
}

function ReviewWriteForm({ productId }: { productId: string }) {
  const daysId = useId();
  // 단계는 뒤로가기로 되돌아와야 하므로 URL에 두고 push한다. 온보딩과 같은 판단이다
  const [step, setStep] = useQueryState(
    "step",
    parseAsStringLiteral(STEPS).withDefault("rating").withOptions({ history: "push" }),
  );
  // 새로고침해도 남아야 한다. 단계만 URL에 있고 입력값이 사라지면 2단계에서 등록할 수 없다
  const draft = useSyncExternalStore(
    subscribeReviewDraft,
    () => getReviewDraft(productId),
    getReviewDraftOnServer,
  );
  const { score, days, responses, petIds, text } = draft;
  const patch = (next: Partial<ReviewDraft>) => setReviewDraft(productId, { ...draft, ...next });
  // 사진은 File이라 기기에 남기지 않는다. 다시 고르는 것이 한 번의 탭이다
  const [photos, setPhotos] = useState<File[]>([]);
  const [done, setDone] = useState(false);
  const {
    pets,
    isLoading: petsLoading,
    isRetrying: petsRetrying,
    refetch: refetchPets,
  } = useQueryPets();
  const { profile } = useQueryMyProfile();
  const { createReview, isSubmitting } = useMutateCreateReview();

  const answer = (key: string, value: string) =>
    patch({ responses: { ...responses, [key]: value } });

  // **시안이 정한 필수 문항을 본다.** 그전에는 "반응 문항 하나 이상"이라는 임시 규칙이었다 —
  // 서버 `answerValues`가 `@NotEmpty`라 그때까지 막아 두었던 것이다(#291). 시안이 기호성과
  // 급여 편의성을 필수로 정해(#302) 그 임시 규칙을 정식 규칙으로 바꾼다. 둘 중 하나만 있어도
  // 서버 조건은 채워지므로 백엔드에 제약을 풀어 달라고 할 필요가 없다.
  const answeredAll = (questions: readonly Question[]) =>
    questions.every((question) => !question.required || responses[question.key] !== undefined);

  const ratingReady = score > 0 && days.length > 0 && answeredAll(RATING_STEP_QUESTIONS);
  const ready =
    ratingReady &&
    petIds.length > 0 &&
    text.trim().length >= MIN_TEXT &&
    answeredAll([HANDLING_QUESTION]);

  /**
   * 등록. 사진이 있으면 훅이 먼저 올린다.
   *
   * **실패하면 초안을 지우지 않는다.** 지우면 두 단계를 처음부터 다시 채워야 한다.
   * 완료 화면으로도 가지 않는다 — 등록되지 않았는데 됐다고 알리는 셈이다.
   */
  const submit = () => {
    const request = toCreateRequest(draft, productId);
    if (!request) {
      // 버튼이 막고 있어 여기까지 오면 화면이 못 잡은 값이다
      toastAppError(APP_MESSAGE_CODE.common.invalidInput);
      return;
    }
    createReview({ request, photos })
      .then(() => {
        setDone(true);
        clearReviewDraft(productId);
      })
      .catch((error: unknown) => toastAppError(toAppMessageCode(error), error));
  };

  if (done) {
    return (
      <div className="flex min-h-dvh flex-col bg-background">
        <PageHeader title="리뷰 작성" />

        {/* 시안(1884-29801)의 가운데 묶음. 56px 연한 브랜드 원 안에 체크, 제목 18, 설명 14 */}
        <main className="flex flex-1 flex-col items-center justify-center gap-2 px-5 pb-6 text-center">
          <span
            aria-hidden
            className="flex size-14 items-center justify-center rounded-full bg-surface-brand-weak text-icon-fill-brand"
          >
            <Icon name="check" />
          </span>
          <div className="flex flex-col gap-1">
            <h1 className="text-title-bold-18 text-foreground">소중한 리뷰 감사해요!</h1>
            <p className="text-body-medium-14 text-text-body-secondary">
              {/* 아직 못 받았으면 이름 없이 부른다. 빈 채로 두면 "님의"만 남는다 */}
              {profile?.nickname ?? "보호자"}님의 후기가 다른 보호자들에게
              <br />큰 도움이 될 거예요
            </p>
          </div>
        </main>

        <BottomActionBar>
          {/* 작성 화면을 히스토리에서 뺀다. push면 목록에서 뒤로가기가 빈 작성 폼으로 돌아온다(#371) */}
          <Button asChild>
            <Link href="/mypage/reviews?tab=written" replace>
              확인
            </Link>
          </Button>
        </BottomActionBar>
      </div>
    );
  }

  return (
    // 흰 섹션 사이로 회색 바탕이 8px 띠로 비친다
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      <PageHeader title="리뷰 작성" className="bg-background" />

      {step === "rating" ? (
        <>
          <main className="flex flex-1 flex-col gap-2">
            <section className="flex flex-col bg-background">
              <ProductHeader productId={productId} />

              <div className="flex flex-col items-center gap-2 px-5 pt-2 pb-4">
                <h2 className="flex items-start gap-2 text-title-bold-16 text-foreground">
                  상품은 만족스러우셨나요?
                  <Badge tone="brand">필수</Badge>
                </h2>
                <RatingInput
                  value={score}
                  onChange={(next) => patch({ score: next })}
                  label="상품 만족도"
                />
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
                    onChange={(event) => patch({ days: event.target.value.replace(/\D/g, "") })}
                    className="h-8 w-12 border-border-default bg-background p-1.5 text-center text-body-medium-14"
                  />
                  일째 사용 중
                </label>
              </div>
            </section>

            {/* 마지막 섹션은 하단 버튼 줄까지 흰색으로 채운다. 그러지 않으면 바탕색이 드러난다 */}
            <section className="flex flex-1 flex-col bg-background">
              <div className="flex flex-col gap-1 px-5 py-4">
                {/* **섹션에는 배지가 없다.** 시안(1884-29158)이 문항마다만 붙인다 — 섹션에
                    "선택"을 달면 그 안의 기호성이 필수인 것과 어긋난다 (#302) */}
                <h2 className="text-title-bold-16 text-foreground">AI 추천을 위해 알려주세요</h2>
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
              <ProductHeader productId={productId} />

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

            <section className="flex flex-1 flex-col bg-background">
              <SectionTitle required>사용 반려동물 프로필 선택</SectionTitle>
              <div className="px-5 pt-2 pb-4">
                {/* 목록을 못 받으면 아이를 고를 수 없어 등록이 막힌다. 빈 줄로 숨기지 않고 알린다 */}
                {pets ? (
                  // 한 상품을 두 아이에게 함께 먹이기도 한다. 여러 마리를 고르고 한 마리 이상이면 등록된다(#391)
                  <PetSwitcher
                    pets={pets}
                    selectedIds={petIds}
                    onToggle={(id) =>
                      patch({
                        petIds: petIds.includes(id)
                          ? petIds.filter((picked) => picked !== id)
                          : [...petIds, id],
                      })
                    }
                    withNames
                    className="gap-4 p-0"
                  />
                ) : petsLoading ? (
                  <Skeleton className="h-17 w-full rounded-lg" />
                ) : (
                  <QueryFailed
                    message="아이 목록을 불러오지 못했어요"
                    isRetrying={petsRetrying}
                    onRetry={() => void refetchPets()}
                  />
                )}
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
                    onChange={(event) => patch({ text: event.target.value })}
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
            {/* 뒤로가기에 기대지 않는다. 2단계 주소로 바로 들어와도 1단계로 갈 수 있어야 한다 */}
            <Button
              variant="outline"
              onClick={() => void setStep("rating", { history: "replace" })}
            >
              이전
            </Button>
            {/* 사진 업로드까지 겹치면 왕복이 길다. disabled만 두면 왜 안 눌리는지 몰라 다시 누르게 된다 */}
            <Button disabled={!ready || isSubmitting} onClick={submit}>
              <LoadingSwap loading={isSubmitting}>등록하기</LoadingSwap>
            </Button>
          </BottomActionBar>
        </>
      )}
    </div>
  );
}
