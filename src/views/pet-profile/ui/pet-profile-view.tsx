// 아이 관리. 아이의 정보와 그 아이가 먹은 제품을 탭으로 나눠 보여준다.
// UI 시안 기준(mypa_021 내 아이 관리 1514-44230 · 아이 제품 관리 1551-46897 · 반응 시트 1551-47882)이다.
//
// 시안의 제품 탭 머리말에만 종(알림) 아이콘이 있고 내 아이 관리 탭에는 없다. 어느 쪽이
// 맞는지 확인 전이라 두 탭 모두 그리지 않는다(#189).

"use client";

import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import {
  PetSwitcher,
  ProductFeedbackSheet,
  useQueryHealthOptions,
  useQueryPetDetail,
  useQueryPets,
  type FeedbackTarget,
} from "@/entities/pet";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { FilterChips } from "@/shared/ui/filter-chips/filter-chips";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

import { toHeroProfile } from "../model/to-hero-profile";
import { PetHeroCard } from "./pet-hero-card";
import { PetProductCard, type PetProduct } from "./pet-product-card";

const TABS = ["profile", "products"] as const;

/** 제품 목록 API는 아직 없다. 화면 확인용 값 */
const MOCK_PRODUCTS: PetProduct[] = [
  {
    id: "1",
    name: "저자극 덴탈껌 14개입",
    boughtAt: "26.08.28",
    sinceLabel: "구매 후 6일",
    countLabel: "3번째 구매",
    reviewed: true,
  },
  {
    id: "2",
    name: "베터 글루코사민",
    boughtAt: "26.08.17",
    sinceLabel: "구매 후 17일",
    countLabel: "1번째 구매",
    reviewed: true,
  },
  {
    id: "3",
    name: "잘먹는 독 기호성 사료 2kg",
    boughtAt: "26.08.09",
    sinceLabel: "구매 후 25일",
    countLabel: "6번째 구매",
    reviewed: false,
  },
  {
    id: "4",
    name: "연어 사료 1.2kg",
    boughtAt: "26.07.30",
    sinceLabel: "구매 후 35일",
    countLabel: "2번째 구매",
    reviewed: false,
  },
];

const PRODUCT_FILTERS = [
  { value: "all", label: "전체" },
  { value: "todo", label: "미입력" },
  { value: "done", label: "입력" },
] as const;

/** 주소로 받을 수 있는 보기. 목록에 없는 값이 오면 걸러 낸 결과가 비어 화면이 사라진다 */
const REVIEW_FILTERS = PRODUCT_FILTERS.map((item) => item.value);

const TAB_TRIGGER =
  "relative h-11 flex-1 rounded-none px-2 text-label-medium-14 text-text-body-tertiary after:bottom-0 after:h-px after:bg-border-strong data-active:text-label-bold-14 data-active:text-foreground";

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
  // 알레르기가 코드로만 와서 표시명을 선택지에서 되찾는다. 종을 알아야 하므로 상세가 먼저다
  const { options } = useQueryHealthOptions(pet?.species ?? "dog");

  const noPets = pets?.length === 0;
  const loadFailed = Boolean(petsError ?? petError);
  // 알레르기 선택지가 아직이면 코드가 그대로 보인다. 자리를 비우면 알레르기가 없는 아이로 읽힌다
  const profile = pet ? toHeroProfile(pet, options?.allergies ?? []) : null;
  const [feedback, setFeedback] = useState<FeedbackTarget | null>(null);
  const [productFilter, setProductFilter] = useQueryState(
    "reviewed",
    // 보기 안에서만 받는다. parseAsString은 검증하지 않아 주소로 아무 값이나 들어온다.
    // 같은 목록을 좁히는 것이라 히스토리에는 쌓지 않는다(기본 replace)
    parseAsStringLiteral(REVIEW_FILTERS).withDefault("all"),
  );

  const visibleProducts = MOCK_PRODUCTS.filter((product) => {
    if (productFilter === "todo") return !product.reviewed;
    if (productFilter === "done") return product.reviewed;
    return true;
  });
  // 남길 반응이 있으면 제품 탭 이름에 점을 찍어 알린다
  const hasTodo = MOCK_PRODUCTS.some((product) => !product.reviewed);

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
          ) : (
            <p
              role={loadFailed ? "alert" : "status"}
              className="px-5 text-body-medium-14 text-text-body-secondary"
            >
              {loadFailed ? "아이 정보를 불러오지 못했어요" : "아이 정보를 불러오는 중이에요"}
            </p>
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

        <TabsContent value="products" className="flex flex-1 flex-col gap-5 px-5 pt-5 pb-8">
          {/* 반응을 남기지 않은 제품을 골라내는 자리 */}
          <FilterChips
            label="반응 입력 여부로 거르기"
            options={PRODUCT_FILTERS}
            value={productFilter}
            onValueChange={(next) => void setProductFilter(next as (typeof REVIEW_FILTERS)[number])}
          />

          {visibleProducts.map((product) => (
            <PetProductCard
              key={product.id}
              product={product}
              onFeedback={(target) =>
                setFeedback({
                  productId: target.id,
                  productName: target.name,
                  imageUrl: target.imageUrl,
                  sinceLabel: target.sinceLabel,
                  countLabel: target.countLabel,
                })
              }
            />
          ))}
        </TabsContent>
      </Tabs>

      <ProductFeedbackSheet
        target={feedback}
        petName={pet?.name ?? ""}
        onOpenChange={(open) => !open && setFeedback(null)}
        onSeeProduct={(productId) => router.push(`/products/${productId}`)}
      />
    </div>
  );
}
