// 상품 비교. 두 자리에 담은 상품을 항목별로 견준다.
// UI 시안 기준(#245, comp_001·comp_001_에러·comp_001_empty, 1568-70143·1117-6319)이다.
//
// 종류가 다르면 표를 그리지 않는다. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라,
// 나란히 놓으면 숫자가 큰 쪽이 나빠 보이는 착시가 생긴다. 근거 있는 판단을 내주겠다는
// 서비스가 비교하면 안 되는 것을 비교해 주는 것이 더 나쁘다.

"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQueryState } from "nuqs";
import { useState } from "react";

import {
  CompareSlot,
  CompareTable,
  MOCK_DETAIL_PRODUCT,
  type CompareProduct,
  type CompareRow,
} from "@/entities/product";
import { Icon } from "@/shared/ui/icon/icon";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { showSnackbar } from "@/shared/ui/snackbar/snackbar";
import { BottomNav } from "@/widgets/bottom-nav";

/**
 * 고르기 화면에서 담아 올 수 있는 상품. 검색 결과 목록과 같은 id·이름을 쓴다.
 * 목업 단계라 양쪽에 값을 두고, API가 붙으면 둘 다 사라진다.
 */
// matchScore는 views/search-result의 MOCK_RESULTS와 같은 id·같은 값을 쓴다.
// 검색에서 보던 적합도와 비교 화면에서 다른 점수가 나오면 같은 상품인지 의심하게 된다.
const PICKABLE: Record<string, CompareProduct> = {
  "1": { id: "1", name: "중소형견 소포장 사료 1kg", price: 31500, kind: "food", matchScore: 92 },
  "2": {
    id: "2",
    name: "노령견 저지방 소화케어 사료 1kg",
    price: 27200,
    kind: "food",
    matchScore: 86,
  },
  "3": {
    id: "3",
    name: "알레르기 케어 무곡물 사료 1kg",
    price: 26100,
    kind: "food",
    matchScore: 74,
  },
  "4": { id: "4", name: "퍼피 성장기 사료 1kg", price: 21000, kind: "food", matchScore: 68 },
  "5": { id: "5", name: "저자극 덴탈껌 14개입", price: 10800, kind: "snack", matchScore: 88 },
  "6": { id: "6", name: "고양이 화장실 모래 6L", price: 14900, kind: "supply", matchScore: 61 },
  "7": {
    id: "7",
    name: "실속형 대용량 사료 5kg",
    price: 18900,
    kind: "food",
    matchScore: null,
  },
  // 상세 상품(면역 지원 영양제)이 supplement라, 검색으로 고를 수 있는 같은 종류가
  // 하나도 없으면 상세→비교 흐름이 항상 "종류가 달라 비교할 수 없다"로 끝난다
  "8": {
    id: "8",
    name: "관절 건강 영양제 60정",
    price: 24000,
    kind: "supplement",
    matchScore: 81,
  },
};

/** API 연동 전까지 화면 확인용 값. 시안 comp_001이 사료 둘을 견준다 */
const MOCK_PRODUCTS: [CompareProduct, CompareProduct] = [PICKABLE["1"], PICKABLE["2"]];

/** 시안 comp_001의 아홉 항목. */
const MOCK_ROWS: CompareRow[] = [
  { label: "10g당 가격", values: ["150원", "176원"] },
  { label: "주원료", values: ["생연어", "가수분해 오리고기"] },
  {
    label: "핵심 기능성",
    values: [
      ["체중 조절", "피모 개선"],
      ["알러지 케어", "소화 촉진"],
    ],
  },
  {
    label: "알러지 안심",
    values: [
      ["그레인프리", "글루텐프리"],
      ["100% 가수분해", "단백질"],
    ],
  },
  { label: "권장 연령대", values: ["1~7세", "전연령"] },
  { label: "알갱이 크기", values: ["작은 사이즈", "중간 사이즈"] },
  { label: "형태 및 식감", values: ["바삭한 건식", "말랑한 반건식"] },
  {
    label: "주요 영양 비율",
    values: [
      ["조단백 30%", "조지방 10%"],
      ["조단백 24%", "조지방 14%"],
    ],
  },
  { label: "칼로리", values: ["310kcal", "360kcal"] },
];

/** 영양제 둘을 견줄 때 쓰는 항목. 사료 전용(10g당 가격·알갱이 크기·형태 및 식감·칼로리) 대신
 *  정제 상품에 맞는 값으로 바꾸고, 나머지 공통 항목(핵심 기능성·알러지 안심·권장 연령대·주요
 *  영양 비율)은 그대로 쓴다 */
