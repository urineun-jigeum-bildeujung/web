// 상품 비교. 두 자리에 담은 상품을 항목별로 견준다.
// UI 시안 기준(#245, comp_001·comp_001_에러·comp_001_empty, 1568-70143·1117-6319)이다.
//
// 종류가 다르면 표를 그리지 않는다. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라,
// 나란히 놓으면 숫자가 큰 쪽이 나빠 보이는 착시가 생긴다. 근거 있는 판단을 내주겠다는
// 서비스가 비교하면 안 되는 것을 비교해 주는 것이 더 나쁘다.
//
// 자리의 이름·가격·이미지는 상품 상세 조회로 채운다(#535). 종류·적합도·항목별 값은 비교용
// API가 없어 아직 모른다 — 아래 `toCompareProduct`와 README "아직 없는 것"을 본다.

"use client";

import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import { useMutateCartItem } from "@/entities/cart";
import {
  CompareSlot,
  ProductOptionSheet,
  useQueryProductDetails,
  type CompareProduct,
  type ProductDetail,
} from "@/entities/product";
import { Button } from "@/shared/ui/button";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { Skeleton } from "@/shared/ui/skeleton";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { BottomNav } from "@/widgets/bottom-nav";
import { CartLink } from "@/widgets/cart-link";
import { NotificationBell } from "@/widgets/notification-bell";

/** 두 자리에 담긴 상품 번호. 비어 있으면 undefined */
type SlotIds = [number | undefined, number | undefined];

/** 주소창의 상품 번호를 읽는다. 숫자가 아니면(`other=none` 포함) 그 자리는 비어 있다 */
function toProductId(value: string | null): number | undefined {
  const id = Number(value);
  return Number.isInteger(id) && id > 0 ? id : undefined;
}

/**
 * 자리 상태를 주소로 옮긴다. 아래 `slots` 초기화가 이 주소를 읽으면 같은 두 자리가 나온다.
 * 상세에서 온 흐름도 `other`로 적는다 — 검색 화면은 `other`와 `from=detail&first`를 똑같이
 * "반대쪽 자리에 이미 있는 상품"으로만 읽는다
 */
function toCompareHref([first, second]: SlotIds) {
  if (second !== undefined) return `/compare?slot=1&product=${second}&other=${first ?? "none"}`;
  if (first !== undefined) return `/compare?slot=0&product=${first}&other=none`;
  return "/compare";
}

/**
 * 상품 상세를 비교 자리 모양으로 옮긴다. **이름·가격·이미지·품절만 API에서 온다.** 품절이면
 * 자리가 장바구니 추가를 막는다 — 담을 수 없는 상품으로 시트를 열어 서버 거절을 기다리지 않는다.
 *
 * 종류(`kind`)와 적합도(`matchScore`)는 상세 응답에 없어 null(모름)이다. 종류를 모르면 종류로
 * 막지 않고, 적합도를 모르면 우열을 가리지 않는다. 예전 목업 맵(`PICKABLE`)의 값을 실제 상품
 * 번호에 붙이면 그 상품과 무관한 종류·점수가 떠 "종류가 달라 비교할 수 없다"가 잘못 나온다.
 */
function toCompareProduct(product: ProductDetail): CompareProduct {
  return {
    id: String(product.productId),
    name: product.name,
    price: product.price,
    imageUrl: product.images[0],
    kind: null,
    matchScore: null,
    soldOut: product.soldOut,
  };
}

/**
 * "맞춤 분석" 콜아웃 문구를 만든다. 시안(1568-70534)은 문구를 통째로 박아 뒀지만,
 * 그 예시가 가리키는 상품·아이 이름이 실제 화면에 뜨는 상품과 다르면 화면이 거짓말을
 * 하게 된다. API 명세상 `/products/compare`가 AI 대기 상태라 임시로 실제 담긴 두
 * 상품 이름과 점수만으로 문장을 만든다. 진짜 AI 분석이 붙으면 이 함수는 사라진다.
 */
