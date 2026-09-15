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

test("기본은 24px 원이고 s는 16px 원이다", () => {
  const { rerender } = render(<CheckboxRow label="기본" />);
  expect(screen.getByRole("checkbox").className).toContain("size-6");

  rerender(<CheckboxRow label="작게" size="s" />);
  expect(screen.getByRole("checkbox").className).toContain("size-4");
});

test("tone에 따라 골랐을 때 채우는 색이 다르다", () => {
  const { rerender } = render(<CheckboxRow label="기본" />);
  expect(screen.getByRole("checkbox").className).toContain("data-checked:bg-primary");

  rerender(<CheckboxRow label="브랜드" tone="brand" />);
  expect(screen.getByRole("checkbox").className).toContain("data-checked:bg-surface-brand");
});

test("설명을 눌러도 체크가 바뀌지 않고 오른쪽 슬롯이 그려진다", () => {
  const onCheckedChange = vi.fn();
  render(
    <CheckboxRow
      label="개인정보 수집 및 이용 동의"
      description="꼭 필요해요"
      trailing={<a href="/terms">본문 보기</a>}
      onCheckedChange={onCheckedChange}
    />,
  );

  fireEvent.click(screen.getByText("꼭 필요해요"));
  expect(onCheckedChange).not.toHaveBeenCalled();
  expect(screen.getByRole("link", { name: "본문 보기" })).toBeDefined();
});

test("disabled면 누를 수 없다", () => {
  const onCheckedChange = vi.fn();
  render(<CheckboxRow label="해당 사항이 없어요" disabled onCheckedChange={onCheckedChange} />);

  fireEvent.click(screen.getByRole("checkbox"));
  expect(onCheckedChange).not.toHaveBeenCalled();
});