const MOCK_SUPPLEMENT_ROWS: CompareRow[] = [
  { label: "1정당 가격", values: ["233원", "400원"] },
  { label: "주요 성분", values: ["오메가3", "글루코사민"] },
  {
    label: "핵심 기능성",
    values: [
      ["면역력 강화", "항산화"],
      ["관절 건강", "염증 완화"],
    ],
  },
  {
    label: "알러지 안심",
    values: [["그레인프리"], ["무설탕"]],
  },
  { label: "권장 연령대", values: ["전연령", "7세 이상"] },
  { label: "1일 섭취량", values: ["1정", "2정"] },
  { label: "총 정 수", values: ["90정 (약 3개월분)", "60정 (약 1개월분)"] },
];

// MOCK_ROWS는 정확히 1번·2번 조합의 실제 값으로 쓴 것이다. food 종류가 이 둘 말고도
// 여러 상품이 있어(3·4·7번), 다른 food 조합을 골라도 이 표를 그대로 보이면 고르지도
// 않은 상품의 스펙을 그 상품 것처럼 보여주게 된다. supplement는 PICKABLE에 8번
// 하나뿐이라 상세 화면 상품과 짝지어도 조합이 하나뿐이라 안전하다
const SUPPORTED_FOOD_PAIR = new Set(["1", "2"]);

/** MOCK_ROWS·MOCK_SUPPLEMENT_ROWS의 두 값은 특정 순서(1번→2번, 상세 상품→8번)로 실측한
 *  것이다. 자리에 반대로 담기면 이름은 뒤집혔는데 값은 그대로라 값의 주인이 바뀐다 —
 *  두 값 열도 같이 뒤집는다 */
function reverseRows(rows: CompareRow[]): CompareRow[] {
  return rows.map((row) => ({ ...row, values: [row.values[1], row.values[0]] }));
}

/** 실제 값이 있는 조합일 때만 항목별 표를 내려준다. 없으면 null — 있지도 않은 상품의
 *  값을 잘못 붙이는 대신 화면이 준비 중이라고 정직하게 알린다 */
