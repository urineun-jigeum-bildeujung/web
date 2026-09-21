// 두 줄이 각자의 경로를 부르는지, 다 찼을 때 잠기는지, 확인이 닫기만 하는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, it, vi } from "vitest";

import { PhotoSourceSheet } from "./photo-source-sheet";

function renderSheet(overrides: Partial<Parameters<typeof PhotoSourceSheet>[0]> = {}) {
  const props = {
    open: true,
    onOpenChange: vi.fn(),
    canAdd: true,
    onPickGallery: vi.fn(),
    onPickCamera: vi.fn(),
    ...overrides,
  };
  render(<PhotoSourceSheet {...props} />);
  return props;
}

it("제목이 시트 이름으로 읽히고 두 줄이 각자의 경로를 부른다", () => {
  const props = renderSheet();

  expect(screen.getByRole("dialog", { name: "사진 첨부하기" })).toBeDefined();
  fireEvent.click(screen.getByRole("button", { name: "사진첩" }));
  fireEvent.click(screen.getByRole("button", { name: "카메라" }));

  expect(props.onPickGallery).toHaveBeenCalledTimes(1);
  expect(props.onPickCamera).toHaveBeenCalledTimes(1);
});

// 시트가 열린 채로 세 장이 차면 눌러도 받을 자리가 없다. 눌리지 않는다고 알린다
it("더 붙일 자리가 없으면 두 줄이 잠긴다", () => {
  renderSheet({ canAdd: false });

  expect(screen.getByRole("button", { name: "사진첩" }).hasAttribute("disabled")).toBe(true);
  expect(screen.getByRole("button", { name: "카메라" }).hasAttribute("disabled")).toBe(true);
});

it("확인은 닫기만 한다", () => {
  const props = renderSheet();

  fireEvent.click(screen.getByRole("button", { name: "확인" }));

  expect(props.onOpenChange).toHaveBeenCalledWith(false);
  expect(props.onPickGallery).not.toHaveBeenCalled();
  expect(props.onPickCamera).not.toHaveBeenCalled();
});
