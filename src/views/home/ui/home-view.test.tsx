// 탭에 따라 화면이 통째로 바뀌는지, 상태 체크가 무엇을 약속하는지 본다. 카테고리
// 그리드·타임딜은 서버가 조회해 준 결과를 그대로 그리는지만 본다 — 거르고 정렬하는
// 건 서버 책임이라 여기서 다시 보지 않는다(entities/product/api/products.test.ts가
// 요청 파라미터 조립을 본다).
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ProductCard,
  ProductListResult,
  TimeDealGroup,
  TimeDealList,
} from "@/entities/product";
import { APP_MESSAGE_CODE } from "@/shared/config/app-message";

const pushMock = vi.fn();
const refreshMock = vi.fn();

// 공개 화면의 로그인 필요 버튼은 이동 없이 로그인 필요 토스트를 띄운다(#542)
const { toastAppError } = vi.hoisted(() => ({ toastAppError: vi.fn() }));
vi.mock("@/shared/lib/app-toast", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/shared/lib/app-toast")>()),
  toastAppError,
}));

// 헤더 종은 서버 상태를 읽는 위젯이다. 이 화면 테스트에는 QueryClient가 없어 링크만 대신 그린다(#395)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <a href="/mypage/notifications" aria-label="알림" className={className} />
  ),
  NewNotificationToaster: () => null,
}));
// 장바구니도 같은 까닭으로 링크만 대신 그린다(#470)
vi.mock("@/widgets/cart-link", () => ({
  CartLink: () => <a href="/cart" aria-label="장바구니" />,
}));
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), refresh: refreshMock }),
  usePathname: () => "/",
}));

// 아이 줄은 마이페이지와 같은 실제 목록을 받는다(#470). 받은 인자도 적어 두어, 로그인 여부를
// 조회에 넘기는지 본다 — 목이 인자를 버리면 게이트를 지워도 테스트가 통과한다(#470 리뷰)
const PETS = [
  { id: "3", name: "초코", isDefault: true },
  { id: "7", name: "구름이", isDefault: false },
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

// 최근에 구매한 상품은 반응을 남길 수 있는 실제 구매다(#494). 서버 상태라 값만 세운다.
// 받은 인자도 모아 로그인 게이트를 본다
const PENDING = [
  { orderProductId: "11", productId: "3", name: "치석 케어 덴탈껌 7개입", petId: null },
  { orderProductId: "12", productId: "5", name: "관절 튼튼 트릿 200g", petId: "7" },
];
type PendingQuery = {
  items: unknown;
  isLoading: boolean;
  isRetrying: boolean;
  error: Error | null;
  refetch: () => void;
};
const pendingIdle = (): PendingQuery => ({
  items: PENDING,
  isLoading: false,
  isRetrying: false,
  error: null,
  refetch: vi.fn(),
});
let pendingQuery = pendingIdle();
let pendingCalls: unknown[] = [];
const submitFeedback = vi.fn();
vi.mock("@/entities/review", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/review")>()),
  useQueryPendingFeedbacks: (options: unknown) => {
    pendingCalls.push(options);
    return pendingQuery;
  },
  useMutateSubmitFeedback: () => ({ submitFeedback, isSubmitting: false }),
}));

// 종류 탭 카드의 찜 하트(#534). 찜 목록·토글은 서버 상태라 값만 세우고, 로그인 확인과 하트 버튼은
// 진짜(`features/toggle-wishlist`)를 그린다 — 로그아웃이면 로그인으로 보내는지까지 이 화면에서 본다
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

import { HomeView } from "./home-view";

afterEach(() => {
  petsQuery = { pets: PETS, isLoading: false };
  petsCalls = [];
  session.value = true;
  pendingQuery = pendingIdle();
  pendingCalls = [];
  submitFeedback.mockReset();
  wishlistQuery = { items: [], isLoading: false };
  toggleWish.mockReset();
  pushMock.mockReset();
  toastAppError.mockReset();
});

const PUPPY_FOOD: ProductCard = {
  productId: 4,
  name: "퍼피 성장기 사료 1kg",
  price: 21000,
  originalPrice: null,
  discountRate: 0,
  unitPrice: 21,
  unitLabel: "g",
  thumbnailUrl: null,
  rating: 4.6,
  reviewCount: 109,
};

