// 타임딜 화면. 진행 중인 딜과 오픈 예정인 딜을 탭으로 나눈다.
// UI 시안 기준(#275, 진행중 1905-32375, 담긴 상태 1905-32403, 오픈예정 1905-32432,
// 빈 화면 1905-32457, 옵션 시트 2544-56035)이다.
//
// 이 화면의 주인공은 상품이 아니라 남은 시간이다. 시간이 다 되면 목록도 함께 사라진다.
//
// 목록은 서버가 조회해 준다(#282). `/app/deals/page.tsx`가 만든 두 Promise(진행중·오픈예정)를
// 각각 `use()`로 풀어 독립된 Suspense 아래 둔다 — 헤더·탭은 그 결과를 기다리지 않는다.
// 백엔드가 딜 묶음(dealId) 개수를 제한하지 않아, 한 상태에 묶음이 여러 개 와도 전부 그린다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { parseAsStringLiteral, useQueryState } from "nuqs";
import { Suspense, use, useEffect, useState } from "react";

import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";
import {
  ProductOptionSheet,
  formatUnitPrice,
  type DealItem,
  type OptionSheetProduct,
  type TimeDealList,
} from "@/entities/product";
import { useMutateCartItem } from "@/entities/cart";
import {
  useMutateTimeDealSubscription,
  useQueryTimeDealSubscription,
} from "@/entities/notification";
import {
  formatDisplayDayHour,
  formatDisplayHour,
  toDisplayDayKey,
} from "@/shared/lib/date/display-date";
import { cn } from "@/shared/lib/utils";
import { Button } from "@/shared/ui/button";
import { Countdown } from "@/shared/ui/countdown/countdown";
import { EmptyState } from "@/shared/ui/empty-state/empty-state";
import { Icon } from "@/shared/ui/icon/icon";
import { LoadingSwap } from "@/shared/ui/loading-swap/loading-swap";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { HeaderIconLink } from "@/shared/ui/page-header/header-icon-link";
import { formatWon } from "@/shared/ui/price/price";
import { ProductSummary } from "@/shared/ui/product-summary/product-summary";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { Skeleton } from "@/shared/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/shared/ui/tabs";

const TABS = ["live", "upcoming"] as const;

const TAB_LABEL = [
  ["live", "진행중"],
  ["upcoming", "오픈 예정"],
] as const;

// 시안(1905-32420·32424·32428)의 배지 색·문구다. 재고 충분(enough)은 배지가 없다
const STOCK_BADGE = {
  low: { label: "품절임박", className: "bg-brand text-brand-foreground" },
  none: { label: "품절", className: "bg-primary text-primary-foreground" },
} as const;

/** 하루. 내일 열리는 딜인지 견줄 때 쓴다 */
const DAY_MS = 86_400_000;

/**
 * 시작 시각이 지난 뒤 다시 받는 간격. 백엔드는 딜 상태를 시각이 아니라 30초마다 도는
 * 전환 작업(`TimeDealTransitionJob`)으로 바꿔, 시작 직후엔 아직 오픈 예정으로 온다
 */
const OPEN_RETRY_MS = 5_000;

/** setTimeout이 받는 가장 긴 대기(약 24.8일). 넘기면 바로 불려 다시 받기를 되풀이한다 */
const MAX_TIMEOUT_MS = 2_147_483_647;

/**
 * "내일 오전 10시"처럼. 오늘·내일이면 날짜 대신 그 말을 쓴다.
 *
 * **date-fns의 `isToday`·`isTomorrow`를 쓰지 않는다.** 그 둘은 브라우저 시간대로 판정해서,
 * 자정 근처에 열리는 딜이 기기에 따라 하루 어긋난다 (#295).
 */
function formatOpenAt(startAt: string) {
  const openDay = toDisplayDayKey(startAt);
  if (!openDay) {
    return null;
  }

  const now = Date.now();
  const nearby =
    openDay === toDisplayDayKey(new Date(now).toISOString())
      ? "오늘"
      : openDay === toDisplayDayKey(new Date(now + DAY_MS).toISOString())
        ? "내일"
        : null;

  return nearby ? `${nearby} ${formatDisplayHour(startAt)}` : formatDisplayDayHour(startAt);
}

