// 전체 동의가 하위를 켜는지, 필수를 채워야 넘어가는지, 설명을 눌러도 체크가 안 바뀌는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { describe, expect, it, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ push: vi.fn(), back: vi.fn() }) }));

import { SignupView } from "./signup-view";

function renderWith(search = "") {
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <SignupView />
    </NuqsTestingAdapter>,
  );
}

describe("SignupView", () => {
  it("처음에는 다음으로 갈 수 없다", () => {
    renderWith();

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);
  });

  it("필수 전체 동의를 누르면 하위가 한꺼번에 체크된다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));

    expect(screen.getByLabelText("만 14세 이상입니다.").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByLabelText("서비스 이용약관 동의").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByLabelText("개인정보 수집 및 이용 동의").getAttribute("aria-checked")).toBe(
      "true",
    );
    // 선택 항목까지 켜지지는 않는다
    expect(
      screen.getByLabelText("맞춤 혜택 및 이벤트 알림 수신 동의").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("필수를 다 채우면 다음으로 갈 수 있다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(false);
  });

  it("선택만 채우면 다음으로 갈 수 없다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[선택] 서비스 이용약관 전체 동의"));

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);
  });

  it("하나를 풀면 전체 동의도 함께 풀린다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));
    fireEvent.click(screen.getByLabelText("만 14세 이상입니다."));

    expect(
      screen.getByLabelText("[필수] 서비스 이용약관 전체 동의").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("설명 문구를 눌러도 체크가 바뀌지 않는다", () => {
    renderWith();

    // 시안이 "체크에 영향 없는 터치 영역"으로 표시해 둔 자리다
    fireEvent.click(screen.getByText("아이의 건강 데이터 활용을 위해 꼭 필요해요"));

    expect(screen.getByLabelText("개인정보 수집 및 이용 동의").getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("약관 항목에서 본문으로 갈 수 있다", () => {
    renderWith();

    expect(
      screen.getByRole("link", { name: "서비스 이용약관 동의 본문 보기" }).getAttribute("href"),
    ).toBe("/mypage/service/terms");
  });

  it("닉네임 단계에서는 두 자 미만이면 넘어갈 수 없다", () => {
    renderWith("?step=nickname");

    const input = screen.getByLabelText("닉네임");
    fireEvent.change(input, { target: { value: "가" } });

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);
  });
});
