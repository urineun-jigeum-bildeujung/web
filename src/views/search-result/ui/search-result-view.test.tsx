// 서버가 준 결과를 그대로 그리는지, 걸리는 게 없을 때 무엇을 보이는지, 검색바가
// 어디로 보내는지, 목록 끝에서 다음 쪽을 이어 받는지 본다. 검색어로 거르고 정렬하는 건
// 서버 책임이라 여기서 다시 보지 않는다(entities/product/api/products.test.ts가 요청 파라미터 조립을 본다).
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import type { ProductCard, ProductSearchResult, ProductSort } from "@/entities/product";

const push = vi.fn();
const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, refresh, back: vi.fn() }),
  usePathname: () => "/search/result",
}));

// 찜은 서버에 저장한다(#483). 로그인·찜 목록은 서버 상태라 값만 세운다. 하트 버튼은 진짜를 그린다
const { toggle, wished } = vi.hoisted(() => ({
  toggle: vi.fn(),
  wished: { ids: new Set<number>(), loading: false },
}));
vi.mock("@/features/toggle-wishlist", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/features/toggle-wishlist")>()),
  useToggleWishlist: () => ({ signedIn: true, toggle }),
  useWishedProductIds: () => ({ wishedIds: wished.ids, isLoading: wished.loading }),
}));

// 비교로 확정하기 전에 로그인을 본다(#542). 토스트는 훅 테스트가 보므로 여기서는 통과 여부만 세운다
const session = vi.hoisted(() => ({ signedIn: true }));
vi.mock("@/shared/api/use-require-session", () => ({
  useRequireSession: () => () => session.signedIn,
}));

import { SearchResultView } from "./search-result-view";

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

function toResult(items: ProductCard[]): ProductSearchResult {
  return { items, totalCount: items.length, nextCursor: null, hasNext: false };
}

/** 첫 쪽을 부른 검색어·정렬. 다음 쪽이 없는 테스트에선 쓰이지 않는다 */
const QUERY: { keyword: string; sort: ProductSort } = { keyword: "사료", sort: "RECOMMEND" };

// `use()`가 첫 렌더에서 항상 한 번 suspend했다가 promise가 풀리면 다시 그린다 — 이미
// resolve된 promise를 넘겨도 마찬가지라, act()로 감싸 그 재렌더까지 기다리고 반환한다
async function renderWith(search: string, items: ProductCard[] = [PUPPY_FOOD]) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <NuqsTestingAdapter searchParams={search}>
        <SearchResultView resultsPromise={Promise.resolve(toResult(items))} resultsQuery={QUERY} />
      </NuqsTestingAdapter>,
    );
  });
  return result!;
}