/**
 * 오픈 예정 딜이 열릴 시각이 되면 서버에서 목록을 다시 받는다(QA #84). 그리는 것은 없다.
 *
 * 탭 안이 아니라 화면에 늘 붙여 둔다 — 탭 내용은 고른 탭만 그려져, 진행중 탭을 보는 동안에도
 * 오픈 예정 딜이 진행중으로 옮겨 와야 한다. 다시 받으면 새 목록이 와 이 효과가 다시 돈다.
 * 여전히 오픈 예정이면(서버 전환 전) `OPEN_RETRY_MS` 뒤에 또 받고, 빠졌으면 멈춘다.
 */
function RefreshOnDealOpen({ dealsPromise }: { dealsPromise: Promise<TimeDealList> }) {
  const { groups, serverTime } = use(dealsPromise);
  const router = useRouter();

  useEffect(() => {
    if (groups.length === 0) return;

    // 기기 시계가 서버와 어긋나도 서버 기준으로 잰다. 응답을 받은 뒤 흐른 시간만큼 늦게
    // 재는 쪽으로만 틀려, 서버가 열기 전에 부르지는 않는다
    const clockOffset = Date.now() - Date.parse(serverTime);
    const openAt = Math.min(...groups.map((group) => Date.parse(group.startAt))) + clockOffset;

    let timer: ReturnType<typeof setTimeout>;
    const refresh = () => {
      router.refresh();
      // 다시 받기가 실패해 새 목록이 오지 않아도 멈추지 않게 다음 번을 걸어 둔다
      timer = setTimeout(refresh, OPEN_RETRY_MS);
    };
    // 이미 시각이 지났으면 서버 전환을 기다리는 중이다. 바로 부르면 응답마다 또 부른다
    const wait = openAt > Date.now() ? openAt - Date.now() : OPEN_RETRY_MS;
    timer = setTimeout(refresh, Math.min(wait, MAX_TIMEOUT_MS));
    return () => clearTimeout(timer);
  }, [groups, serverTime, router]);

  return null;
}

