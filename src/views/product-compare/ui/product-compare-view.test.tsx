// 상품 비교 테스트. 자리가 비면 무엇이 달라지는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { expect, test, vi } from "vitest";

const { push } = vi.hoisted(() => ({ push: vi.fn() }));
const { showSnackbar } = vi.hoisted(() => ({ showSnackbar: vi.fn() }));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push, back: vi.fn() }),
  usePathname: () => "/compare",
}));

vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

import { ProductCompareView } from "./product-compare-view";

function renderView(search = "") {
  render(
    <NuqsTestingAdapter searchParams={search}>
      <ProductCompareView />
    </NuqsTestingAdapter>,
  );
}

test("두 자리가 차 있으면 비교표를 보여준다", () => {
  renderView();
  expect(screen.getByRole("table")).toBeDefined();
});

test("한 자리를 비우면 견줄 것이 없어 표가 사라진다", () => {
  renderView();

  fireEvent.click(screen.getAllByRole("button", { name: /비교에서 빼기/ })[0]);

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByText(/담아주세요/)).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
});

test("상품 상세에서 담아 온 경우 현재 상품만 첫 자리에 보여준다", () => {
  renderView("?slot=0&product=123&from=detail");

  expect(screen.getByText("면역 지원 영양제 90정")).toBeDefined();
  expect(screen.getByText("21,000원")).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
});

test("두 번째 상품을 고르러 갈 때 첫 상품 ID를 함께 전달한다", () => {
  renderView("?slot=0&product=123&from=detail");

  fireEvent.click(screen.getByRole("button", { name: "상품 추가하기" }));

  expect(push).toHaveBeenCalledWith("/search?slot=1&from=detail&first=123");
});

test("검색에서 두 번째 상품을 고르고 돌아와도 상세 상품이 첫 자리에 남는다", () => {
  renderView("?slot=1&product=4&from=detail&first=123");

  expect(screen.getByText("면역 지원 영양제 90정")).toBeDefined();
  expect(screen.getByText("퍼피 성장기 사료 1kg")).toBeDefined();
  expect(screen.queryByText("중소형견 소포장 사료 1kg")).toBeNull();
});

// 검색에서 돌아왔을 때 반대쪽 자리를 항상 MOCK_PRODUCTS 기본값(2번)으로 되돌리던 버그.
// 자리 1이 실제로는 8번인데 자리 0에서 그 기본값과 같은 2번을 고르면, 두 자리가
// 우연히 같은 id("2")를 가져 React가 "두 자식이 같은 key를 가졌다"는 경고를 내고
// CompareSlot이 하나로 뭉개졌다(#245)
test("반대쪽 자리가 검색 기본값과 겹쳐도 각 자리를 실제 값대로 되살린다", () => {
  const consoleError = vi.spyOn(console, "error").mockImplementation(() => {});

  renderView("?slot=0&product=2&other=8");

  expect(screen.getByText("노령견 저지방 소화케어 사료 1kg")).toBeDefined();
  expect(screen.getByText("관절 건강 영양제 60정")).toBeDefined();
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
test("product와 other가 같은 id면 반대쪽 자리를 비운다", () => {
  renderView("?slot=0&product=1&other=1");

  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
  expect(screen.getAllByText("중소형견 소포장 사료 1kg")).toHaveLength(1);
});

// 자리를 비우고 검색을 한 바퀴 돌고 와도 비운 자리가 화면 확인용 기본값으로
// 되살아나지 않아야 한다. "other" 자체가 없는 것과 구분하려고 "none"을 쓴다
test("두 자리를 다 비우고 검색에 가면 other가 none으로 담긴다", () => {
  renderView();

  fireEvent.click(screen.getAllByRole("button", { name: /비교에서 빼기/ })[0]);
  fireEvent.click(screen.getByRole("button", { name: /비교에서 빼기/ }));
  fireEvent.click(screen.getAllByRole("button", { name: "상품 추가하기" })[0]);

  expect(push).toHaveBeenCalledWith("/search?slot=0&other=none");
});

test("other가 none이면 그 자리를 비운 채로 되살린다", () => {
  renderView("?slot=1&product=8&other=none");

  expect(screen.getByText("관절 건강 영양제 60정")).toBeDefined();
  expect(screen.getByRole("button", { name: "상품 추가하기" })).toBeDefined();
  expect(screen.queryByRole("table")).toBeNull();
});

// 상세 상품(면역 지원 영양제)은 supplement라, 검색에서 같은 종류를 고를 수 있어야
// 비교표가 뜬다. 고를 수 있는 게 없으면 상세→비교 흐름이 늘 안내만 보고 끝난다
test("상세에서 온 상품과 같은 종류를 고르면 비교표가 뜬다", () => {
  renderView("?slot=1&product=8&from=detail&first=123");

  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.queryByText(/건식은 건식끼리/)).toBeNull();
});

// 시안 comp_001_에러. 사료와 간식은 10g당 가격도 칼로리도 기준이 달라 견줄 수 없다
test("종류가 다른 둘을 담으면 표 대신 안내가 나온다", () => {
  // 자리 1에 간식(저자극 덴탈껌)을 담는다. 자리 0은 사료(1번)로 명시한다 —
  // other 없이는 반대쪽이 더는 자동으로 채워지지 않는다(#245)
  renderView("?slot=1&product=5&other=1");

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByText(/건식은 건식끼리/)).toBeDefined();
});

