// 남은 시간이 목록과 함께 움직이는지, 품절을 담을 수 없는지, 담긴 상태가 바뀌는지 본다.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

const { showSnackbar } = vi.hoisted(() => ({ showSnackbar: vi.fn() }));
vi.mock("@/shared/ui/snackbar/snackbar", () => ({ showSnackbar }));

import { DealsView } from "./deals-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <DealsView />
    </NuqsTestingAdapter>,
  );
}

describe("DealsView", () => {
  it("진행중 탭에 남은 시간과 딜 목록이 있다", () => {
    renderWith();

    expect(screen.getByText("종료까지 남은 시간")).toBeDefined();
    expect(screen.getByText("오리&고구마 소형견 사료 1.5kg")).toBeDefined();
  });

  it("썸네일·이름을 누르면 상품 상세로 가는 링크다", () => {
    renderWith();

    const link = screen.getByText("오리&고구마 소형견 사료 1.5kg").closest("a");
    expect(link?.getAttribute("href")).toBe("/products/d1");
  });

  it("품절인 딜은 담을 수 없다", () => {
    renderWith();

    const soldOut = screen.getByLabelText("황태 단호박 미니 큐브 20개입 품절");
    expect(soldOut.hasAttribute("disabled")).toBe(true);
  });

  it("담으면 그 딜이 담긴 것으로 바뀐다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기"));
    // 시트의 담기 버튼은 금액을 함께 읽힌다(기본 수량 1개 기준 목록가)
    fireEvent.click(screen.getByRole("button", { name: "24,000원 장바구니 담기" }));

    expect(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담김")).toBeDefined();
    expect(showSnackbar).toHaveBeenCalledWith("장바구니에 담겼어요");
  });

  it("이미 담긴 딜을 다시 누르면 시트를 열지 않고 바로 뺀다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기"));
    fireEvent.click(screen.getByRole("button", { name: "24,000원 장바구니 담기" }));
    expect(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담김")).toBeDefined();

    fireEvent.click(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담김"));

    expect(screen.getByLabelText("오리&고구마 소형견 사료 1.5kg 장바구니에 담기")).toBeDefined();
    expect(screen.queryByText("1.5kg (기본 구성)")).toBeNull();
  });

  it("수량을 올리면 담기 버튼의 금액도 오른다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 장바구니에 담기"));
    fireEvent.click(screen.getByLabelText("데일리 루테인 영양제 30정 수량 하나 늘리기"));

    expect(screen.getByRole("button", { name: "28,800원 장바구니 담기" })).toBeDefined();
  });

  it("오픈 예정 탭은 정각 시각을 '시'로 읽고 분은 적지 않는다", () => {
    renderWith("?tab=upcoming");

    expect(screen.getByText(/(오전|오후) \d+시에 봬요!/)).toBeDefined();
    expect(screen.queryByText(/:00/)).toBeNull();
  });

  it("오픈 예정 탭에서 알림을 신청하면 신청된 상태로 남고, 다시 누르면 취소된다", () => {
    renderWith("?tab=upcoming");

    fireEvent.click(screen.getByRole("button", { name: "오픈 알림 신청하기" }));

    expect(screen.getByText("오픈 알림 신청됨")).toBeDefined();
    expect(screen.queryByRole("button", { name: "오픈 알림 신청하기" })).toBeNull();
    // 취소할 수도 있으니 신청 후에도 남은 시간은 계속 보여준다
    expect(screen.getByText(/\d{2} : \d{2} : \d{2}/)).toBeDefined();

    fireEvent.click(screen.getByRole("button", { name: "오픈 알림 신청 취소하기" }));

    expect(screen.getByRole("button", { name: "오픈 알림 신청하기" })).toBeDefined();
    expect(screen.queryByText("오픈 알림 신청됨")).toBeNull();
  });

  describe("남은 시간이 다 되면", () => {
    beforeEach(() => {
      vi.useFakeTimers();
    });

    afterEach(() => {
      vi.useRealTimers();
    });

    it("목록 대신 비었다고 알린다", () => {
      renderWith();

      // 화면에 붙는 순간부터 11시간 28분 43초라 그만큼 넘긴다.
      // 타이머가 부르는 상태 갱신이라 act로 감싸야 화면에 반영된다
      act(() => {
        vi.advanceTimersByTime(12 * 3_600_000);
      });

      expect(screen.getByText("지금 진행 중인 타임딜이 없어요")).toBeDefined();
      expect(screen.queryByText("오리&고구마 소형견 사료 1.5kg")).toBeNull();
    });
  });
});
