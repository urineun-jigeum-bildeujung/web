// 체크박스 줄 단위 테스트. 레이블 연결과 상태 전달을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { CheckboxRow } from "./checkbox-row";

test("레이블로 체크박스를 찾을 수 있다", () => {
  render(<CheckboxRow label="해당 사항이 없어요" />);
  expect(screen.getByRole("checkbox", { name: "해당 사항이 없어요" })).toBeDefined();
});

test("레이블을 눌러도 상태가 바뀐다", () => {
  const onCheckedChange = vi.fn();
  render(<CheckboxRow label="해당 사항이 없어요" onCheckedChange={onCheckedChange} />);

  fireEvent.click(screen.getByText("해당 사항이 없어요"));
  expect(onCheckedChange).toHaveBeenCalledWith(true);
});

test("disabled면 누를 수 없다", () => {
  const onCheckedChange = vi.fn();
  render(<CheckboxRow label="해당 사항이 없어요" disabled onCheckedChange={onCheckedChange} />);

  fireEvent.click(screen.getByRole("checkbox"));
  expect(onCheckedChange).not.toHaveBeenCalled();
});
