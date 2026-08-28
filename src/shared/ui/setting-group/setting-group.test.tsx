// 설정 묶음 단위 테스트. 제목이 heading으로 나오고 자식이 담기는지 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { SettingGroup } from "./setting-group";

test("제목을 heading으로 보여준다", () => {
  render(
    <SettingGroup title="나의 쇼핑">
      <button type="button">주문/배송 내역</button>
    </SettingGroup>,
  );

  expect(screen.getByRole("heading", { name: "나의 쇼핑" })).toBeDefined();
  expect(screen.getByRole("button", { name: "주문/배송 내역" })).toBeDefined();
});

test("제목이 없으면 heading을 만들지 않는다", () => {
  render(
    <SettingGroup>
      <button type="button">로그아웃</button>
    </SettingGroup>,
  );

  expect(screen.queryByRole("heading")).toBeNull();
});
