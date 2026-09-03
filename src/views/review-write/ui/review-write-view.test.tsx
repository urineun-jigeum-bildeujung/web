// 무엇을 다 채워야 등록되는지, 아이의 반응을 실제로 받는지 본다.
import { fireEvent, render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { ReviewWriteView } from "./review-write-view";

/** 같은 이름의 보기가 여러 묶음에 있어 묶음을 먼저 좁힌다 */
function pick(group: string, option: string) {
  fireEvent.click(
    within(screen.getByRole("radiogroup", { name: group })).getByRole("radio", { name: option }),
  );
}

/** 시안이 묻는 것을 다 채운다. skipPet이면 아이만 비워 둔다 */
function fillAll({ skipPet = false } = {}) {
  fireEvent.click(screen.getByRole("radio", { name: "5점 만점에 4점" }));
  fireEvent.change(screen.getByLabelText("사용 기간"), { target: { value: "16" } });
  // "보통이에요"가 기호성과 급여 편의성 양쪽에 있어 묶음 안에서 고른다
  pick("기호성 — 잘 먹었나요?", "잘 먹어요");
  pick("소화 반응 — 아이 배변 상태는 어땠나요?", "좋아졌어요");
  pick("급여 편의성(정제 크기 등) — 아이에게 급여하기 편했나요?", "보통이에요");
  if (!skipPet) fireEvent.click(screen.getByRole("radio", { name: "소리" }));
  fireEvent.change(screen.getByLabelText("다른 보호자에게 도움이 되는 후기"), {
    target: { value: "확실히 예전보다 계단 오를 때 덜 힘들어해요" },
  });
}

describe("ReviewWriteView", () => {
  it("별점 말고 아이의 반응도 함께 묻는다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);

    expect(screen.getByText("기호성 — 잘 먹었나요?")).toBeDefined();
    expect(screen.getByText("소화 반응 — 아이 배변 상태는 어땠나요?")).toBeDefined();
    expect(
      screen.getByText("급여 편의성(정제 크기 등) — 아이에게 급여하기 편했나요?"),
    ).toBeDefined();
  });

  it("처음에는 등록할 수 없다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);

    expect(screen.getByRole("button", { name: "리뷰 등록하기" }).hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("어느 아이가 먹었는지 빠지면 등록할 수 없다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);
    // 아이를 모르면 그 답을 다음 추천에 쓸 수 없다
    fillAll({ skipPet: true });

    expect(screen.getByRole("button", { name: "리뷰 등록하기" }).hasAttribute("disabled")).toBe(
      true,
    );

    fireEvent.click(screen.getByRole("radio", { name: "소리" }));
    expect(screen.getByRole("button", { name: "리뷰 등록하기" }).hasAttribute("disabled")).toBe(
      false,
    );
  });

  it("후기가 열 자에 못 미치면 등록할 수 없다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);
    fillAll();

    fireEvent.change(screen.getByLabelText("다른 보호자에게 도움이 되는 후기"), {
      target: { value: "좋아요" },
    });

    expect(screen.getByRole("button", { name: "리뷰 등록하기" }).hasAttribute("disabled")).toBe(
      true,
    );
  });

  it("등록하면 어느 아이의 후기인지 짚어 고마움을 전한다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);
    fillAll();

    fireEvent.click(screen.getByRole("button", { name: "리뷰 등록하기" }));

    expect(screen.getByText("소중한 리뷰 감사해요!")).toBeDefined();
    // 받침 없는 이름이라 "소리가"다
    expect(screen.getByText(/소리가 어땠는지/)).toBeDefined();
  });

  it("사용 기간에는 숫자만 남는다", () => {
    render(<ReviewWriteView orderItemId="oi1" />);

    const days = screen.getByLabelText("사용 기간") as HTMLInputElement;
    fireEvent.change(days, { target: { value: "1a6" } });

    expect(days.value).toBe("16");
  });
});
