// 적합도가 아이에 따라 갈리는지, 재지 못한 아이를 0점으로 읽히지 않게 하는지 본다.
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { toast } from "sonner";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));

// 헤더 종은 서버 상태를 읽는 위젯이다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다(#395)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <a href="/mypage/notifications" aria-label="알림" className={className} />
  ),
  NewNotificationToaster: () => null,
}));
// 헤더 장바구니도 서버 상태를 읽는 위젯이라 링크만 대신 그린다(#470)
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

const { add } = vi.hoisted(() => ({ add: vi.fn() }));
// 담기는 서버를 부른다. 이 화면 테스트의 관심은 담은 뒤의 표시라 호출만 세운다 (#316)
// 바로 구매 주소(`toBuyNowPath`)는 결제 화면과 같은 규칙이어야 해 진짜를 그대로 둔다
vi.mock("@/entities/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart")>()),
  useMutateCartItem: () => ({ add, isAdding: false }),
}));
// 적합도는 내 아이 기준이다(#481). 로그인·아이 목록·아이 상세는 서버 상태라 값만 세운다
const { useSessionState, useQueryPets, useQueryPetDetail } = vi.hoisted(() => ({
  useSessionState: vi.fn(),
  useQueryPets: vi.fn(),
  useQueryPetDetail: vi.fn(),
}));
vi.mock("@/shared/api/use-session-state", () => ({ useSessionState }));
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets,
  useQueryPetDetail,
}));
// 찜은 서버에 저장한다(#483). 로그인·찜 여부·찜 목록은 서버 상태라 값만 세운다. 하트 버튼은 진짜를 그린다
const { toggleWish, wish } = vi.hoisted(() => ({
  toggleWish: vi.fn(),
  wish: {
    status: undefined as boolean | undefined,
    statusLoading: false,
    ids: new Set<number>(),
    listLoading: false,
  },
}));
vi.mock("@/features/toggle-wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/toggle-wishlist")>()),
  useToggleWishlist: () => ({ signedIn: true, toggle: toggleWish }),
  useWishedProductIds: () => ({ wishedIds: wish.ids, isLoading: wish.listLoading }),
}));
vi.mock("@/entities/wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/wishlist")>()),
  useQueryWishlistStatus: () => ({ wished: wish.status, isLoading: wish.statusLoading }),
}));
vi.mock("sonner", () => ({
  toast: { custom: vi.fn(), dismiss: vi.fn(), success: vi.fn(), error: vi.fn() },
}));

import type { ProductCard, ProductDetail } from "@/entities/product";

import { useRecentlyViewedStore } from "@/features/recently-viewed";
import { ProductDetailView } from "./product-detail-view";

// 라우트가 서버에서 받아 넘기는 값이다. 상태(정상·품절)는 soldOut이 가른다
const PRODUCT: ProductDetail = {
  productId: 1,
  timeDealItemId: null,
  images: [],
  name: "면역 지원 영양제 90정",
  price: 21_000,
  originalPrice: 30_000,
  discountRate: 30,
  rating: 4.8,
  reviewCount: 108,
  soldOut: true,
  detail: {
    manufacturer: "대한펫푸드",
    brandName: "포포도그",
    originCountry: "대한민국",
    netQuantityValue: 90,
    netQuantityUnit: "정",
    ingredients: ["타우린", "글루코사민"],
    feedingTarget: "8세 이상",
    targetBreedSize: "소형·중형견",
    targetAgeGroup: "노령",
    targetSpecies: ["강아지"],
    feedingMethod: "1일 1정, 사료와 함께 급여",
    allergens: [{ code: "EGG", displayName: "계란", severity: "CRITICAL" }],
    cautions: ["나트륨 과다"],
    consumptionPeriodDisplay: "제조일로부터 18개월",
    shelfLifeAfterOpeningDays: 60,
    storageMethod: "직사광선을 피해 서늘하고 건조한 곳에 보관",
  },
};

/** 함께 보면 좋은 상품. 지금 상품을 빼는 일은 받아 올 때 끝난다(`getRelatedProducts`) */
const RELATED: ProductCard[] = [
  {
    productId: 3,
    name: "연어&감자 그레인프리 사료 2kg",
    thumbnailUrl: null,
    price: 31_200,
    originalPrice: 38_900,
    discountRate: 20,
    unitPrice: 16,
    unitLabel: "g",
    rating: 4.6,
    reviewCount: 12,
  },
];

