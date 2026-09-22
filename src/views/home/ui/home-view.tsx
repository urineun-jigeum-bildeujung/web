// 메인 화면. 전체 탭은 골라주는 화면이고, 종류 탭은 상품 목록이다.
// UI 시안 기준(홈화면 1758-68883, 사료 탭 1758-69075 등)이다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, use, useRef, useState, useTransition } from "react";

import { PetSwitcher, ProductFeedbackSheet, type FeedbackTarget } from "@/entities/pet";
import {
  MatchScoreBadge,
  useProductList,
  type ProductCard as ApiProductCard,
  type ProductListResult,
  type TimeDealGroup,
  type TimeDealList,
} from "@/entities/product";
import { cn } from "@/shared/lib/utils";
import { Badge } from "@/shared/ui/badge/badge";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { ErrorBoundary } from "@/shared/ui/error-boundary/error-boundary";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { formatWon } from "@/shared/ui/price/price";
import { ProductGridCard } from "@/shared/ui/product-grid-card/product-grid-card";
import { ScrollRow, ScrollRowItem } from "@/shared/ui/scroll-row/scroll-row";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/shared/ui/select";
import { Skeleton } from "@/shared/ui/skeleton";
import { BottomNav } from "@/widgets/bottom-nav";

import { CATEGORIES, CATEGORY_LABEL, CATEGORY_TO_API, type HomeCategory } from "../model/category";
import { SORT_LABEL, SORT_TO_API, SORTS, type HomeSort } from "../model/sort";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PETS = [
  { id: "1", name: "소리" },
  { id: "2", name: "냥이" },
];

// "AI가 골라주는 맞춤 상품" 캐러셀 전용 목업. petId가 실제 조회에 반영되지 않고
// 적합도(matchScore) 필드도 응답에 없어(#289, product-service 코드로 확인) 이번
// 라운드에서는 연동하지 않는다 — /recommendations와 같은 이유로 제외한다.
const MOCK_PRODUCTS = Array.from({ length: 4 }, (_, index) => ({
  id: String(index + 1),
  name: index % 2 === 0 ? "그레인프리 연어 사료 2kg" : "저자극 덴탈껌 14개입",
  price: index % 2 === 0 ? 31200 : 10800,
  originalPrice: index % 2 === 0 ? 38000 : 13100,
  dailyCost: index % 2 === 0 ? 1050 : 771,
  dailyLabel: index % 2 === 0 ? "하루 예상 급여비" : "1개당",
  rating: index % 2 === 0 ? 4.8 : 4.9,
  reviewCount: index % 2 === 0 ? 108 : 203,
  matchScore: 92 - index * 6,
}));

const MOCK_RECENT: FeedbackTarget[] = [
  {
    productId: "1",
    productName: "저자극 덴탈껌 14개입",
    sinceLabel: "구매 후 6일",
    countLabel: "3번째 구매",
  },
  {
    productId: "2",
    productName: "그레인프리 연어 사료 2kg",
    sinceLabel: "구매 후 12일",
    countLabel: "2번째 구매",
  },
];

/** 시안 ProductCard/Grid의 price 슬롯 — 하루 급여비 캡션 + 별점 + 후기 수를 한 자리에.
 * Rating Container는 5개 별을 늘어놓는 Rating(mypa_041_작성한 기준)과 달리 별 1개 + 숫자다 */
