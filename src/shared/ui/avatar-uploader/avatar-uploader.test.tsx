// 사진 업로더 단위 테스트. 파일 선택 시 미리보기 전환과 상위 전달을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { AvatarUploader } from "./avatar-uploader";

beforeEach(() => {
  // jsdom에는 createObjectURL이 없다. 교체를 확인해야 하므로 매번 다른 주소를 준다
  let seq = 0;
  URL.createObjectURL = vi.fn(() => `blob:preview-${++seq}`);
  URL.revokeObjectURL = vi.fn();
});

function selectFile(name = "coco.png") {
  const file = new File(["x"], name, { type: "image/png" });
  const input = screen.getByLabelText("반려동물 사진 등록", { selector: "input" });
  fireEvent.change(input, { target: { files: [file] } });
  return file;
}

test("사진이 없으면 미리보기가 없다", () => {
  render(<AvatarUploader onFileChange={() => {}} />);

  expect(screen.getByLabelText("반려동물 사진 등록", { selector: "input" })).toBeDefined();
  expect(screen.queryByRole("presentation")).toBeNull();
});

test("파일을 고르면 미리보기를 보여주고 상위에 넘긴다", () => {
  const onFileChange = vi.fn();
  render(<AvatarUploader onFileChange={onFileChange} />);

  const file = selectFile();

  expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  expect(onFileChange).toHaveBeenCalledWith(file);
  expect(screen.getByRole("presentation").getAttribute("src")).toBe("blob:preview-1");
});

test("사진을 바꾸면 이전 주소를 해제한다", () => {
  render(<AvatarUploader onFileChange={() => {}} />);

  selectFile("coco.png");
  selectFile("bori.png");

  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
});

test("저장된 사진이 있으면 그것을 보여준다", () => {
  render(<AvatarUploader onFileChange={() => {}} defaultImageUrl="https://example.com/coco.png" />);

  expect(screen.getByRole("presentation").getAttribute("src")).toBe("https://example.com/coco.png");
});

// 온보딩 두 번째 단계에서 "이전"을 누르면 첫 단계가 새로 그려져 빈 원이 됐다. 파일은 초안에
// 남아 실제로는 등록되는데 화면만 사진이 빠진 것처럼 보였다 (#602)
test("상위가 들고 있는 파일을 넘기면 다시 그려져도 그 파일로 미리보기를 되살린다", () => {
  const file = new File(["x"], "coco.png", { type: "image/png" });
  const { unmount } = render(<AvatarUploader onFileChange={() => {}} file={file} />);
  unmount();

  render(<AvatarUploader onFileChange={() => {}} file={file} />);

  expect(URL.createObjectURL).toHaveBeenLastCalledWith(file);
  expect(screen.getByRole("presentation").getAttribute("src")).toBe("blob:preview-2");
});

test("화면에서 빠지면 만든 주소를 해제한다", () => {
  const file = new File(["x"], "coco.png", { type: "image/png" });
  const { unmount } = render(<AvatarUploader onFileChange={() => {}} file={file} />);

  unmount();

  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
});

test("상위가 파일을 비우면 미리보기도 비운다", () => {
  const file = new File(["x"], "coco.png", { type: "image/png" });
  const { rerender } = render(<AvatarUploader onFileChange={() => {}} file={file} />);

  rerender(<AvatarUploader onFileChange={() => {}} file={null} />);

  expect(screen.queryByRole("presentation")).toBeNull();
  expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:preview-1");
});
