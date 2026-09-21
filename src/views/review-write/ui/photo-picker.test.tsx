// 정해진 장수를 넘겨 받지 않는지, 뺄 수 있는지, 미리보기 주소를 거둬들이는지,
// 그리고 더하는 칸이 시트를 열고 사진첩·카메라가 각자 약속대로 닫히는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoPicker } from "./photo-picker";

function makeFile(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

const galleryInput = () => screen.getByLabelText("사진첩에서 고르기") as HTMLInputElement;
const cameraInput = () => screen.getByLabelText("카메라로 찍기") as HTMLInputElement;
const sheet = () => screen.queryByRole("dialog", { name: "사진 첨부하기" });

describe("PhotoPicker", () => {
  beforeEach(() => {
    // jsdom에는 없다. 몇 번 만들고 거둬들이는지 세려는 목적도 겸한다
    URL.createObjectURL = vi.fn((file) => `blob:${(file as File).name}`);
    URL.revokeObjectURL = vi.fn();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("남은 자리만큼만 받는다", () => {
    const onChange = vi.fn();
    render(<PhotoPicker files={[makeFile("a.png")]} onChange={onChange} max={3} />);

    fireEvent.change(galleryInput(), {
      target: { files: [makeFile("b.png"), makeFile("c.png"), makeFile("d.png")] },
    });

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });

  it("다 채우면 더할 자리가 사라진다", () => {
    const files = [makeFile("a.png"), makeFile("b.png"), makeFile("c.png")];
    render(<PhotoPicker files={files} onChange={vi.fn()} max={3} />);

    expect(screen.queryByRole("button", { name: /사진 추가/ })).toBeNull();
    expect(screen.getAllByRole("button", { name: /사진 빼기/ })).toHaveLength(3);
  });

  it("뺀 자리는 목록에서 빠진다", () => {
    const onChange = vi.fn();
    const files = [makeFile("a.png"), makeFile("b.png")];
    render(<PhotoPicker files={files} onChange={onChange} />);

    fireEvent.click(screen.getByRole("button", { name: "1번째 사진 빼기" }));

    expect(onChange).toHaveBeenCalledWith([files[1]]);
  });

  it("화면에서 사라지면 미리보기 주소를 거둬들인다", () => {
    const { unmount } = render(<PhotoPicker files={[makeFile("a.png")]} onChange={vi.fn()} />);

    unmount();

    // 두고 가면 사진을 고칠 때마다 메모리에 쌓인다
    expect(URL.revokeObjectURL).toHaveBeenCalledWith("blob:a.png");
  });

  // 파일 입력이 둘이라 바로 파일창을 열 수 없다. 어느 쪽인지 시트가 묻는다
  it("더하는 칸을 누르면 사진첩·카메라를 고르는 시트가 뜬다", async () => {
    render(<PhotoPicker files={[]} onChange={vi.fn()} />);

    fireEvent.click(screen.getByRole("button", { name: "사진 추가 (0/3)" }));

    await waitFor(() => expect(sheet()).not.toBeNull());
    expect(screen.getByRole("button", { name: "사진첩" })).toBeDefined();
    expect(screen.getByRole("button", { name: "카메라" })).toBeDefined();
  });

  it("사진첩 줄은 사진첩 입력을, 카메라 줄은 카메라 입력을 연다", async () => {
    render(<PhotoPicker files={[]} onChange={vi.fn()} />);
    const gallery = vi.spyOn(galleryInput(), "click");
    const camera = vi.spyOn(cameraInput(), "click");
    fireEvent.click(screen.getByRole("button", { name: "사진 추가 (0/3)" }));
    await waitFor(() => expect(sheet()).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "사진첩" }));
    fireEvent.click(screen.getByRole("button", { name: "카메라" }));

    expect(gallery).toHaveBeenCalledTimes(1);
    expect(camera).toHaveBeenCalledTimes(1);
    // 카메라 입력만 한 장에 그친다. 사진첩은 여러 장을 한 번에 고른다
    expect(cameraInput().hasAttribute("capture")).toBe(true);
    expect(cameraInput().hasAttribute("multiple")).toBe(false);
    expect(galleryInput().hasAttribute("multiple")).toBe(true);
  });

  it("사진첩에서 골라도 시트가 남고, 카메라로 찍으면 시트가 닫힌다", async () => {
    render(<PhotoPicker files={[]} onChange={vi.fn()} />);
    fireEvent.click(screen.getByRole("button", { name: "사진 추가 (0/3)" }));
    await waitFor(() => expect(sheet()).not.toBeNull());

    fireEvent.change(galleryInput(), { target: { files: [makeFile("a.png")] } });
    expect(sheet()).not.toBeNull();

    fireEvent.change(cameraInput(), { target: { files: [makeFile("b.png")] } });
    await waitFor(() => expect(sheet()).toBeNull());
  });

  it("확인은 시트를 닫기만 한다", async () => {
    const onChange = vi.fn();
    render(<PhotoPicker files={[]} onChange={onChange} />);
    fireEvent.click(screen.getByRole("button", { name: "사진 추가 (0/3)" }));
    await waitFor(() => expect(sheet()).not.toBeNull());

    fireEvent.click(screen.getByRole("button", { name: "확인" }));

    await waitFor(() => expect(sheet()).toBeNull());
    expect(onChange).not.toHaveBeenCalled();
  });
});
