// 상품 비교 테스트. 자리를 무엇으로 채우는지, 자리가 비면 무엇이 달라지는지, 장바구니에 실제로 담는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import type { ProductDetail } from "@/entities/product";
import { ApiError } from "@/shared/api/client";
import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const { push, replace, showSnackbar, getProductDetail, addCartItem, getCart } = vi.hoisted(() => ({
  push: vi.fn(),
  replace: vi.fn(),
  showSnackbar: vi.fn(),
  getProductDetail: vi.fn(),
  addCartItem: vi.fn(),
  getCart: vi.fn(),
}));

// 서버로 가는 것만 갈아끼운다. 상세 훅·장바구니 훅은 진짜를 써서 캐시 무효화까지 지나가게 한다
vi.mock("@/entities/product/api/products", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/product/api/products")>()),
  getProductDetail,
}));
vi.mock("@/entities/cart/api/cart", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/cart/api/cart")>()),
  addCartItem,
  getCart,
}));

// 헤더 종은 서버 상태를 읽는 위젯이다. 이 화면 테스트에는 알림 API가 없어 링크만 대신 그린다(#395)
vi.mock("@/widgets/notification-bell", () => ({
  NotificationBell: ({ className }: { className?: string }) => (
    <a href="/mypage/notifications" aria-label="알림" className={className} />
  ),
  NewNotificationToaster: () => null,
}));
// 헤더 장바구니는 세션을 읽는 위젯이라 수를 세는 훅만 그대로 써서 대신 그린다(#470).
// 담은 뒤 이 수가 바뀌는지가 QA CP-010이다
vi.mock("@/widgets/cart-link", async () => {
  const { useQueryCartCount } = await import("@/entities/cart");
  return {
    CartLink: function CartLink() {
      const count = useQueryCartCount();
      return <a href="/cart" aria-label={count > 0 ? `장바구니에 ${count}개` : "장바구니"} />;
    },
  };
});
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, replace, back: vi.fn() }),
  usePathname: () => "/compare",
}));

vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

import { ProductCompareView } from "./product-compare-view";

/** 배포 API에서 본 상품과 같은 모양의 상세. 이름·가격·이미지만 번호마다 다르다 */
function detail(productId: number, name: string, price: number): ProductDetail {
  return {
    productId,
    timeDealItemId: null,
    images: [`https://image.leechs.shop/products/${productId}.png`],
    name,
    price,
    originalPrice: price,
    discountRate: 0,
    rating: null,
    reviewCount: 0,
    soldOut: false,
    detail: {
      manufacturer: null,
      brandName: null,
      originCountry: null,
      netQuantityValue: 1,
      netQuantityUnit: "kg",
      ingredients: [],
      feedingTarget: null,
      targetBreedSize: null,
      targetAgeGroup: null,
      targetSpecies: [],
      feedingMethod: null,
      allergens: [],
      cautions: [],
      consumptionPeriodDisplay: null,
      shelfLifeAfterOpeningDays: null,
      storageMethod: null,
    },
  };
}

const PRODUCTS: Record<string, ProductDetail> = {
  "1": detail(1, "한끼 그레인프리 곤충 시니어 1kg", 19000),
  "2": detail(2, "한끼 그레인프리 곤충 시니어 4kg", 50400),
  "4": detail(4, "한끼 웰니스 닭고기 시니어 2kg", 34000),
  "8": detail(8, "한끼 클래식 칠면조 시니어 2kg", 30300),
  "33": detail(33, "한끼 웰니스 사슴 어덜트 4kg", 48200),
  "75": detail(75, "담았냥 그레인프리 가다랑어 시니어 1kg", 24700),
  "123": detail(123, "한포 면역 지원 영양제 90정", 21000),
};

beforeEach(() => {
  getProductDetail.mockImplementation((id: string) =>
    PRODUCTS[id] ? Promise.resolve(PRODUCTS[id]) : Promise.reject(new ApiError(404, "없음")),
  );
  getCart.mockResolvedValue({ memberId: 1, items: [], totalAmount: 0 });
  addCartItem.mockResolvedValue(undefined);
});

