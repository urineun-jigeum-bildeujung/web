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