function buildAiAnalysis(first: CompareProduct, second: CompareProduct) {
  const a = first.matchScore;
  const b = second.matchScore;
  // 적합도 API가 없어 지금 담기는 실제 상품은 모두 여기다. "한 상품은"이라고 하면 사실과 다르다
  if (a === null && b === null) {
    return "두 상품 모두 아직 적합도를 재지 못했어요.";
  }
  // 미측정(null)은 "비슷하다"가 아니라 "아직 모른다"다. 한쪽만 null이어도 우열을
  // 매길 근거가 없는 건 같지만, 실제로 재 보면 한쪽이 크게 나을 수도 있어 "비슷해요"라고
  // 단정하면 화면이 없는 근거를 지어낸 게 된다
  if (a === null || b === null) {
    return "한 상품은 아직 적합도를 재지 못했어요. 아래 표를 참고해서 골라보세요.";
  }
  if (a === b) {
    return "두 상품의 적합도가 같아요. 아래 표를 참고해서 골라보세요.";
  }
  const [winner, loser] = a > b ? [first, second] : [second, first];
  return `${winner.name}이(가) ${loser.name}보다 우리 아이에게 더 잘 맞아요.`;
}

/** 자리의 상품을 받는 동안. 채워진 자리와 같은 자리를 잡는다 (AGENTS.md 5.8) */
function SlotSkeleton() {
  return (
    <div
      role="status"
      aria-label="비교할 상품을 불러오는 중"
      className="flex min-w-0 flex-1 flex-col gap-3"
    >
      <Skeleton className="aspect-square w-full rounded-lg" />
      <Skeleton className="h-4 w-3/4" />
      <Skeleton className="h-4 w-1/2" />
      <Skeleton className="h-10 w-full" />
    </div>
  );
}

/** 자리의 상품을 받지 못했다. 비었다고 보이면 사실과 달라 다시 시도를 둔다 */
function SlotError({ onRetry }: { onRetry: () => void }) {
  return (
    <div
      role="alert"
      className="flex aspect-square min-w-0 flex-1 flex-col items-center justify-center gap-3 rounded-lg bg-muted p-3 text-center"
    >
      <p className="text-body-regular-14 text-text-body-secondary">상품을 불러오지 못했어요.</p>
      {/* 대기 표시 없음 — 누르면 조회가 받는 중으로 돌아가 이 칸째 뼈대(SlotSkeleton)로 바뀐다 */}
      <Button variant="outline" className="min-h-11 px-4" onClick={onRetry}>
        다시 시도
      </Button>
    </div>
  );
}