afterEach(() => {
  vi.clearAllMocks();
});

function renderView(search = "") {
  const Wrapper = createQueryWrapper();
  return render(
    <Wrapper>
      <NuqsTestingAdapter searchParams={search}>
        <ProductCompareView />
      </NuqsTestingAdapter>
    </Wrapper>,
  );
}

// 담지 않았는데 예시 상품 둘이 담겨 있고, 빼고 다시 와도 되살아났다(QA HM-000)
test("고른 상품이 없으면 두 자리 모두 빈 칸으로 시작한다", () => {
  renderView();

  expect(screen.getAllByRole("button", { name: "상품 추가하기" })).toHaveLength(2);
  expect(screen.queryByRole("button", { name: /비교에서 빼기/ })).toBeNull();
  expect(screen.queryByText("맞춤 분석")).toBeNull();
  expect(getProductDetail).not.toHaveBeenCalled();
});

// 검색이 돌려준 실제 번호(33)를 목업 맵에서 찾아 자리가 빈 채로 남았다(QA CP-022).
// 목업 상품에는 이미지도 없었다(QA CP-001)
test("주소의 상품 번호로 상세를 받아 이름·가격·이미지를 채운다", async () => {
  const { container } = renderView("?slot=0&product=33&other=75");

  expect(
    await screen.findByRole("button", { name: "한끼 웰니스 사슴 어덜트 4kg 비교에서 빼기" }),
  ).toBeDefined();
  expect(
    await screen.findByRole("button", {
      name: "담았냥 그레인프리 가다랑어 시니어 1kg 비교에서 빼기",
    }),
  ).toBeDefined();
  expect(screen.getByText("48,200원")).toBeDefined();
  expect(getProductDetail).toHaveBeenCalledWith("33");
  expect(getProductDetail).toHaveBeenCalledWith("75");

  const sources = Array.from(container.querySelectorAll("img")).map((img) =>
    decodeURIComponent(img.getAttribute("src") ?? ""),
  );
  expect(sources.some((src) => src.includes("https://image.leechs.shop/products/33.png"))).toBe(
    true,
  );
  expect(sources.some((src) => src.includes("https://image.leechs.shop/products/75.png"))).toBe(
    true,
  );
});

