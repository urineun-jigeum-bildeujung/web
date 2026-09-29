// 몸무게 칸이 소수 첫째 자리까지만 받고, 칸을 벗어나면 kg을 붙이는지 본다 (QA No.206·242).
import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, test } from "vitest";

import { WeightField } from "./weight-field";

function Harness({ initial = "" }: { initial?: string }) {
  const [value, setValue] = useState(initial);
  return <WeightField label="몸무게" value={value} onValueChange={setValue} />;
}

function input() {
  return screen.getByLabelText("몸무게") as HTMLInputElement;
}

test("치는 동안에는 숫자만, 소수 첫째 자리까지만 들어간다", () => {
  render(<Harness />);

  fireEvent.focus(input());
  fireEvent.change(input(), { target: { value: "4.567" } });

  expect(input().value).toBe("4.5");
});

// QA는 포커스를 벗어나도 "4.567"·"30"이 그대로이고 kg이 없다고 했다
test("칸을 벗어나면 kg을 붙여 보이고, 돌아오면 숫자만 보인다", () => {
  render(<Harness />);

  fireEvent.focus(input());
  fireEvent.change(input(), { target: { value: "30" } });
  fireEvent.blur(input());
  expect(input().value).toBe("30kg");

  fireEvent.focus(input());
  expect(input().value).toBe("30");
});

// "4.kg"으로 보이면 잘못 적은 줄 안다
test("칸을 벗어날 때 치다 만 모양을 다듬는다", () => {
  render(<Harness />);

  fireEvent.focus(input());
  fireEvent.change(input(), { target: { value: "4." } });
  fireEvent.blur(input());

  expect(input().value).toBe("4kg");
});

test("비어 있으면 kg도 붙이지 않는다", () => {
  render(<Harness />);

  fireEvent.focus(input());
  fireEvent.blur(input());

  expect(input().value).toBe("");
});

test("지우기를 누르면 비운다", () => {
  render(<Harness initial="4" />);

  fireEvent.click(screen.getByRole("button", { name: "입력 지우기" }));

  expect(input().value).toBe("");
});