// MOCK_ROWS는 정확히 1번·2번 조합의 실제 값으로 쓴 것이다. 이 조합일 때만 표를 보인다
test("실제 값이 있는 조합(1·2번)은 표가 그대로 보인다", () => {
  renderView("?slot=1&product=2&other=1");

  expect(screen.getByRole("table")).toBeDefined();
  expect(screen.queryByText(/건식은 건식끼리/)).toBeNull();
});

// 자리에 반대 순서로 담기면(2번이 첫 자리) 값도 같이 뒤집어야 한다. 안 뒤집으면
// 화면엔 2번 이름 옆에 1번 값이 붙어 값의 주인이 바뀐다
test("반대 순서로 담아도 값이 그 상품 것으로 붙는다", () => {
  renderView("?slot=0&product=2&other=1");

  const priceRow = screen.getByRole("row", { name: /10g당 가격/ });
  // 원래 값은 (150원, 176원)이 (1번, 2번) 순인데, 여기선 2번이 첫 자리라 176원이 앞에 와야 한다
  expect(priceRow.textContent).toMatch(/176원.*10g당 가격.*150원/);
});

// food는 1·2번 말고도 3·4·7번이 있다. 같은 종류라도 MOCK_ROWS는 1·2번 값이라
// 다른 조합에 그대로 붙이면 고르지도 않은 상품의 스펙을 보여주게 된다(#245 후속)
test("같은 종류라도 실제 값이 없는 조합은 표 대신 준비 중 안내가 나온다", () => {
  renderView("?slot=1&product=3&other=1");

  expect(screen.queryByRole("table")).toBeNull();
  expect(screen.getByText(/아직 준비 중/)).toBeDefined();
  // 종류가 달라서가 아니라 값이 없어서라, 종류 안내 문구와는 다르다
  expect(screen.queryByText(/건식은 건식끼리/)).toBeNull();
});

// 점수가 갈리면 높은 쪽을 브랜드색·큰 글자로, 낮은 쪽을 회색·작은 글자로 강조한다
test("적합도가 높은 자리를 브랜드색으로 강조한다", () => {
  renderView();

  expect(screen.getByText("92점").className).toContain("text-text-body-brand-default");
  expect(screen.getByText("86점").className).toContain("text-text-body-unselect");
});

test("AI 맞춤 분석 콜아웃이 실제로 담긴 두 상품 이름으로 문장을 만든다", () => {
  renderView();

  expect(screen.getByText("맞춤 분석")).toBeDefined();
  expect(
    screen.getByText(
      "중소형견 소포장 사료 1kg이(가) 노령견 저지방 소화케어 사료 1kg보다 우리 아이에게 더 잘 맞아요.",
    ),
  ).toBeDefined();
});

test("종류가 달라 표가 안 뜨면 맞춤 분석도 뜨지 않는다", () => {
  renderView("?slot=1&product=5&other=1");

  expect(screen.queryByText("맞춤 분석")).toBeNull();
});

// 미측정(null)은 "비슷하다"가 아니라 "아직 모른다"다. 근거 없이 비슷하다고
// 단정하면 실제로는 한쪽이 크게 나을 수도 있는 상황을 감춘다
test("한쪽이 미측정이면 비슷하다고 하지 않고 아직 못 쟀다고 알린다", () => {
  renderView("?slot=1&product=7&other=1");

  expect(screen.getByText(/아직 적합도를 재지 못했어요/)).toBeDefined();
  expect(screen.queryByText(/비슷해요/)).toBeNull();
});

test("장바구니 추가를 누르면 담겼다고 알린다", () => {
  renderView();

  fireEvent.click(screen.getAllByRole("button", { name: "장바구니 추가" })[0]);

  expect(showSnackbar).toHaveBeenCalledWith("장바구니에 담겼어요");
});

// 헤더에 title·leading을 안 줘서 뒤로가기와 "상품비교" 제목이 통째로 빠져 있었다(1568-70276)
test("머리말에 뒤로가기와 제목이 있다", () => {
  renderView();

  expect(screen.getByRole("button", { name: "이전 화면으로" })).toBeDefined();
  expect(screen.getByRole("heading", { name: "상품비교" })).toBeDefined();
  expect(screen.getByRole("link", { name: "알림" }).getAttribute("href")).toBe(
    "/mypage/notifications",
  );
  expect(screen.getByRole("link", { name: "장바구니" }).getAttribute("href")).toBe("/cart");
});

test("하단 이동 줄에서 현재 화면을 알린다", () => {
  renderView();

  const current = screen.getByRole("link", { name: "상품비교" });
  expect(current.getAttribute("aria-current")).toBe("page");
});