export function ProductCompareView() {
  const router = useRouter();
  // 검색에서 고른 상품이 주소창에 담겨 온다. 어느 자리에 무엇을 넣을지 알려 준다.
  const [slot] = useQueryState("slot");
  const [product] = useQueryState("product");
  const [from] = useQueryState("from");
  const [firstProduct] = useQueryState("first");
  // 검색으로 가기 직전 반대쪽 자리에 실제로 있던 상품의 id. /search 왕복 사이에
  // 이 컴포넌트가 통째로 언마운트-재마운트되어 그 자리 상태를 잃기 때문에 주소창으로
  // 들고 다닌다
  const [otherId] = useQueryState("other");

  // 어느 자리에 어떤 상품이 담겼는지는 화면이 든다. 빼면 그 자리가 비고 표가 사라진다.
  // 상품 내용은 아래 상세 조회가 맡는다
  const [slots, setSlots] = useState<SlotIds>(() => {
    const picked = toProductId(product);

    if (from === "detail") {
      // 상세에서 온 흐름은 자리 0이 늘 상세 상품이다. 처음엔 `product`가, 두 번째 상품을
      // 고르고 돌아오면 `first`가 그 번호다
      const detailId = toProductId(firstProduct) ?? picked;
      // 주소를 손으로 고쳐 두 번호가 같으면 두 자리가 같은 key를 가진다. 두 번째 자리를 비운다
      return [detailId, slot === "1" && picked !== detailId ? picked : undefined];
    }

    // 고른 상품이 없으면 두 자리 모두 빈 칸으로 시작한다. 예전엔 화면 확인용 예시 상품 둘
    // (`MOCK_PRODUCTS`)을 채워, 담지 않았는데 담겨 있고 빼고 다시 와도 되살아났다(QA HM-000)
    if (picked === undefined) return [undefined, undefined];

    // 고른 상품은 slot이 가리키는 자리에, 나머지 자리는 otherId로 넘어온 원래 값을
    // 그대로 되돌린다. 예전엔 반대쪽을 항상 기본값으로 되돌려서, 우연히 그 기본값과
    // 같은 상품을 고르면 두 자리의 id가 겹쳐 React key 충돌 에러가 났다(#245).
    // otherId가 없거나 "none"이면 그 자리는 실제로 비어 있었다는 뜻이라 그대로 비운다.
    // otherId가 지금 고르는 product와 같으면(주소를 손으로 조작했을 때만 가능하다 —
    // goSelect는 반대쪽 자리의 실제 값만 보내 절대 같은 id를 만들지 않는다) 그대로
    // 믿으면 두 자리가 같은 상품이 되어 React key가 겹친다. 잘못된 쿼리로 보고 비운다
    const other = toProductId(otherId);
    const kept = other !== picked ? other : undefined;
    return slot === "1" ? [kept, picked] : [picked, kept];
  });

  // 담긴 번호로 상품 상세를 받는다. 예전엔 검색이 돌려준 실제 상품 번호(예: 33)를 목업 맵
  // (`PICKABLE`, 키 "1"~"8")에서 찾아, 없으면 자리가 빈 채로 남았다(QA CP-022)
  const { entries, refetchFailed } = useQueryProductDetails(
    slots.filter((id): id is number => id !== undefined),
  );
  const slotEntries = slots.map((id) =>
    id === undefined ? undefined : entries.find((entry) => entry.productId === id),
  );
  // 없어진 상품(404)은 빈 자리로 둔다. 다시 골라 채우면 된다
  const [first, second] = slotEntries.map(
    (entry) => entry?.product && toCompareProduct(entry.product),
  );
  const both = first && second;
  // 종류를 모르면(null) 막지 않는다. 둘 다 알고 다를 때만 표를 감춘다
  const comparable =
    both && (first.kind === null || second.kind === null || first.kind === second.kind);

  // 둘 다 채워지고 점수가 갈릴 때만 우열을 가린다. 동점·미측정이면 우열 없는 기본 크기다.
  const winnerIndex =
    both &&
    first.matchScore !== null &&
    second.matchScore !== null &&
    first.matchScore !== second.matchScore
      ? first.matchScore > second.matchScore
        ? 0
        : 1
      : null;

  // 고르는 일은 검색 화면이 맡는다. 어느 자리를 채우러 왔는지는 주소창이 들고 간다.
  const goSelect = (index: number) => {
    const detailId = from === "detail" && index === 1 ? slots[0] : undefined;
    // 상세에서 온 흐름은 자리 0이 항상 상세 상품으로 고정돼 otherId가 필요 없다.
    // 그 외에는 채우지 않는 반대쪽 자리의 현재 상품도 같이 들고 가야, 검색에서
    // 돌아왔을 때 그 자리를 원래 값으로 되돌릴 수 있다(위 slots 초기화 참고). 비어
    // 있으면 "none"을 명시한다
    const other = slots[index === 0 ? 1 : 0];
    const otherContext =
      detailId !== undefined ? "" : `&other=${encodeURIComponent(other ?? "none")}`;
    const detailContext =
      detailId !== undefined ? `&from=detail&first=${encodeURIComponent(detailId)}` : "";
    router.push(`/search?slot=${index}${otherContext}${detailContext}`);
  };

  // 빼면 주소도 남은 자리로 바꾼다. 화면 상태만 비우면 주소에 뺀 번호가 남아, 검색에서
  // 뒤로 오거나 새로고침해 다시 마운트될 때 위 초기화가 그 번호로 자리를 되살렸다(QA HM-000).
  // 쿼리만 바뀌는 이동이라 이 화면은 다시 마운트되지 않는다. 기록은 쌓지 않는다(replace)
  const removeAt = (index: number) => {
    const next: SlotIds = [slots[0], slots[1]];
    next[index] = undefined;
    setSlots(next);
    router.replace(toCompareHref(next), { scroll: false });
  };

  // "장바구니 추가"는 수량을 고르는 바텀시트를 연다(QA CP-006·007). 예전엔 담지 않고
  // 담겼다는 토스트만 띄워 장바구니 수도 그대로였다(QA CP-010)
  const { add, isAdding } = useMutateCartItem();
  const [cartTarget, setCartTarget] = useState<ProductDetail | null>(null);

  const addToCart = async (quantity: number) => {
    if (!cartTarget) return;
    // 상품 상세와 같은 규칙이다. 타임딜 중인 상품은 딜 아이템으로 담아야 딜가가 붙는다 —
    // 일반 상세 응답은 이 번호를 비워 주므로 지금은 늘 일반 상품으로 담긴다(#484)
    const item = cartTarget.timeDealItemId
      ? ({ itemType: "TIME_DEAL", itemId: cartTarget.timeDealItemId } as const)
      : ({ itemType: "NORMAL", itemId: cartTarget.productId } as const);
    // 담기가 거부되면 여기서 멈춰 시트가 열린 채 남는다. 실패 알림은 전역 토스트가 맡는다.
    // 담기면 장바구니 조회를 다시 받아 헤더 장바구니 수가 바뀐다(`useMutateCartItem`)
    await add(item, quantity);
    setCartTarget(null);
    showSnackbar("장바구니에 담겼어요");
  };

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="상품비교"
        right={
          // home-view와 같은 순서(알림→장바구니)·아이콘 세트다(1568-70276). 시안의 첫 슬롯은 아이콘 없이
          // 비어 있는데, 오른쪽 칸이 오른쪽 끝에 붙어 있어 빈 자리를 따로 두지 않아도 두 아이콘 자리가 같다
          <>
            <NotificationBell />
            <CartLink />
          </>
        }
      />

      {/* 시안(1117-6319)의 카드 영역 폭이 353px(393-353=40, 양쪽 20px)이다 */}
      <main className="flex flex-1 flex-col gap-4 px-5 pb-4">
        <div className="flex items-start gap-4">
          {slots.map((productId, index) => {
            const entry = slotEntries[index];
            const key = productId ?? `empty-${index}`;
            if (entry?.isLoading) return <SlotSkeleton key={key} />;
            if (entry?.isError) return <SlotError key={key} onRetry={refetchFailed} />;
            return (
              <CompareSlot
                key={key}
                product={index === 0 ? first : second}
                className="flex-1"
                scoreEmphasis={
                  winnerIndex === null ? undefined : index === winnerIndex ? "win" : "lose"
                }
                onAdd={() => goSelect(index)}
                onAddToCart={() => setCartTarget(entry?.product ?? null)}
                onRemove={() => removeAt(index)}
              />
            );
          })}
        </div>

        {/* 한쪽이라도 비면 견줄 것이 없다. */}
        {both &&
          (comparable ? (
            <>
              <div className="flex flex-col gap-1 rounded-xl bg-surface-ai-weak px-2 py-3">
                <div className="flex items-center gap-1.5">
                  <Icon
                    name="report_sparkle"
                    aria-hidden
                    className="size-6 text-icon-fill-purple"
                  />
                  <p className="text-label-bold-14 text-text-body-ai-strong">맞춤 분석</p>
                </div>
                <p className="text-body-medium-14 text-text-body-ai-strong">
                  {buildAiAnalysis(first, second)}
                </p>
              </div>

              {/* 항목별 값(성분·영양 비율 등)을 주는 API가 없다. 예전 목데이터 표는 목업 상품
                  두 개의 값이라, 실제 상품 이름 아래 붙이면 고르지도 않은 스펙을 그 상품 것처럼
                  보여준다(#245 후속과 같은 이유). 값이 오기 전까지 준비 중이라고 알린다 */}
              <div className="flex gap-2 rounded-lg bg-muted p-4">
                <span className="shrink-0 text-sm font-bold text-foreground">안내</span>
                <p className="text-sm text-muted-foreground">
                  이 조합의 항목별 비교는 아직 준비 중이에요. 위 요약을 참고해 주세요
                </p>
              </div>
            </>
          ) : (
            // 시안(comp_001_에러). 표와 맞춤 분석이 통째로 빠지고 이 안내만 남는다
            <div className="flex gap-2 rounded-lg bg-muted p-4">
              <span className="shrink-0 text-sm font-bold text-foreground">안내</span>
              <p className="text-sm text-muted-foreground">
                정확한 결과를 위해 건식은 건식끼리, 간식은 간식끼리 골라주세요
              </p>
            </div>
          ))}
      </main>

      <BottomNav />

      <ProductOptionSheet
        product={
          cartTarget && {
            id: String(cartTarget.productId),
            name: cartTarget.name,
            price: cartTarget.price,
            // 옵션은 없는 개념이다(#137). 상품 상세의 시트와 같게 지금 담는 용량을 알린다
            optionLabel: cartTarget.detail.netQuantityValue
              ? `${cartTarget.detail.netQuantityValue}${cartTarget.detail.netQuantityUnit}`
              : "",
            imageUrl: cartTarget.images[0],
          }
        }
        onOpenChange={(open) => !open && setCartTarget(null)}
        onAddToCart={(_productId, quantity) => addToCart(quantity)}
        adding={isAdding}
      />
    </div>
  );
}