describe("SearchResultView", () => {
  it("서버가 준 결과를 그대로 그린다", async () => {
    await renderWith("?q=퍼피");

    expect(await screen.findAllByRole("listitem")).toHaveLength(1);
    expect(screen.getByText("총 1개")).toBeDefined();
  });

  // 서버는 단위 기호(`g`)와 한 단위의 가격을 준다. 기호만 앞에 붙이면 "g 21원"으로 읽힌다 (#479)
  it("단가를 한 단위당 가격으로 보인다", async () => {
    await renderWith("?q=퍼피");

    expect(await screen.findByText("1g당 약 21원")).toBeDefined();
  });

  it("결과가 없으면 없다고 알린다", async () => {
    await renderWith("?q=고양이모래", []);

    expect(await screen.findByText(/검색 결과가 없어요/)).toBeDefined();
    // 셀 것이 없으니 개수와 정렬도 감춘다
    expect(screen.queryByLabelText("정렬")).toBeNull();
  });

  it("검색바를 누르면 검색 화면으로 되돌아간다", async () => {
    // 헤더·검색바는 결과를 기다리지 않고 바로 그려진다
    await renderWith("?q=사료");

    fireEvent.click(screen.getByRole("button", { name: /검색어 고치기/ }));

    expect(push).toHaveBeenCalledWith("/search");
  });

  // 비교 화면이 자리를 채우러 보낸 경우. 카드는 체크만 되고, 선택 완료로 확정해야 비교로 간다
  it("비교할 자리를 채우러 왔으면 카드를 체크하고 선택 완료를 눌러야 비교 화면으로 간다", async () => {
    await renderWith("?q=퍼피&slot=1");

    // 카드가 링크가 아니라 체크 버튼이 된다
    await screen.findByRole("button", { name: /퍼피 성장기 사료/ });
    expect(screen.queryByRole("link", { name: /퍼피 성장기 사료/ })).toBeNull();
    // 시안(1117-6424)엔 총 개수·정렬이 없다 — 무엇이 맞는지가 아니라 고르는 것 자체가 목적이다
    expect(screen.queryByText(/^총 \d+개$/)).toBeNull();
    expect(screen.queryByLabelText("정렬")).toBeNull();

    const complete = screen.getByRole("button", { name: "선택 완료" });
    expect(complete.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("button", { name: /퍼피 성장기 사료/ }));
    expect(complete.hasAttribute("disabled")).toBe(false);

    fireEvent.click(complete);
    expect(push).toHaveBeenCalledWith("/compare?slot=1&product=4");
  });

  // 고르기 모드는 주소로도 들어온다. 비교는 로그인해야 열리므로 비로그인이면 가지 않는다
  it("로그인하지 않았으면 선택 완료를 눌러도 비교 화면으로 가지 않는다", async () => {
    session.signedIn = false;
    // 앞 테스트가 비교로 보낸 기록이 남아 있다
    push.mockClear();
    try {
      await renderWith("?q=퍼피&slot=1");

      fireEvent.click(await screen.findByRole("button", { name: /퍼피 성장기 사료/ }));
      fireEvent.click(screen.getByRole("button", { name: "선택 완료" }));

      expect(push).not.toHaveBeenCalledWith(expect.stringContaining("/compare"));
    } finally {
      session.signedIn = true;
    }
  });

  it("체크한 카드를 다시 누르면 선택이 풀리고 선택 완료가 다시 비활성된다", async () => {
    await renderWith("?q=퍼피&slot=1");

    const card = await screen.findByRole("button", { name: /퍼피 성장기 사료/ });
    fireEvent.click(card);
    expect(screen.getByRole("button", { name: "선택 완료" }).hasAttribute("disabled")).toBe(false);

    fireEvent.click(card);
    expect(screen.getByRole("button", { name: "선택 완료" }).hasAttribute("disabled")).toBe(true);
  });

  it("자리를 들고 검색어를 고치러 가도 자리를 잃지 않는다", async () => {
    await renderWith("?q=사료&slot=0");

    fireEvent.click(screen.getByRole("button", { name: /검색어 고치기/ }));

    expect(push).toHaveBeenCalledWith("/search?slot=0");
  });

  // 반대쪽 자리에 이미 있는 상품을 또 고르면 두 자리의 id가 겹쳐 React가 "두 자식이
  // 같은 key를 가졌다" 경고를 내고 CompareSlot이 뭉개지던 버그다(#245)
  it("반대쪽 자리에 이미 있는 상품은 고르는 목록에서 빠진다", async () => {
    await renderWith("?q=저지방&slot=0&other=2", [PUPPY_FOOD, SENIOR_FOOD]);

    await screen.findByRole("button", { name: /퍼피 성장기 사료/ });
    expect(screen.queryByRole("button", { name: /노령견 저지방 소화케어 사료/ })).toBeNull();
  });

  it("상세에서 고른 첫 상품을 선택 완료와 검색어 수정에도 유지한다", async () => {
    await renderWith("?q=퍼피&slot=1&from=detail&first=123");

    fireEvent.click(await screen.findByRole("button", { name: /퍼피 성장기 사료/ }));
    fireEvent.click(screen.getByRole("button", { name: "선택 완료" }));
    expect(push).toHaveBeenCalledWith("/compare?slot=1&product=4&from=detail&first=123");

    fireEvent.click(screen.getByRole("button", { name: /검색어 고치기/ }));
    expect(push).toHaveBeenCalledWith("/search?slot=1&from=detail&first=123");
  });

  // 일반 검색은 적합도 대신 찜하기를 보여준다(2396-80432). 찜 여부는 전체 찜 목록에서 온다 (#483)
  it("그냥 검색하러 왔으면 찜하기가 보이고 찜한 상품은 눌린 하트다", async () => {
    wished.ids = new Set([4]);
    await renderWith("?q=사료", [PUPPY_FOOD, SENIOR_FOOD]);

    const puppy = await screen.findByRole("button", { name: /퍼피 성장기 사료 1kg 찜하기/ });
    expect(puppy.getAttribute("aria-pressed")).toBe("true");
    const senior = screen.getByRole("button", { name: /노령견 저지방 소화케어 사료 1kg 찜하기/ });
    expect(senior.getAttribute("aria-pressed")).toBe("false");
    wished.ids = new Set();
  });

  // 화면 안 상태로 두던 동안 새로고침하면 사라지고 좋아요 탭에도 뜨지 않았다 (#483)
  it("하트를 누르면 그 상품의 찜을 서버에서 뒤집는다", async () => {
    await renderWith("?q=퍼피");

    fireEvent.click(await screen.findByRole("button", { name: /퍼피 성장기 사료 1kg 찜하기/ }));

    // 정가가 없는 상품은 찜 응답처럼 판매가로 채워 좋아요 탭 목록에 먼저 넣는다
    expect(toggle).toHaveBeenCalledWith(4, true, {
      productId: 4,
      name: "퍼피 성장기 사료 1kg",
      thumbnailUrl: null,
      price: 21000,
      originalPrice: 21000,
    });
  });

  // 비교 자리를 채우러 왔으면 체크만 하면 되니 카드가 이름·가격만 보인다(1117-6424) —
  // 할인율·별점·찜하기 같은 판단 재료는 일반 검색에서만 쓰인다
  it("비교할 자리를 채우러 왔으면 찜하기·별점·단가 없이 이름과 가격만 보인다", async () => {
    await renderWith("?q=퍼피&slot=1");

    await screen.findByText("퍼피 성장기 사료 1kg");
    expect(screen.queryByRole("button", { name: /찜하기/ })).toBeNull();
    expect(screen.queryByText(/당 약/)).toBeNull();
    expect(screen.getByText("21,000원")).toBeDefined();
  });

  // SENIOR_FOOD는 27,200 / 31,900이다. 서버가 준 15%와 버림 계산 14%가 갈린다
  it("그냥 검색하러 왔으면 취소선 정가와 서버 할인율이 보인다", async () => {
    await renderWith("?q=저지방", [SENIOR_FOOD]);

    expect(await screen.findByText("31,900원")).toBeDefined();
    expect(screen.getByText("15%")).toBeDefined();
    expect(screen.queryByText("14%")).toBeNull();
  });

  it("비교할 자리를 채우러 왔으면 할인 중인 상품도 정가·할인율 없이 보인다", async () => {
    const { container } = await renderWith("?q=저지방&slot=1", [SENIOR_FOOD]);

    await screen.findByText("노령견 저지방 소화케어 사료 1kg");
    expect(screen.getByText("27,200원")).toBeDefined();
    expect(screen.queryByText("31,900원")).toBeNull();
    expect(screen.queryByText("15%")).toBeNull();
    expect(container.querySelector(".line-through")).toBeNull();
  });

  /**
   * **바깥에 경계를 씌워 보지 않는다.** 전에는 이 테스트가 스스로 `ErrorBoundary`를 세우고
   * 친절한 대체 화면을 단정해, 실제 트리에 없는 경계를 전제하고 통과했다 — 그동안 배포된
   * 화면은 전역 `app/error.tsx`가 머리말째 덮어 눌러 갈 링크가 하나도 없었다 (#620).
   * 이제 화면이 제 경계를 들고 있으므로 그대로 그려서 본다.
   */
  describe("서버 조회가 실패하면", () => {
    /** 거절된 promise를 넘겨 그대로 그린다. 이유를 아무도 안 잡으면 Node가 시끄러워져 미리 삼킨다 */
    async function renderFailed() {
      const rejected = Promise.reject(new Error("네트워크 오류"));
      rejected.catch(() => {});

      await act(async () => {
        render(
          <NuqsTestingAdapter searchParams="?q=사료">
            <SearchResultView resultsPromise={rejected} resultsQuery={QUERY} />
          </NuqsTestingAdapter>,
        );
      });
    }

    it("결과 칸만 실패 안내로 바뀌고 머리말과 하단 이동 줄은 남는다", async () => {
      await renderFailed();

      expect(await screen.findByRole("alert")).toBeDefined();
      expect(screen.getByText("잠시 문제가 생겼어요. 다시 시도해 주세요.")).toBeDefined();

      // 이것이 이 테스트가 막는 회귀다 — 검색어를 고치러 갈 검색바와 이동 줄이 남아야 한다
      expect(screen.getByRole("button", { name: /검색어 고치기/ })).toBeDefined();
      expect(screen.getByRole("heading", { name: "검색 결과" })).toBeDefined();
      expect(screen.getByRole("navigation")).toBeDefined();
    });

    // 일반 Promise를 `use()`로 읽으므로 경계만 리셋하면 같은 거절을 다시 읽어 그 자리에서 또 실패한다.
    // 서버가 새로 그려 준 Promise는 `resetKeys`가 알아보고 경계를 스스로 푼다 (#289와 같은 처리)
    it("다시 시도는 경계 리셋이 아니라 서버 재조회를 부른다", async () => {
      refresh.mockClear();
      await renderFailed();

      fireEvent.click(await screen.findByRole("button", { name: "다시 시도" }));

      expect(refresh).toHaveBeenCalledOnce();
    });
  });

  // 모르는 채로 누르면 토글이라 이미 찜한 상품의 찜이 서버에서 지워진다 (#493 리뷰)
  it("찜 목록을 받는 동안은 하트를 누를 수 없다", async () => {
    toggle.mockClear();
    wished.loading = true;
    await renderWith("?q=퍼피");

    const heart = await screen.findByRole("button", { name: /퍼피 성장기 사료 1kg 찜하기/ });
    expect(heart).toHaveProperty("disabled", true);
    fireEvent.click(heart);
    expect(toggle).not.toHaveBeenCalled();
    wished.loading = false;
  });
});

