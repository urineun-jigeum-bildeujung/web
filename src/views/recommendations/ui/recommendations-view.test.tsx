// 적합도가 점수만이 아니라 문장으로도 읽히는지, 아이를 바꿀 수 있는지, 추천 API 결과(성공·빈 목록·실패·감점)를 어떻게 그리는지, 카드 하트가 서버 찜을 따르는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, describe, expect, it, vi } from "vitest";

import type { Recommendation } from "@/entities/recommendation";

const { showSnackbar } = vi.hoisted(() => ({ showSnackbar: vi.fn() }));
vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), back: vi.fn() }),
  usePathname: () => "/recommendations",
}));

// 헤더 위젯은 서버 상태를 읽는다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: () => <a href="/mypage/notifications" aria-label="알림" />,
}));
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));

// 아이는 마이페이지와 같은 실제 목록이다(#470). 받은 인자도 적어 두어, 로그인 여부를 조회에
// 넘기는지 본다 — 목이 인자를 버리면 게이트를 지워도 테스트가 통과한다(#470 리뷰)
const PETS = [
  { id: "3", name: "초코", isDefault: true },
  { id: "7", name: "구름", isDefault: false },
];
let petsQuery: { pets: unknown; isLoading: boolean } = { pets: PETS, isLoading: false };
let petsCalls: unknown[] = [];
vi.mock("@/entities/pet", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/pet")>()),
  useQueryPets: (options: unknown) => {
    petsCalls.push(options);
    return petsQuery;
  },
}));

// 로그인 여부. 서버 렌더·하이드레이션 중에는 모른다(null)
const session: { value: boolean | null } = { value: true };
vi.mock("@/shared/api/use-session-state", () => ({ useSessionState: () => session.value }));

// 추천은 AI 추천 API에서 온다(#600). 서버 상태라 값만 세우고 받은 인자를 모은다.
// `fail`을 켜면 훅이 실제처럼 오류를 던져 격자의 오류 경계가 받는지 본다
function recommendation(
  productId: number,
  rank: number,
  rating: number,
  createdAt: string,
  extra: Partial<Recommendation> = {},
): Recommendation {
  return {
    productId,
    rank,
    score: 90 - rank * 10,
    reason: `상품 ${productId}의 추천 이유`,
    allergyPenalized: false,
    name: `추천 상품 ${productId}`,
    thumbnailUrl: "/images/e2e/product-photo-1.png",
    category: "food",
    price: 19000,
    originalPrice: 20000,
    unitPrice: { label: "g", price: 19 },
    rating,
    reviewCount: 10,
    status: "onSale",
    createdAt,
    ...extra,
  };
}
// 추천순·최신순·별점순이 서로 다른 순서를 내도록 섞는다
const RECOMMENDED = [
  recommendation(10, 1, 4.1, "2026-09-01T00:00:00+00:00"),
  recommendation(20, 2, 4.9, "2026-09-20T00:00:00+00:00", {
    allergyPenalized: true,
    status: "soldOut",
  }),
  recommendation(30, 3, 4.5, "2026-09-10T00:00:00+00:00"),
];
let recommendationQuery: { items: Recommendation[] | undefined; isLoading: boolean } = {
  items: RECOMMENDED,
  isLoading: false,
};
let recommendationFails = false;
let recommendationCalls: unknown[] = [];
vi.mock("@/entities/recommendation", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/recommendation")>()),
  useQueryHomeRecommendations: (options: unknown) => {
    recommendationCalls.push(options);
    if (recommendationFails) throw new Error("503");
    return recommendationQuery;
  },
}));

// 카드 하트는 서버 찜이다(#611). 찜 목록·토글은 서버 상태라 값만 세우고, 로그인 확인과 찜 훅은
// 진짜(`features/toggle-wishlist`)를 쓴다
let wishlistQuery: { items: { productId: number }[] | undefined; isLoading: boolean } = {
  items: [],
  isLoading: false,
};
const toggleWish = vi.fn();
vi.mock("@/entities/wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/wishlist")>()),
  useQueryWishlist: () => wishlistQuery,
  useMutateWishlist: () => ({ toggle: toggleWish }),
}));