const SENIOR_FOOD: ProductCard = {
  productId: 2,
  name: "노령견 저지방 소화케어 사료 1kg",
  price: 27200,
  originalPrice: 31900,
  discountRate: 15,
  unitPrice: 27,
  unitLabel: "g",
  thumbnailUrl: null,
  rating: 4.5,
  reviewCount: 108,
};

function toProducts(items: ProductCard[]): ProductListResult {
  return { items, nextCursor: null, hasNext: false };
}

const EMPTY_PRODUCTS: ProductListResult = { items: [], nextCursor: null, hasNext: false };
const EMPTY_DEALS: TimeDealList = { groups: [], serverTime: "2026-09-21T00:00:00Z" };

// `use()`가 첫 렌더에서 항상 한 번 suspend했다가 promise가 풀리면 다시 그린다 — 이미
// resolve된 promise를 넘겨도 마찬가지라, act()로 감싸 그 재렌더까지 기다리고 반환한다
async function renderWith(
  search = "",
  products: ProductListResult = EMPTY_PRODUCTS,
  deals: TimeDealList = EMPTY_DEALS,
) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <NuqsTestingAdapter searchParams={search}>
        <HomeView
          productsPromise={Promise.resolve(products)}
          productsKey={search}
          dealsPromise={Promise.resolve(deals)}
        />
      </NuqsTestingAdapter>,
    );
  });
  return result!;
}

