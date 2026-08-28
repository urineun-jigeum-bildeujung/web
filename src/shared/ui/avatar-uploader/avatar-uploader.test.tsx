// 사진 업로더 단위 테스트. 파일 전달과 미리보기 전환을 검증한다.
import { render, screen } from "@testing-library/react";
import { beforeEach, expect, test, vi } from "vitest";

import { AvatarUploader } from "./avatar-uploader";

beforeEach(() => {
  // jsdom에는 createObjectURL이 없다
  URL.createObjectURL = vi.fn(() => "blob:preview");
  URL.revokeObjectURL = vi.fn();
});

test("사진이 없으면 등록 버튼만 보인다", () => {
  render(<AvatarUploader onFileChange={() => {}} />);

  expect(screen.getByLabelText("반려동물 사진 등록")).toBeDefined();
  expect(screen.queryByRole("img")).toBeNull();
});

test("고른 파일을 미리보기로 보여준다", () => {
  const file = new File(["x"], "coco.png", { type: "image/png" });
  render(<AvatarUploader file={file} onFileChange={() => {}} />);

  expect(URL.createObjectURL).toHaveBeenCalledWith(file);
  expect(screen.getByRole("presentation").getAttribute("src")).toBe("blob:preview");
});

test("저장된 사진이 있으면 그것을 보여준다", () => {
  render(<AvatarUploader onFileChange={() => {}} defaultImageUrl="https://example.com/coco.png" />);

  expect(screen.getByRole("presentation").getAttribute("src")).toBe("https://example.com/coco.png");
});
