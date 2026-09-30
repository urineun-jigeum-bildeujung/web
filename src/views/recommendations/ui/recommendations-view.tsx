// 고른 아이에게 맞는 상품을 모아 보여준다.
// UI 시안 기준(#273, 1576-87320)이다. 헤더는 시안(로고+검색+알림+장바구니)과 달리
// 뒤로가기 있는 PageHeader를 쓴다 — 메인 "맞춤 추천"의 "더보기"로 들어가는 서브
// 화면이라 사용자 흐름상 뒤로 갈 방법이 있어야 해서 우선 이렇게 두었고, 시안대로
// 바꿀지는 프디팀 확인 후 정한다. 오른쪽 검색·알림·장바구니는 시안대로 둔다 — 빠져 있었다(QA 1차 2번, #470).
//
// 아이는 마이페이지와 같은 실제 목록이고, 상품·적합도·추천 이유는 AI 추천 API 결과다(#600).

"use client";

import { parseAsString, parseAsStringLiteral, useQueryState } from "nuqs";
import { useState } from "react";

import { BottomNav } from "@/widgets/bottom-nav";
import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";
import { useQueryPets } from "@/entities/pet";
import { MatchScoreBadge } from "@/entities/product";
import {
  formatUnitPriceLine,
  RECOMMENDATION_SORTS,
  RecommendationReason,
  SaleStatusBadge,
  sortRecommendations,
  useQueryHomeRecommendations,
  type RecommendationSort,
} from "@/entities/recommendation";
import { useSessionState } from "@/shared/api/use-session-state";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { HeaderIconLink } from "@/shared/ui/page-header/header-icon-link";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";

// 건강 고민 칩(관절·알러지·구강관리)은 이 시안에 없다. home-view와 같은 상품 분류
// 탭(전체·사료·간식·영양제)으로 거른다
const CATEGORIES = ["all", "food", "snack", "supplement"] as const;
const CATEGORY_LABEL: Record<(typeof CATEGORIES)[number], string> = {
  all: "전체",
  food: "사료",
  snack: "간식",
  supplement: "영양제",
};

// home-view의 정렬 드롭다운(1758-69122)과 같은 목록·순서다. 값 목록은 entities/recommendation이 갖는다
const SORT_LABEL: Record<RecommendationSort, string> = {
  recommend: "추천순",
  latest: "최신순",
  "rating-high": "별점 높은순",
  "rating-low": "별점 낮은순",
};

/**
 * 한 번에 받을 수 있는 최대 개수. 추천 API의 정렬이 추천순 하나뿐이라 최신순·별점순은 받은 목록
 * 안에서 FE가 늘어놓는다 — 그래서 받을 수 있는 만큼 받는다(entities/recommendation README, #600)
 */
const RECOMMENDATION_PAGE_SIZE = 50;

/** 추천을 받는 동안 격자 자리를 잡는다. 2열 두 줄 */
function RecommendationGridSkeleton() {
  return (
    <ul
      className="mt-4 grid grid-cols-2 gap-x-3.25 gap-y-3 px-5"
      role="status"
      aria-label="맞춤 상품을 불러오는 중"
    >
      {Array.from({ length: 4 }, (_, index) => (
        <li key={index} className="flex flex-col gap-2">
          <Skeleton className="aspect-square w-full rounded-lg" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-4 w-1/2" />
        </li>
      ))}
    </ul>
  );
}

type RecommendationGridProps = {
  petId: number;
  petName: string;
  category: (typeof CATEGORIES)[number];
  sort: RecommendationSort;
};

/**
 * 고른 아이·분류의 추천 격자. 분류는 서버가 거르고(요청 `category`), 정렬은 받은 목록 안에서 한다.
 * 조회 훅이 받아 둔 것 없이 실패하면 오류를 던지고, 부모의 `ErrorBoundary`가 이 격자만 대체한다(#600)
 */