function relatedOf(items: ProductCard[] = RELATED): Promise<ProductCard[]> {
  return Promise.resolve(items);
}

/**
 * **act 안에서 그리고 돌려준다.** "함께 보면 좋은 상품"은 `use()`로 promise를 읽어, 한 번 멈췄다가
 * 풀리면서 다시 그린다. act 밖에서 풀리면 토스트·시트를 보는 테스트까지 흔들린다
 */
async function renderWith(
  search = "",
  product: Partial<ProductDetail> = {},
  relatedPromise: Promise<ProductCard[]> = relatedOf(),
) {
  let result: ReturnType<typeof render> | undefined;
  await act(async () => {
    result = render(
      <NuqsTestingAdapter searchParams={search}>
        <ProductDetailView
          productId="1"
          product={{ ...PRODUCT, ...product }}
          relatedPromise={relatedPromise}
        />
      </NuqsTestingAdapter>,
    );
  });
  return result!;
}

/** 내 아이 둘. 기본 아이가 앞에 온다 */
const PETS = [
  { id: "7", name: "초코", isDefault: true },
  { id: "8", name: "나비", isDefault: false },
];
const PET_DETAILS: Record<string, object> = {
  "7": {
    id: "7",
    name: "초코",
    species: "dog",
    breedName: "말티즈",
    age: 3,
    weight: 4.5,
    allergies: [],
  },
  "8": {
    id: "8",
    name: "나비",
    species: "cat",
    breedName: "코리안 숏헤어",
    age: 2,
    weight: 3.8,
    allergies: [],
  },
};

function signedIn() {
  useSessionState.mockReturnValue(true);
  useQueryPets.mockReturnValue({ pets: PETS, isLoading: false });
  useQueryPetDetail.mockImplementation((petId?: string) => ({
    pet: petId ? PET_DETAILS[petId] : undefined,
    isLoading: false,
  }));
}

