// 빈 상태 안내 단위 테스트. 선택 요소가 없을 때도 깨지지 않는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { EmptyState } from "./empty-state";

test("제목만 넘겨도 렌더링된다", () => {
  render(<EmptyState title="등록된 배송지가 없어요" />);
  expect(screen.getByText("등록된 배송지가 없어요")).toBeDefined();
});

test("설명과 액션을 함께 보여준다", () => {
  render(
    <EmptyState
      title="진행 중인 타임딜이 없어요"
      description="오픈 예정 탭에서 다음 딜을 확인해 보세요."
      action={<button type="button">오픈 예정 보기</button>}
    />,
  );

  expect(screen.getByText("오픈 예정 탭에서 다음 딜을 확인해 보세요.")).toBeDefined();
  expect(screen.getByRole("button", { name: "오픈 예정 보기" })).toBeDefined();
});
