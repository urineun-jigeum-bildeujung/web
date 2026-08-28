// 항목·값 줄 단위 테스트. 빈 값 처리를 검증한다.
import { render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { DefinitionRow } from "./definition-row";

test("항목과 값을 보여준다", () => {
  render(
    <dl>
      <DefinitionRow term="닉네임" description="청주 불주먹" />
    </dl>,
  );

  expect(screen.getByText("닉네임")).toBeDefined();
  expect(screen.getByText("청주 불주먹")).toBeDefined();
});

test("값이 없으면 안내 문구를 대신 보여준다", () => {
  render(
    <dl>
      <DefinitionRow term="생년월일" />
    </dl>,
  );

  expect(screen.getByText("등록 전")).toBeDefined();
});

test("빈 문자열도 없는 것으로 본다", () => {
  render(
    <dl>
      <DefinitionRow term="이메일" description="" emptyText="아직 없어요" />
    </dl>,
  );

  expect(screen.getByText("아직 없어요")).toBeDefined();
});
