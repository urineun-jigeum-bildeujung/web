// 아이 관리. 아이의 정보와 반응을 남길 수 있는 제품을 탭으로 나눠 보여준다.
// UI 시안 기준(mypa_021 내 아이 관리 1514-44230 · 아이 제품 관리 1551-46897 · 반응 시트 1551-47882)이다.
//
// 시안의 제품 탭 머리말에만 종(알림) 아이콘이 있고 내 아이 관리 탭에는 없다. 어느 쪽이
// 맞는지 확인 전이라 두 탭 모두 그리지 않는다(#189).
//
// 제품 탭은 아이별이 아니다. 아이 전환 줄은 내 아이 관리 탭에만 있고, 서버도 회원 전체의
// "지금 반응을 남길 수 있는 구매"를 준다(#345). 어느 아이 것인지는 항목의 `petId`가 정한다.

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useState } from "react";

import {
  PetSwitcher,
  ProductFeedbackSheet,
  useQueryPetDetail,
  useQueryPets,
  type FeedbackChoice,
  type FeedbackTarget,
} from "@/entities/pet";
import {
  useMutateSubmitFeedback,
  useQueryPendingFeedbacks,
  type PendingFeedback,
} from "@/entities/review";
import { ApiError } from "@/shared/api/client";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { toHeroProfile } from "../model/to-hero-profile";
import { PetHeroCard } from "./pet-hero-card";
import { PetProductCard } from "./pet-product-card";

const TABS = ["profile", "products"] as const;

const TAB_TRIGGER =
  "relative h-11 flex-1 rounded-none px-2 text-label-medium-14 text-text-body-tertiary after:bottom-0 after:h-px after:bg-border-strong data-active:text-label-bold-14 data-active:text-foreground";

/** 반응 시트가 열린 항목. 등록 요청에 구매 항목 id가 필요해 카드 값과 함께 든다 */
type OpenFeedback = {
  item: PendingFeedback;
  target: FeedbackTarget;
};

/** 받는 동안 잡아 둘 자리. 카드 한 장(사진 64 + 버튼 40)과 같은 높이다 */
function ProductListSkeleton() {
  return (
    <div role="status" aria-label="남길 수 있는 반응을 불러오는 중" className="flex flex-col gap-5">
      {[0, 1].map((index) => (
        <div key={index} className="flex flex-col gap-3">
          <div className="flex items-center gap-3">
            <Skeleton className="size-16 rounded-lg" />
            <Skeleton className="h-5 flex-1" />
          </div>
          <Skeleton className="h-10 w-full rounded-lg" />
        </div>
      ))}
    </div>
  );
}

