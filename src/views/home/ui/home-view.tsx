// 메인 화면. 전체 탭은 골라주는 화면이고, 종류 탭은 상품 목록이다.
// UI 시안 기준(홈화면 1758-68883, 사료 탭 1758-69075 등)이다.

"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Suspense, use, useId, useRef, useState, useTransition } from "react";

import {
  canAddPet,
  PetSwitcher,
  ProductFeedbackSheet,
  toAddPetHref,
  useSelectDefaultPet,
  useQueryPets,
  type FeedbackChoice,
} from "@/entities/pet";
import {
  useMutateTimeDealSubscription,
  useQueryTimeDealSubscription,
} from "@/entities/notification";
import {
  CATEGORY_TO_API,
  MatchScoreBadge,
  formatUnitPrice,
  useProductList,
  type ProductCard as ApiProductCard,
  type ProductListResult,
  type TimeDealGroup,
  type TimeDealList,
} from "@/entities/product";
import {
  formatUnitPriceLine,
  RecommendationReason,
  SaleStatusBadge,
  useQueryHomeRecommendations,
  type Recommendation,
} from "@/entities/recommendation";
import {
  useMutateSubmitFeedback,
  useQueryPendingFeedbacks,
  type PendingFeedback,
} from "@/entities/review";
import {
  CardHeartButton,
  toWishlistItem,
  useToggleWishlist,
  useWishedProductIds,
} from "@/features/toggle-wishlist";
import { useRequireSession } from "@/shared/api/use-require-session";
import { useSessionState } from "@/shared/api/use-session-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { HeaderIconLink } from "@/shared/ui/page-header/header-icon-link";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { BottomNav } from "@/widgets/bottom-nav";
import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";

import { CATEGORIES, CATEGORY_LABEL, type HomeCategory } from "../model/category";
import { SORT_LABEL, SORT_TO_API, SORTS, type HomeSort } from "../model/sort";
import { PromoBannerCarousel } from "./promo-banner-carousel";

/** 메인 맞춤 상품은 추천 API의 기본 개수(9)만큼 받는다. 추천 화면(50개)과 캐시를 나눈다(#600) */
const HOME_RECOMMENDATION_SIZE = 9;

/** 찜하면 띄우는 안내. 상품 상세·리뷰 상세·사진 뷰어와 같은 문구다 */
const WISHED_MESSAGE = "해당 상품을 찜 목록에 담았어요!";

/**
 * 시안 ProductCard/Grid의 price 슬롯 — 단가 + 별점 + 후기 수, 그 아래 추천 이유.
 * Rating Container는 5개 별을 늘어놓는 Rating(mypa_041_작성한 기준)과 달리 별 1개 + 숫자다.
 *
 * 단가 줄은 시안(1758-68917)의 "1개당 800원" 꼴이다. 시안의 다른 카드에 있는 "하루 예상 급여비"는
 * 추천 응답에 없어 쓰지 못하고, 단가를 해석하지 못하면 그 줄을 비운다. 별점은 카테고리 그리드와 같이
 * 후기 수로 가른다(#534). **추천 이유는 시안에 없지만 이 서비스의 핵심 근거라 카드마다 보인다**(#600)
 */
function RecommendedProductMeta({ item }: { item: Recommendation }) {
  const rated = item.reviewCount > 0;
  return (
    <>
      {item.unitPrice && (
        <p className="text-label-medium-11 text-text-body-tertiary">
          {formatUnitPriceLine(item.unitPrice)}
        </p>
      )}
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5">
          {rated && <span className="sr-only">5점 만점에 {item.rating.toFixed(1)}점</span>}
          <Icon
            name="star"
            className={cn("size-4", rated ? "text-icon-fill-accent" : "text-icon-fill-disable")}
          />
          <span aria-hidden className="text-label-medium-14 text-text-body-tertiary">
            {rated ? item.rating.toFixed(1) : "-"}
          </span>
        </span>
        <span className="text-label-medium-14 text-text-body-tertiary">
          후기 {item.reviewCount}개
        </span>
      </div>
      <RecommendationReason
        reason={item.reason}
        allergyPenalized={item.allergyPenalized}
        className="mt-1"
      />
    </>
  );
}

/** 맞춤 상품을 받는 동안 가로 목록 자리를 잡는다. 카드 폭은 본체와 같은 208px */
function RecommendedProductsSkeleton() {
  return (
    <div className="flex gap-3 overflow-hidden" role="status" aria-label="맞춤 상품을 불러오는 중">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex w-52 shrink-0 flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </div>
      ))}
    </div>
  );
}

/**
 * 고른 아이의 맞춤 상품 가로 목록. 조회 훅이 받아 둔 것 없이 실패하면 오류를 던지고, 부모의
 * `ErrorBoundary`가 이 칸만 대체한다 — 아이 줄·최근 구매·타임딜은 그대로 남는다(#600)
 */
