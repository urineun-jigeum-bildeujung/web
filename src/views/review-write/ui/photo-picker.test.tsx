// 정해진 장수를 넘겨 받지 않는지, 뺄 수 있는지, 미리보기 주소를 거둬들이는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { PhotoPicker } from "./photo-picker";

function makeFile(name: string) {
  return new File(["x"], name, { type: "image/png" });
}

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

    fireEvent.change(screen.getByLabelText("1/3", { selector: "input" }), {
      target: { files: [makeFile("b.png"), makeFile("c.png"), makeFile("d.png")] },
    });

    expect(onChange.mock.calls[0][0]).toHaveLength(3);
  });

  it("다 채우면 더할 자리가 사라진다", () => {
    const files = [makeFile("a.png"), makeFile("b.png"), makeFile("c.png")];
    render(<PhotoPicker files={files} onChange={vi.fn()} max={3} />);

    expect(screen.queryByText("3/3")).toBeNull();
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
});
