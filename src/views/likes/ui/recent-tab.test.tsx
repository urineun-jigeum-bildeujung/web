// "최근에 봤어요" 탭 테스트. 브라우저 기록을 최신순으로 그리고, 빼기·찜·빈 상태·받는 중·없어진 상품·실패를 본다.
import { fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { renderToString } from "react-dom/server";
import { beforeEach, expect, test, vi } from "vitest";

import { ApiError } from "@/shared/api/client";
import { toAppMessageCode } from "@/shared/api/error-message";
import { APP_MESSAGE } from "@/shared/config/app-message";

type EntryState = {
  product?: object;
  isLoading?: boolean;
  notFound?: boolean;
  isError?: boolean;
};

const SERVER_ERROR = new ApiError(503, "잠시 문제");

const { details, refetchFailed, toggle } = vi.hoisted(() => ({
  /** 상품 번호마다 조회가 어떤 상태인지. 없으면 받은 것도 실패도 아닌 기본값이다 */
  details: new Map<number, EntryState>(),
  refetchFailed: vi.fn(),
  toggle: vi.fn(),
}));

vi.mock("@/entities/product", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/product")>()),
  useQueryProductDetails: (productIds: number[]) => ({
    entries: productIds.map((productId) => ({
      productId,
      isLoading: false,
      notFound: false,
      isError: false,
      ...details.get(productId),
    })),
    error: productIds.some((productId) => details.get(productId)?.isError) ? SERVER_ERROR : null,
    refetchFailed,
  }),
}));
vi.mock("@/features/toggle-wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/toggle-wishlist")>()),
  useToggleWishlist: () => ({ signedIn: true, toggle }),
  // 간식B(2)만 이미 찜했다
  useWishedProductIds: () => ({ wishedIds: new Set([2]), isLoading: false }),
}));

import { useRecentlyViewedStore } from "@/features/recently-viewed";

import { RecentTab } from "./recent-tab";

const productOf = (
  productId: number,
  name: string,
  price: number,
  originalPrice: number | null,
  discountRate: number,
) => ({
  productId,
  timeDealItemId: null,
  images: [],
  name,
  price,
  originalPrice,
  discountRate,
  rating: null,
  reviewCount: 0,
  soldOut: false,
  detail: {},
});

beforeEach(() => {
  vi.clearAllMocks();
  details.clear();
  details.set(1, { product: productOf(1, "사료A", 25600, 32000, 20) });
  details.set(2, { product: productOf(2, "간식B", 11900, null, 0) });
  localStorage.clear();
  useRecentlyViewedStore.setState({ productIds: [2, 1] });
});

// PRD "최근 본 상품 조회" — 최신순, 대표 이미지·상품명·판매가·할인율·정가
test("본 상품을 최신순으로 판매가·할인율·정가와 함께 보인다", () => {
  render(<RecentTab />);

  const [latest, earlier] = screen.getAllByRole("listitem");
  expect(latest.textContent).toContain("간식B");
  expect(earlier.textContent).toContain("사료A");
  expect(earlier.textContent).toContain("20%");
  expect(earlier.textContent).toContain("32,000원");
  expect(within(earlier).getByRole("link").getAttribute("href")).toBe("/products/1");
});

// PRD "[터치] 목록에서 제거" — 확인을 거치지 않는다
test("X를 누르면 확인 없이 바로 목록과 기록에서 빠진다", () => {
  render(<RecentTab />);

  fireEvent.click(screen.getByRole("button", { name: "간식B 최근 본 목록에서 빼기" }));

  expect(screen.queryByText("간식B")).toBeNull();
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(useRecentlyViewedStore.getState().productIds).toEqual([1]);
});

// PRD "찜하기 버튼 [터치]: 화면 이동 없이 찜 목록에 등록"
test("하트는 찜 여부를 보이고, 누르면 그 자리에서 찜을 켠다", () => {
  render(<RecentTab />);

  expect(screen.getByRole("button", { name: "간식B 찜하기" }).getAttribute("aria-pressed")).toBe(
    "true",
  );
  fireEvent.click(screen.getByRole("button", { name: "사료A 찜하기" }));

  expect(toggle).toHaveBeenCalledWith(1, true, {
    productId: 1,
    name: "사료A",
    thumbnailUrl: null,
    price: 25600,
    originalPrice: 32000,
  });
});

test("본 상품이 없으면 없다고 알린다", () => {
  useRecentlyViewedStore.setState({ productIds: [] });

  render(<RecentTab />);

  expect(screen.getByText("최근 본 상품이 없어요")).toBeDefined();
  expect(screen.queryAllByRole("listitem")).toHaveLength(0);
});

test("상품을 받는 동안은 그 자리에 뼈대를 둔다", () => {
  details.set(1, { isLoading: true });

  render(<RecentTab />);

  const items = screen.getAllByRole("listitem");
  expect(items).toHaveLength(2);
  expect(within(items[1]).queryByRole("link")).toBeNull();
});

// 두면 들어올 때마다 404를 다시 부른다
test("없어진 상품은 목록에서 빼고 기록에서도 지운다", async () => {
  useRecentlyViewedStore.setState({ productIds: [9, 1] });
  details.set(9, { notFound: true });

  render(<RecentTab />);

  expect(screen.getAllByRole("listitem")).toHaveLength(1);
  await waitFor(() => expect(useRecentlyViewedStore.getState().productIds).toEqual([1]));
});

// 본 상품이 있는데 "없어요"라고 하면 사실과 다르다
test("하나도 받지 못하면 불러오지 못했다고 알리고 다시 부를 수 있다", () => {
  useRecentlyViewedStore.setState({ productIds: [5] });
  details.set(5, { isError: true });

  render(<RecentTab />);

  const alert = screen.getByRole("alert");
  // 찜 탭과 같게 실패 코드로 고른 문구다(app-message-convention)
  expect(alert.textContent).toContain(APP_MESSAGE[toAppMessageCode(SERVER_ERROR)].title);
  fireEvent.click(within(alert).getByRole("button", { name: "다시 시도" }));
  expect(refetchFailed).toHaveBeenCalledOnce();
});

// 서버에는 저장된 목록이 없다. 그대로 그리면 기록이 있는 사람에게도 "없어요"가 먼저 스친다
test("저장된 목록을 읽기 전(서버 렌더)에는 빈 상태가 아니라 뼈대를 그린다", () => {
  const html = renderToString(<RecentTab />);

  expect(html).not.toContain("최근 본 상품이 없어요");
  expect(html).toContain("최근 본 상품을 불러오는 중");
});