// 첫 20개만 그리던 동안 "총 200개" 아래 카드가 20개에서 끝났다(QA SR-014, #532).
// 목록 끝을 지켜보는 관찰자는 jsdom에 없어, 끝이 화면에 들어오는 순간을 직접 흉내 낸다
describe("SearchResultView 다음 쪽 이어 받기", () => {
  const observers = new Set<(entries: { isIntersecting: boolean }[]) => void>();

  beforeEach(() => {
    observers.clear();
    vi.stubGlobal(
      "IntersectionObserver",
      class {
        private readonly callback: (entries: { isIntersecting: boolean }[]) => void;
        constructor(callback: (entries: { isIntersecting: boolean }[]) => void) {
          this.callback = callback;
        }
        observe() {
          observers.add(this.callback);
        }
        unobserve() {}
        // 관찰을 끊은 뒤엔 부르지 않는다. 브라우저도 끊긴 관찰자에겐 알리지 않는다
        disconnect() {
          observers.delete(this.callback);
        }
      },
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  async function scrollToEnd() {
    await act(async () => {
      for (const callback of [...observers]) {
        callback([{ isIntersecting: true }]);
      }
    });
  }

  /** 서버 응답 모양(`ProductCardResponse`)의 SENIOR_FOOD */
  const SENIOR_FOOD_RESPONSE = {
    productId: 2,
    thumbnailUrl: null,
    productName: "노령견 저지방 소화케어 사료 1kg",
    discountRate: 15,
    price: 27200,
    originalPrice: 31900,
    unitPrice: 27,
    unitLabel: "g",
    avgRating: 4.5,
    reviewCount: 108,
  };

  /** 서버는 다음 쪽에서 개수를 세지 않고 null을 준다 */
  const LAST_PAGE = {
    items: [SENIOR_FOOD_RESPONSE],
    nextCursor: null,
    hasNext: false,
    totalCount: null,
  };

  /** 두 개 중 첫 쪽 하나만 받은 상태 */
  const FIRST_PAGE: ProductSearchResult = {
    items: [PUPPY_FOOD],
    totalCount: 2,
    nextCursor: "page-2",
    hasNext: true,
  };

  function view(search: string, first: ProductSearchResult, query = QUERY) {
    return (
      <NuqsTestingAdapter searchParams={search}>
        <SearchResultView resultsPromise={Promise.resolve(first)} resultsQuery={query} />
      </NuqsTestingAdapter>
    );
  }

  it("목록 끝에 닿으면 다음 쪽을 이어 붙여 총 개수만큼 보이고, 개수는 바뀌지 않는다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(LAST_PAGE)));
    await act(async () => {
      render(view("?q=사료", FIRST_PAGE));
    });
    expect(await screen.findByText("총 2개")).toBeDefined();

    await scrollToEnd();

    expect(await screen.findByText("노령견 저지방 소화케어 사료 1kg")).toBeDefined();
    expect(screen.getByText("퍼피 성장기 사료 1kg")).toBeDefined();
    expect(screen.getByText("총 2개")).toBeDefined();
  });

  // 정렬을 고르면 URL이 서버의 새 첫 쪽보다 먼저 바뀐다. 그 사이 이전 목록의 커서를 새 정렬로
  // 보내면 서버가 커서를 거절한다(커서에 정렬이 새겨져 있다)
  it("다음 쪽은 URL의 정렬이 아니라 첫 쪽을 부른 정렬로 부른다", async () => {
    const fetchMock = vi.fn().mockResolvedValue(Response.json(LAST_PAGE));
    vi.stubGlobal("fetch", fetchMock);
    await act(async () => {
      render(view("?q=사료&sort=price-low", FIRST_PAGE, { keyword: "사료", sort: "RECOMMEND" }));
    });
    await screen.findByText("총 2개");

    await scrollToEnd();

    await screen.findByText("노령견 저지방 소화케어 사료 1kg");
    const url = String(fetchMock.mock.calls[0]?.[0]);
    expect(url).toContain("sort=RECOMMEND");
    expect(url).toContain("cursor=page-2");
  });

  it("검색어·정렬이 바뀌면 이어 받은 목록을 버리고 새 첫 쪽부터 그린다", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json(LAST_PAGE)));
    let rendered: ReturnType<typeof render>;
    await act(async () => {
      rendered = render(view("?q=사료", FIRST_PAGE));
    });
    await scrollToEnd();
    await screen.findByText("노령견 저지방 소화케어 사료 1kg");

    // 서버가 높은 가격순으로 새로 센 첫 쪽이다. 이전 정렬로 이어 붙인 퍼피 사료가 남으면 안 된다
    await act(async () => {
      rendered.rerender(
        view("?q=사료&sort=price-high", toResult([SENIOR_FOOD]), {
          keyword: "사료",
          sort: "PRICE_DESC",
        }),
      );
    });

    await waitFor(() => expect(screen.queryByText("퍼피 성장기 사료 1kg")).toBeNull());
    expect(screen.getByText("노령견 저지방 소화케어 사료 1kg")).toBeDefined();
    expect(screen.getByText("총 1개")).toBeDefined();
  });

  it("다음 쪽을 못 받으면 받은 목록은 두고, 다시 시도를 누르면 이어 받는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValueOnce(Response.json({ code: "ERR" }, { status: 500 }))
        .mockResolvedValueOnce(Response.json(LAST_PAGE)),
    );
    await act(async () => {
      render(view("?q=사료", FIRST_PAGE));
    });
    await screen.findByText("총 2개");

    await scrollToEnd();

    const retry = await screen.findByRole("button", {
      name: "상품을 더 불러오지 못했어요. 다시 시도",
    });
    expect(screen.getByText("퍼피 성장기 사료 1kg")).toBeDefined();

    fireEvent.click(retry);

    expect(await screen.findByText("노령견 저지방 소화케어 사료 1kg")).toBeDefined();
    expect(screen.queryByRole("button", { name: /다시 시도/ })).toBeNull();
  });
});