describe("ProductDetailView", () => {
  // 최근 본 상품은 백엔드 API가 없어 이 브라우저에 기록한다(#509)
  it("들어온 상품을 최근 본 상품 맨 앞에 남긴다", async () => {
    useRecentlyViewedStore.setState({ productIds: [5] });

    await renderWith();

    expect(useRecentlyViewedStore.getState().productIds).toEqual([PRODUCT.productId, 5]);
  });

  beforeEach(() => {
    vi.clearAllMocks();
    signedIn();
  });

  // 아직 아무도 평가하지 않은 상품을 0점으로 그리면 평이 나쁜 상품처럼 읽힌다(#119와 같은 판단).
  // 백엔드는 이 경우를 null로도 0으로도 줄 수 있어 후기 수로 가른다
  describe("리뷰가 없는 상품의 별점", () => {
    it("후기가 0이면 숫자를 적지 않고 별을 회색으로 둔다", async () => {
      await renderWith("", { reviewCount: 0, rating: 0 });

      const summary = screen.getByRole("region", { name: PRODUCT.name });
      expect(within(summary).queryByText("0.0")).toBeNull();
      expect(within(summary).getByRole("button", { name: "후기 0개" })).toBeDefined();
      expect(summary.querySelector(".text-icon-fill-disable")).not.toBeNull();
      expect(summary.querySelector(".text-icon-fill-accent")).toBeNull();
    });

    it("별점이 null로 와도 같다", async () => {
      await renderWith("", { reviewCount: 0, rating: null });

      const summary = screen.getByRole("region", { name: PRODUCT.name });
      expect(within(summary).queryByText(/^\d\.\d$/)).toBeNull();
      expect(summary.querySelector(".text-icon-fill-disable")).not.toBeNull();
    });

    it("후기가 있으면 노란 별과 숫자를 보여준다", async () => {
      await renderWith("", { reviewCount: 108, rating: 4.8 });

      const summary = screen.getByRole("region", { name: PRODUCT.name });
      expect(within(summary).getByText("4.8")).toBeDefined();
      expect(summary.querySelector(".text-icon-fill-accent")).not.toBeNull();
    });
  });

  it("가격 아래에 적합도와 근거가 함께 있다", async () => {
    await renderWith();

    expect(screen.getByRole("heading", { name: "초코와 잘 맞는 상품이에요" })).toBeDefined();
    expect(screen.getByText("관절 건강에 도움되는 글루코사민이 들어있어요")).toBeDefined();
  });

  // 예시 아이("소리")를 그리던 동안 내 아이가 누구든 남의 이름이 근거에까지 박혀 떴다 (#481)
  it("적합도는 내 기본 아이의 이름과 프로필로 그린다", async () => {
    await renderWith();

    expect(screen.getByText("초코 기준으로 보고 있어요")).toBeDefined();
    expect(screen.getByText(/말티즈 · 3세 · 4.5kg/)).toBeDefined();
    expect(screen.queryByText(/소리/)).toBeNull();
  });

  // 고양이에게 강아지 영양제 점수를 보이면 근거가 거짓이 된다
  it("급여 대상이 아닌 종의 아이는 점수 없이 재지 못했다고 알린다", async () => {
    useQueryPets.mockReturnValue({ pets: [PETS[1], PETS[0]], isLoading: false });
    await renderWith();

    expect(screen.getByText("나비 기준으로 보고 있어요")).toBeDefined();
    expect(screen.getByText("고양이 급여 대상이 아닌 상품이라 아직 재지 못했어요")).toBeDefined();
    // 정보 탭도 이유를 지어내지 않는다. 예전 문구는 "급여량이 등록되지 않아"였다
    expect(screen.getByText("나비 기준으로는 아직 분석하지 못했어요.")).toBeDefined();
  });

  // 이름이 서버에서 온다. 예시 아이("소리")는 받침이 없어 "와"로 박아도 맞았다
  it("받침 있는 이름에는 '과'를 붙인다", async () => {
    useQueryPets.mockReturnValue({
      pets: [{ id: "9", name: "콩", isDefault: true }],
      isLoading: false,
    });
    useQueryPetDetail.mockReturnValue({
      pet: { ...PET_DETAILS["7"], id: "9", name: "콩" },
      isLoading: false,
    });
    await renderWith();

    expect(screen.getByRole("heading", { name: "콩과 잘 맞는 상품이에요" })).toBeDefined();
  });

  it("로그인하지 않았으면 적합도 칸을 그리지 않는다", async () => {
    useSessionState.mockReturnValue(false);
    // 세션이 만료돼 로그아웃되면 캐시에 전의 아이가 남아 있을 수 있다. 그래도 그리지 않는다
    useQueryPets.mockReturnValue({ pets: PETS, isLoading: false });
    await renderWith();

    // 아이 조회는 로그인해야 부른다. 부르면 방문할 때마다 401과 재발급 시도가 헛돈다
    expect(useQueryPets).toHaveBeenCalledWith({ enabled: false });
    expect(useQueryPetDetail).not.toHaveBeenCalledWith("7");
    expect(screen.queryByRole("combobox", { name: "적합도 기준이 되는 아이" })).toBeNull();
    expect(screen.queryByRole("status", { name: "적합도를 불러오는 중" })).toBeNull();
    // 정보 탭의 성분 분석은 아이 없이 예시로 남는다
    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
  });

  // 서버는 로그인을 모른다. 늦게 끼어들면 아래가 통째로 밀리니 자리를 잡는다
  it("로그인 여부를 아직 모르면 적합도 자리를 잡아 둔다", async () => {
    useSessionState.mockReturnValue(null);
    useQueryPets.mockReturnValue({ pets: undefined, isLoading: false });
    await renderWith();

    expect(screen.getByRole("status", { name: "적합도를 불러오는 중" })).toBeDefined();
  });

  // 조용히 비우면 로그아웃과 구별되지 않는다 (#482 리뷰)
  it("로그인했는데 아이 목록을 받지 못하면 그 자리에서 알리고 다시 받는다", async () => {
    const refetch = vi.fn();
    useQueryPets.mockReturnValue({
      pets: undefined,
      isLoading: false,
      isRetrying: false,
      error: new Error("503"),
      refetch,
    });
    await renderWith();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("적합도를 불러오지 못했어요");
    fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  it("고른 아이의 상세를 받지 못해도 알리고 그 상세를 다시 받는다", async () => {
    const refetch = vi.fn();
    useQueryPetDetail.mockReturnValue({
      pet: undefined,
      isLoading: false,
      isRetrying: false,
      error: new Error("503"),
      refetch,
    });
    await renderWith();

    fireEvent.click(within(screen.getByRole("alert")).getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  // 예시 상품 셋은 없는 상품이라 누를 수 없게 막아 두었다. AI 추천 전까지 인기순이다 (#481)
  it("함께 보면 좋은 상품은 실제 상품이고 누르면 그 상품으로 간다", async () => {
    await renderWith();

    const card = screen.getByRole("link", { name: /연어&감자 그레인프리 사료 2kg/ });
    expect(card.getAttribute("href")).toBe("/products/3");
    expect(within(card).getByText("1g당 약 16원")).toBeDefined();
    // 다른 목록 카드처럼 취소선 정가와 서버 할인율을 단다(#458). 서버의 20%와 버림 계산 19%가 갈린다
    expect(within(card).getByText("38,900원")).toBeDefined();
    expect(within(card).getByText("20%")).toBeDefined();
    expect(within(card).queryByText("19%")).toBeNull();
  });

  it("함께 볼 다른 상품이 없으면 칸을 그리지 않는다", async () => {
    await renderWith("", {}, relatedOf([]));

    expect(screen.queryByRole("heading", { name: "함께 보면 좋은 상품" })).toBeNull();
    expect(screen.queryByRole("status", { name: "함께 보면 좋은 상품을 불러오는 중" })).toBeNull();
  });

  // 추천 칸 하나가 실패했다고 상품까지 못 보게 하지 않는다
  it("함께 보면 좋은 상품을 받지 못하면 그 칸만 숨긴다", async () => {
    // React가 경계에 걸린 오류를 콘솔에 찍어 출력이 지저분해진다
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    const failed = Promise.reject(new Error("503"));
    failed.catch(() => {});
    await renderWith("", {}, failed);

    expect(screen.queryByRole("heading", { name: "함께 보면 좋은 상품" })).toBeNull();
    expect(screen.queryByRole("alert")).toBeNull();
    expect(screen.getByRole("heading", { name: "초코와 잘 맞는 상품이에요" })).toBeDefined();

    consoleError.mockRestore();
  });

  // 좋은 말만 있으면 광고와 구별되지 않는다. 지켜볼 것이 같은 자리에 있어야 근거로 읽힌다
  it("지켜볼 점도 같은 자리에 있다", async () => {
    await renderWith();

    expect(screen.getByText("나트륨 함량이 또래 평균보다 다소 높은 편이에요")).toBeDefined();
  });

  // 리뷰 탭 전환은 여기서 보지 않는다 — ReviewPanel이 QueryClient를 요구해 이 harness로는
  // 열 수 없고, 그 탭 안의 동작은 review-panel.test.tsx가 맡는다.
  //
  // 상품 문의는 이번 MVP 범위 밖이다(PD) — 좋아요 화면의 두 탭과 같은 방식으로 막는다
  it("Q&A 탭은 눌러도 열리지 않는다", async () => {
    await renderWith();

    // 클릭 결과만 보면 이벤트 연결이 끊겨도 통과한다. 막아 둔 수단 자체를 함께 본다
    const qnaTab = screen.getByRole("tab", { name: "Q&A" });
    expect(qnaTab.hasAttribute("disabled")).toBe(true);

    // 나머지 탭까지 같이 막히면 화면이 통째로 굳는다
    expect(screen.getByRole("tab", { name: "리뷰" }).hasAttribute("disabled")).toBe(false);

    fireEvent.click(qnaTab);

    // 탭 전환 없이 상품 정보 탭 내용이 그대로 남는다
    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
    expect(screen.queryByRole("link", { name: "상품 문의" })).toBeNull();
  });

  // disabled는 클릭만 막는다. 주소로 직접 들어오는 건 tab 쿼리 파서를 좁혀 막았다
  it("주소로 Q&A에 들어가도 상품 정보 탭으로 떨어진다", async () => {
    await renderWith("?tab=qna");

    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
    expect(screen.queryByText("하루에 몇 알씩 급여하면 되나요?")).toBeNull();
  });

  it("상품 정보 탭에 영양 성분 분석이 있다", async () => {
    await renderWith();

    expect(screen.getByRole("heading", { name: "영양 성분 분석" })).toBeDefined();
    expect(screen.getByText("종합 92점")).toBeDefined();
    expect(screen.getByText("초코에게 꾸준히 급여하기 좋은 상품이에요")).toBeDefined();
  });

  it("비교하기를 누르면 한 상품을 담은 안내를 띄우고 확인 시 비교 화면으로 이동한다", async () => {
    await renderWith();

    fireEvent.click(screen.getByRole("button", { name: "비교하기" }));
    expect(toast.custom).toHaveBeenCalledOnce();

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    render(renderToast("compare-toast"));
    expect(screen.getByRole("status").textContent).toContain("상품이 비교하기에 담겼어요");

    fireEvent.click(screen.getByRole("button", { name: "확인하기" }));
    expect(push).toHaveBeenCalledWith("/compare?slot=0&product=1&from=detail");
  });

  describe("평소 상태(정상 재고)", () => {
    it("장바구니 버튼을 누르면 수량을 고르는 시트가 열린다", async () => {
      await renderWith("", { soldOut: false });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));

      const sheet = screen.getByRole("dialog", { name: "면역 지원 영양제 90정 수량 고르기" });

      // 고를 옵션은 없다(#137). 남는 것은 지금 담는 것이 무엇인지 알리는 용량뿐이다
      // (같은 "90정"이 상세 설명 표의 제품 용량에도 있어 시트 안으로 좁혀 본다)
      expect(within(sheet).getByText("90정")).toBeDefined();
    });

    it("옵션 시트에서 담으면 시트가 닫히고 담김 안내가 뜬다", async () => {
      await renderWith("", { soldOut: false });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));
      fireEvent.click(screen.getByRole("button", { name: "21,000원 장바구니 담기" }));

      // 담기가 서버를 기다린다. 응답이 온 뒤에 시트가 닫힌다 (#316)
      await waitFor(() =>
        expect(
          screen.queryByRole("dialog", { name: "면역 지원 영양제 90정 수량 고르기" }),
        ).toBeNull(),
      );
      expect(add).toHaveBeenCalledWith({ itemType: "NORMAL", itemId: 1 }, 1);
      expect(toast.custom).toHaveBeenCalledOnce();

      const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
      render(renderToast("cart-toast"));
      expect(screen.getByRole("status").textContent).toContain("상품이 장바구니에 담겼어요");
    });

    // 딜 아이템으로 담아야 딜가가 붙는다. 그냥 상품으로 담으면 정가로 들어간다
    it("타임딜 상품은 딜 아이템 id로 담는다", async () => {
      await renderWith("", { soldOut: false, timeDealItemId: 77 });

      fireEvent.click(screen.getByRole("button", { name: /^장바구니$/ }));
      fireEvent.click(screen.getByRole("button", { name: "21,000원 장바구니 담기" }));

      await waitFor(() =>
        expect(add).toHaveBeenCalledWith({ itemType: "TIME_DEAL", itemId: 77 }, 1),
      );
    });
  });

  // 종료 시각이 상세 응답에 없어 타임딜 화면은 아직 개발용 오버라이드로만 본다(#413)
  it("타임딜 중에는 카운트다운이 붙은 구매 버튼 하나만 있다", async () => {
    await renderWith("?status=deal", { soldOut: false });

    expect(screen.getByText("타임딜")).toBeDefined();
    expect(screen.getByRole("button", { name: /타임딜 구매하기/ })).toBeDefined();
    expect(screen.queryByRole("button", { name: /^장바구니$/ })).toBeNull();
  });

  // 전에는 `/payment` 링크라 결제 화면에 고른 상품이 없었다(QA PD-056, #520)
  it("바로 구매는 수량을 고른 뒤 이 상품만 싣고 결제 화면으로 가며 장바구니에 담지 않는다", async () => {
    await renderWith("", { soldOut: false });

    fireEvent.click(screen.getByRole("button", { name: "바로 구매" }));
    fireEvent.click(screen.getByRole("button", { name: "면역 지원 영양제 90정 수량 하나 늘리기" }));
    fireEvent.click(screen.getByRole("button", { name: "42,000원 바로 구매" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/payment?buy=NORMAL%3A1%3A2"));
    expect(add).not.toHaveBeenCalled();
  });

  // 타임딜 구매도 딜 아이템으로 가야 딜가로 주문된다
  it("타임딜 상품의 바로 구매는 딜 아이템 번호로 결제 화면에 간다", async () => {
    await renderWith("", { soldOut: false, timeDealItemId: 7 });

    fireEvent.click(screen.getByRole("button", { name: "바로 구매" }));
    fireEvent.click(screen.getByRole("button", { name: "21,000원 바로 구매" }));

    await waitFor(() => expect(push).toHaveBeenCalledWith("/payment?buy=TIME_DEAL%3A7%3A1"));
  });

  it("품절이면 재입고 알림 버튼만 있고 누르면 안내가 뜬다", async () => {
    await renderWith();

    expect(screen.getByText("품절")).toBeDefined();
    expect(screen.queryByRole("button", { name: /^장바구니$/ })).toBeNull();

    fireEvent.click(screen.getByRole("button", { name: "재입고 알림 신청" }));
    expect(toast.custom).toHaveBeenCalledOnce();

    const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
    render(renderToast("restock-toast"));
    expect(screen.getByRole("status").textContent).toContain("재입고되면 바로 알려드릴게요!");
  });

  describe("찜 (#483)", () => {
    beforeEach(() => {
      wish.status = undefined;
      wish.statusLoading = false;
      wish.ids = new Set();
      wish.listLoading = false;
    });

    // 모르는 채로 누르면 토글이라 이미 찜한 상품의 찜이 서버에서 지워진다 (#493 리뷰)
    it("찜 여부를 받는 동안은 하트를 누를 수 없고 대기를 알린다", async () => {
      wish.statusLoading = true;
      wish.listLoading = true;
      await renderWith();

      const bottom = screen.getByRole("button", { name: "찜 목록에 담기" });
      expect(bottom).toHaveProperty("disabled", true);
      fireEvent.click(bottom);
      expect(toggleWish).not.toHaveBeenCalled();
      expect(
        screen.getByRole("button", { name: "연어&감자 그레인프리 사료 2kg 찜하기" }),
      ).toHaveProperty("disabled", true);
      expect(
        screen.getAllByRole("status", { name: "찜 여부를 불러오는 중" }).length,
      ).toBeGreaterThan(0);
    });

    it("찜한 상품이면 채운 하트로 들어온다", async () => {
      wish.status = true;
      await renderWith();

      const button = screen.getByRole("button", { name: "찜 목록에서 빼기" });
      expect(button.getAttribute("aria-pressed")).toBe("true");
    });

    // 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도 뜨지 않았다
    it("찜을 누르면 서버에 찜을 걸고 담김 안내가 뜬다", async () => {
      toggleWish.mockReturnValue(true);
      await renderWith();

      fireEvent.click(screen.getByRole("button", { name: "찜 목록에 담기" }));

      // 좋아요 탭 목록에 먼저 넣을 줄도 함께 넘긴다
      expect(toggleWish).toHaveBeenCalledWith(1, true, {
        productId: 1,
        name: "면역 지원 영양제 90정",
        thumbnailUrl: null,
        price: 21_000,
        originalPrice: 30_000,
      });
      expect(toast.custom).toHaveBeenCalledOnce();
      const renderToast = vi.mocked(toast.custom).mock.calls[0][0];
      render(renderToast("liked-toast"));
      expect(screen.getByRole("status").textContent).toContain("해당 상품을 찜 목록에 담았어요!");
    });

    // 로그인으로 보냈거나 로그인 여부를 아직 모르면 찜이 걸리지 않았다
    it("찜이 걸리지 않았으면 담김 안내를 띄우지 않는다", async () => {
      toggleWish.mockReturnValue(false);
      await renderWith();

      fireEvent.click(screen.getByRole("button", { name: "찜 목록에 담기" }));

      expect(toast.custom).not.toHaveBeenCalled();
    });

    it("찜을 빼면 담김 안내를 띄우지 않는다", async () => {
      wish.status = true;
      toggleWish.mockReturnValue(true);
      await renderWith();

      fireEvent.click(screen.getByRole("button", { name: "찜 목록에서 빼기" }));

      expect(toggleWish).toHaveBeenCalledWith(1, false, expect.anything());
      expect(toast.custom).not.toHaveBeenCalled();
    });

    // 찜 목록은 정상가로 온다. 딜가를 넣으면 좋아요 탭에 딜가가 잠깐 보인다
    it("타임딜 상세면 좋아요 탭에 먼저 넣을 줄을 넘기지 않는다", async () => {
      toggleWish.mockReturnValue(true);
      await renderWith("", { soldOut: false, timeDealItemId: 77 });

      fireEvent.click(screen.getByRole("button", { name: "찜 목록에 담기" }));

      expect(toggleWish).toHaveBeenCalledWith(1, true, undefined);
    });

    it("함께 보면 좋은 상품의 하트는 찜 목록으로 채우고 누르면 그 상품을 뒤집는다", async () => {
      wish.ids = new Set([3]);
      await renderWith();

      const heart = screen.getByRole("button", { name: "연어&감자 그레인프리 사료 2kg 찜하기" });
      expect(heart.getAttribute("aria-pressed")).toBe("true");

      fireEvent.click(heart);
      expect(toggleWish).toHaveBeenCalledWith(3, false, {
        productId: 3,
        name: "연어&감자 그레인프리 사료 2kg",
        thumbnailUrl: null,
        price: 31_200,
        originalPrice: 38_900,
      });
    });
  });
});