/** 결과 영역이 대기 중일 때 자리를 잡는다. 카운트다운 자리 하나 + 카드 3장 자리 */
function DealsSkeleton() {
  return (
    <div className="flex flex-col" role="status" aria-label="타임딜을 불러오는 중">
      <div className="flex flex-col gap-1 px-5 pt-3">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-4 w-24" />
      </div>
      <ul className="flex flex-col">
        {Array.from({ length: 3 }, (_, index) => (
          <li
            key={index}
            className="flex items-center gap-4 border-b border-border py-5 pr-17 pl-5 last:border-b-0"
          >
            <Skeleton className="size-24 shrink-0 rounded-md" />
            <div className="flex flex-1 flex-col gap-2">
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-5 w-1/2" />
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}

type LiveDealsSectionProps = {
  dealsPromise: Promise<TimeDealList>;
  /** 서버가 다시 알려준 게 아니라, 이 화면에서 카운트다운이 다 돼 로컬로만 숨긴 딜 id들 */
  endedDealIds: number[];
  onGroupEnd: (dealId: number) => void;
  addedIds: string[];
  onItemAction: (item: DealItem) => void;
};

/** 진행중 탭 내용. 딜 묶음마다 카운트다운+목록을 반복해 그린다(묶음이 여러 개일 수 있다) */
function LiveDealsSection({
  dealsPromise,
  endedDealIds,
  onGroupEnd,
  addedIds,
  onItemAction,
}: LiveDealsSectionProps) {
  const { groups } = use(dealsPromise);
  const visibleGroups = groups.filter((group) => !endedDealIds.includes(group.dealId));

  if (visibleGroups.length === 0) {
    return (
      <EmptyState
        // 시안(1905-32457)은 44px 아이콘·icon/fill/secondary 색이다(다른 화면의
        // 72px·icon-fill-tertiary 기본값과 다르다). EmptyState가 아이콘을 담는
        // 자리에 `[&>svg]:size-18`을 걸어 두어 className 크기 지정으로는 못 이긴다
        // (부모>svg 결합자가 단일 클래스보다 우선) — 인라인 style로 덮는다
        icon={
          <Icon
            name="clock"
            className="text-icon-fill-secondary"
            style={{ width: 44, height: 44 }}
          />
        }
        title="지금 진행 중인 타임딜이 없어요"
        // 시안은 title/bold_18이 아니라 body/medium_18(18px·500)이다
        titleClassName="text-body-medium-18"
        description={
          <>
            새로운 타임딜이 열리면 알려드릴게요
            <br />
            다른 상품도 둘러보시겠어요?
          </>
        }
        className="flex-1"
      />
    );
  }

  return (
    <>
      {visibleGroups.map((group) => (
        <div key={group.dealId}>
          <div className="flex flex-col px-5 pt-3">
            <Countdown endsAt={new Date(group.endAt)} onEnd={() => onGroupEnd(group.dealId)} />
            <p className="text-sm text-muted-foreground">종료까지 남은 시간</p>
          </div>

          <ul className="flex flex-col">
            {group.items.map((item) => {
              const soldOut = item.stock === "none";
              const id = String(item.timeDealItemId);
              const added = addedIds.includes(id);
              const badge = item.stock === "enough" ? null : STOCK_BADGE[item.stock];

              return (
                <li
                  key={id}
                  className={cn(
                    "relative border-b border-border last:border-b-0",
                    // 시안(1905-32428)은 품절 카드 전체를 45%로 흐리게 한다
                    soldOut && "opacity-45",
                  )}
                >
                  {/* 썸네일·텍스트를 누르면 상품 상세로 간다. 담기 버튼은 링크 안에
                      두면 "링크 속 버튼"이 되어 눌리지 않으므로 링크 바깥의 절대
                      위치 요소로 따로 둔다(product-grid-card의 imageAction과 같은 방식).
                      딜 아이템 번호를 함께 넘긴다 — 딜가는 일반 상품 상세에 오지 않는다(#484) */}
                  <Link
                    href={`/products/${item.productId}?dealItem=${item.timeDealItemId}`}
                    className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <ProductSummary
                      name={item.name}
                      imageUrl={item.thumbnailUrl ?? undefined}
                      imageSize={24}
                      className="gap-4 py-5 pr-17 pl-5"
                      imageBadge={
                        badge && (
                          <span
                            className={cn(
                              "rounded px-1 py-0.5 text-label-medium-12",
                              badge.className,
                            )}
                          >
                            {badge.label}
                          </span>
                        )
                      }
                      meta={
                        <div className="flex flex-col items-start">
                          {item.discountRate > 0 && (
                            <p className="text-label-regular-13 text-text-body-unselect line-through">
                              {formatWon(item.originalPrice)}
                            </p>
                          )}
                          <div className="flex items-center gap-1">
                            {item.discountRate > 0 && (
                              <span className="text-label-regular-13 font-bold text-destructive">
                                {item.discountRate}%
                              </span>
                            )}
                            <span className="text-title-bold-18 text-foreground">
                              {formatWon(item.price)}
                            </span>
                          </div>
                          {/* unitLabel이 실제로 null일 수 있다(정규화 단위가 없는 상품) —
                              없으면 이 줄 자체를 안 그린다 */}
                          {item.unitLabel && (
                            <p className="text-label-medium-11 text-text-body-unselect">
                              {formatUnitPrice(item.unitLabel, item.unitAmount)}
                            </p>
                          )}
                        </div>
                      }
                    />
                  </Link>
                  <button
                    type="button"
                    disabled={soldOut}
                    aria-label={
                      soldOut
                        ? `${item.name} 품절`
                        : added
                          ? `${item.name} 장바구니에서 빼기`
                          : `${item.name} 장바구니에 담기`
                    }
                    onClick={() => onItemAction(item)}
                    // 시안(1905-32420·32424·32428)은 테두리 없는 6px 모서리
                    // 사각형이다. 담을 수 있음/담김은 배경이 아예 없고, 품절만
                    // disable 회색(surface-disable)이 채워진다. 링크 위에 겹쳐야 해서
                    // absolute로 뺐다(product-grid-card의 imageAction과 같은 방식)
                    className={cn(
                      "absolute top-1/2 right-5 flex size-8 -translate-y-1/2 items-center justify-center rounded-md transition-colors",
                      "after:absolute after:-inset-1.5",
                      "focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none",
                      soldOut ? "bg-surface-disable" : "hover:bg-muted",
                    )}
                  >
                    {added ? (
                      <Icon name="check" aria-hidden className="size-6 text-icon-fill-default" />
                    ) : (
                      <Icon name="cart" aria-hidden className="size-6 text-icon-fill-secondary" />
                    )}
                  </button>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </>
  );
}

type UpcomingDealsSectionProps = {
  dealsPromise: Promise<TimeDealList>;
  /** 타임딜 알림 구독 여부. 타임딜은 한 번에 열려 딜마다가 아니라 전체 하나다(#644) */
  notified: boolean;
  /** 구독을 바꾸는 응답을 기다리는 중 */
  notifyPending: boolean;
  onToggleNotify: () => void;
};

/** 오픈예정 탭 내용. 딜 묶음마다 오픈 카운트다운+목록+알림 버튼을 반복해 그린다 */
function UpcomingDealsSection({
  dealsPromise,
  notified,
  notifyPending,
  onToggleNotify,
}: UpcomingDealsSectionProps) {
  const { groups } = use(dealsPromise);

  if (groups.length === 0) {
    return (
      // Figma에 오픈예정 전용 빈 화면이 따로 없어, 진행중 탭 빈 화면(1905-32457)과
      // 같은 아이콘·색·크기·간격·설명 문구를 그대로 재사용하고 제목만 이 탭 문맥에
      // 맞춰 바꿨다 — 근거는 deals/README.md의 "아직 확인이 끝나지 않은 것"을 본다
      <EmptyState
        icon={
          <Icon
            name="clock"
            className="text-icon-fill-secondary"
            style={{ width: 44, height: 44 }}
          />
        }
        title="현재 예정된 타임딜이 없어요"
        titleClassName="text-body-medium-18"
        description={
          <>
            새로운 타임딜이 열리면 알려드릴게요
            <br />
            다른 상품도 둘러보시겠어요?
          </>
        }
        className="flex-1"
      />
    );
  }

  return (
    <>
      {groups.map((group) => {
        const openAt = new Date(group.startAt);
        const openLabel = formatOpenAt(group.startAt);

        return (
          <div key={group.dealId}>
            <div className="flex flex-col px-5 pt-3">
              {/* 신청해도 나중에 취소할 수 있어 남은 시간은 계속 보여준다. 버튼 문구만 바뀐다 */}
              <Countdown
                endsAt={openAt}
                fallback={<p className="text-2xl font-bold text-foreground">곧 열려요</p>}
              />
              {openLabel && <p className="text-sm text-muted-foreground">{openLabel}에 봬요!</p>}
            </div>

            <ul className="flex flex-col">
              {group.items.map((item) => (
                <li key={item.timeDealItemId} className="border-b border-border last:border-b-0">
                  {/* 누르면 상품 상세로 간다(QA #94). 딜 번호는 붙이지 않는다 — 아직 열리지
                      않은 딜가로 상세를 그리면 그 값에 담을 수 있는 것처럼 보인다 */}
                  <Link
                    href={`/products/${item.productId}`}
                    className="block focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <ProductSummary
                      name={item.name}
                      imageUrl={item.thumbnailUrl ?? undefined}
                      imageSize={24}
                      className="gap-4 p-5"
                      meta={
                        <span className="flex flex-col gap-0.5">
                          <span className="text-title-bold-18 text-brand">
                            예정 {item.discountRate}%
                          </span>
                          {/* 값이 없으면 줄째로 비운다. `오픈`만 남으면 언제 여는지 아는
                              것처럼 보인다 (#300 리뷰) */}
                          {openLabel && (
                            <span className="text-label-medium-11 text-text-body-unselect">
                              {openLabel} 오픈
                            </span>
                          )}
                        </span>
                      }
                      // 시안(1905-32448)은 이 자리(action_button)가 아예 없다 — 장식용
                      // 가방 아이콘을 지운다
                    />
                  </Link>
                </li>
              ))}
            </ul>

            <div className="px-5 py-4">
              {/* 다시 누르면 신청을 취소한다. 이 "신청됨" 상태 자체의 시안은 아직 개별
                  확인 전이다(로컬 QA 기록) */}
              {notified ? (
                // 신청 전 버튼과 높이·모서리·글자 스타일·눌림 효과가 전부 같아야 해서
                // 직접 만든 button 대신 같은 공용 Button을 쓴다(variant만 바꾼다)
                <Button
                  variant="default"
                  onClick={onToggleNotify}
                  disabled={notifyPending}
                  aria-label="오픈 알림 신청 취소하기"
                  className="min-h-11 text-label-bold-14"
                >
                  <LoadingSwap loading={notifyPending} label="오픈 알림 신청을 취소하는 중">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="bell" aria-hidden className="size-6" />
                      오픈 알림 신청됨
                    </span>
                  </LoadingSwap>
                </Button>
              ) : (
                <Button
                  variant="secondary"
                  onClick={onToggleNotify}
                  disabled={notifyPending}
                  className="min-h-11 text-label-bold-14"
                >
                  <LoadingSwap loading={notifyPending} label="오픈 알림을 신청하는 중">
                    <span className="inline-flex items-center gap-1.5">
                      <Icon name="bell" aria-hidden className="size-6 text-icon-stroke-tertiary" />
                      오픈 알림 신청하기
                    </span>
                  </LoadingSwap>
                </Button>
              )}
            </div>
          </div>
        );
      })}
    </>
  );
}

type DealsViewProps = {
  liveDealsPromise: Promise<TimeDealList>;
  upcomingDealsPromise: Promise<TimeDealList>;
};

export function DealsView({ liveDealsPromise, upcomingDealsPromise }: DealsViewProps) {
  // 탭 전환은 이력에 쌓지 않는다(replace, QA #1). AGENTS 5.1은 탭을 push로 두라지만, PM QA는
  // 장바구니 등에서 뒤로가면 "보던 탭 그대로의 타임딜"로, 한 번 더 뒤로가면 타임딜에 오기 전
  // 화면으로 가길 기대한다. push면 거기서 지나온 탭을 하나씩 되짚는다. 보던 탭은 주소에 남아
  // 뒤로 돌아와도 유지된다
  const [tab, setTab] = useQueryState("tab", parseAsStringLiteral(TABS).withDefault("live"));

  // 서버가 다시 알려준 게 아니라 카운트다운이 다 돼 로컬에서만 숨긴 딜들이다.
  // 실제로 그 딜이 끝났는지는 다음에 이 화면을 다시 열 때 서버 조회로 확인된다
  const [endedDealIds, setEndedDealIds] = useState<number[]>([]);
  const { subscribed: notified } = useQueryTimeDealSubscription();
  const { setSubscribed, isPending: notifyPending } = useMutateTimeDealSubscription();
  const [picked, setPicked] = useState<OptionSheetProduct | null>(null);
  const [addedIds, setAddedIds] = useState<string[]>([]);
  // QA가 빈 상태를 바로 보고 싶을 때 쓰는 개발용 스위치. 실제 딜 종료와는 별개다
  const [devForceEmpty, setDevForceEmpty] = useState(false);

  const { add, removeAsync, isAdding } = useMutateCartItem();

  const addToCart = async (dealItemId: string, quantity: number) => {
    // **타임딜은 `TIME_DEAL`로 간다.** 상품과 딜이 id 공간을 따로 써서 종류 없이는
    // 가리킬 수 없다. 여기 `dealItemId`는 `timeDealItemId`다 (#316)
    await add({ itemType: "TIME_DEAL", itemId: Number(dealItemId) }, quantity);
    setAddedIds((prev) => (prev.includes(dealItemId) ? prev : [...prev, dealItemId]));
    setPicked(null);
    // 시안(1905-32431 snackbar)은 수량 설명 없이 한 줄이다
    showSnackbar("장바구니에 담겼어요");
  };

  const handleItemAction = async (item: DealItem) => {
    const id = String(item.timeDealItemId);
    if (addedIds.includes(id)) {
      // **서버에서도 뺀다.** 로컬 목록만 지우면 버튼은 "담기"로 돌아가는데 장바구니에는
      // 그 줄이 남고, 다시 담으면 서버가 같은 줄의 수량을 더한다 (#316 리뷰)
      await removeAsync({ itemType: "TIME_DEAL", itemId: item.timeDealItemId });
      setAddedIds((prev) => prev.filter((v) => v !== id));
      return;
    }
    setPicked({
      id,
      name: item.name,
      price: item.price,
      // 실제 API에 옵션 구성("1.5kg (기본 구성)" 같은) 개념 자체가 없다. 있는 데이터로
      // 지어내지 않고 빈 문자열로 둔다 — README의 "아직 확인이 끝나지 않은 것"에 남김
      optionLabel: "",
      unitLabel: item.unitLabel ?? undefined,
      unitAmount: item.unitAmount,
    });
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="타임딜"
        right={
          // 시안(1905-32416)의 공용 header 아이콘 슬롯이다. 모든 헤더와 같은 HeaderIconLink를 쓴다(#513).
          // 장바구니 개수 뱃지는 실제 담은 수다(#470). 알림은 다른 헤더와 같은 순서로 검색과
          // 장바구니 사이에 둔다(QA No.25, #588)
          <>
            <HeaderIconLink href="/search" label="검색" icon="search" />
            <NotificationBell />
            <CartLink />
          </>
        }
      />

      {/* 본문 랜드마크. 낭독기가 머리말을 지나 본문으로 건너뛸 자리다 — 이 화면만 빠져 있었다(#630).
          좋아요 화면과 같은 모양이고, 머리말과 아래 개발용 줄·시트는 이 밖에 둔다 */}
      <main className="flex flex-1 flex-col">
        <Tabs
          value={tab}
          onValueChange={(next) => void setTab(next as (typeof TABS)[number])}
          className="flex-1 gap-0"
        >
          {/* 시안(1905-32413)은 탭 줄 전체를 가르는 회색 선이 없다 — 고른 탭 글자 바로
              아래에만 1px 밑줄이 붙는다. 나머지는 배경과 같은 흰 바탕이다 */}
          <TabsList variant="line" className="h-10 w-full justify-start gap-0 px-5">
            {TAB_LABEL.map(([value, label]) => (
              <TabsTrigger
                key={value}
                value={value}
                className="relative h-8 flex-none px-2 text-label-medium-14 text-text-body-tertiary before:absolute before:inset-x-0 before:-inset-y-1.5 after:bg-border-strong group-data-horizontal/tabs:after:bottom-0 group-data-horizontal/tabs:after:h-px data-active:text-label-bold-14 data-active:text-foreground"
              >
                {label}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="live" className="flex flex-col">
            {devForceEmpty ? (
              <EmptyState
                icon={
                  <Icon
                    name="clock"
                    className="text-icon-fill-secondary"
                    style={{ width: 44, height: 44 }}
                  />
                }
                title="지금 진행 중인 타임딜이 없어요"
                titleClassName="text-body-medium-18"
                description={
                  <>
                    새로운 타임딜이 열리면 알려드릴게요
                    <br />
                    다른 상품도 둘러보시겠어요?
                  </>
                }
                className="flex-1"
              />
            ) : (
              <Suspense fallback={<DealsSkeleton />}>
                <LiveDealsSection
                  dealsPromise={liveDealsPromise}
                  endedDealIds={endedDealIds}
                  onGroupEnd={(dealId) => setEndedDealIds((prev) => [...prev, dealId])}
                  addedIds={addedIds}
                  onItemAction={handleItemAction}
                />
              </Suspense>
            )}
          </TabsContent>

          <TabsContent value="upcoming" className="flex flex-col">
            <Suspense fallback={<DealsSkeleton />}>
              <UpcomingDealsSection
                dealsPromise={upcomingDealsPromise}
                notified={notified}
                notifyPending={notifyPending}
                onToggleNotify={() => setSubscribed(!notified)}
              />
            </Suspense>
          </TabsContent>
        </Tabs>
      </main>

      <Suspense fallback={null}>
        <RefreshOnDealOpen dealsPromise={upcomingDealsPromise} />
      </Suspense>

      {/* 실제 진행 딜이 몇 시간씩 남아 빈 상태를 보려면 오래 기다려야 할 수 있다.
          QA가 두 상태를 바로 오가며 볼 수 있게 둔 개발용 버튼이다 — 시안엔 없고
          운영 빌드에는 나가지 않는다 */}
      {process.env.NODE_ENV !== "production" && (
        <div className="border-t border-border p-4 text-center">
          <button
            type="button"
            onClick={() => setDevForceEmpty((prev) => !prev)}
            className="text-label-medium-12 text-text-body-tertiary underline"
          >
            [개발용] {devForceEmpty ? "타임딜 상품 있는 상태 보기" : "타임딜 빈 상태 보기"}
          </button>
        </div>
      )}

      <ProductOptionSheet
        product={picked}
        onOpenChange={(open) => !open && setPicked(null)}
        onAddToCart={addToCart}
        adding={isAdding}
      />
    </div>
  );
}
