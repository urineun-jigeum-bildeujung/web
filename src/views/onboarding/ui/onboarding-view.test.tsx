// 온보딩 화면 테스트. 단계 이동과 다음 버튼 활성 조건을 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { resetDraftCache } from "../model/draft-storage";
import { OnboardingView } from "./onboarding-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));

beforeEach(() => {
  // 초안을 기기에 남기므로 앞 테스트가 뒤 테스트로 새어 나간다
  window.localStorage.clear();
  resetDraftCache();
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

// 확정본 도입부에는 버튼이 하나뿐이다. 섹션 메모도 "건너뛰기, 닫기 버튼 삭제"다.
// 이름을 짚어 없는지만 보면 다른 이름의 이탈 버튼이 생겨도 통과하므로 개수를 센다
test("도입부에는 프로필 입력하기 하나만 있다", () => {
  renderAt("");

  const buttons = screen.getAllByRole("button");
  expect(buttons).toHaveLength(1);
  expect(buttons[0].textContent).toBe("프로필 입력하기");
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

test("입력 단계 머리말에는 진행 표시만 있다", () => {
  renderAt("?step=detail");

  expect(screen.getByRole("progressbar", { name: "전체 3단계 중 2단계" })).toBeDefined();
  expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();
});

test("도입부에는 진행 표시가 없다", () => {
  renderAt("");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

// 확정본에는 건너뛰기도 닫기도 없다. 모달만 보면 다른 이탈 경로가 생겨도 통과하므로
// 머리말 버튼과 링크까지 함께 본다
test("입력 단계에는 온보딩을 떠나는 버튼도 링크도 없다", () => {
  const { container } = renderAt("?step=basic");

  // 이탈 확인 모달을 여는 곳이 없어 모달도 함께 사라졌다
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByText("프로필 작성을 그만둘까요?")).toBeNull();

  // 머리말에는 진행 표시만 남는다
  expect(container.querySelector("header")?.querySelectorAll("button")).toHaveLength(0);
  // 다른 화면으로 새는 링크도 없다
  expect(container.querySelectorAll("a")).toHaveLength(0);
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
