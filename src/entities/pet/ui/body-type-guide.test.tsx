// 다섯 단계가 이름만이 아니라 무엇을 보고 고르는지까지 읽히는지 본다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test } from "vitest";

import { BODY_TYPE_GUIDE, BODY_TYPE_OPTIONS } from "../model/breeds";
import { BodyTypeGuide } from "./body-type-guide";

test("누르기 전에는 설명이 없다", () => {
  render(<BodyTypeGuide />);
  expect(screen.queryByText("bcs란?")).toBeNull();
});

test("누르면 다섯 단계가 설명과 함께 나온다", () => {
  render(<BodyTypeGuide />);

  fireEvent.click(screen.getByRole("button", { name: "체형이 무엇인지 보기" }));

  // 이름만 있으면 만져서 판단하는 기준을 알 수 없다. 다섯 줄이 모두 있어야 한다.
  for (const label of BODY_TYPE_OPTIONS) {
    expect(screen.getByText(label)).toBeDefined();
    expect(screen.getByText(BODY_TYPE_GUIDE[label])).toBeDefined();
  }
});