describe("HomeView", () => {
  it("전체 탭은 골라주는 화면이다", async () => {
    await renderWith();

    expect(screen.getByText(/AI가 골라주는/)).toBeDefined();
    expect(screen.getByText(/최근에 구매한 상품/)).toBeDefined();
  });

  // 첫 입력 단계의 "이전"이 메인으로 돌아오도록 돌아올 곳을 싣는다(QA No.254, #527)
  it("새 아이 추가를 누르면 메인을 돌아올 곳으로 싣고 온보딩 기본 정보 단계로 간다", async () => {
    await renderWith();

    fireEvent.click(screen.getByRole("button", { name: "새 아이 추가" }));

    expect(pushMock).toHaveBeenCalledWith("/onboarding?step=basic&from=/");
  });

  // 5마리째를 등록한 뒤에도 추가 자리가 남아 여섯째가 등록됐다(QA No.130, #527)
  it("5마리를 채우면 새 아이 추가 칸이 없다", async () => {
    petsQuery = {
      pets: ["1", "2", "3", "4", "5"].map((id) => ({ id, name: `아이${id}`, isDefault: false })),
      isLoading: false,
    };
    await renderWith();

    const switcher = screen.getByRole("radiogroup", { name: "아이 고르기" });
    expect(within(switcher).getAllByRole("radio")).toHaveLength(5);
    expect(screen.queryByRole("button", { name: "새 아이 추가" })).toBeNull();
  });

  it("종류를 고르면 서버가 준 상품 목록을 그대로 그린다", async () => {
    await renderWith("?category=food", toProducts([SENIOR_FOOD, PUPPY_FOOD]));

    // 큐레이션 자리가 사라지고 정렬이 나온다
    expect(screen.queryByText(/AI가 골라주는/)).toBeNull();
    expect(screen.getByLabelText("정렬")).toBeDefined();
    // 서버가 준 순서 그대로 그린다 — 화면이 다시 정렬하지 않는다
    const ids = screen
      .getAllByRole("link")
      .map((link) => link.getAttribute("href"))
      .filter((href): href is string => !!href?.startsWith("/products/"))
      .map((href) => href.split("/").pop());
    expect(ids).toEqual(["2", "4"]);

    // 지금 어느 것을 보고 있는지 알린다
    expect(screen.getByRole("button", { name: "사료" })).toHaveProperty("ariaCurrent", "page");
  });

  // SENIOR_FOOD는 27,200 / 31,900이다. 서버가 준 15%와 버림 계산 14%가 갈려, 화면이
  // 어느 쪽을 쓰는지 드러난다. PUPPY_FOOD는 정가가 없어 취소선이 붙지 않는다
  it("할인 중인 상품만 취소선 정가와 서버 할인율을 보여준다", async () => {
    const { container } = await renderWith("?category=food", toProducts([SENIOR_FOOD, PUPPY_FOOD]));

    expect(screen.getByText("31,900원")).toBeDefined();
    expect(screen.getByText("15%")).toBeDefined();
    expect(screen.queryByText("14%")).toBeNull();
    // 정가가 없는 상품은 판매가만 나온다 — 취소선은 둘 중 하나에만 붙는다
    expect(screen.getByText("21,000원")).toBeDefined();
    expect(container.querySelectorAll(".line-through")).toHaveLength(1);
  });

  // 시안(1758-69075 등)의 카드마다 있는 하트가 없었다. QA HM-009 "각 상품 카드 내 좋아요 버튼 부재" (#534)
  it("종류 탭 카드에도 찜 하트가 있고, 찜한 상품은 눌린 하트다", async () => {
    wishlistQuery = { items: [{ productId: 2 }], isLoading: false };
    await renderWith("?category=food", toProducts([SENIOR_FOOD, PUPPY_FOOD]));

    expect(
      screen
        .getByRole("button", { name: "노령견 저지방 소화케어 사료 1kg 찜하기" })
        .getAttribute("aria-pressed"),
    ).toBe("true");
    expect(
      screen
        .getByRole("button", { name: "퍼피 성장기 사료 1kg 찜하기" })
        .getAttribute("aria-pressed"),
    ).toBe("false");
  });

  it("하트를 누르면 그 상품의 찜을 서버에서 뒤집는다", async () => {
    await renderWith("?category=food", toProducts([PUPPY_FOOD]));

    fireEvent.click(screen.getByRole("button", { name: "퍼피 성장기 사료 1kg 찜하기" }));

    // 정가가 없는 상품은 찜 응답처럼 판매가로 채워 좋아요 탭 목록에 먼저 넣는다
    expect(toggleWish).toHaveBeenCalledWith({
      productId: 4,
      wished: true,
      item: {
        productId: 4,
        name: "퍼피 성장기 사료 1kg",
        thumbnailUrl: null,
        price: 21000,
        originalPrice: 21000,
      },
    });
  });

  // 다른 목록(#483)과 같다. 로그아웃 상태에서 찜을 보내면 401과 재발급 시도만 헛돈다
  it("로그인하지 않았으면 하트를 눌렀을 때 찜 대신 로그인 필요 토스트를 띄우고 이동하지 않는다", async () => {
    session.value = false;
    await renderWith("?category=food", toProducts([PUPPY_FOOD]));

    fireEvent.click(screen.getByRole("button", { name: "퍼피 성장기 사료 1kg 찜하기" }));

    expect(toastAppError).toHaveBeenCalledWith(APP_MESSAGE_CODE.auth.loginRequired);
    expect(pushMock).not.toHaveBeenCalledWith("/login");
    expect(toggleWish).not.toHaveBeenCalled();
  });

  // 모르는 채로 누르면 토글이라 이미 찜한 상품의 찜이 서버에서 지워진다 (#493 리뷰)
  it("찜 목록을 받는 동안은 하트를 누를 수 없다", async () => {
    wishlistQuery = { items: undefined, isLoading: true };
    await renderWith("?category=food", toProducts([PUPPY_FOOD]));

    const heart = screen.getByRole("button", { name: "퍼피 성장기 사료 1kg 찜하기" });
    expect(heart).toHaveProperty("disabled", true);
    fireEvent.click(heart);
    expect(toggleWish).not.toHaveBeenCalled();
  });

  // 시안의 Rating Container다. 후기가 없는 상품은 회색 별에 "-" — 0.0이면 평이 나쁜 상품처럼 읽힌다 (#534)
  it("단가 아래에 별점과 후기 수를 보이고, 후기가 없으면 별점 대신 -를 보인다", async () => {
    const NEW_FOOD: ProductCard = { ...PUPPY_FOOD, productId: 9, rating: 0, reviewCount: 0 };
    await renderWith("?category=food", toProducts([SENIOR_FOOD, NEW_FOOD]));

    const card = (name: RegExp) => screen.getByRole("link", { name }).closest("li")!;
    const senior = card(/노령견 저지방/);
    const fresh = card(/퍼피 성장기/);
    expect(within(senior).getByText("1g당 약 27원")).toBeDefined();
    expect(within(senior).getByText("5점 만점에 4.5점")).toBeDefined();
    expect(within(senior).getByText("후기 108개")).toBeDefined();

    expect(within(fresh).getByText("-")).toBeDefined();
    expect(within(fresh).getByText("후기 0개")).toBeDefined();
    expect(within(fresh).queryByText(/0\.0|5점 만점에/)).toBeNull();
  });

  it("카테고리에 상품이 없으면 없다고 알린다", async () => {
    await renderWith("?category=snack", EMPTY_PRODUCTS);

    expect(await screen.findByText(/아직 등록된 상품이 없어요/)).toBeDefined();
  });

  it("아이 이름이 화면에 보인다", async () => {
    await renderWith();

    // 사진만으로는 어느 아이인지 알 수 없다
    expect(screen.getByText("구름이")).toBeDefined();
  });

  // 예시 이름(소리)을 쓰던 동안 마이페이지의 실제 이름과 달랐다(QA 1차 6번, #470)
  it("고르기 전에는 기본 아이의 실제 이름으로 추천 제목을 단다", async () => {
    petsQuery = {
      pets: [
        { id: "3", name: "초코", isDefault: false },
        { id: "7", name: "구름이", isDefault: true },
      ],
      isLoading: false,
    };
    await renderWith();

    expect(screen.getByText("AI가 골라주는 구름이 맞춤 상품")).toBeDefined();
    expect(screen.getByRole("radio", { name: "구름이" }).getAttribute("aria-checked")).toBe("true");
  });

  it("아이를 바꾸면 추천 제목도 그 아이 이름으로 바뀐다", async () => {
    await renderWith();

    fireEvent.click(screen.getByRole("radio", { name: "구름이" }));

    expect(screen.getByText("AI가 골라주는 구름이 맞춤 상품")).toBeDefined();
  });

  // 안 들고 가면 추천은 기본 아이로 열려 두 화면의 아이가 달라졌다(#470 리뷰)
  it("더보기는 고른 아이를 맞춤 추천까지 들고 간다", async () => {
    await renderWith();
    expect(screen.getByRole("link", { name: "더보기" }).getAttribute("href")).toBe(
      "/recommendations?pet=3",
    );

    fireEvent.click(screen.getByRole("radio", { name: "구름이" }));

    expect(screen.getByRole("link", { name: "더보기" }).getAttribute("href")).toBe(
      "/recommendations?pet=7",
    );
  });

  it("로그인했을 때만 아이 목록을 부른다", async () => {
    session.value = false;
    const { unmount } = await renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
    unmount();

    session.value = true;
    await renderWith();
    expect(petsCalls.at(-1)).toEqual({ enabled: true });
  });

  it("아이 목록을 받는 동안 아이 줄 자리를 잡아 둔다", async () => {
    petsQuery = { pets: undefined, isLoading: true };
    await renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
  });

  // 서버가 그린 첫 화면이 로그아웃 모양이면 하이드레이션 뒤 아이 줄이 끼어들며 아래가 밀렸다(#470 리뷰)
  it("로그인 여부를 아직 모르면 아이 줄 자리를 뼈대로 잡아 둔다", async () => {
    session.value = null;
    petsQuery = { pets: undefined, isLoading: false };
    await renderWith();

    expect(screen.getByRole("status", { name: "아이 목록을 불러오는 중" })).toBeDefined();
    expect(petsCalls.at(-1)).toEqual({ enabled: false });
  });

  it("로그인하지 않았으면 아이 줄 없이 우리 아이로 읽는다", async () => {
    session.value = false;
    petsQuery = { pets: undefined, isLoading: false };
    await renderWith();

    expect(screen.queryByRole("radiogroup", { name: "아이 고르기" })).toBeNull();
    expect(screen.queryByRole("status", { name: "아이 목록을 불러오는 중" })).toBeNull();
    expect(screen.getByText("AI가 골라주는 우리 아이 맞춤 상품")).toBeDefined();
  });

  // 아이 등록이 전제라 드물지만, 그때도 새 아이를 들일 자리는 남아야 한다(#470 리뷰)
  it("아이가 0마리면 새 아이 추가 칸만 남긴다", async () => {
    petsQuery = { pets: [], isLoading: false };
    await renderWith();

    expect(screen.queryAllByRole("radio")).toHaveLength(0);
    expect(screen.getByRole("button", { name: "새 아이 추가" })).toBeDefined();
  });

  // 배너 API가 없어 비워 둔 회색 상자가 첫 화면 가장 큰 자리를 차지했다 (#504)
  it("배너 자리에 예시 배너 이미지가 문구를 대체 텍스트로 들고 있다", async () => {
    await renderWith();

    const banner = screen.getByRole("region", { name: "진행 중인 행사" });
    expect(within(banner).getByRole("img", { name: /타임딜 특가/ })).toBeDefined();
  });

  it("진행 중인 타임딜이 없으면 없다고 알린다", async () => {
    await renderWith("", EMPTY_PRODUCTS, EMPTY_DEALS);

    expect(await screen.findByText(/지금은 진행 중인 타임딜이 없어요/)).toBeDefined();
  });

  // 목데이터 두 개가 누구에게나 뜨던 자리다 (#494)
  it("최근에 구매한 상품은 반응을 남길 수 있는 실제 구매다", async () => {
    await renderWith();

    expect(screen.getByText("치석 케어 덴탈껌 7개입")).toBeDefined();
    expect(screen.getByText("관절 튼튼 트릿 200g")).toBeDefined();
    // 구매 후 며칠·몇 번째 구매는 응답에 없다. 지어내지 않는다
    expect(screen.queryByText(/구매 후 \d+일|\d+번째 구매/)).toBeNull();
    expect(pendingCalls).toContainEqual({ enabled: true });
  });

  it("남길 반응이 없으면 칸을 그리지 않는다", async () => {
    pendingQuery = { ...pendingIdle(), items: [] };
    await renderWith();

    expect(screen.queryByText("최근에 구매한 상품, 아이는 어때요?")).toBeNull();
  });

  // 로그아웃 상태에서 부르면 방문할 때마다 401과 재발급 시도가 헛돈다
  it("로그인하지 않았으면 부르지 않고 칸도 없다", async () => {
    session.value = false;
    pendingQuery = { ...pendingIdle(), items: undefined };
    await renderWith();

    expect(pendingCalls).toContainEqual({ enabled: false });
    expect(pendingCalls).not.toContainEqual({ enabled: true });
    expect(screen.queryByText("최근에 구매한 상품, 아이는 어때요?")).toBeNull();
  });

  // 조용히 비우면 남길 반응이 없는 것과 구별되지 않는다
  it("받지 못하면 그 자리에서 알리고 다시 받는다", async () => {
    const refetch = vi.fn();
    pendingQuery = { ...pendingIdle(), items: undefined, error: new Error("503"), refetch };
    await renderWith();

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toContain("최근에 구매한 상품을 불러오지 못했어요");
    fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
    expect(refetch).toHaveBeenCalledOnce();
  });

  // 받아 둔 것 없이 다시 부르면 조회가 오류를 비운다. 그때 칸이 사라지면 아래 구역이 튄다 (#498 점검)
  it("다시 받는 동안에도 오류 칸이 남아 대기를 알린다", async () => {
    pendingQuery = { ...pendingIdle(), items: undefined, error: null, isRetrying: true };
    await renderWith();

    const alert = screen.getByRole("alert");
    expect(
      within(alert).getByRole("status", { name: "최근에 구매한 상품을 다시 불러오는 중" }),
    ).toBeDefined();
    expect(within(alert).getByRole("button")).toHaveProperty("disabled", true);
  });

  it("반응을 남기면 서버에 보내고 어디에 쓰이는지 알린다", async () => {
    submitFeedback.mockResolvedValue(undefined);
    await renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    // 남긴 반응이 추천으로 되돌아간다는 것이 이 서비스의 약속이다
    expect(await screen.findByText(/다음 추천 적합도에 반영할게요/)).toBeDefined();
    // 항목의 아이가 비어 있으면(백엔드가 아직 null) 메인에서 고른 아이다
    expect(submitFeedback).toHaveBeenCalledWith({
      productId: "3",
      orderProductId: "11",
      petId: "3",
      submission: { answer: "GOOD" },
    });
  });

  it("항목에 아이가 있으면 그 아이의 반응으로 묻고 보낸다", async () => {
    submitFeedback.mockResolvedValue(undefined);
    await renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[1]);
    expect(screen.getByText("구름이에게 잘 맞았나요?")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "안 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith({
        productId: "5",
        orderProductId: "12",
        petId: "7",
        submission: { answer: "BAD" },
      }),
    );
  });

  // 테스트의 고른 아이가 기본 아이이자 목록 첫째면, 규칙을 "목록 첫 아이"로 바꿔도 통과한다 (#498 점검)
  it("항목에 아이가 없으면 메인에서 고른 아이로 묻고 보낸다", async () => {
    submitFeedback.mockResolvedValue(undefined);
    await renderWith();

    fireEvent.click(screen.getByRole("radio", { name: "구름이" }));
    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    expect(screen.getByText("구름이에게 잘 맞았나요?")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ orderProductId: "11", petId: "7" }),
      ),
    );
  });

  // 지운 아이의 주문이다. 고른 아이 이름으로 떨어지면 다른 아이에게 묻게 된다 (#498 점검)
  it("항목의 아이가 목록에 없으면 우리 아이로 묻고, 그 아이 번호는 그대로 보낸다", async () => {
    submitFeedback.mockResolvedValue(undefined);
    pendingQuery = {
      ...pendingIdle(),
      items: [{ orderProductId: "13", productId: "8", name: "연어 트릿 100g", petId: "99" }],
    };
    await renderWith();

    fireEvent.click(screen.getByRole("button", { name: /반응 남기기/ }));
    expect(screen.getByText("우리 아이에게 잘 맞았나요?")).toBeDefined();
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    await waitFor(() =>
      expect(submitFeedback).toHaveBeenCalledWith(
        expect.objectContaining({ orderProductId: "13", petId: "99" }),
      ),
    );
  });

  // 버튼 이름이 카드마다 같아 스크린 리더로는 어느 상품인지 모른다 (#498 점검)
  it("반응 남기기 버튼은 어느 상품인지 설명으로 알린다", async () => {
    await renderWith();

    const names = screen
      .getAllByRole("button", { name: "우리 아이 반응 남기기" })
      .map(
        (button) =>
          document.getElementById(button.getAttribute("aria-describedby") ?? "")?.textContent,
      );
    expect(names).toEqual(["치석 케어 덴탈껌 7개입", "관절 튼튼 트릿 200g"]);
  });

  it("반응을 고르면 아직 이르다는 표시가 풀린다", async () => {
    await renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    const tooEarly = screen.getByLabelText(/아직 판단하기에는 일러요/);
    fireEvent.click(tooEarly);
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));

    // 둘 다 켜지면 무엇을 답한 것인지 알 수 없다
    expect(tooEarly).toHaveProperty("dataset.state", "unchecked");
  });

  it("아직 답할 수 없다는 것도 답으로 받는다", async () => {
    await renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    const submit = screen.getByRole("button", { name: "등록하기" });
    expect(submit).toHaveProperty("disabled", true);

    fireEvent.click(screen.getByLabelText(/아직 판단하기에는 일러요/));
    expect(submit).toHaveProperty("disabled", false);
  });

  // 상품 목록·타임딜은 TanStack Query가 아니라 page.tsx가 만든 일반 Promise를
  // use()로 읽는다. 공용 ErrorBoundary의 기본 재시도(Query 리셋)만으로는 이미
  // reject된 같은 Promise를 다시 읽어 즉시 같은 오류가 재발하므로, 버튼이
  // router.refresh만 부르고 resetKeys={[productsPromise]}가 새 Promise를 감지해
  // 자동으로 회복하는지 본다
  it("다시 시도를 누르면 router.refresh를 부르고, 서버가 새로 준 결과가 오면 자동으로 회복한다", async () => {
    refreshMock.mockClear();
    const rejected = Promise.reject(new Error("네트워크 오류"));
    rejected.catch(() => {});

    let result: ReturnType<typeof render>;
    await act(async () => {
      result = render(
        <NuqsTestingAdapter searchParams="?category=food">
          <HomeView
            productsPromise={rejected}
            productsKey="food:recommend"
            dealsPromise={Promise.resolve(EMPTY_DEALS)}
          />
        </NuqsTestingAdapter>,
      );
    });

    fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));
    expect(refreshMock).toHaveBeenCalledTimes(1);
    // retry()는 부르지 않는다 — 아직 이전(reject된) Promise 그대로라 그걸 불렀다면
    // 같은 오류로 즉시 다시 잡혀야 하는데, 클릭 한 번으로 그런 재입장이 없어야 한다
    expect(screen.getByText("잠시 문제가 생겼어요. 다시 시도해 주세요.")).toBeDefined();

    // router.refresh()가 실제로 서버에서 새 결과를 받아온 상황을 흉내낸다 —
    // productsKey는 그대로(같은 category/sort)이고 productsPromise만 새 값으로 바뀐다
    await act(async () => {
      result.rerender(
        <NuqsTestingAdapter searchParams="?category=food">
          <HomeView
            productsPromise={Promise.resolve(toProducts([PUPPY_FOOD]))}
            productsKey="food:recommend"
            dealsPromise={Promise.resolve(EMPTY_DEALS)}
          />
        </NuqsTestingAdapter>,
      );
    });

    expect(await screen.findByText("퍼피 성장기 사료 1kg")).toBeDefined();
  });
});