export function PetProfileView() {
  const router = useRouter();
  const [tab, setTab] = useQueryState(
    "tab",
    // 프로필과 제품 관리는 서로 다른 화면이라 뒤로가기로 되돌아와야 한다
    parseAsStringLiteral(TABS).withDefault("profile").withOptions({ history: "push" }),
  );
  // 목록을 받기 전에는 고른 아이가 없다. 받고 나면 기본 아이(맨 앞)를 쓴다
  const [pickedId, setPickedId] = useState<string | null>(null);
  const { pets, error: petsError } = useQueryPets();
  const selectedPetId = pickedId ?? pets?.[0]?.id;
  const { pet, error: petError } = useQueryPetDetail(selectedPetId);

  const noPets = pets?.length === 0;
  // **세션이 끊긴 것과 조회가 실패한 것은 다르다.** 재발급까지 실패하면 `clearTokens`가
  // 알려 주지만(SessionExpiryRedirect), 토큰이 처음부터 없으면 재발급을 시도조차 하지 않아
  // 그 알림이 없다. 그대로 두면 로그인하지 않은 보호자에게 "불러오지 못했어요"가 떠서
  // 다시 눌러 보게 된다 — 눌러도 될 리가 없다
  const error = petsError ?? petError;
  const noSession = error instanceof ApiError && error.status === 401;
  const loadFailed = Boolean(error) && !noSession;

  useEffect(() => {
    if (noSession) {
      router.replace("/login");
    }
  }, [noSession, router]);
  const profile = pet ? toHeroProfile(pet) : null;

  // 반응을 남길 수 있는 구매. 답하거나 보류하면 서버가 목록을 바꾼다
  const {
    items,
    isLoading: itemsLoading,
    isRetrying: itemsRetrying,
    refetch: refetchItems,
  } = useQueryPendingFeedbacks();
  const { submitFeedback, isSubmitting } = useMutateSubmitFeedback();
  const [feedback, setFeedback] = useState<OpenFeedback | null>(null);
  // 남길 반응이 있으면 제품 탭 이름에 점을 찍어 알린다
  const hasTodo = (items?.length ?? 0) > 0;

  /**
   * 시트의 아이. 항목의 `petId`가 그 제품을 사 준 아이인데 **백엔드가 아직 `null`로 둔다**
   * (주문 서비스 내부 응답에 없어 "추후 연동"). 그때까지는 대표 아이(목록 첫 번째)다.
   * 채워지면 코드 변경 없이 그 아이로 바뀐다. 등록 요청에는 이 id를 그대로 싣고, 이름은
   * 목록에서 찾는다 — 목록에 없는 아이(지운 아이·아직 못 받음)라도 id를 대표 아이로 바꿔
   * 보내지 않는다. 그 제품을 사 준 아이가 아니면 반응이 다른 아이의 적합도에 섞인다
   */
  const feedbackPetId = feedback ? (feedback.item.petId ?? pets?.[0]?.id ?? null) : null;
  const feedbackPetName = pets?.find((candidate) => candidate.id === feedbackPetId)?.name;

  const submit = (choice: FeedbackChoice) =>
    feedback
      ? submitFeedback({
          productId: feedback.item.productId,
          orderProductId: feedback.item.orderProductId,
          petId: feedbackPetId,
          submission: choice,
        }).catch((causedBy: unknown) => {
          toastAppError(toAppMessageCode(causedBy), causedBy);
          throw causedBy;
        })
      : Promise.resolve();

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="아이 관리" />

      <Tabs
        value={tab}
        onValueChange={(value) => setTab(value as (typeof TABS)[number])}
        className="flex flex-1 flex-col gap-0"
      >
        {/* 시안의 탭 줄. 44px에 고른 탭만 검정 밑줄 */}
        <TabsList variant="line" className="h-11 w-full gap-0 rounded-none p-0 px-5">
          <TabsTrigger value="profile" className={TAB_TRIGGER}>
            내 아이 관리
          </TabsTrigger>
          <TabsTrigger value="products" className={TAB_TRIGGER}>
            아이 제품 관리
            {hasTodo && (
              <>
                <span
                  aria-hidden
                  className="absolute top-2.5 right-0.5 size-1.5 rounded-full bg-surface-brand"
                />
                <span className="sr-only">(남길 반응 있음)</span>
              </>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="flex flex-1 flex-col gap-4 pt-5">
          {/* 아이가 없으면 카드를 그릴 것이 없다. 왜 비었는지와 무엇을 할지 함께 보인다 */}
          {noPets ? (
            <EmptyState
              title="아직 등록한 아이가 없어요"
              description="아이를 등록하면 프로필과 먹은 제품을 여기서 관리할 수 있어요."
              action={
                <Button onClick={() => router.push("/onboarding?step=basic")}>아이 등록하기</Button>
              }
            />
          ) : profile ? (
            <PetHeroCard profile={profile} />
          ) : loadFailed ? (
            <p role="alert" className="px-5 text-body-medium-14 text-text-body-secondary">
              아이 정보를 불러오지 못했어요
            </p>
          ) : (
            // 카드를 처음 그리는 자리라 그릴 내용이 아직 없다. 문구만 두면 카드 자리가
            // 통째로 비었다가 갑자기 채워진다. 실제 카드와 같은 크기로 자리를 잡는다
            <Skeleton
              role="status"
              aria-label="아이 정보를 불러오는 중"
              className="mx-5 h-110.25 rounded-t-lg rounded-b-2xl"
            />
          )}

          {/* 아이 전환 줄은 화면 아래에 붙는다. 새 아이는 온보딩 기본 정보 단계에서 등록한다 */}
          <div className="mt-auto pb-[calc(env(safe-area-inset-bottom)+2rem)]">
            <PetSwitcher
              variant="hero"
              pets={pets ?? []}
              selectedId={selectedPetId}
              onSelect={setPickedId}
              onAdd={() => router.push("/onboarding?step=basic")}
            />
          </div>
        </TabsContent>

        {/* 거르기 칩(전체·미입력·입력)은 답한 항목을 주는 API가 없어 빼 두었다. 목록이 곧 미입력이다 */}
        <TabsContent value="products" className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-8">
          {items ? (
            items.length > 0 ? (
              items.map((item) => (
                <PetProductCard
                  key={item.orderProductId}
                  product={{
                    id: item.orderProductId,
                    name: item.name,
                    imageUrl: item.imageUrl,
                    reviewed: false,
                  }}
                  onFeedback={(target) =>
                    setFeedback({
                      item,
                      target: {
                        productId: item.productId,
                        productName: target.name,
                        imageUrl: target.imageUrl,
                      },
                    })
                  }
                />
              ))
            ) : (
              <EmptyState
                icon={<Icon name="review" />}
                title="지금은 남길 반응이 없어요"
                description="받은 제품을 며칠 써 보면 여기서 반응을 남길 수 있어요"
              />
            )
          ) : itemsLoading ? (
            <ProductListSkeleton />
          ) : (
            <EmptyState
              icon={<Icon name="review" />}
              title="제품을 불러오지 못했어요"
              description="잠시 후 다시 시도해 주세요"
              action={
                <Button
                  variant="outline"
                  disabled={itemsRetrying}
                  onClick={() => void refetchItems()}
                >
                  <LoadingSwap loading={itemsRetrying} label="제품을 다시 불러오는 중">
                    다시 시도
                  </LoadingSwap>
                </Button>
              }
            />
          )}
        </TabsContent>
      </Tabs>

      <ProductFeedbackSheet
        target={feedback?.target ?? null}
        petName={feedbackPetName ?? "우리 아이"}
        onOpenChange={(open) => !open && setFeedback(null)}
        onSeeProduct={(productId) => router.push(`/products/${productId}`)}
        onSubmit={submit}
        isSubmitting={isSubmitting}
      />
    </div>
  );
}