function ProductMeta({ product }: { product: (typeof MOCK_PRODUCTS)[number] }) {
  return (
    <>
      <p className="text-label-medium-11 text-text-body-tertiary">
        {product.dailyLabel} 약 {product.dailyCost.toLocaleString("ko-KR")}원
      </p>
      <div className="flex items-center gap-2">
        <span className="flex items-center gap-0.5">
          <span className="sr-only">5점 만점에 {product.rating}점</span>
          <Icon name="star" className="size-4 text-icon-fill-accent" />
          <span aria-hidden className="text-label-medium-14 text-text-body-tertiary">
            {product.rating.toFixed(1)}
          </span>
        </span>
        <span className="text-label-medium-14 text-text-body-tertiary">
          후기 {product.reviewCount}
        </span>
      </div>
    </>
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
  return (
    <div className={cn("flex items-center justify-between", className)}>
      <h2 className="text-title-bold-20 text-foreground">{children}</h2>
      {href && (
        // 보이는 크기는 시안대로 두고, 누르는 자리만 after:로 44px 확보한다.
        // min-h-11을 쓰면 이 줄 전체가 44px로 늘어나 제목과 격자 사이 간격이 밀린다
        <Link
          href={href}
          className="relative text-label-medium-14 text-text-body-tertiary after:absolute after:-inset-2.75"
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

/** 카테고리 그리드 상품 하나의 가격 아래 자리. 적합도·별점은 응답에 없어(#289)
 *  단가만 보인다 — search-result의 일반 검색 카드와 같은 이유로 정가·할인율도 뺐다 */
function CategoryProductMeta({ product }: { product: ApiProductCard }) {
  return (
    <p className="text-label-medium-11 text-text-body-tertiary">
      {product.unitLabel} {formatWon(product.unitPrice)}
    </p>
  );
}

/** 카테고리 그리드가 대기 중일 때 자리를 잡는다. 정렬 줄 하나 + 카드 4장 자리 */
function ProductGridSkeleton() {
  return (
    <div className="flex flex-col gap-6 px-5" role="status" aria-label="상품 목록을 불러오는 중">
      <div className="flex justify-end">
        <Skeleton className="h-5 w-14" />
      </div>
      <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
        {Array.from({ length: 4 }, (_, index) => (
          <li key={index} className="flex flex-col gap-2">
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

  return (
    <div className="flex flex-1 flex-col">
      <div className="flex justify-end p-5">{sortSelect}</div>

      {items.length === 0 ? (
        <p className="px-5 py-16 text-center text-body-medium-16 text-text-body-tertiary">
          아직 등록된 상품이 없어요
        </p>
      ) : (
        <div className="flex flex-col gap-4 px-5">
          <ul className="grid grid-cols-2 gap-x-3 gap-y-6">
            {items.map((product) => (
              <li key={product.productId} className="flex">
                <ProductGridCard
                  className="flex-1"
                  href={`/products/${product.productId}`}
                  name={product.name}
                  price={product.price}
                  imageUrl={product.thumbnailUrl ?? undefined}
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
  const [notified, setNotified] = useState(false);
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
              // 알림 신청 API가 아직 없어 타임딜 화면(DealsView)처럼 로컬 상태로만 완료를 알린다
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
                  onClick={() => setNotified(true)}
                  className="flex min-h-11 items-center gap-1 px-2.5 text-body-medium-14 text-brand"
                >
                  <Icon name="bell" className="size-5" />
                  오픈 알림 받기
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
              href={`/products/${item.productId}`}
              name={item.name}
              price={item.price}
              originalPrice={item.originalPrice}
              imageUrl={item.thumbnailUrl ?? undefined}
              meta={
                item.unitLabel && (
                  <p className="text-label-medium-11 text-text-body-tertiary">
                    {item.unitLabel} {formatWon(item.unitAmount)}
                  </p>
                )
              }
            />
          </ScrollRowItem>
        ))}
      </ScrollRow>

      <div className="pr-5">
        <Button variant="outline" className="min-h-11 w-full text-label-bold-16 font-bold" asChild>
          <Link href="/deals">특가 더보기</Link>
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
  /** productsPromise와 같은 렌더에서 서버가 만든 `${category}:${sort}` 조합.
   *  ProductGrid를 다시 마운트시키는 key로 이 값을 쓴다 — 클라이언트의 useQueryState
   *  값(category·sort)은 서버가 새 Promise를 만들기도 전에 먼저 바뀔 수 있어(#289,
   *  실측 확인), 그걸 key로 쓰면 아직 이전 Promise로 마운트된 채 새 데이터가 와도
   *  key가 이미 같아 다시 마운트되지 않고 빈 상태에 멈추는 경합이 있었다 */
  productsKey: string;
  /** 서버가 만든 진행 중 타임딜 조회 결과. "전체" 탭에서만 쓰인다 */
  dealsPromise: Promise<TimeDealList>;
};

export function HomeView({ productsPromise, productsKey, dealsPromise }: HomeViewProps) {
  const router = useRouter();
  // 그리드는 서버가 새 Promise를 줄 때까지 이전 카테고리의 상품을 들고 있다.
  // isPending인 동안 Skeleton으로 교체해 숨긴다 — 안 그러면 더 보기가 새
  // category/sort에 이전 cursor를 섞어 보낼 수 있다(#289)
  const [isPending, startTransition] = useTransition();
  const [category, setCategory] = useQueryState(
    "category",
    // 전체 탭은 큐레이션, 종류 탭은 상품 목록으로 구성이 통째로 다르다.
    // 같은 목록의 필터가 아니므로 뒤로가기로 되돌아올 수 있어야 한다.
    // shallow를 꺼서(false) 서버 컴포넌트가 새 카테고리로 다시 조회하게 한다(#289)
    parseAsStringLiteral(CATEGORIES)
      .withDefault("all")
      .withOptions({ history: "push", shallow: false }),
  );
  const [sort, setSort] = useQueryState(
    "sort",
    // 정렬도 서버가 다시 조회해야 하므로 shallow를 끈다(#289)
    parseAsStringLiteral(SORTS).withDefault("recommend").withOptions({ shallow: false }),
  );
  const [petId, setPetId] = useState(MOCK_PETS[0].id);
  const [feedback, setFeedback] = useState<FeedbackTarget | null>(null);
  const [recentIndex, setRecentIndex] = useState(0);
  const recentListRef = useRef<HTMLUListElement>(null);

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
    setRecentIndex(Math.max(0, Math.min(MOCK_RECENT.length - 1, index)));
  };

  const pet = MOCK_PETS.find((item) => item.id === petId) ?? MOCK_PETS[0];

  return (
    <div className="flex min-h-dvh flex-col">
      {/* 시안 header/type=logo. 실제 로고 이미지 자산이 아직 없어 글자를 그대로 둔다 */}
      <header className="flex h-12 items-center justify-between px-5">
        <p className="text-title-bold-18 text-brand">골라주개냥</p>
        <nav
          aria-label="바로 가기"
          className="flex items-center gap-2.25 text-icon-stroke-tertiary"
        >
          {/* 보이는 자리는 시안대로 28px·9px 간격을 두고, 누르는 자리만 after로 안 보이게 넓힌다.
              가로는 간격(9px)의 절반까지만 넓혀 옆 아이콘 터치 영역과 겹치지 않게 한다 */}
          <Link
            href="/search"
            aria-label="검색"
            className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
          >
            <Icon name="search" className="size-7" />
          </Link>
          <Link
            href="/mypage/notifications"
            aria-label="알림"
            className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
          >
            <Icon name="bell_noti" className="size-7" />
          </Link>
          <Link
            href="/cart"
            aria-label="장바구니에 5개"
            className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
          >
            <Icon name="cart" className="size-7" />
            {/* 시안(header, 카트 아이콘의 Notification Badge)의 18px·11px 값 그대로 */}
            <span
              aria-hidden
              className="absolute -top-1 -right-2 flex size-4.5 items-center justify-center rounded-full bg-brand text-label-bold-11 text-brand-foreground"
            >
              5
            </span>
          </Link>
        </nav>
      </header>

      {/* 탭처럼 보이지만 탭 역할을 주지 않는다. 고르면 화면 구성이 통째로 바뀌고 주소도 달라져
          연결할 패널이 없다. 지금 어느 것을 보고 있는지는 aria-current로 알린다.
          시안 tap_item: 활성은 label-bold-14 + 검정 밑줄, 비활성은 label-medium-14 + 회색 */}
      <nav aria-label="상품 종류" className="flex px-5">
        {CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            aria-current={category === value ? "page" : undefined}
            onClick={() => startTransition(() => void setCategory(value))}
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
        {category === "all" ? (
          <>
            {/* 프로모션 배너. 시안은 문구 없이 사진 배너 하나다 — 홍보 문구는 이미지 안에 들어간다 */}
            <section aria-label="진행 중인 행사" className="relative p-5">
              <div className="aspect-4/3 overflow-hidden rounded-lg bg-muted" />
              {/* 배너가 여럿임을 알리는 자리. 넘기는 것은 서버 데이터가 붙은 뒤에 잇는다.
                  시안(Frame 31)은 사진 박스가 아니라 padding을 포함한 이 섹션 기준
                  bottom-[29.75px]다 — 테두리 없이 짙은 원 1개 + 옅은 원 2개.
                  비선택 원은 라이트/다크 각각 surface/default(흰색/#141414)라 고정
                  흰색이 아니라 모드에 따라 바뀌는 토큰(bg-background)을 쓴다 */}
              <span
                aria-hidden
                className="absolute bottom-[29.75px] left-1/2 flex -translate-x-1/2 gap-1"
              >
                <span className="size-1.5 rounded-full bg-primary" />
                <span className="size-1.5 rounded-full bg-background" />
                <span className="size-1.5 rounded-full bg-background" />
              </span>
            </section>

            <PetSwitcher
              pets={MOCK_PETS}
              selectedId={petId}
              onSelect={setPetId}
              // #189가 정한 대로 새 아이는 온보딩 기본 정보 단계로 잇는다
              onAdd={() => router.push("/onboarding?step=basic")}
              withNames
              variant="main"
            />

            <section className="flex flex-col gap-5 pt-6 pb-8 pl-5">
              <SectionTitle href="/recommendations" className="pr-5">
                AI가 골라주는 {pet.name} 맞춤 상품
              </SectionTitle>
              <ScrollRow
                label={`${pet.name} 맞춤 상품`}
                itemWidth="208px"
                edgeInset={5}
                bleedRight={false}
              >
                {MOCK_PRODUCTS.slice(0, 4).map((product) => (
                  <ScrollRowItem key={product.id}>
                    <ProductGridCard
                      href={`/products/${product.id}`}
                      name={product.name}
                      price={product.price}
                      originalPrice={product.originalPrice}
                      imageBadge={<MatchScoreBadge score={product.matchScore} petName={pet.name} />}
                      imageAction={
                        // 시안(Reaction Button)은 24px 흰색이다 — 사진 위에 얹히므로 흰색이어야 보인다
                        <span
                          aria-hidden
                          className="flex size-6 items-center justify-center text-icon-fill-static-white"
                        >
                          <Icon name="heart_stroke" className="size-6" />
                        </span>
                      }
                      meta={<ProductMeta product={product} />}
                    />
                  </ScrollRowItem>
                ))}
              </ScrollRow>
            </section>

            {/* 이 서비스가 근거를 모으는 자리 */}
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
                {MOCK_RECENT.map((item) => (
                  <ScrollRowItem key={item.productId}>
                    <div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-4">
                      <div className="flex items-center gap-3">
                        <span aria-hidden className="size-15 shrink-0 rounded-lg bg-muted" />
                        <div className="flex min-w-0 flex-col gap-2">
                          {/* 시안은 15px SemiBold(raw, 토큰 없음)인데 이 크기의 타입 토큰이
                              디자인 시스템에 없다. SemiBold(600)도 #162에서 정리된 대로 이
                              프로젝트가 등록해 쓰지 않는 굵기라, 가장 가까운 기존 토큰
                              (14px Bold)으로 근사한다 — PD팀에 15px·SemiBold 처리 여부 확인 필요 */}
                          <p className="truncate text-label-bold-14 text-foreground">
                            {item.productName}
                          </p>
                          <p className="flex gap-2">
                            <Badge>{item.sinceLabel}</Badge>
                            <Badge variant="outline">{item.countLabel}</Badge>
                          </p>
                        </div>
                      </div>
                      <Button
                        className="min-h-11 w-full bg-brand text-label-bold-16 font-bold text-brand-foreground hover:bg-brand/90"
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
                  보이지만, 코드는 목데이터 개수만큼 그리므로 지금은 MOCK_RECENT가
                  2개라 2개만 뜬다 */}
              <span aria-hidden className="flex justify-center gap-1">
                {MOCK_RECENT.map((item, index) => (
                  <span
                    key={item.productId}
                    className={cn(
                      "size-1.5 rounded-full",
                      index === recentIndex ? "bg-primary" : "bg-border",
                    )}
                  />
                ))}
              </span>
            </section>

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
        ) : // isPending 중 Skeleton으로 바꾸는 이유는 위 useTransition 자리에 적어 뒀다.
        // isPending이 아닐 때는 productsKey(서버가 productsPromise와 같은 렌더에서 만든
        // 값)로 다시 마운트한다 — ProductGrid 안의 누적 목록·커서·오류 상태가 필터
        // 전환 때 자동으로 비워진다(#289)
        isPending ? (
          <ProductGridSkeleton />
        ) : (
          <ErrorBoundary
            key={productsKey}
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
                    onValueChange={(next) => startTransition(() => void setSort(next as HomeSort))}
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
        target={feedback}
        petName={pet.name}
        onOpenChange={(open) => !open && setFeedback(null)}
        onSeeProduct={(productId) => router.push(`/products/${productId}`)}
        variant="full"
      />
    </div>
  );
}