import { RecommendationsView } from "./recommendations-view";

afterEach(() => {
  petsQuery = { pets: PETS, isLoading: false };
  petsCalls = [];
  session.value = true;
  recommendationQuery = { items: RECOMMENDED, isLoading: false };
  recommendationFails = false;
  recommendationCalls = [];
  wishlistQuery = { items: [], isLoading: false };
  toggleWish.mockReset();
});

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <RecommendationsView />
    </NuqsTestingAdapter>,
  );
}

const cardIds = () =>
  screen
    .getAllByRole("link")
    .map((link) => link.getAttribute("href"))
    .filter((href): href is string => !!href?.startsWith("/products/"))
    .map((href) => Number(href.split("/").pop()));

describe("RecommendationsView", () => {
  it("어느 아이 기준인지 고를 수 있다", () => {
    renderWith();
    expect(screen.getByLabelText("어느 아이의 추천을 볼지")).toBeDefined();
  });

  it("주소로 받은 아이가 적합도 문장에 들어가고 그 아이의 추천을 부른다", () => {
    renderWith("?pet=7");

    // 점수만 보여주면 누구 기준인지 알 수 없다. 받침 있는 이름에는 과가 붙는다
    expect(screen.getAllByText(/구름과 적합도 \d+점/)[0]).toBeDefined();
    expect(recommendationCalls.at(-1)).toEqual({ petId: 7, category: undefined, size: 50 });
  });

  // 예시 이름(코코)을 쓰던 동안 마이페이지의 실제 이름과 달랐다(QA 1차 6번, #470).
  // 기본 아이를 둘째에 두어야 "첫 아이로 되돌림"과 갈린다(#470 리뷰)
  it("주소에 아이가 없거나 목록에 없으면 첫 아이가 아니라 기본 아이 기준이다", () => {
    petsQuery = {
      pets: [
        { id: "3", name: "초코", isDefault: false },
        { id: "7", name: "구름", isDefault: true },
      ],
      isLoading: false,
    };
    renderWith("?pet=999");

    expect(screen.getAllByText(/구름과 적합도 \d+점/)[0]).toBeDefined();
  });

  it("로그인했을 때만 아이 목록을 부른다", () => {
    session.value = false;
    const { unmount } = renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
    unmount();

    session.value = true;
    renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: true });
  });

  it("아이 목록을 받는 동안 아이 알약 자리를 잡아 둔다", () => {
    petsQuery = { pets: undefined, isLoading: true };
    renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
  });

  it("로그인 여부를 아직 모르면 아이 알약 자리를 잡아 둔다", () => {
    session.value = null;
    petsQuery = { pets: undefined, isLoading: false };
    renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
  });

  it("로그인하지 않았으면 고르는 알약 없이 우리 아이로 읽고 추천을 부르지 않는다", () => {
    session.value = false;
    petsQuery = { pets: undefined, isLoading: false };
    renderWith();

    expect(screen.queryByLabelText("어느 아이의 추천을 볼지")).toBeNull();
    expect(screen.getByRole("heading", { name: "우리 아이의 건강 고민을 덜어줄" })).toBeDefined();
    expect(recommendationCalls).toHaveLength(0);
    expect(screen.getByText(/로그인하면 우리 아이에게 맞는 상품/)).toBeDefined();
  });

  it("아이가 없으면 추천을 부르지 않고 아이를 등록하라고 알린다", () => {
    petsQuery = { pets: [], isLoading: false };
    renderWith();

    expect(recommendationCalls).toHaveLength(0);
    expect(screen.getByText("아이를 등록하면 맞는 상품을 골라드려요")).toBeDefined();
  });

  // 알약이 이름만큼 넓어져 뒤 문장 "의 건강 고민을 덜어줄"이 두 줄로 밀렸다(QA 신규-줄바꿈, #599).
  // 줄 높이는 jsdom이 재지 못해 알약이 이름을 자르고 문장은 줄지 않는지만 본다
  it("긴 이름은 알약 안에서 한 줄 말줄임으로 자르고 전체 이름은 title로 남긴다", () => {
    const name = "초코바나나딸기우유맛쿠키";
    petsQuery = { pets: [{ id: "3", name, isDefault: true }], isLoading: false };
    renderWith();

    const picker = screen.getByRole("combobox", { name: "어느 아이의 추천을 볼지" });
    expect(picker.getAttribute("title")).toBe(name);
    const label = screen.getByText(name);
    expect(picker.contains(label)).toBe(true);
    expect(label.className).toContain("truncate");
    expect(screen.getByRole("heading", { name: "의 건강 고민을 덜어줄" }).className).toContain(
      "shrink-0",
    );
  });

  it("무엇을 근거로 골랐는지 알린다", () => {
    renderWith();
    expect(screen.getByText(/건강 고민을 바탕으로 추천해요/)).toBeDefined();
  });

  // 분류는 서버가 거른다. 받은 목록을 다시 filter하지 않는다(AGENTS 2.5)
  it("분류를 요청에 실어 부르고, 전체는 분류를 보내지 않는다", () => {
    const { unmount } = renderWith("?category=snack");
    expect(recommendationCalls.at(-1)).toEqual({ petId: 3, category: "snack", size: 50 });
    unmount();

    renderWith();
    expect(recommendationCalls.at(-1)).toEqual({ petId: 3, category: undefined, size: 50 });
  });

  // 서버가 추천순만 지원해 나머지는 받은 목록 안에서 늘어놓는다(entities/recommendation README)
  it("추천순은 서버 순서, 나머지는 주소로 받은 정렬 기준대로 늘어놓는다", () => {
    const orders: Record<string, number[]> = {};
    for (const sort of ["recommend", "latest", "rating-high", "rating-low"]) {
      const { unmount } = renderWith(`?sort=${sort}`);
      orders[sort] = cardIds();
      unmount();
    }

    expect(orders).toEqual({
      recommend: [10, 20, 30],
      latest: [20, 30, 10],
      "rating-high": [20, 30, 10],
      "rating-low": [10, 30, 20],
    });
  });

  it("카드에 적합도·단가·추천 이유를 보이고, 감점 상품에 주의 한 줄과 품절 배지를 붙인다", () => {
    renderWith();

    const card = (id: number) =>
      screen.getByRole("link", { name: new RegExp(`추천 상품 ${id}`) }).closest("li")!;
    const plain = card(10);
    expect(within(plain).getByText("초코와 적합도 80점")).toBeDefined();
    expect(within(plain).getByText("1g당 19원")).toBeDefined();
    expect(within(plain).getByText(/상품 10의 추천 이유/)).toBeDefined();
    expect(within(plain).queryByText(/알레르기/)).toBeNull();

    const penalized = card(20);
    expect(within(penalized).getByText("등록한 알레르기 성분이 들어 있어요")).toBeDefined();
    expect(within(penalized).getByText("품절")).toBeDefined();
  });

  // 화면 상태(useState)라 서버에 가지 않고 새로고침하면 사라졌다(QA r36, #611)
  it("카드 하트는 서버 찜 목록으로 눌림을 보인다", () => {
    wishlistQuery = { items: [{ productId: 20 }], isLoading: false };
    renderWith();

    const pressed = (id: number) =>
      screen.getByRole("button", { name: `추천 상품 ${id} 찜하기` }).getAttribute("aria-pressed");
    expect(pressed(10)).toBe("false");
    expect(pressed(20)).toBe("true");
  });

  it("하트를 누르면 그 상품의 찜을 서버에서 뒤집는다", () => {
    showSnackbar.mockClear();
    wishlistQuery = { items: [{ productId: 20 }], isLoading: false };
    renderWith();

    fireEvent.click(screen.getByRole("button", { name: "추천 상품 10 찜하기" }));
    // 좋아요 탭 목록에 먼저 넣을 줄을 함께 넘겨 하트가 곧바로 켜진다
    expect(toggleWish).toHaveBeenLastCalledWith({
      productId: 10,
      wished: true,
      item: {
        productId: 10,
        name: "추천 상품 10",
        thumbnailUrl: "/images/e2e/product-photo-1.png",
        price: 19000,
        originalPrice: 20000,
      },
    });

    // QA r35(#625). 담을 때만 상품 상세와 같은 안내를 띄운다
    expect(showSnackbar).toHaveBeenCalledExactlyOnceWith("해당 상품을 찜 목록에 담았어요!");

    fireEvent.click(screen.getByRole("button", { name: "추천 상품 20 찜하기" }));
    expect(toggleWish).toHaveBeenLastCalledWith(
      expect.objectContaining({ productId: 20, wished: false }),
    );
    expect(showSnackbar).toHaveBeenCalledTimes(1);
  });

  // PATCH가 토글이라 모르는 채로 누르면 이미 찜한 상품의 찜이 지워진다(#493 리뷰)
  it("찜 목록을 받는 동안은 하트를 누를 수 없고 대기를 알린다", () => {
    wishlistQuery = { items: undefined, isLoading: true };
    renderWith();

    const heart = screen.getByRole("button", { name: "추천 상품 10 찜하기" });
    expect(heart).toHaveProperty("disabled", true);
    fireEvent.click(heart);
    expect(toggleWish).not.toHaveBeenCalled();
    expect(within(heart).getByRole("status", { name: "찜 여부를 불러오는 중" })).toBeDefined();
  });

  it("추천을 받는 동안 격자 자리를 뼈대로 잡는다", () => {
    recommendationQuery = { items: undefined, isLoading: true };
    renderWith();

    expect(screen.getByRole("status", { name: "맞춤 상품을 불러오는 중" })).toBeDefined();
  });

  it("추천이 비었으면 아직 찾지 못했다고 알린다", () => {
    recommendationQuery = { items: [], isLoading: false };
    renderWith();

    expect(screen.getByText("초코에게 맞는 상품을 아직 찾지 못했어요")).toBeDefined();
  });

  it("추천만 실패하면 격자만 알리고 분류·정렬은 남으며, 다시 시도하면 다시 부른다", () => {
    recommendationFails = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWith();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("맞춤 상품을 불러오지 못했어요");
    expect(screen.getByRole("navigation", { name: "상품 분류" })).toBeDefined();
    expect(screen.getByLabelText("정렬")).toBeDefined();

    recommendationFails = false;
    fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(cardIds()).toEqual([10, 20, 30]);
    consoleError.mockRestore();
  });

  // 분류 탭은 오류 경계 밖이다. 경계를 분류로 비우지 않으면 탭은 눌려도 오류 문구가 남았다(#600)
  it("추천이 실패한 뒤 분류를 바꾸면 그 분류로 다시 부른다", () => {
    recommendationFails = true;
    const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});
    render(
      <NuqsTestingAdapter hasMemory>
        <RecommendationsView />
      </NuqsTestingAdapter>,
    );
    expect(screen.getByRole("alert")).toBeDefined();

    recommendationFails = false;
    fireEvent.click(
      within(screen.getByRole("navigation", { name: "상품 분류" })).getByRole("button", {
        name: "간식",
      }),
    );

    expect(screen.queryByRole("alert")).toBeNull();
    expect(recommendationCalls.at(-1)).toEqual({ petId: 3, category: "snack", size: 50 });
    consoleError.mockRestore();
  });

  // 메인 "맞춤 추천" 더보기로 들어오는 서브 화면이라 뒤로가기가 있어야 한다.
  // 시안 헤더(로고형)와 다르게 유지하기로 한 것을 여기서 고정해 둔다(#273)
  it("머리말에 뒤로가기와 제목이 있다", () => {
    renderWith();
    expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
    expect(screen.getByRole("heading", { name: "맞춤 추천" })).toBeDefined();
  });

  // 시안의 검색·알림·장바구니가 이 헤더에만 빠져 있었다(QA 1차 2번, #470)
  it("머리말 오른쪽에 검색·알림·장바구니가 있다", () => {
    renderWith();
    expect(screen.getByRole("link", { name: "검색" }).getAttribute("href")).toBe("/search");
    expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
      "/mypage/notifications",
    );
    expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
  });
});
