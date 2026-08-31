// 온보딩 화면 테스트. 단계 이동과 다음 버튼 활성 조건을 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { OnboardingView } from "./onboarding-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

beforeEach(() => {
  push.mockClear();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

function renderAt(search: string, children: ReactNode = <OnboardingView />) {
  return render(<NuqsTestingAdapter searchParams={search}>{children}</NuqsTestingAdapter>);
}

test("기본은 도입부를 보여준다", () => {
  renderAt("");
  expect(screen.getByRole("heading", { name: "딱 1분만 아이에 대해 알려주세요" })).toBeDefined();
});

test("건너뛰기를 누르면 홈으로 보낸다", () => {
  renderAt("");
  fireEvent.click(screen.getByRole("button", { name: "건너뛰기" }));
  expect(push).toHaveBeenCalledWith("/");
});

test("첫 입력 단계는 세 항목이 다 차야 다음으로 넘어갈 수 있다", () => {
  renderAt("?step=basic");

  const next = screen.getByRole("button", { name: "다음 단계 작성하기" });
  expect((next as HTMLButtonElement).disabled).toBe(true);

  fireEvent.change(screen.getByLabelText("아이의 이름을 알려주세요"), {
    target: { value: "코코" },
  });
  fireEvent.click(screen.getByText("남자아이"));
  expect((next as HTMLButtonElement).disabled).toBe(true);

  fireEvent.click(screen.getByText("했어요"));
  expect((next as HTMLButtonElement).disabled).toBe(false);
});

test("건강 단계는 해당 없음 체크만으로도 넘어갈 수 있다", () => {
  renderAt("?step=health");

  const next = screen.getByRole("button", { name: "다음 단계 작성하기" });
  expect((next as HTMLButtonElement).disabled).toBe(true);

  const [concern, allergy] = screen.getAllByRole("checkbox", { name: "해당 사항이 없어요" });
  fireEvent.click(concern);
  fireEvent.click(allergy);

  expect((next as HTMLButtonElement).disabled).toBe(false);
});

test("입력 단계에는 닫기 버튼과 진행 표시가 있다", () => {
  renderAt("?step=detail");

  expect(screen.getByRole("button", { name: "닫기" })).toBeDefined();
  expect(screen.getByRole("progressbar", { name: "전체 3단계 중 2단계" })).toBeDefined();
});

test("도입부에는 진행 표시가 없다", () => {
  renderAt("");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

test("닫기를 누르면 이탈 확인 모달이 뜬다", () => {
  renderAt("?step=basic");

  fireEvent.click(screen.getByRole("button", { name: "닫기" }));
  expect(screen.getByRole("alertdialog")).toBeDefined();
  expect(screen.getByText("프로필 작성을 그만둘까요?")).toBeDefined();
});

test("체구를 고르기 전에는 몸무게·체질 항목이 없다", () => {
  renderAt("?step=detail");

  // 시안 onbo_003_체구선택전에는 두 항목이 보이지 않는다
  expect(screen.queryByPlaceholderText("평균 몸무게 5kg")).toBeNull();
  expect(screen.queryByRole("slider")).toBeNull();
});

test("체구를 고르면 몸무게와 체질 항목이 나타난다", () => {
  renderAt("?step=detail");

  fireEvent.click(screen.getByText("소형견"));

  expect(screen.getByPlaceholderText("평균 몸무게 5kg")).toBeDefined();
  expect(screen.getByRole("slider")).toBeDefined();
  expect(screen.getByText("보통")).toBeDefined();
});
