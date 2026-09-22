// 탭에 따라 화면이 통째로 바뀌는지, 상태 체크가 무엇을 약속하는지 본다. 카테고리
// 그리드·타임딜은 서버가 조회해 준 결과를 그대로 그리는지만 본다 — 거르고 정렬하는
// 건 서버 책임이라 여기서 다시 보지 않는다(entities/product/api/products.test.ts가
// 요청 파라미터 조립을 본다).
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type {
  ProductCard,
  ProductListResult,
  TimeDealGroup,
  TimeDealList,
} from "@/entities/product";

const pushMock = vi.fn();
const refreshMock = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: pushMock, back: vi.fn(), refresh: refreshMock }),
  usePathname: () => "/",
}));

import { HomeView } from "./home-view";

const PUPPY_FOOD: ProductCard = {
  productId: 4,
  name: "퍼피 성장기 사료 1kg",
  price: 21000,
  discountRate: 0,
  unitPrice: 1060,
  unitLabel: "1kg당",
  thumbnailUrl: null,
  rating: 4.6,
  reviewCount: 109,
};

const SENIOR_FOOD: ProductCard = {
  productId: 2,
  name: "노령견 저지방 소화케어 사료 1kg",
  price: 27200,
  discountRate: 15,
  unitPrice: 1050,
  unitLabel: "1kg당",
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

  it("새 아이 추가를 누르면 온보딩 기본 정보 단계로 간다", async () => {
    await renderWith();

    fireEvent.click(screen.getByRole("button", { name: "새 아이 추가" }));

    expect(pushMock).toHaveBeenCalledWith("/onboarding?step=basic");
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

  it("카테고리에 상품이 없으면 없다고 알린다", async () => {
    await renderWith("?category=snack", EMPTY_PRODUCTS);

    expect(await screen.findByText(/아직 등록된 상품이 없어요/)).toBeDefined();
  });

  it("아이 이름이 화면에 보인다", async () => {
    await renderWith();

    // 사진만으로는 어느 아이인지 알 수 없다
    expect(screen.getByText("소리")).toBeDefined();
  });

  it("진행 중인 타임딜이 없으면 없다고 알린다", async () => {
    await renderWith("", EMPTY_PRODUCTS, EMPTY_DEALS);

    expect(await screen.findByText(/지금은 진행 중인 타임딜이 없어요/)).toBeDefined();
  });

  it("반응을 남기면 어디에 쓰이는지 알린다", async () => {
    await renderWith();

    fireEvent.click(screen.getAllByRole("button", { name: /반응 남기기/ })[0]);
    fireEvent.click(screen.getByRole("radio", { name: "잘 맞았어요" }));
    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    // 남긴 반응이 추천으로 되돌아간다는 것이 이 서비스의 약속이다
    expect(screen.getByText(/다음 추천 적합도에 반영할게요/)).toBeDefined();
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
});