function RecommendedProducts({ petId, petName }: { petId: number; petName: string }) {
  const { items, isLoading } = useQueryHomeRecommendations({
    petId,
    size: HOME_RECOMMENDATION_SIZE,
  });
  // 찜은 서버에 저장한다. 종류 탭 격자(#534)와 같이 전체 찜 목록으로 하트를 채우고 누르면 서버에서
  // 뒤집는다 — 토글이 찜 목록 캐시를 먼저 바꿔 하트가 곧바로 바뀐다(QA r22~r30, #611)
  const heart = useToggleWishlist();
  const { wishedIds, isLoading: wishLoading } = useWishedProductIds();

  if (isLoading || !items) return <RecommendedProductsSkeleton />;

  if (items.length === 0) {
    return (
      <p className="py-8 pr-5 text-center text-body-medium-14 text-text-body-tertiary">
        {petName}에게 맞는 상품을 아직 찾지 못했어요
      </p>
    );
  }

  return (
    <ScrollRow label={`${petName} 맞춤 상품`} itemWidth="208px" edgeInset={5} bleedRight={false}>
      {items.map((item) => (
        <ScrollRowItem key={item.productId}>
          <ProductGridCard
            // 품절 카드는 타임딜 목록(1905-32428)처럼 통째로 흐린다. 글자 배지가 함께 있어 색만으로 알리지 않는다
            className={cn(item.status === "soldOut" && "opacity-45")}
            imageSizes="208px"
            href={`/products/${item.productId}`}
            name={item.name}
            price={item.price}
            originalPrice={item.originalPrice}
            imageUrl={item.thumbnailUrl}
            imageBadge={
              <div className="flex flex-col items-start gap-1">
                <MatchScoreBadge score={item.score} petName={petName} />
                <SaleStatusBadge status={item.status} />
              </div>
            }
            // 시안(Reaction Button)은 사진 모서리에서 12px 안쪽의 24px 흰 하트다. 종류 탭 격자와 같은
            // 원판(32px) 하트를 쓰므로 원판을 8px 안쪽에 두어 하트 자리를 시안과 맞춘다(#534)
            imageActionClassName="top-2 right-2"
            imageAction={
              <CardHeartButton
                name={item.name}
                wished={wishedIds.has(item.productId)}
                loading={wishLoading}
                onToggle={() => {
                  // 담기면 상품 상세와 같은 안내를 띄운다. 빼는 것은 하트 모양으로 충분하다(QA r24·r29, #625)
                  const next = !wishedIds.has(item.productId);
                  if (heart.toggle(item.productId, next, toWishlistItem(item)) && next) {
                    showSnackbar(WISHED_MESSAGE);
                  }
                }}
              />
            }
            meta={<RecommendedProductMeta item={item} />}
          />
        </ScrollRowItem>
      ))}
    </ScrollRow>
  );
}

function SectionTitle({
  children,
  href,
  className,
}: {
  children: React.ReactNode;
  href?: string;
  className?: string;
}) {
  // 더보기가 가는 맞춤 추천은 로그인해야 열린다. 비로그인이면 가지 않고 토스트만 띄운다 (#542)
  const requireSession = useRequireSession();

  return (
    // 제목이 길면 제목 쪽이 준다. 더보기가 함께 줄면 "더보/기"로 꺾였다(QA 신규-줄바꿈, #599).
    // 둘이 맞닿지 않게 사이를 띄운다
    <div className={cn("flex items-center justify-between gap-2", className)}>
      <h2 className="min-w-0 text-title-bold-20 text-foreground">{children}</h2>
      {href && (
        // 보이는 크기는 시안대로 두고, 누르는 자리만 after:로 44px 확보한다.
        // min-h-11을 쓰면 이 줄 전체가 44px로 늘어나 제목과 격자 사이 간격이 밀린다
        <Link
          href={href}
          onClick={(event) => {
            if (!requireSession()) event.preventDefault();
          }}
          className="relative shrink-0 text-label-medium-14 text-text-body-tertiary after:absolute after:-inset-2.75"
        >
          더보기
        </Link>
      )}
    </div>
  );
}

/**
 * 상품 그리드·타임딜 미리보기 둘 다 이 실패 화면을 쓴다. 상품·타임딜은 Query가 아니라
 * `page.tsx`가 만든 일반 Promise를 `use()`로 읽으므로, `retry`(Query 리셋)를 불러도
 * 아직 오지 않은 새 Promise 대신 같은(이미 reject된) Promise를 다시 읽어 즉시
 * 재실패한다 — 그래서 `retry`는 부르지 않고 `router.refresh()`만 부른다. 실제 재요청은
 * 그 결과로 온 새 Promise를 `resetKeys`가 감지해 자동으로 처리한다(#289)
 */
function PromiseErrorFallback({ router }: { router: ReturnType<typeof useRouter> }) {
  return (
    <div role="alert" className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <p className="text-sm text-muted-foreground">잠시 문제가 생겼어요. 다시 시도해 주세요.</p>
      <Button variant="outline" className="min-h-11 px-4" onClick={() => router.refresh()}>
        다시 시도
      </Button>
    </div>
  );
}

/**
 * 카테고리 그리드 상품 하나의 가격 아래 자리. 시안(1758-69075 등의 Rating Container)대로 단가 아래에
 * 별 하나 + 평점 + 후기 수를 둔다. 적합도는 응답에 없어(#289) 그리지 않는다.
 *
 * **평점이 있는지는 후기 수로 가른다.** `avgRating`은 후기가 없으면 null로도 0으로도 온다
 * (entities/product README). 시안도 후기 0개면 회색 별에 "-"다 — 0.0으로 두면 평이 나쁜 상품처럼 읽힌다 (#534)
 */
function CategoryProductMeta({ product }: { product: ApiProductCard }) {
  const rated = product.reviewCount > 0;
  return (
    <>
      <p className="text-label-medium-11 text-text-body-tertiary">
        {formatUnitPrice(product.unitLabel, product.unitPrice)}
      </p>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5">
          {rated && <span className="sr-only">5점 만점에 {product.rating.toFixed(1)}점</span>}
          <Icon
            name="star"
            className={cn("size-4", rated ? "text-icon-fill-accent" : "text-icon-fill-disable")}
          />
          <span aria-hidden className="text-label-medium-14 text-text-body-tertiary">
            {rated ? product.rating.toFixed(1) : "-"}
          </span>
        </span>
        <span className="text-label-medium-14 text-text-body-tertiary">
          후기 {product.reviewCount}개
        </span>
      </div>
    </>
  );
}

/** 아이 목록을 받는 동안 아이 고르기 줄의 자리를 잡는다. 60px 원과 이름 줄 둘 */
function PetSwitcherSkeleton() {
  return (
    <div className="flex gap-4 px-5" role="status" aria-label="아이 목록을 불러오는 중">
      {Array.from({ length: 2 }, (_, index) => (
        <div key={index} className="flex flex-col items-center gap-1">
          <Skeleton className="size-15 rounded-full" />
          <Skeleton className="h-4.5 w-8" />
        </div>
      ))}
    </div>
  );
}

