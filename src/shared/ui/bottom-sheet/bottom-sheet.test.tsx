// 열림 여부에 따라 내용이 나오는지와 제목이 시트 이름으로 읽히는지 본다.
import { render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { DrawerTitle } from "@/shared/ui/drawer";

import { BottomSheet } from "./bottom-sheet";

test("닫혀 있으면 내용이 없다", () => {
  render(
    <BottomSheet open={false} onOpenChange={vi.fn()}>
      <DrawerTitle>걱정되는 질환</DrawerTitle>
    </BottomSheet>,
  );

  expect(screen.queryByText("걱정되는 질환")).toBeNull();
});

test("열리면 제목이 시트 이름이 된다", () => {
  render(
    <BottomSheet open onOpenChange={vi.fn()}>
      <DrawerTitle>걱정되는 질환</DrawerTitle>
      <p>내용</p>
    </BottomSheet>,
  );

  expect(screen.getByRole("dialog", { name: "걱정되는 질환" })).toBeDefined();
  expect(screen.getByText("내용")).toBeDefined();
});