function RecommendationGrid({ petId, petName, category, sort }: RecommendationGridProps) {
  const { items, isLoading } = useQueryHomeRecommendations({
    petId,
    category: category === "all" ? undefined : category,
    size: RECOMMENDATION_PAGE_SIZE,
  });
  // 찜은 아직 서버에 남지 않는다(README "아직 없는 것")
  const [liked, setLiked] = useState<number[]>([]);

  if (isLoading || !items) return <RecommendationGridSkeleton />;

  if (items.length === 0) {
    return (
      <EmptyState
        title={`${petName}에게 맞는 상품을 아직 찾지 못했어요`}
        description="아이 정보를 채우면 더 잘 골라드릴 수 있어요."
        className="flex-1"
      />
    );
  }

  const toggleLike = (id: number) =>
    setLiked((prev) => (prev.includes(id) ? prev.filter((v) => v !== id) : [...prev, id]));

  return (
    <ul className="mt-4 grid grid-cols-2 gap-x-3.25 gap-y-3 px-5">
      {sortRecommendations(items, sort).map((product) => {
        const rated = product.reviewCount > 0;
        return (
          <li key={product.productId} className="flex">
            <ProductGridCard
              // 품절 카드는 타임딜 목록(1905-32428)처럼 통째로 흐린다. 글자 배지가 함께 있어 색만으로 알리지 않는다
              className={cn("flex-1", product.status === "soldOut" && "opacity-45")}
              href={`/products/${product.productId}`}
              name={product.name}
              price={product.price}
              originalPrice={product.originalPrice}
              imageUrl={product.thumbnailUrl}
              // 적합도 배지는 이 화면 시안(1584-16064 등)이 홈과 다른 위치·색·문구를
              // 쓰는데, Figma에 이 배지를 다른 화면과 통일할 예정이라는 코멘트가 있다.
              // MatchScoreBadge는 home-view와 같이 쓰는 공용 컴포넌트라 지금 표기를
              // 그대로 두고 통일 방향을 프디팀에 확인한다(README 참고)
              imageBadge={
                <div className="flex flex-col items-start gap-1">
                  <MatchScoreBadge score={product.score} petName={petName} />
                  <SaleStatusBadge status={product.status} />
                </div>
              }
              // 찜 버튼은 32px 흰 원판(rounded-full) 위에 24px 아이콘, 사진 오른쪽
              // 아래 4px 인셋이다(product-detail과 같은 위치). 원판은 시안이 불투명
              // 흰색인데 이 프로젝트에 그 토큰이 없어 반투명 surface-overlay-static으로
              // 근사했다(README 참고)
              imageActionClassName="top-auto right-1 bottom-1"
              imageAction={
                // 비활성 #565D6D=text-body-secondary, 활성 #FF611D=brand — SVG fill을
                // 토큰과 대조해 확인했다
                <button
                  type="button"
                  onClick={() => toggleLike(product.productId)}
                  aria-pressed={liked.includes(product.productId)}
                  aria-label={`${product.name} 찜하기`}
                  className="relative flex size-8 items-center justify-center rounded-full bg-surface-overlay-static after:absolute after:-inset-1.5"
                >
                  {liked.includes(product.productId) ? (
                    <Icon name="heart_fill" aria-hidden className="size-6 text-brand" />
                  ) : (
                    <Icon
                      name="heart_stroke"
                      aria-hidden
                      className="size-6 text-text-body-secondary"
                    />
                  )}
                </button>
              }
              meta={
                <>
                  {/* 시안(1585-16763)의 "하루 예상 급여비 약 N원"은 하루 급여량이 필요한데 추천
                      응답에 없다. 메인 시안(1758-68917)의 단가 줄 "1g당 19원"을 쓰고, 해석하지
                      못하면 줄을 비운다(#600) */}
                  {product.unitPrice && (
                    <p className="text-xs text-muted-foreground">
                      {formatUnitPriceLine(product.unitPrice)}
                    </p>
                  )}
                  {/* 시안(1585-18006)은 5개 별점 줄이 아니라 별 1개(20px)+숫자, 구분선,
                      후기 수다. product-detail의 RatingSummary와 같은 모양이라 공용
                      Rating(5개 별, 리뷰 자체의 별점 표시용)과는 다른 이 마크업을 쓴다.
                      별점은 값이 아니라 후기 수로 가른다 — 후기가 없으면 회색 별에 "-"다(#534) */}
                  <span className="flex items-center gap-2">
                    {rated && (
                      <span className="sr-only">{`5점 만점에 ${product.rating.toFixed(1)}점`}</span>
                    )}
                    <span aria-hidden className="flex items-center gap-0.5">
                      <Icon
                        name="star"
                        className={cn(
                          "size-5",
                          rated ? "text-icon-fill-accent" : "text-icon-fill-disable",
                        )}
                      />
                      <span className="text-body-medium-14 text-text-body-secondary">
                        {rated ? product.rating.toFixed(1) : "-"}
                      </span>
                    </span>
                    <span aria-hidden className="h-4 w-px bg-border" />
                    <span className="text-body-medium-14 text-text-body-secondary">
                      후기 {product.reviewCount}개
                    </span>
                  </span>
                  {/* 왜 이 아이에게 추천하는지. 이 화면이 별점·인기순 나열과 갈라지는 근거다(#600) */}
                  <RecommendationReason
                    reason={product.reason}
                    allergyPenalized={product.allergyPenalized}
                    className="mt-1"
                  />
                </>
              }
            />
          </li>
        );
      })}
    </ul>
  );
}