describe("타임딜 여러 묶음", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  // 백엔드가 dealId 개수를 제한하지 않아 묶음이 여러 개 올 수 있다(#282). 응답 순서를
  // 믿지 않고 가장 먼저 끝나는 묶음부터 보여주다가, 그 묶음이 끝나면 다음으로 먼저
  // 끝나는 묶음으로 넘어가는지 본다
  it("가장 먼저 끝나는 묶음을 보여주다가, 끝나면 다음 묶음으로 넘어간다", async () => {
    const now = Date.now();
    const soon: TimeDealGroup = {
      dealId: 1,
      dealName: "먼저 끝나는 딜",
      startAt: new Date(now - 3_600_000).toISOString(),
      endAt: new Date(now + 5_000).toISOString(),
      items: [
        {
          timeDealItemId: 1,
          productId: 1,
          name: "먼저 끝나는 상품",
          thumbnailUrl: null,
          price: 1000,
          originalPrice: 2000,
          discountRate: 50,
          unitLabel: null,
          unitAmount: 0,
          stock: "enough",
        },
      ],
    };
    const later: TimeDealGroup = {
      dealId: 2,
      dealName: "나중에 끝나는 딜",
      startAt: new Date(now - 3_600_000).toISOString(),
      endAt: new Date(now + 3_600_000).toISOString(),
      items: [
        {
          timeDealItemId: 2,
          productId: 2,
          name: "나중에 끝나는 상품",
          thumbnailUrl: null,
          price: 3000,
          originalPrice: 4000,
          discountRate: 25,
          unitLabel: null,
          unitAmount: 0,
          stock: "enough",
        },
      ],
    };

    // 응답 순서를 일부러 later 먼저로 둔다 — 순서를 믿지 않는지 확인하기 위해서다
    await renderWith("", EMPTY_PRODUCTS, {
      groups: [later, soon],
      serverTime: new Date(now).toISOString(),
    });

    expect(screen.getByText("먼저 끝나는 상품")).toBeDefined();
    expect(screen.queryByText("나중에 끝나는 상품")).toBeNull();

    await act(async () => {
      await vi.advanceTimersByTimeAsync(6_000);
    });

    expect(screen.queryByText("먼저 끝나는 상품")).toBeNull();
    expect(screen.getByText("나중에 끝나는 상품")).toBeDefined();
  });

  // 27,200 / 31,900은 서버가 15%, 버림 계산이 14%다. 딜 응답의 discountRate를 쓰는지 본다
  it("딜 상품의 할인율은 두 금액으로 계산하지 않고 서버 값을 쓴다", async () => {
    const now = Date.now();
    const group: TimeDealGroup = {
      dealId: 1,
      dealName: "지금 딜",
      startAt: new Date(now - 3_600_000).toISOString(),
      endAt: new Date(now + 3_600_000).toISOString(),
      items: [
        {
          timeDealItemId: 1,
          productId: 1,
          name: "딜 사료",
          thumbnailUrl: null,
          price: 27200,
          originalPrice: 31900,
          discountRate: 15,
          unitLabel: null,
          unitAmount: 0,
          stock: "enough",
        },
      ],
    };

    await renderWith("", EMPTY_PRODUCTS, {
      groups: [group],
      serverTime: new Date(now).toISOString(),
    });

    expect(screen.getByText("15%")).toBeDefined();
    expect(screen.queryByText("14%")).toBeNull();
    expect(screen.getByText("31,900원")).toBeDefined();
    // 딜가는 일반 상품 상세에 오지 않는다. 딜 번호를 들고 가야 상세도 딜가다 (#484)
    expect(screen.getByRole("link", { name: /딜 사료/ }).getAttribute("href")).toBe(
      "/products/1?dealItem=1",
    );
  });
});