function getRows(first: CompareProduct, second: CompareProduct): CompareRow[] | null {
  if (first.kind === "supplement" && second.kind === "supplement") {
    // 원래 순서는 (상세 상품, 8번)이다. 8번이 앞에 왔으면 반대로 담긴 것이다
    return first.id === "8" ? reverseRows(MOCK_SUPPLEMENT_ROWS) : MOCK_SUPPLEMENT_ROWS;
  }
  if (SUPPORTED_FOOD_PAIR.has(first.id) && SUPPORTED_FOOD_PAIR.has(second.id)) {
    // 원래 순서는 (1번, 2번)이다. 2번이 앞에 왔으면 반대로 담긴 것이다
    return first.id === "2" ? reverseRows(MOCK_ROWS) : MOCK_ROWS;
  }
  return null;
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

  // 서버 연동 전까지 담긴 상품을 화면이 든다. 빼면 그 자리가 비고 표가 사라진다.
  const [slots, setSlots] = useState<[CompareProduct | undefined, CompareProduct | undefined]>(
    () => {
      if (from === "detail" && product) {
        const first = { id: firstProduct ?? product, ...MOCK_DETAIL_PRODUCT };
        return [first, slot === "1" ? PICKABLE[product] : undefined];
      }

      if (!product) return MOCK_PRODUCTS;

      // 고른 상품은 slot이 가리키는 자리에, 나머지 자리는 otherId로 넘어온 원래 값을
      // 그대로 되돌린다. 예전엔 반대쪽을 항상 MOCK_PRODUCTS 기본값으로 되돌려서,
      // 우연히 그 기본값과 같은 상품을 고르면 두 자리의 id가 겹쳐 React key 충돌
      // 에러가 났다(#245). otherId가 없거나 "none"이면 그 자리는 실제로 비어 있었다는
      // 뜻이라 그대로 비운다 — search-result-view의 "고르기 목록에서 이미 담긴 상품
      // 빼기"도 이 규칙과 맞아떨어져야 하므로, 여기서 몰래 기본값을 채우면 그쪽이
      // 모르는 상품이 다시 두 자리에 겹칠 수 있다. 화면만 확인할 땐 product 자체를
      // 안 주고 들어오면(위 !product 분기) MOCK_PRODUCTS 두 자리를 그대로 본다
      const picked = PICKABLE[product];
      // otherId가 지금 고르는 product와 같으면(주소를 손으로 조작했을 때만 가능하다 —
      // goSelect는 반대쪽 자리의 실제 값만 보내 절대 같은 id를 만들지 않는다) 그대로
      // 믿으면 두 자리가 같은 상품이 되어 React key가 겹친다. 잘못된 쿼리로 보고 비운다
      const other =
        otherId && otherId !== "none" && otherId !== product ? PICKABLE[otherId] : undefined;
      return slot === "1" ? [other, picked] : [picked, other];
    },
  );

  const [first, second] = slots;
  const both = first && second;
  const sameKind = both && first.kind === second.kind;
  const rows = sameKind ? getRows(first, second) : null;

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
    const detailFlow = from === "detail" && index === 1 && Boolean(first);
    // 상세에서 온 흐름은 자리 0이 항상 상세 상품으로 고정돼 otherId가 필요 없다.
    // 그 외에는 채우지 않는 반대쪽 자리의 현재 상품도 같이 들고 가야, 검색에서
    // 돌아왔을 때 그 자리를 원래 값으로 되돌릴 수 있다(위 slots 초기화 참고). 비어
    // 있으면 "none"을 명시해, 주소에 아예 안 담아 화면 확인용 기본값이 채워지는
    // 경우와 구분한다
    const other = slots[index === 0 ? 1 : 0];
    const otherContext = detailFlow ? "" : `&other=${encodeURIComponent(other?.id ?? "none")}`;
    const detailContext =
      from === "detail" && index === 1 && first
        ? `&from=detail&first=${encodeURIComponent(first.id)}`
        : "";
    router.push(`/search?slot=${index}${otherContext}${detailContext}`);
  };

  // entities/cart에 "새로 담기" API가 아직 없어(변경·삭제만 있다) 실제 요청 없이
  // 담겼다고 알린다. product-detail-view·deals-view와 같은 방식이다 — 실제 API가
  // 붙을 때 세 화면을 함께 정리한다
  const addToCart = () => showSnackbar("장바구니에 담겼어요");

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader
        title="상품비교"
        right={
          // home-view와 같은 순서(알림→장바구니)·아이콘 세트·탭 영역이다(1568-70276).
          // 장바구니는 #214로 이미 나와 있어 링크로 잇는다. 시안의 첫 슬롯(touch_gudie)은
          // 아이콘 없이 자리만 차지해 두 아이콘 사이 실제 간격을 만든다
          <>
            <span aria-hidden className="size-7" />
            <Link
              href="/mypage/notifications"
              aria-label="알림"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="bell_noti" className="size-7" />
            </Link>
            <Link
              href="/cart"
              aria-label="장바구니"
              className="after:-inset-x-1.125 relative flex size-7 items-center justify-center after:absolute after:-inset-y-2"
            >
              <Icon name="cart" className="size-7" />
            </Link>
          </>
        }
      />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-4">
        <div className="flex items-start gap-4">
          {slots.map((product, index) => (
            <CompareSlot
              key={product?.id ?? `empty-${index}`}
              product={product}
              className="flex-1"
              scoreEmphasis={
                winnerIndex === null ? undefined : index === winnerIndex ? "win" : "lose"
              }
              onAdd={() => goSelect(index)}
              onAddToCart={addToCart}
              onRemove={() =>
                setSlots((prev) => {
                  const next: typeof prev = [prev[0], prev[1]];
                  next[index] = undefined;
                  return next;
                })
              }
            />
          ))}
        </div>

        {/* 한쪽이라도 비면 견줄 것이 없다. */}
        {both &&
          (sameKind ? (
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

              {rows ? (
                <CompareTable
                  productNames={[first.name, second.name]}
                  rows={rows}
                  className="border-t border-border"
                />
              ) : (
                // 목데이터에 실제 값이 없는 조합이다. 다른 상품의 항목별 수치를
                // 이 상품 것처럼 보여주는 대신 준비 중이라고 알린다
                <div className="flex gap-2 rounded-lg bg-muted p-4">
                  <span className="shrink-0 text-sm font-bold text-foreground">안내</span>
                  <p className="text-sm text-muted-foreground">
                    이 조합의 항목별 비교는 아직 준비 중이에요. 위 요약을 참고해 주세요
                  </p>
                </div>
              )}
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
    </div>
  );
}