/** 카테고리 그리드가 대기 중일 때 자리를 잡는다. 정렬 줄 하나 + 카드 4장 자리 */
function ProductGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5" role="status" aria-label="상품 목록을 불러오는 중">
      <div className="flex justify-end">
        <Skeleton className="h-5 w-14" />
      </div>
      {/* 본체와 같은 규칙으로 눕는다(#569) — 카드 170px 고정, 사이 13px.
          개수는 가장 넓을 때의 한 줄(6)에 맞춘다. 전에 4였던 것도 그때의 최대 열 수
          (`lg:grid-cols-4`)를 채우는 수였는데, 열이 여섯까지 늘어 그 의도가 깨졌다 —
          첫 쪽이 10건이라 1200에서 본체는 여섯으로 서는데 뼈대만 넷이면 줄이 어긋난다 */}
      <ul className="flex flex-wrap gap-x-3.25 gap-y-6">
        {Array.from({ length: 6 }, (_, index) => (
          <li key={index} className="flex w-42.5 flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </li>
        ))}
      </ul>
    </div>
  );
}

type ProductGridProps = {
  /** app/page.tsx가 서버에서 만든 첫 페이지 Promise. category==="all"이면 이
   *  컴포넌트 자체가 그려지지 않으므로 여기 오는 값은 항상 실제 조회 결과다 */
  productsPromise: Promise<ProductListResult>;
  category: HomeCategory;
  sort: HomeSort;
  sortSelect: React.ReactNode;
};

/** 카테고리 탭 상품 그리드. 첫 페이지는 서버가 준 Promise를 `use()`로 풀어 `useProductList`에
 *  넘긴다 — 커서 이어 붙이기·중복 제거·로딩/실패 상태는 그 훅이 맡고, 이 컴포넌트는
 *  그리기만 한다(SRP, #289). 부모가 이 컴포넌트를 `key={category:sort}`로 감싸 필터가
 *  바뀌면 통째로 다시 마운트하므로, 훅 안의 상태도 필터 전환 때 따로 비울 필요가 없다 */
