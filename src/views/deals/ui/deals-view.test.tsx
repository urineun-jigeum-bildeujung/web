// 남은 시간이 목록과 함께 움직이는지, 품절을 담을 수 없는지, 알림 신청이 상태로 남는지 본다.
import { act, fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

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
    expect(screen.getByText("면역 지원 영양제 90정")).toBeDefined();
  });

  it("품절인 딜은 담을 수 없다", () => {
    renderWith();

    const soldOut = screen.getByLabelText("노령견 저지방 소화케어 사료 2kg 품절");
    expect(soldOut.hasAttribute("disabled")).toBe(true);
  });

  it("담으면 그 딜이 담긴 것으로 바뀐다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("면역 지원 영양제 90정 장바구니에 담기"));
    // 시트의 담기 버튼은 금액을 함께 읽힌다
    fireEvent.click(screen.getByRole("button", { name: "21,000원 장바구니 담기" }));

    expect(screen.getByLabelText("면역 지원 영양제 90정 장바구니에 담김")).toBeDefined();
  });

  it("수량을 올리면 담기 버튼의 금액도 오른다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("닭가슴살 저염 트릿 200g 장바구니에 담기"));
    fireEvent.click(screen.getByLabelText("닭가슴살 저염 트릿 200g 수량 하나 늘리기"));

    expect(screen.getByRole("button", { name: "19,500원 장바구니 담기" })).toBeDefined();
  });

  it("오픈 예정 탭에서 알림을 신청하면 신청된 상태로 남는다", () => {
    renderWith("?tab=upcoming");

    fireEvent.click(screen.getByRole("button", { name: "오픈 알림 신청하기" }));

    // 누를 것이 없어졌으니 버튼이 아니라 상태로 남는다
    expect(screen.getByRole("status").textContent).toContain("오픈 알림 신청됨");
    expect(screen.queryByRole("button", { name: /오픈 알림/ })).toBeNull();
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

      expect(screen.getByText("지금은 진행 중인 타임딜이 없어요")).toBeDefined();
      expect(screen.queryByText("면역 지원 영양제 90정")).toBeNull();
    });
  });
});