test("상품을 받는 동안 그 자리에 뼈대를 보인다", () => {
  getProductDetail.mockImplementation(() => new Promise(() => {}));
  renderView("?slot=0&product=33&other=none");

  expect(screen.getByRole("status", { name: "비교할 상품을 불러오는 중" })).toBeDefined();
  // 반대쪽 빈 자리는 기다리지 않는다
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

test("상품을 받지 못하면 그 자리에 다시 시도를 보이고, 누르면 다시 부른다", async () => {
  getProductDetail.mockRejectedValue(new ApiError(503, "잠시 문제"));
  renderView("?slot=0&product=33&other=none");

  expect(await screen.findByText("상품을 불러오지 못했어요.")).toBeDefined();

  getProductDetail.mockResolvedValue(PRODUCTS["33"]);
  fireEvent.click(screen.getByRole("button", { name: "다시 시도" }));

  expect(
    await screen.findByRole("button", { name: "한끼 웰니스 사슴 어덜트 4kg 비교에서 빼기" }),
  ).toBeDefined();
  expect(getProductDetail).toHaveBeenCalledTimes(2);
});

test("없어진 상품(404)은 빈 자리로 둔다", async () => {
  renderView("?slot=0&product=999&other=none");

  await waitFor(() => expect(getProductDetail).toHaveBeenCalledWith("999"));
  await waitFor(() =>
    expect(screen.getAllByRole("button", { name: "상품 추가하기" })).toHaveLength(2),
  );
  expect(screen.queryByRole("alert")).toBeNull();
});

test("상품 상세에서 담아 온 경우 그 상품만 첫 자리에 보여준다", async () => {
  renderView("?slot=0&product=123&from=detail");

  expect(await screen.findByText("한포 면역 지원 영양제 90정")).toBeDefined();
  expect(screen.getByText("21,000원")).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
  expect(screen.queryByText("맞춤 분석")).toBeNull();
});

test("두 번째 상품을 고르러 갈 때 첫 상품 ID를 함께 전달한다", () => {
  renderView("?slot=0&product=123&from=detail");

  fireEvent.click(screen.getByRole("button", { name: "상품 추가하기" }));

  expect(push).toHaveBeenCalledWith("/search?slot=1&from=detail&first=123");
});

test("검색에서 두 번째 상품을 고르고 돌아와도 상세 상품이 첫 자리에 남는다", async () => {
  renderView("?slot=1&product=4&from=detail&first=123");

  expect(await screen.findByText("한포 면역 지원 영양제 90정")).toBeDefined();
  expect(await screen.findByText("한끼 웰니스 닭고기 시니어 2kg")).toBeDefined();
});

// 검색에서 돌아왔을 때 반대쪽 자리를 항상 기본값으로 되돌리던 버그. 두 자리가 우연히 같은
// id를 가져 React가 "두 자식이 같은 key를 가졌다"는 경고를 내고 자리가 하나로 뭉개졌다(#245)
test("검색에서 돌아오면 각 자리를 주소의 번호대로 되살린다", async () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  renderView("?slot=0&product=2&other=8");

  expect(await screen.findByText("한끼 그레인프리 곤충 시니어 4kg")).toBeDefined();
  expect(await screen.findByText("한끼 클래식 칠면조 시니어 2kg")).toBeDefined();
  expect(consoleError.mock.calls.some((call) => String(call[0]).includes("same key"))).toBe(false);

  consoleError.mockRestore();
});

test("검색으로 갈 때 반대쪽 자리의 현재 상품 id를 함께 전달한다", () => {
  // 자리 0은 비우고(other=none), 자리 1엔 1번을 채운 상태로 시작한다
  renderView("?slot=1&product=1&other=none");

  fireEvent.click(screen.getByRole("button", { name: "상품 추가하기" }));

  expect(push).toHaveBeenCalledWith("/search?slot=0&other=1");
});

// 정상 흐름(goSelect)은 절대 같은 id를 만들지 않지만, 주소를 손으로 조작하면
// product와 other가 같은 값일 수 있다. 그대로 믿으면 두 자리가 같은 상품이 되어
// React key가 겹친다(코드리뷰 지적)
test("product와 other가 같은 id면 반대쪽 자리를 비운다", async () => {
  renderView("?slot=0&product=1&other=1");

  expect(await screen.findAllByText("한끼 그레인프리 곤충 시니어 1kg")).toHaveLength(1);
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

// 자리를 비우고 검색을 한 바퀴 돌고 와도 비운 자리가 되살아나지 않아야 한다
test("두 자리를 다 비우고 검색에 가면 other가 none으로 담긴다", async () => {
  renderView("?slot=0&product=1&other=2");

  fireEvent.click(
    await screen.findByRole("button", { name: "한끼 그레인프리 곤충 시니어 1kg 비교에서 빼기" }),
  );
  fireEvent.click(
    await screen.findByRole("button", { name: "한끼 그레인프리 곤충 시니어 4kg 비교에서 빼기" }),
  );
  fireEvent.click(screen.getAllByRole("button", { name: "상품 추가하기" })[0]);

  expect(push).toHaveBeenCalledWith("/search?slot=0&other=none");
});

/** 빼기가 바꾼 주소의 쿼리. 이 쿼리로 다시 여는 것이 검색에서 뒤로 오거나 새로고침한 것과 같다 */
function searchOf(href: string) {
  return new URL(href, "http://localhost").search;
}

// 빼도 주소에 번호가 남아, 검색에서 뒤로 오거나 새로고침하면 다시 마운트되며 뺀 상품이
// 되살아났다(QA HM-000). 하단 탭으로 /compare에 새로 들어올 때만 비어 있었다
test("하나 남은 상품을 빼면 주소도 비워, 그 주소로 다시 열면 빈 칸이다", async () => {
  const { unmount } = renderView("?slot=0&product=33&other=none");

  fireEvent.click(
    await screen.findByRole("button", { name: "한끼 웰니스 사슴 어덜트 4kg 비교에서 빼기" }),
  );

  expect(replace).toHaveBeenCalledWith("/compare", { scroll: false });

  unmount();
  getProductDetail.mockClear();
  renderView(searchOf(replace.mock.calls[0][0]));

  expect(screen.getAllByRole("button", { name: "상품 추가하기" })).toHaveLength(2);
  expect(getProductDetail).not.toHaveBeenCalled();
});

test("두 자리 중 하나를 빼면 남은 자리만 주소에 남는다", async () => {
  const { unmount } = renderView("?slot=0&product=1&other=2");

  fireEvent.click(
    await screen.findByRole("button", { name: "한끼 그레인프리 곤충 시니어 1kg 비교에서 빼기" }),
  );

  expect(replace).toHaveBeenCalledWith("/compare?slot=1&product=2&other=none", { scroll: false });

  unmount();
  renderView(searchOf(replace.mock.calls[0][0]));

  expect(await screen.findByText("한끼 그레인프리 곤충 시니어 4kg")).toBeDefined();
  expect(screen.queryByText("한끼 그레인프리 곤충 시니어 1kg")).toBeNull();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

// 상세에서 온 흐름도 other 형식으로 적는다. 검색 화면은 other와 from=detail&first를 똑같이
// "반대쪽 자리에 이미 있는 상품"으로 읽어, 다시 고르러 가도 상세 상품이 목록에서 빠진다
test("상세에서 온 흐름에서 두 번째 상품을 빼면 상세 상품만 주소에 남는다", async () => {
  const { unmount } = renderView("?slot=1&product=4&from=detail&first=123");

  fireEvent.click(
    await screen.findByRole("button", { name: "한끼 웰니스 닭고기 시니어 2kg 비교에서 빼기" }),
  );

  expect(replace).toHaveBeenCalledWith("/compare?slot=0&product=123&other=none", {
    scroll: false,
  });

  unmount();
  renderView(searchOf(replace.mock.calls[0][0]));

  expect(await screen.findByText("한포 면역 지원 영양제 90정")).toBeDefined();
  expect(screen.queryByText("한끼 웰니스 닭고기 시니어 2kg")).toBeNull();

  fireEvent.click(screen.getByRole("button", { name: "상품 추가하기" }));
  expect(push).toHaveBeenCalledWith("/search?slot=1&other=123");
});

test("other가 none이면 그 자리를 비운 채로 되살린다", async () => {
  renderView("?slot=1&product=8&other=none");

  expect(await screen.findByText("한끼 클래식 칠면조 시니어 2kg")).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
  expect(screen.queryByText("맞춤 분석")).toBeNull();
});

// 항목별 값·적합도 API가 없다. 목업 상품의 표를 실제 상품 이름 아래 붙이지 않는다(#245 후속)
test("두 자리가 차면 맞춤 분석과 준비 중 안내가 나오고 목업 표는 그리지 않는다", async () => {
  renderView("?slot=0&product=1&other=2");

  expect(await screen.findByText("두 상품 모두 아직 적합도를 재지 못했어요.")).toBeDefined();
  expect(screen.getByText(/아직 준비 중/)).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
  // 종류를 모르면 종류로 막지 않는다
  expect(screen.queryByText(/건식은 건식끼리/)).toBeNull();
});

test("한 자리를 비우면 견줄 것이 없어 비교 영역이 사라진다", async () => {
  renderView("?slot=0&product=1&other=2");

  await screen.findByText("두 상품 모두 아직 적합도를 재지 못했어요.");
  fireEvent.click(
    screen.getByRole("button", { name: "한끼 그레인프리 곤충 시니어 1kg 비교에서 빼기" }),
  );

  expect(screen.queryByText("맞춤 분석")).toBeNull();
  expect(screen.getByText(/담아주세요/)).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

// 예전엔 담지 않고 토스트만 띄웠다. 시트도 없었다(QA CP-006·007)
test("장바구니 추가를 누르면 수량 시트가 열리고 고른 수량대로 담는다", async () => {
  renderView("?slot=0&product=33&other=none");

  fireEvent.click(await screen.findByRole("button", { name: "장바구니 추가" }));
  // 시트의 담기 버튼은 금액을 함께 읽힌다(기본 수량 1개)
  expect(await screen.findByRole("button", { name: "48,200원 장바구니 담기" })).toBeDefined();
  // 옵션은 없는 개념이라 지금 담는 용량을 알린다(상품 상세 시트와 같다)
  expect(screen.getByText("1kg")).toBeDefined();

  fireEvent.click(screen.getByLabelText("한끼 웰니스 사슴 어덜트 4kg 수량 하나 늘리기"));
  fireEvent.click(screen.getByRole("button", { name: "96,400원 장바구니 담기" }));

  await waitFor(() =>
    expect(addCartItem).toHaveBeenCalledWith({ itemType: "NORMAL", itemId: 33 }, 2),
  );
  await waitFor(() => expect(showSnackbar).toHaveBeenCalledWith("장바구니에 담겼어요"));
  await waitFor(() => expect(screen.queryByRole("button", { name: /장바구니 담기$/ })).toBeNull());
});

// 담아도 헤더 장바구니 수가 그대로였다(QA CP-010)
test("담고 나면 헤더 장바구니 수를 다시 받아 갱신한다", async () => {
  renderView("?slot=0&product=33&other=none");

  expect(await screen.findByRole("link", { name: "장바구니" })).toBeDefined();

  getCart.mockResolvedValue({
    memberId: 1,
    items: [{ itemType: "NORMAL", itemId: 33, quantity: 1, addedAt: "2026-09-29T01:00:00Z" }],
    totalAmount: 48200,
  });
  fireEvent.click(await screen.findByRole("button", { name: "장바구니 추가" }));
  fireEvent.click(await screen.findByRole("button", { name: "48,200원 장바구니 담기" }));

  expect(await screen.findByRole("link", { name: "장바구니에 1개" })).toBeDefined();
});

test("담기가 거부되면 시트가 열린 채 남고 담겼다고 알리지 않는다", async () => {
  addCartItem.mockRejectedValue(new ApiError(503, "잠시 문제"));
  renderView("?slot=0&product=33&other=none");

  fireEvent.click(await screen.findByRole("button", { name: "장바구니 추가" }));
  fireEvent.click(await screen.findByRole("button", { name: "48,200원 장바구니 담기" }));

  await waitFor(() => expect(addCartItem).toHaveBeenCalled());
  expect(await screen.findByRole("button", { name: "48,200원 장바구니 담기" })).toBeDefined();
  expect(showSnackbar).not.toHaveBeenCalledWith("장바구니에 담겼어요");
});

// 헤더에 title·leading을 안 줘서 뒤로가기와 "상품비교" 제목이 통째로 빠져 있었다(1568-70276)
test("머리말에 뒤로가기와 제목이 있다", async () => {
  renderView();

  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "상품비교" })).toBeDefined();
  expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
    "/mypage/notifications",
  );
  expect((await screen.findByRole("link", { name: "장바구니" })).getAttribute("href")).toBe(
    "/cart",
  );
});

test("하단 이동 줄에서 현재 화면을 알린다", () => {
  renderView();

  const current = screen.getByRole("link", { name: "상품비교" });
  expect(current.getAttribute("aria-current")).toBe("page");
});
