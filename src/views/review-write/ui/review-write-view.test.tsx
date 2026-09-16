// 무엇을 다 채워야 넘어가고 등록되는지, 아이의 반응을 실제로 받는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { ReviewWriteView } from "./review-write-view";

function renderAt(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <ReviewWriteView orderItemId="oi1" />
    </NuqsTestingAdapter>,
  );
}

/** 같은 이름의 보기가 여러 묶음에 있어 묶음을 먼저 좁힌다 */
function pick(group: string, option: string) {
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: group })).getByRole("radio", { name: option }),
  );
}

/** 1단계 필수(별점·사용 기간)를 채우고 2단계로 넘어간다 */
function goToDetail() {
  fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
  fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
  fireEvent.click(screen.getByRole("button", { name: "다음" }));
}

/** 2단계에서 필수를 다 채운다. skipPet이면 아이만 비워 둔다 */
function fillDetail({ skipPet = false } = {}) {
  if (!skipPet) fireEvent.click(screen.getByRole("radio", { name: "소리" }));
  fireEvent.change(screen.getByLabelText("후기"), {
    target: { value: "확실히 예전보다 계단 오를 때 덜 힘들어해요" },
  });
}

describe("ReviewWriteView 1단계", () => {
  it("별점 말고 아이의 반응도 함께 묻고, 반응은 선택이다", () => {
    renderAt();

    for (const question of [
      "잘 먹었나요?",
      "배변 상태는 어땠나요?",
      "피부 · 털 상태는 어땠나요?",
      "체중 · 활력은 어땠나요?",
      "알러지 반응이 있었나요?",
    ]) {
      expect(screen.getByRole("radiogroup", { name: question })).toBeDefined();
    }
    expect(screen.getAllByText("선택").length).toBeGreaterThan(0);
  });

  it("별점과 사용 기간을 채워야 다음으로 간다", () => {
    renderAt();

    const next = screen.getByRole("button", { name: "다음" });
    expect(next.hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
    expect(next.hasAttribute("disabled")).toBe(true);

    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
    expect(next.hasAttribute("disabled")).toBe(false);
  });

  it("별은 반 개 단위로 매기고 화살표 키로 반 개씩 옮긴다", () => {
    renderAt();

    const half = screen.getByRole("radio", { name: "5점 만점에 3.5점" });
    fireEvent.click(half);
    expect(half.getAttribute("aria-checked")).toBe("true");

    fireEvent.keyDown(half, { key: "ArrowRight" });
    // 초점이 뒤처지면 다음 화살표가 엉뚱한 데서 출발한다
    expect(document.activeElement).toBe(screen.getByRole("radio", { name: "5점 만점에 4점" }));
  });

  it("사용 기간에는 숫자만 남는다", () => {
    renderAt();

    const days = screen.getByLabelText("사용 기간") as HTMLInputElement;
    fireEvent.change(days, { target: { value: "1a6" } });

    expect(days.value).toBe("16");
  });
});

describe("ReviewWriteView 2단계", () => {
  it("1단계에서 답한 문항만 요약 카드에 배지로 보인다", () => {
    renderAt();
    fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4.5점" }));
    fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "7" } });
    pick("잘 먹었나요?", "보통이에요");
    pick("배변 상태는 어땠나요?", "좋아졌어요");
    fireEvent.click(screen.getByRole("button", { name: "다음" }));

    // "보통이에요"는 2단계의 급여 편의성 보기에도 있어 요약 카드 안에서 찾는다
    const card = screen.getByText("7일째 사용 중").parentElement as HTMLElement;
    expect(within(card).getByText("5점 만점에 4.5점")).toBeDefined();
    expect(within(card).getByText("보통이에요")).toBeDefined();
    expect(within(card).getByText("좋아졌어요")).toBeDefined();
    // 안 답한 피부·모질은 배지가 없다
    expect(within(card).queryByText(/피부/)).toBeNull();
  });

  it("어느 아이가 먹었는지 빠지면 등록할 수 없다", () => {
    renderAt();
    goToDetail();
    // 아이를 모르면 그 답을 다음 추천에 쓸 수 없다
    fillDetail({ skipPet: true });

    expect(screen.getByRole("button", { name: "등록하기" }).hasAttribute("disabled")).toBe(true);

    fireEvent.click(screen.getByRole("radio", { name: "소리" }));
    expect(screen.getByRole("button", { name: "등록하기" }).hasAttribute("disabled")).toBe(false);
  });

  it("후기가 열 자에 못 미치면 등록할 수 없다", () => {
    renderAt();
    goToDetail();
    fillDetail();

    fireEvent.change(screen.getByLabelText("후기"), { target: { value: "좋아요" } });

    expect(screen.getByRole("button", { name: "등록하기" }).hasAttribute("disabled")).toBe(true);
  });

  it("등록하면 고마움을 전하고 확인이 작성한 리뷰 목록으로 이어진다", () => {
    renderAt();
    goToDetail();
    fillDetail();

    fireEvent.click(screen.getByRole("button", { name: "등록하기" }));

    expect(screen.getByText("소중한 리뷰 감사해요!")).toBeDefined();
    expect(screen.getByRole("link", { name: "확인" }).getAttribute("href")).toBe(
      "/mypage/reviews?tab=written",
    );
  });
});