export function RecommendationsView() {
  // 아이 id는 서버에서 오는 값이라 보기를 미리 적을 수 없어 parseAsStringLiteral을 쓰지 못한다.
  // 대신 아래에서 목록에 없는 id면 기본 아이로 되돌린다
  const [petId, setPetId] = useQueryState("pet", parseAsString);
  // 주소로 아무 값이나 올 수 있다. 목록에 없는 값이면 목록이 통째로 비므로 보기 안에서만 받는다.
  const [category, setCategory] = useQueryState(
    "category",
    parseAsStringLiteral(CATEGORIES).withDefault("all"),
  );
  // 필터·정렬은 URL 상태로 둔다(AGENTS.md) — 상품 상세로 갔다 돌아와도 유지돼야 한다
  const [sort, setSort] = useQueryState(
    "sort",
    parseAsStringLiteral(RECOMMENDATION_SORTS).withDefault("recommend"),
  );

  // **아이는 마이페이지와 같은 실제 목록에서 온다.** 예시 이름(코코·봄이)을 쓰던 동안 화면마다
  // 이름이 달랐다(QA 1차 6번, #470). 로그인하지 않았으면 부르지 않아 아이가 없고 "우리 아이"로 읽는다.
  // 로그인 여부를 아직 모르는 동안(서버 렌더·하이드레이션)은 받는 중과 같이 알약 자리를 잡는다 — 메인과
  // 같은 기준이다
  const session = useSessionState();
  const { pets, isLoading } = useQueryPets({ enabled: session === true });
  const isWaitingPets = session === null || isLoading;
  const pet =
    pets?.find((item) => item.id === petId) ?? pets?.find((item) => item.isDefault) ?? pets?.[0];

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="맞춤 추천"
        right={
          // 시안(1576-87320) 헤더의 검색·알림·장바구니. 모든 헤더와 같은 공용 슬롯이다(#513)
          <>
            <HeaderIconLink href="/search" label="검색" icon="search" />
            <NotificationBell />
            <CartLink />
          </>
        }
      />

      {/* 시안(홈화면 프레임 기준)은 상태 표시줄+헤더 아래로 12px을 두고 본문이 시작한다.
          다른 화면들도 PageHeader 다음에 pt-3을 공통으로 쓴다 */}
      <main className="flex flex-1 flex-col pt-3 pb-8">
        <div className="flex flex-col gap-2 px-5">
          <div className="flex flex-col">
            <div className="flex items-center gap-1">
              {/* 아이를 바꾸면 추천도 바뀐다. 시안(1576-87420)은 검정 알약 안에 이름+화살표만
                  두고 문장 첫머리에 잇는다. 보이는 높이는 32px, 누르는 자리만 44px로 넓힌다 */}
              {/* 주소에 없는 id가 와도 본문과 같은 아이를 가리키도록 정규화한 값을 쓴다 */}
              {pet ? (
                <Select value={pet.id} onValueChange={(next) => void setPetId(next)}>
                  {/* 배경은 시안(1576-87505, button/bg/primary #2a3038)과 같은 surface-primary
                      토큰이다 — shadcn Button 기본 변형의 bg-primary와 같다. 화살표는 시안대로
                      20px 흰 아이콘으로 바꾸고, 시안에 없는 기본 테두리도 지운다 */}
                  <SelectTrigger
                    aria-label="어느 아이의 추천을 볼지"
                    // 알약이 이름을 한 줄로 두고 남는 폭을 넘으면 말줄임표로 자른다. 뒤 문장은 줄지 않는다
                    // (QA 신규-줄바꿈, #599). 잘려도 마우스로 전체 이름을 본다
                    title={pet.name}
                    // 마지막 svg(공용 트리거의 기본 화살표)만 지운다 — 앞의 Icon은 남겨야 한다
                    className="relative h-8 w-auto min-w-0 gap-1 rounded-lg border-0 bg-primary px-3 py-2 text-label-medium-12 text-primary-foreground after:absolute after:-inset-y-1.5 [&>svg:last-child]:hidden"
                  >
                    {/* 공용 트리거가 값 자리를 flex로 그려 글자에 말줄임표가 붙지 않는다. 이름을 한 겹
                        감싸 그 겹이 자른다. 값은 위 value와 같은 아이다 */}
                    <SelectValue>
                      <span className="truncate">{pet.name}</span>
                    </SelectValue>
                    <Icon name="down" aria-hidden className="size-5" />
                  </SelectTrigger>
                  {/* 시안(1585-18052)은 흰 배경에 4px 안쪽 여백, 항목은 40px에 6px 모서리고
                      고른 항목도 체크 표시 없이 글자만 있다. 아이 선택 알약 바로 아래로 열리는
                      일반 드롭다운이라 position="popper"를 쓴다 */}
                  <SelectContent position="popper" align="start" className="min-w-25 p-1">
                    {(pets ?? []).map((item) => (
                      <SelectItem
                        key={item.id}
                        value={item.id}
                        className="h-10 rounded-md px-1.5 [&>span:first-child]:hidden"
                      >
                        {item.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              ) : (
                isWaitingPets && (
                  // 이름이 오기 전에 문장이 "의 건강 고민을"로 시작하지 않게 알약 자리를 잡는다
                  <Skeleton
                    role="status"
                    aria-label="아이 목록을 불러오는 중"
                    className="h-8 w-16 rounded-lg"
                  />
                )
              )}
              {/* 알약이 있으면 문장은 한 줄을 지키고 알약이 준다. 알약이 없으면 "우리 아이의…"가 길어 줄바꿈을 남긴다 */}
              <h2
                className={cn("text-title-bold-20 break-keep text-foreground", pet && "shrink-0")}
              >
                {pet || isWaitingPets ? "의 건강 고민을 덜어줄" : "우리 아이의 건강 고민을 덜어줄"}
              </h2>
            </div>
            <p className="text-title-bold-20 text-foreground">맞춤 상품을 찾았어요</p>
          </div>

          {/* 시안(1576-87525)은 "안내" 라벨과 한 문장을 주황 카드에 담는다. InfoNotice는
              불릿 목록이라 여기엔 맞지 않는다 */}
          <p className="flex items-center gap-2 rounded-xl bg-surface-brand-weak px-2 py-3 text-body-medium-14 text-text-body-brand-strong">
            <span className="shrink-0 text-label-bold-14">안내</span>
            보호자님이 알려주신 건강 고민을 바탕으로 추천해요
          </p>
        </div>

        {/* 건강 고민 칩 대신 home-view와 같은 상품 분류 탭이다(1576-87434). 탭처럼 보이지만
            탭 역할을 주지 않는다 — 화면 구성이 바뀌는 게 아니라 같은 목록을 거를 뿐이다.
            지금 어느 것을 보고 있는지는 aria-current로 알린다 */}
        <nav aria-label="상품 분류" className="mt-4 flex px-5">
          {CATEGORIES.map((value) => (
            <button
              key={value}
              type="button"
              aria-current={category === value ? "page" : undefined}
              onClick={() => void setCategory(value)}
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

        {/* 시안(1576-87321)은 이 줄 높이가 22px뿐이다. 공용 트리거에 min-h-11을 주면
            그만큼 위아래 여백이 늘어나 탭·격자 사이가 시안보다 벌어진다 — 보이는 높이는
            그대로 두고 after:로 누르는 자리만 44px 채운다(home-view 정렬과 같은 기법) */}
        <div className="mt-1 flex items-center justify-end px-5">
          <Select value={sort} onValueChange={(next) => void setSort(next as RecommendationSort)}>
            <SelectTrigger
              aria-label="정렬"
              className="relative w-auto shrink-0 border-0 bg-transparent p-0 text-body-medium-14 text-text-body-secondary shadow-none after:absolute after:-inset-x-2.5 after:-inset-y-3 data-[size=default]:h-auto"
            >
              <SelectValue />
            </SelectTrigger>
            {/* home-view의 정렬 드롭다운(1758-69122)과 같은 패턴이다 — 트리거 아래로 열리는
                일반 드롭다운이라 position="popper"·오른쪽 정렬을 쓰고, 고른 항목은 체크
                아이콘 대신 배경색으로만 구분한다 */}
            <SelectContent position="popper" align="end" className="w-42.5 min-w-42.5 p-1">
              {RECOMMENDATION_SORTS.map((value) => (
                <SelectItem
                  key={value}
                  value={value}
                  className="h-10 rounded-md px-1.5 text-label-medium-14 data-[state=checked]:bg-surface-weak data-[state=checked]:font-bold [&>span:first-child]:hidden"
                >
                  {SORT_LABEL[value]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* 추천은 고른 아이 기준이라 아이가 있어야 부른다. 알약과 같이 로그인 여부를 모르거나 아이
            목록을 받는 동안은 뼈대로 자리를 잡는다 */}
        {isWaitingPets ? (
          <RecommendationGridSkeleton />
        ) : pet ? (
          // 추천만 실패하면 격자만 대체한다. 머리말·분류·정렬은 남는다. 아이를 바꾸면 경계를 비운다
          <ErrorBoundary
            resetKeys={[pet.id]}
            fallback={(retry) => (
              <div role="alert" className="flex flex-col items-center gap-3 px-5 py-12 text-center">
                <p className="text-body-regular-14 text-text-body-secondary">
                  맞춤 상품을 불러오지 못했어요. 다시 시도해 주세요.
                </p>
                {/* 대기 표시 없음 — 누르면 경계가 비워지고 곧바로 격자 뼈대로 바뀐다 */}
                <Button variant="outline" className="min-h-11 px-4" onClick={retry}>
                  다시 시도
                </Button>
              </div>
            )}
          >
            <RecommendationGrid
              petId={Number(pet.id)}
              petName={pet.name}
              category={category}
              sort={sort}
            />
          </ErrorBoundary>
        ) : (
          // 로그인하지 않았거나 아이가 없다. 아이 목록을 받지 못했으면(실패) 비워 둔다
          (session === false || pets?.length === 0) && (
            <EmptyState
              title={
                session === false
                  ? "로그인하면 우리 아이에게 맞는 상품을 골라드려요"
                  : "아이를 등록하면 맞는 상품을 골라드려요"
              }
              className="flex-1"
            />
          )
        )}
      </main>

      {/* 시안(1576-87320)의 navigation 인스턴스다. 시안은 "홈" 탭이 켜진 채로 그려 뒀지만,
          이 화면은 BottomNav의 네 경로(/, /compare, /likes, /mypage) 어디에도 안 속해
          있어 지금 컴포넌트로는 그 상태를 만들 수 없다 — 프디팀 확인 예정(README 참고) */}
      <BottomNav />
    </div>
  );
}
