// 서버가 준 결과를 그대로 그리는지, 걸리는 게 없을 때 무엇을 보이는지, 검색바가
// 어디로 보내는지 본다. 검색어로 거르고 정렬하는 건 서버 책임이라 여기서 다시 보지 않는다
// (entities/product/api/products.test.ts가 요청 파라미터 조립을 본다).
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { ErrorBoundary } from "react-error-boundary";
import { describe, expect, it, vi } from "vitest";

import type { ProductCard, ProductSearchResult } from "@/entities/product";

const push = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/search/result",
}));

import { SearchResultView } from "./search-result-view";

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

function toResult(items: ProductCard[]): ProductSearchResult {
  return { items, totalCount: items.length, nextCursor: null, hasNext: false };
}

// `use()`가 첫 렌더에서 항상 한 번 suspend했다가 promise가 풀리면 다시 그린다 — 이미
// resolve된 promise를 넘겨도 마찬가지라, act()로 감싸 그 재렌더까지 기다리고 반환한다
async function renderWith(search: string, items: ProductCard[] = [PUPPY_FOOD]) {
  let result: ReturnType<typeof render>;
  await act(async () => {
    result = render(
      <NuqsTestingAdapter searchParams={search}>
        <SearchResultView resultsPromise={Promise.resolve(toResult(items))} />
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

  // 일반 검색은 적합도 대신 찜하기를 보여준다(2396-80432)
  it("그냥 검색하러 왔으면 찜하기가 보이고 찜하면 눌린 채로 바뀐다", async () => {
    await renderWith("?q=퍼피");

    const like = await screen.findByRole("button", { name: /퍼피 성장기 사료 1kg 찜하기/ });
    expect(like.getAttribute("aria-pressed")).toBe("false");

    fireEvent.click(like);
    expect(like.getAttribute("aria-pressed")).toBe("true");
  });

  // 비교 자리를 채우러 왔으면 체크만 하면 되니 카드가 이름·가격만 보인다(1117-6424) —
  // 할인율·별점·찜하기 같은 판단 재료는 일반 검색에서만 쓰인다
  it("비교할 자리를 채우러 왔으면 찜하기·별점·단가 없이 이름과 가격만 보인다", async () => {
    await renderWith("?q=퍼피&slot=1");

    await screen.findByText("퍼피 성장기 사료 1kg");
    expect(screen.queryByRole("button", { name: /찜하기/ })).toBeNull();
    expect(screen.queryByText(/1kg당/)).toBeNull();
    expect(screen.getByText("21,000원")).toBeDefined();
  });

  it("서버 조회가 실패하면 렌더 중 오류로 던져 바깥 경계가 잡는다", async () => {
    const onError = vi.fn();
    // 던지는 이유(rejection reason)를 아무도 안 잡으면 Node가 unhandledRejection으로
    // 시끄러워진다 — ErrorBoundary가 결국 잡아줄 것이므로 여기서는 무시해도 되는 잡음이다
    const rejected = Promise.reject(new Error("네트워크 오류"));
    rejected.catch(() => {});

    await act(async () => {
      render(
        <NuqsTestingAdapter searchParams="?q=사료">
          <ErrorBoundary onError={onError} fallbackRender={() => <p>문제가 생겼어요</p>}>
            <SearchResultView resultsPromise={rejected} />
          </ErrorBoundary>
        </NuqsTestingAdapter>,
      );
    });

    expect(await screen.findByText("문제가 생겼어요")).toBeDefined();
    expect(onError).toHaveBeenCalled();
  });
});