function ProductGrid({ productsPromise, category, sort, sortSelect }: ProductGridProps) {
  const first = use(productsPromise);
  const { items, hasNext, loading, failed, loadMore } = useProductList(first, {
    category: category === "all" ? undefined : CATEGORY_TO_API[category],
    sort: SORT_TO_API[sort],
  });
  // 찜은 서버에 저장한다. 다른 목록(#483)과 같이 전체 찜 목록으로 하트를 채우고, 로그인하지
  // 않았으면 누를 때 로그인으로 보낸다(#534)
  const heart = useToggleWishlist();
  const { wishedIds, isLoading: wishLoading } = useWishedProductIds();

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end p-5">{sortSelect}</div>

      {items.length === 0 ? (
        <p className="px-5 py-16 text-center text-body-medium-16 text-text-body-tertiary">
          아직 등록된 상품이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-5">
          {/* **전환점을 잡지 않는다**(#569). PD 확정이 카드 170px 고정·사이 13px이고,
              폭이 넓어지면 카드가 커지는 것이 아니라 한 줄에 더 들어간다. 거터 20px(px-5)을 빼면
              393에서 둘(170×2+13=353), 768에서 넷(170×4+13×3=719), 1200부터 여섯(170×6+13×5=1085)이
              저절로 나와 `md:`·`lg:`가 필요 없다 — 상품 상세의 353px 줄(#497)과 같은 방식이다.
              비교 고르기 시안이 네 폭 모두 같은 값이라 목록 전체가 한 규칙을 쓴다.
              오른쪽이 고르지 않게 남는 것도 시안 그대로다(1920 시안이 5장에서 258px을 비운다) */}
          {/* 카드는 칸 폭을 그대로 받는다. 칸(li)을 flex로 두고 카드에 flex-1을 주던 동안 카드의 최소
              폭이 이름 전체 길이가 되어, 긴 이름의 카드가 옆 칸을 덮고 사진도 정사각형 칸보다 커졌다(#534) */}
          <ul className="flex flex-wrap gap-x-3.25 gap-y-6">
            {items.map((product) => (
              <li key={product.productId} className="w-42.5">
                <ProductGridCard
                  // 카드가 폭과 무관하게 170px이라 후보도 하나면 된다(#569).
                  // 폭 따라 커지던 때는 구간별 계산식이 필요했는데 그 이유가 사라졌다
                  imageSizes="170px"
                  href={`/products/${product.productId}`}
                  name={product.name}
                  price={product.price}
                  originalPrice={product.originalPrice ?? undefined}
                  discountRate={product.discountRate}
                  imageUrl={product.thumbnailUrl ?? undefined}
                  // 시안(Reaction Button)은 사진 모서리에서 12px 안쪽의 24px 하트다. 다른 목록과 같은
                  // 원판(32px) 하트를 쓰므로 원판을 8px 안쪽에 두어 하트 자리를 시안과 맞춘다
                  imageActionClassName="top-2 right-2"
                  imageAction={
                    <CardHeartButton
                      name={product.name}
                      wished={wishedIds.has(product.productId)}
                      loading={wishLoading}
                      onToggle={() => {
                        const next = !wishedIds.has(product.productId);
                        if (
                          heart.toggle(product.productId, next, toWishlistItem(product)) &&
                          next
                        ) {
                          showSnackbar(WISHED_MESSAGE);
                        }
                      }}
                    />
                  }
                  meta={<CategoryProductMeta product={product} />}
                />
              </li>
            ))}
          </ul>

          {hasNext && (
            <div className="flex flex-col items-center gap-2">
              <Button
                variant="outline"
                className="min-h-11 w-full text-label-bold-16 font-bold"
                disabled={loading}
                onClick={() => void loadMore()}
              >
                <LoadingSwap loading={loading} label="상품을 더 불러오는 중">
                  더 보기
                </LoadingSwap>
              </Button>
              {failed && (
                <p role="alert" className="text-body-regular-14 text-text-body-danger-default">
                  불러오지 못했어요. 다시 시도해 주세요.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** 타임딜 미리보기가 대기 중일 때 자리를 잡는다. 카운트다운 자리 + 카드 3장 자리 */
function TimeDealSkeleton() {
  return (
    <div className="flex flex-col gap-6 pr-5" role="status" aria-label="타임딜을 불러오는 중">
      <div className="flex flex-col gap-1">
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-24" />
      </div>
      <div className="flex gap-3">
        {Array.from({ length: 3 }, (_, index) => (
          <div key={index} className="flex w-40 shrink-0 flex-col gap-2">
            <Skeleton className="aspect-square w-full rounded-lg" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        ))}
      </div>
    </div>
  );
}

type TimeDealPreviewProps = {
  dealsPromise: Promise<TimeDealList>;
};

/** "전체" 탭의 타임딜 미리보기. 백엔드가 진행 중인 딜 묶음 개수를 제한하지 않으므로(#282)
 *  묶음이 여러 개 올 수 있다 — 응답 순서를 믿지 않고 가장 먼저 끝나는 묶음 하나만
 *  보여주다가, 그 묶음이 끝나면(Countdown onEnd) 다음으로 먼저 끝나는 묶음으로 넘어간다.
 *  전부 끝나야만 빈 상태를 보인다(#289) */
function TimeDealPreview({ dealsPromise }: TimeDealPreviewProps) {
  const { groups } = use(dealsPromise);
  // 타임딜 화면의 오픈 알림과 같은 구독이다. 타임딜은 한 번에 열려 전체 구독 하나다(#644)
  const { subscribed: notified } = useQueryTimeDealSubscription();
  const { setSubscribed, isPending: notifyPending } = useMutateTimeDealSubscription();
  // 알림 신청과 특가 더보기(타임딜 화면)는 로그인해야 쓴다. 비로그인이면 토스트만 띄운다 (#542)
  const requireSession = useRequireSession();
  // 서버가 다시 알려준 게 아니라, 이 화면에서 카운트다운이 다 돼 로컬로만 숨긴 딜 id들
  const [endedDealIds, setEndedDealIds] = useState<number[]>([]);

  const visibleGroups = groups
    .filter((group) => !endedDealIds.includes(group.dealId))
    .sort((a, b) => new Date(a.endAt).getTime() - new Date(b.endAt).getTime());
  const group: TimeDealGroup | undefined = visibleGroups[0];

  if (!group) {
    return (
      <>
        <h2 className="pr-5 text-title-bold-20 text-foreground">오늘의 타임딜</h2>
        <div className="pr-5">
          <EmptyState
            icon={<Icon name="clock" />}
            title="지금은 진행 중인 타임딜이 없어요"
            description="매주 목요일 밤 12시에 새로운 특가가 열려요"
            className="rounded-xl border border-dashed border-border px-0 py-4"
            action={
              notified ? (
                <p
                  role="status"
                  className="inline-flex min-h-11 items-center gap-1 px-2.5 text-body-medium-14 text-text-body-secondary"
                >
                  <Icon name="check" className="size-5" />
                  오픈 알림 신청됨
                </p>
              ) : (
                <button
                  type="button"
                  disabled={notifyPending}
                  onClick={() => {
                    if (requireSession()) setSubscribed(true);
                  }}
                  className="flex min-h-11 items-center px-2.5 text-body-medium-14 text-brand"
                >
                  <LoadingSwap loading={notifyPending} label="오픈 알림을 신청하는 중">
                    <span className="inline-flex items-center gap-1">
                      <Icon name="bell" className="size-5" />
                      오픈 알림 받기
                    </span>
                  </LoadingSwap>
                </button>
              )
            }
          />
        </div>
      </>
    );
  }

  return (
    <>
      <div className="flex flex-col gap-1 pr-5">
        <h2 className="text-title-bold-20 text-foreground">
          매주 목요일 밤 12시 <span className="text-brand">타임딜 특가</span>
        </h2>
        <div className="flex flex-col gap-0.5">
          <Countdown
            endsAt={new Date(group.endAt)}
            onEnd={() => setEndedDealIds((prev) => [...prev, group.dealId])}
          />
          <p className="text-body-regular-14 text-text-body-secondary">종료까지 남은 시간</p>
        </div>
      </div>

      <ScrollRow label="타임딜 상품" itemWidth="160px" edgeInset={5} bleedRight={false}>
        {group.items.map((item) => (
          <ScrollRowItem key={item.timeDealItemId}>
            <ProductGridCard
              // 딜 아이템 번호를 함께 넘긴다 — 딜가는 일반 상품 상세에 오지 않는다(#484)
              href={`/products/${item.productId}?dealItem=${item.timeDealItemId}`}
              name={item.name}
              price={item.price}
              originalPrice={item.originalPrice}
              discountRate={item.discountRate}
              imageUrl={item.thumbnailUrl ?? undefined}
              meta={
                item.unitLabel && (
                  <p className="text-label-medium-11 text-text-body-tertiary">
                    {formatUnitPrice(item.unitLabel, item.unitAmount)}
                  </p>
                )
              }
            />
          </ScrollRowItem>
        ))}
      </ScrollRow>

      <div className="pr-5">
        <Button variant="outline" className="min-h-11 w-full text-label-bold-16 font-bold" asChild>
          <Link
            href="/deals"
            onClick={(event) => {
              if (!requireSession()) event.preventDefault();
            }}
          >
            특가 더보기
          </Link>
        </Button>
      </div>
    </>
  );
}

type HomeViewProps = {
  /** app/page.tsx가 서버에서 만든, 아직 안 기다린 카테고리 목록 조회 결과.
   *  category==="all"이면 그리드 자체가 안 그려지므로 이 Promise는 만들어지지만
   *  쓰이지 않는다(검색 결과 없음 화면과 같은 이유로 조회는 이미 생략된 상태다) */
  productsPromise: Promise<ProductListResult>;
  /** productsPromise와 같은 렌더에서 서버가 주소로 정한 종류·정렬. 화면 구성·탭 표시·그리드
   *  조건을 모두 이 값으로 그린다 — 데이터와 같은 렌더에서 오므로 둘이 어긋날 수 없다.
   *
   *  **nuqs 값으로 그리지 않는다(#560).** `shallow: false`인 nuqs는 history API로 주소를 먼저
   *  바꾸고(Next는 이전 화면 그대로 주소만 바뀐 상태를 만든다) 서버 요청을 따로 건다. 그 전환이
   *  끝나기 전에 뒤로가면, 뒤로가기가 `/`를 그린 앞뒤로 "주소만 사료로 바뀐 상태"가 늦게 커밋되고
   *  nuqs 값은 `/`로 돌아온 뒤에도 "food"에 남았다. 그래서 화면은 사료 탭 모양인데 목록은 전체용
   *  빈 목록에 멈췄다(느린 CPU에서 첫 화면 직후 누를 때 실측) */
  category: HomeCategory;
  sort: HomeSort;
  /** 서버가 만든 진행 중 타임딜 조회 결과. "전체" 탭에서만 쓰인다 */
  dealsPromise: Promise<TimeDealList>;
};

export function HomeView({ productsPromise, category, sort, dealsPromise }: HomeViewProps) {
  const router = useRouter();
  // 종류·정렬을 바꾸면 서버가 새 목록을 줄 때까지 이전 화면이 남는다.
  // isPending인 동안 Skeleton으로 교체해 기다리는 중임을 알린다 — 이전 그리드를 두면
  // 더 보기가 새 category/sort에 이전 cursor를 섞어 보낼 수도 있다(#289)
  const [isPending, startTransition] = useTransition();
  /**
   * 종류·정렬을 주소에 담아 서버가 다시 그리게 한다(#560). Next 라우터 이동 하나라 주소·화면·데이터가
   * 함께 바뀌고, 뒤로가기도 Next가 기억해 둔 그 화면으로 돌아간다. 기본값은 주소에서 뺀다(nuqs의
   * clearOnDefault와 같다).
   *
   * 종류는 화면 구성이 통째로 바뀌어 `push`다 — 뒤로가기로 이전 종류에 돌아올 수 있어야 한다.
   * 정렬은 같은 목록의 순서라 `replace`다
   */
  const navigate = (
    next: { category: HomeCategory; sort: HomeSort },
    history: "push" | "replace",
  ) => {
    const params = new URLSearchParams();
    if (next.category !== "all") params.set("category", next.category);
    if (next.sort !== "recommend") params.set("sort", next.sort);
    const query = params.toString();
    startTransition(() => router[history](query ? `/?${query}` : "/", { scroll: false }));
  };
  const [petId, setPetId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<PendingFeedback | null>(null);
  const [recentIndex, setRecentIndex] = useState(0);
  const recentListRef = useRef<HTMLUListElement>(null);
  // 카드마다 반응 남기기 버튼 이름이 같아, 스크린 리더가 어느 상품인지 알도록 상품명을 설명으로 잇는다
  const recentNameId = useId();

  // **아이는 마이페이지와 같은 실제 목록에서 온다.** 예시 이름(소리·냥이)을 쓰던 동안 화면마다
  // 이름이 달랐다(QA 1차 6번, #470). 고르기 전에는 기본 아이이고, 로그인하지 않았으면 부르지 않아
  // 아이가 없다 — 그때 문구는 "우리 아이"로 읽는다.
  //
  // **로그인 여부를 아직 모르는 동안도 받는 중과 같이 뼈대를 그린다.** 이 화면은 서버가 그리는데,
  // 서버에서는 로그인을 알 수 없다. 로그아웃 모양으로 그려 두면 하이드레이션 뒤 아이 줄이 끼어들며
  // 아래 구역이 통째로 밀린다(#470 리뷰). 아이 등록이 전제인 서비스라 로그인한 쪽을 지킨다
  const session = useSessionState();
  const { pets, isLoading } = useQueryPets({ enabled: session === true });
  const isWaitingPets = session === null || isLoading;
  const pet =
    pets?.find((item) => item.id === petId) ?? pets?.find((item) => item.isDefault) ?? pets?.[0];
  const petName = pet?.name ?? "우리 아이";

  const selectDefaultPet = useSelectDefaultPet();

  /**
   * 아이를 고른다. 맞춤 상품·적합도가 모두 그 아이 기준으로 바뀌므로 누구로 바뀌었는지 알린다(QA r18, #611).
   * 지금 보이는 아이를 다시 누르면 바뀐 것이 없어 요청도 알림도 없다.
   *
   * **고른 아이가 기본 아이가 된다(QA HM-020, #531).** 상품 상세 적합도·결제·맞춤 추천이 모두 기본
   * 아이로 시작하므로, 화면 안에만 두면 이 화면을 떠나는 순간 처음 아이로 돌아갔다. 표시는 바로 옮기고
   * 알림은 서버가 받은 뒤에 띄운다 — 먼저 띄우면 실패했을 때 "바꿨어요"가 거짓이 된다. 실패하면
   * 알림은 전역이 띄우고 여기서는 기본 아이로 되돌린다. 그사이 다른 아이를 골랐으면 그 선택은 둔다.
   *
   * **목록의 `isDefault`로 요청을 건너뛰지 않는다.** 앞 요청이 도는 동안 목록은 옛 기본 아이를
   * 가리킨다. 그 아이를 요청 없이 고르면 화면은 그 아이인데 서버에는 앞 요청의 아이가 남는다.
   * 요청은 훅이 누른 순서대로 하나씩 보낸다
   */
  const selectPet = (id: string) => {
    const next = pets?.find((item) => item.id === id);
    if (!next || next.id === pet?.id) return;
    setPetId(id);
    selectDefaultPet(next, () => setPetId(null));
  };

  // **최근에 구매한 상품은 반응을 남길 수 있는 실제 구매다(#494).** 누구에게나 같은 목데이터
  // 두 개가 뜨고 남긴 반응이 서버에 가지 않던 자리다. 마이페이지 아이 관리의 제품 탭과 같은 목록이다.
  //
  // **받는 동안 뼈대를 그리지 않는다.** 아이 줄과 달리 이 칸은 구매확정 뒤 며칠이 지난 사람에게만
  // 있다 — 뼈대를 그렸다 지우면 칸이 없는 대부분의 사람에게 아래 구역이 한 번 밀린다
  const pending = useQueryPendingFeedbacks({ enabled: session === true });
  const recentItems = pending.items ?? [];
  // 답해서 목록이 줄면 스크롤 전의 칸 번호가 남는다. 남은 칸 안으로 당겨 점 하나는 늘 켜 둔다(#498 점검)
  const activeRecent = Math.min(recentIndex, recentItems.length - 1);
  const { submitFeedback, isSubmitting } = useMutateSubmitFeedback();

  // 시안(Frame 31)의 점 표시기를 실제 스크롤 위치에 맞춘다. 카드 사이 간격(gap)까지
  // 포함해야 해서, 고정 폭을 그대로 쓰지 않고 옆 칸까지의 실제 간격(offsetLeft 차이)으로
  // 한 칸 크기를 구한다
  const handleRecentScroll = () => {
    const list = recentListRef.current;
    const first = list?.children[0] as HTMLElement | undefined;
    const second = list?.children[1] as HTMLElement | undefined;
    if (!list || !first || !second) return;
    const step = second.offsetLeft - first.offsetLeft;
    if (step <= 0) return;
    const index = Math.round(list.scrollLeft / step);
    setRecentIndex(Math.max(0, Math.min(recentItems.length - 1, index)));
  };

  /**
   * 반응의 아이. 항목의 `petId`가 그 제품을 사 준 아이다. 2026-09-23부터 주문에 아이가 필수라
   * (주문 서비스 `CreateOrderRequest.petId`) 그 전 주문만 `null`이고, 그때는 메인에서 고른 아이다 —
   * 시트의 "○○에게 잘 맞았나요?"도 그 아이다.
   *
   * **항목의 아이가 목록에 없으면(지운 아이) 이름은 "우리 아이"로 둔다.** 고른 아이 이름으로 떨어지면
   * 다른 아이에게 묻게 된다. 마이페이지 아이 관리와 같다(#498 점검)
   */
  const feedbackPetId = feedback ? (feedback.petId ?? pet?.id ?? null) : null;
  const feedbackPetName =
    pets?.find((candidate) => candidate.id === feedbackPetId)?.name ?? "우리 아이";
  const submitRecent = (choice: FeedbackChoice) =>
    feedback
      ? submitFeedback({
          productId: feedback.productId,
          orderProductId: feedback.orderProductId,
          petId: feedbackPetId,
          submission: choice,
        })
      : Promise.resolve();

  return (
    // 이 화면은 `(constrained)` 그룹 밖이라 폭을 스스로 진다(#496).
    // 1200은 브레이크포인트가 아니라 최대 폭이다 — 768~1199는 뷰포트를 다 쓰고
    // 1200부터 멈춰 가운데 선다. 거터 20px은 컨테이너가 아니라 섹션이 갖는다.
    // 헤더·카테고리 탭·하단 탭바가 모두 이 안에 있어 함께 1200에 맞춰진다
    // (BottomNav가 sticky라 흐름 안에 있다).
    <div className="mx-auto flex min-h-dvh w-full max-w-300 flex-col">
      {/* 시안 header/type=logo. 실제 로고 이미지 자산이 아직 없어 글자를 그대로 둔다 */}
      <PageHeader
        leading="logo"
        right={
          <nav aria-label="바로 가기" className="flex items-center gap-1">
            <HeaderIconLink href="/search" label="검색" icon="search" />
            <NotificationBell />
            <CartLink />
          </nav>
        }
      />

      {/* 탭처럼 보이지만 탭 역할을 주지 않는다. 고르면 화면 구성이 통째로 바뀌고 주소도 달라져
          연결할 패널이 없다. 지금 어느 것을 보고 있는지는 aria-current로 알린다.
          시안 tap_item: 활성은 label-bold-14 + 검정 밑줄, 비활성은 label-medium-14 + 회색.
          보고 있는 탭을 다시 누르면 아무것도 하지 않는다 — 서버를 다시 불러 뼈대만 한 번 번쩍인다 */}
      <nav aria-label="상품 종류" className="flex px-5">
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-current={category === value ? "page" : undefined}
            onClick={() => value !== category && navigate({ category: value, sort }, "push")}
            className={
              category === value
                ? "min-h-11 border-b border-border-strong px-2 text-label-bold-14 text-text-label-default"
                : "min-h-11 border-b border-transparent px-2 text-label-medium-14 text-text-body-tertiary"
            }
          >
            {CATEGORY_LABEL[value]}
          </button>
        ))}
      </nav>

      <main className="flex flex-1 flex-col pb-24">
        {/* 종류·정렬을 바꾸고 서버 응답을 기다리는 동안은 어느 탭이든 뼈대를 그린다. 탭 표시와 구성은
            응답이 와야 바뀌므로(서버가 준 값으로 그린다) 이것이 눌렸다는 표시다 */}
        {isPending ? (
          <ProductGridSkeleton />
        ) : category === "all" ? (
          <>
            <PromoBannerCarousel />

            {isWaitingPets ? (
              <PetSwitcherSkeleton />
            ) : (
              // 아이가 0마리여도 새 아이를 들이는 칸은 남긴다. 목록을 못 받았으면(실패) 줄을 비운다
              pets && (
                <PetSwitcher
                  pets={pets}
                  selectedId={pet?.id}
                  onSelect={selectPet}
                  // #189가 정한 대로 새 아이는 온보딩 기본 정보 단계로 잇는다. 5마리를 채웠으면
                  // 추가 칸을 그리지 않는다(QA No.130, #527)
                  onAdd={canAddPet(pets) ? () => router.push(toAddPetHref("/")) : undefined}
                  withNames
                  variant="main"
                />
              )
            )}

            <section className="flex flex-col gap-5 pt-6 pb-8 pl-5">
              {/* 고른 아이를 맞춤 추천까지 들고 간다. 안 들고 가면 추천은 기본 아이로 열려, 메인에서
                  다른 아이를 골랐을 때 두 화면의 아이가 달라진다(#470 리뷰) */}
              <SectionTitle
                href={pet ? `/recommendations?pet=${pet.id}` : "/recommendations"}
                className="pr-5"
              >
                {/* 제목은 시안대로 한 줄을 지키고 넘치는 만큼 이름만 말줄임표로 자른다(QA 신규-줄바꿈,
                    #599). 이름 앞뒤 띄어쓰기는 문구에 붙여 둔다 — flex 안에서 띄어쓰기만 있는 글자는
                    그려지지 않고, 문구 끝 띄어쓰기는 whitespace-pre가 아니면 지워진다.
                    화면 낭독기는 잘린 글자도 전부 읽고, 마우스는 title로 본다 */}
                <span className="flex whitespace-pre">
                  {"AI가 골라주는 "}
                  <span title={petName} className="truncate">
                    {petName}
                  </span>
                  {" 맞춤 상품"}
                </span>
              </SectionTitle>
              {/* 추천은 고른 아이 기준이라 아이가 있어야 부른다. 아이 줄과 같이 로그인 여부를 모르거나
                  아이 목록을 받는 동안은 뼈대로 자리를 잡는다 */}
              {isWaitingPets ? (
                <RecommendedProductsSkeleton />
              ) : pet ? (
                // 추천만 실패하면 이 칸만 대체한다. 아이를 바꾸면 경계를 비워 새 아이로 다시 부른다
                <ErrorBoundary
                  resetKeys={[pet.id]}
                  fallback={(retry) => (
                    <div
                      role="alert"
                      className="flex flex-col items-center gap-3 py-4 pr-5 text-center"
                    >
                      <p className="text-body-regular-14 text-text-body-secondary">
                        맞춤 상품을 불러오지 못했어요. 다시 시도해 주세요.
                      </p>
                      {/* 누르면 경계가 비워지고 칸이 곧바로 뼈대로 바뀌어 대기 표시를 따로 두지 않는다 */}
                      <Button variant="outline" className="min-h-11 px-4" onClick={retry}>
                        다시 시도
                      </Button>
                    </div>
                  )}
                >
                  <RecommendedProducts petId={Number(pet.id)} petName={pet.name} />
                </ErrorBoundary>
              ) : (
                // 로그인하지 않았거나 아이가 없다. 추천은 아이 기준이라 부르지 않고 무엇을 하면 되는지 알린다.
                // 아이 목록을 받지 못했으면(실패) 아이 줄처럼 비워 둔다
                (session === false || pets?.length === 0) && (
                  <p className="py-8 pr-5 text-center text-body-medium-14 text-text-body-tertiary">
                    {session === false
                      ? "로그인하면 우리 아이에게 맞는 상품을 골라드려요"
                      : "아이를 등록하면 맞는 상품을 골라드려요"}
                  </p>
                )
              )}
            </section>

            {/* 이 서비스가 근거를 모으는 자리. 남길 반응이 없으면 빈 상태를 안내한다(QA r26·r31, #625).
                시안에 빈 상태가 없어 맞춤 상품의 빈 안내와 같은 모양으로 둔다 */}
            {/* 다시 받는 동안에도 오류 칸을 지킨다 — 받아 둔 것 없이 다시 부르면 조회가 오류를 비운다(#498 점검) */}
            {(pending.error || pending.isRetrying) && !pending.items ? (
              <section className="flex flex-col gap-3 py-6 pl-5">
                <SectionTitle className="pr-5">최근에 구매한 상품, 아이는 어때요?</SectionTitle>
                <div
                  role="alert"
                  className="flex flex-col items-center gap-3 py-4 pr-5 text-center"
                >
                  <p className="text-body-regular-14 text-text-body-secondary">
                    최근에 구매한 상품을 불러오지 못했어요. 다시 시도해 주세요.
                  </p>
                  <Button
                    variant="outline"
                    className="min-h-11 px-4"
                    disabled={pending.isRetrying}
                    onClick={() => void pending.refetch()}
                  >
                    <LoadingSwap
                      loading={pending.isRetrying}
                      label="최근에 구매한 상품을 다시 불러오는 중"
                    >
                      다시 시도
                    </LoadingSwap>
                  </Button>
                </div>
              </section>
            ) : pending.items && recentItems.length === 0 ? (
              <section className="flex flex-col gap-3 py-6 pl-5">
                <SectionTitle className="pr-5">최근에 구매한 상품, 아이는 어때요?</SectionTitle>
                <p className="py-8 pr-5 text-center text-body-medium-14 text-text-body-tertiary">
                  아직 반응을 남길 상품이 없어요
                </p>
              </section>
            ) : (
              recentItems.length > 0 && (
                <section className="flex flex-col gap-3 py-6 pl-5">
                  <SectionTitle className="pr-5">최근에 구매한 상품, 아이는 어때요?</SectionTitle>
                  <ScrollRow
                    ref={recentListRef}
                    onScroll={handleRecentScroll}
                    label="최근에 구매한 상품"
                    itemWidth="322px"
                    edgeInset={5}
                    bleedRight={false}
                    className="gap-2"
                  >
                    {recentItems.map((item) => (
                      <ScrollRowItem key={item.orderProductId}>
                        <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                          {/* 사진·이름을 누르면 그 상품 상세로 간다(QA HM-032). 버튼은 링크 안에 둘 수
                              없어 반응 남기기는 링크 밖에 따로 둔다. 사진이 60px라 누르는 자리는 44px를 넘는다 */}
                          <Link
                            href={`/products/${item.productId}`}
                            className="flex items-center gap-3 rounded-lg focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                          >
                            {/* 이름이 바로 옆에 있어 사진은 꾸밈이다(alt="") */}
                            {item.imageUrl ? (
                              <Image
                                src={item.imageUrl}
                                alt=""
                                width={60}
                                height={60}
                                sizes="60px"
                                className="size-15 shrink-0 rounded-lg object-cover"
                              />
                            ) : (
                              <span
                                aria-hidden
                                className="flex size-15 shrink-0 items-center justify-center rounded-lg bg-muted"
                              >
                                <Icon name="image" className="size-6 text-muted-foreground" />
                              </span>
                            )}
                            <div className="flex min-w-0 flex-col gap-2">
                              {/* 시안은 15px SemiBold(raw, 토큰 없음)인데 이 크기의 타입 토큰이
                              디자인 시스템에 없다. SemiBold(600)도 #162에서 정리된 대로 이
                              프로젝트가 등록해 쓰지 않는 굵기라, 가장 가까운 기존 토큰
                              (14px Bold)으로 근사한다 — PD팀에 15px·SemiBold 처리 여부 확인 필요 */}
                              <p
                                id={`${recentNameId}-${item.orderProductId}`}
                                className="truncate text-label-bold-14 text-foreground"
                              >
                                {item.name}
                              </p>
                              {/* 시안의 "구매 후 N일"·"N번째 구매" 뱃지는 응답에 값이 없어 그리지 않는다.
                              지어낸 숫자를 보이면 반응의 근거가 거짓이 된다 (#494) */}
                            </div>
                          </Link>
                          <Button
                            className="min-h-11 w-full bg-brand text-label-bold-16 font-bold text-brand-foreground hover:bg-brand/90"
                            aria-describedby={`${recentNameId}-${item.orderProductId}`}
                            onClick={() => setFeedback(item)}
                          >
                            우리 아이 반응 남기기
                          </Button>
                        </div>
                      </ScrollRowItem>
                    ))}
                  </ScrollRow>
                  {/* 시안(Frame 31)은 배너와 같은 점 표시기다 — 이 목록은 있고, 아래 두 목록
                  (AI 추천·타임딜)은 개수가 안 정해져 있어 없다. 피그마엔 점이 3개
                  보이지만 실제 항목 수만큼 그린다 */}
                  <span aria-hidden className="flex justify-center gap-1">
                    {recentItems.map((item, index) => (
                      <span
                        key={item.orderProductId}
                        className={cn(
                          "size-1.5 rounded-full",
                          index === activeRecent ? "bg-primary" : "bg-border",
                        )}
                      />
                    ))}
                  </span>
                </section>
              )
            )}

            {/* 시안은 이 줄만 왼쪽 여백(pl-5)이고 오른쪽은 없다 — ScrollRow가 화면
                끝까지 삐져나가야 해서, 그 줄 말고 나머지 자식들에 pr-5를 따로 준다.
                타임딜은 실제 API로 연동했다(#289) — 진행 중인 딜이 여러 개일 수 있고,
                묶음이 끝나면 다음 묶음으로 넘어가는 흐름은 TimeDealPreview가 맡는다 */}
            <section className="flex flex-col gap-6 pt-5 pb-8 pl-5">
              <ErrorBoundary
                fallback={() => <PromiseErrorFallback router={router} />}
                resetKeys={[dealsPromise]}
              >
                <Suspense fallback={<TimeDealSkeleton />}>
                  <TimeDealPreview dealsPromise={dealsPromise} />
                </Suspense>
              </ErrorBoundary>
            </section>
          </>
        ) : (
          // 서버가 productsPromise와 같은 렌더에서 준 종류·정렬로 다시 마운트한다 —
          // ProductGrid 안의 누적 목록·커서·오류 상태가 필터 전환 때 자동으로 비워진다(#289)
          <ErrorBoundary
            key={`${category}:${sort}`}
            fallback={() => <PromiseErrorFallback router={router} />}
            resetKeys={[productsPromise]}
          >
            <Suspense fallback={<ProductGridSkeleton />}>
              <ProductGrid
                productsPromise={productsPromise}
                category={category}
                sort={sort}
                sortSelect={
                  // 시안(dropdown)은 테두리 안쪽에 4px 여백을 두고 그 안에 항목을 채운다.
                  // 트리거 아래로 열리는 일반 드롭다운이라 position="popper"·오른쪽 정렬을 쓴다
                  <Select
                    value={sort}
                    onValueChange={(next) =>
                      navigate({ category, sort: next as HomeSort }, "replace")
                    }
                  >
                    <SelectTrigger
                      aria-label="정렬"
                      // 보이는 크기는 시안대로 두고, 누르는 자리만 after:로 시안 프레임
                      // 높이(59px)만큼 확보한다. 글자 자체는 22px(line-height)라 위아래로
                      // (59-22)/2=18.5px씩 남긴다
                      className="relative w-auto border-0 bg-transparent p-0 text-label-bold-14 shadow-none after:absolute after:inset-[-18.5px] data-[size=default]:h-auto dark:bg-transparent dark:hover:bg-transparent"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent position="popper" align="end" className="w-42.5 min-w-42.5 p-1">
                      {SORTS.map((value) => (
                        <SelectItem
                          key={value}
                          value={value}
                          // 시안은 고른 항목을 체크 표시가 아니라 배경색으로만 구분한다.
                          // Select 기본은 체크 아이콘을 같이 보여줘서 숨긴다
                          className="h-10 rounded-md px-1.5 text-label-medium-14 data-[state=checked]:bg-surface-weak data-[state=checked]:font-bold [&>span:first-child]:hidden"
                        >
                          {SORT_LABEL[value]}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                }
              />
            </Suspense>
          </ErrorBoundary>
        )}
      </main>

      <BottomNav />

      <ProductFeedbackSheet
        target={
          feedback && {
            productId: feedback.productId,
            productName: feedback.name,
            imageUrl: feedback.imageUrl,
          }
        }
        petName={feedbackPetName}
        onOpenChange={(open) => !open && setFeedback(null)}
        // "자세히 보러 갈게요"는 상품이 아니라 아이 관리로 간다. 메인 구조도가 "반응 체크 → 마이페이지로
        // 이동"이다(QA HM-042). 메인에서 고른 아이가 아니라 반응을 남긴 아이로 연다(`?pet=`, #527).
        // 남긴 반응은 제품 탭에서 빠지므로 탭은 기본(내 아이 관리)으로 둔다
        onSeeProduct={() =>
          router.push(feedbackPetId ? `/mypage/pets?pet=${feedbackPetId}` : "/mypage/pets")
        }
        onSubmit={submitRecent}
        isSubmitting={isSubmitting}
        variant="full"
      />
    </div>
  );
}
