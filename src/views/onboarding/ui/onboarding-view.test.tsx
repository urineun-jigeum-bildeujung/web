// 온보딩 화면 테스트. 단계 이동과 다음 버튼 활성 조건을 검증한다.
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { fireEvent, render, screen } from "@testing-library/react";
import type { ComponentProps, ReactNode } from "react";
import { beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

import { resetDraftCache } from "../model/draft-storage";
import { OnboardingView } from "./onboarding-view";

const push = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ push, back: vi.fn() }) }));
// 도입부 목업 이미지. jsdom에는 이미지 최적화가 없어 img로 대신한다
type MockImageProps = ComponentProps<"img"> & { fill?: boolean; priority?: boolean };
vi.mock("next/image", () => ({
  default: ({ fill, priority, alt, ...props }: MockImageProps) => {
    // fill·priority는 next/image 전용이라 img에 넘기면 경고가 난다
    void fill;
    void priority;
    // eslint-disable-next-line @next/next/no-img-element
    return <img alt={alt} {...props} />;
  },
}));

beforeEach(() => {
  // 초안을 기기에 남기므로 앞 테스트가 뒤 테스트로 새어 나간다
  window.localStorage.clear();
  resetDraftCache();
  push.mockClear();
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

function renderAt(search: string, children: ReactNode = <OnboardingView />) {
  // 품종 단계가 서버에서 목록을 받는다(#226). Provider가 없으면 그 단계 렌더에서 죽는다
  return render(<NuqsTestingAdapter searchParams={search}>{children}</NuqsTestingAdapter>, {
    wrapper: createQueryWrapper(),
  });
}

test("기본은 도입부를 보여준다", () => {
  renderAt("");
  expect(screen.getByRole("heading", { name: "딱 1분만 아이에 대해 알려주세요" })).toBeDefined();
});

// 시안 도입부에는 버튼이 하나뿐이다. 섹션 메모도 "건너뛰기, 닫기 버튼 삭제"다.
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

// 시안 onbo_002가 첫 단계의 "이전"을 비활성으로 그린다. 도입부로 돌아가는 길은 없다
test("첫 입력 단계의 이전은 잠겨 있다", () => {
  renderAt("?step=basic");
  expect((screen.getByRole("button", { name: "이전" }) as HTMLButtonElement).disabled).toBe(true);
});

test("건강 단계는 해당 없음 체크만으로도 넘어갈 수 있다", () => {
  renderAt("?step=health");

  const next = screen.getByRole("button", { name: "작성 완료" });
  expect((next as HTMLButtonElement).disabled).toBe(true);

  const [concern, allergy] = screen.getAllByRole("checkbox", { name: "해당 사항이 없어요" });
  fireEvent.click(concern);
  fireEvent.click(allergy);

  expect((next as HTMLButtonElement).disabled).toBe(false);
});

test("입력 단계 위에는 진행 표시만 있고 머리말은 없다", () => {
  const { container } = renderAt("?step=detail");

  expect(screen.getByRole("progressbar", { name: "전체 3단계 중 2단계" })).toBeDefined();
  expect(container.querySelector("header")).toBeNull();
  expect(screen.queryByRole("button", { name: "닫기" })).toBeNull();
});

test("도입부에는 진행 표시가 없다", () => {
  renderAt("");
  expect(screen.queryByRole("progressbar")).toBeNull();
});

// 시안에는 건너뛰기도 닫기도 없다. 모달만 보면 다른 이탈 경로가 생겨도 통과하므로
// 링크까지 함께 본다
test("입력 단계에는 온보딩을 떠나는 버튼도 링크도 없다", () => {
  const { container } = renderAt("?step=basic");

  // 이탈 확인 모달을 여는 곳이 없어 모달도 함께 사라졌다
  expect(screen.queryByRole("alertdialog")).toBeNull();
  expect(screen.queryByText("프로필 작성을 그만둘까요?")).toBeNull();

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

  fireEvent.click(screen.getByText("소형"));

  expect(screen.getByPlaceholderText("평균 몸무게 5kg")).toBeDefined();
  expect(screen.getByRole("slider")).toBeDefined();
  expect(screen.getByText("보통")).toBeDefined();
});

test("체구 물음표를 누르면 몇 kg으로 가르는지 보인다", () => {
  renderAt("?step=detail");

  fireEvent.click(screen.getByRole("button", { name: "체구 기준 보기" }));
  expect(screen.getByText("소형은 10kg 미만")).toBeDefined();
});

test("품종 선택 단계에는 진행 표시 대신 품종선택 머리말이 있다", () => {
  renderAt("?step=breed");

  expect(screen.queryByRole("progressbar")).toBeNull();
  expect(screen.getByRole("heading", { name: "품종선택" })).toBeDefined();
});

// 시안에 이어지는 화면이 없어 같은 흐름을 처음부터 다시 돈다
test("완료 화면의 프로필 추가는 초안을 비우고 첫 입력 단계로 돌아간다", () => {
  window.localStorage.setItem("onboarding-draft", JSON.stringify({ name: "코코" }));
  resetDraftCache();
  renderAt("?step=done");

  expect(screen.getByRole("heading", { name: /코코의 프로필 등록이 끝났어요/ })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "프로필 추가" }));

  expect(window.localStorage.getItem("onboarding-draft")).toBeNull();
  expect(screen.getByRole("heading", { name: "아이를 소개해 주세요" })).toBeDefined();
});
