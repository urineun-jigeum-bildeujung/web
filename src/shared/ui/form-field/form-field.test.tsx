// 폼 항목 단위 테스트. 레이블·설명 연결과 클리어 버튼 노출 조건을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

import { FormField } from "./form-field";

test("레이블로 입력을 찾을 수 있다", () => {
  render(<FormField label="아이의 이름을 알려주세요" />);
  expect(screen.getByLabelText("아이의 이름을 알려주세요")).toBeDefined();
});

test("힌트가 입력의 설명으로 연결된다", () => {
  render(<FormField label="아이의 이름을 알려주세요" hint="ex) 코코, 보리" />);

  const input = screen.getByLabelText("아이의 이름을 알려주세요");
  const describedBy = input.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  expect(document.getElementById(describedBy!)?.textContent).toBe("ex) 코코, 보리");
});

test("error가 있으면 힌트 대신 그것을 읽고 invalid로 표시한다", () => {
  render(<FormField label="이름" hint="ex) 코코" error="이름을 입력해 주세요" />);

  const input = screen.getByLabelText("이름");
  expect(input.getAttribute("aria-invalid")).toBe("true");
  expect(screen.getByText("이름을 입력해 주세요")).toBeDefined();
  expect(screen.queryByText("ex) 코코")).toBeNull();
});

test("값이 없으면 클리어 버튼이 보이지 않는다", () => {
  render(<FormField label="이름" value="" onChange={() => {}} onClear={() => {}} />);
  expect(screen.queryByRole("button", { name: "입력 지우기" })).toBeNull();
});

test("값이 있으면 클리어 버튼이 보이고 눌리면 콜백이 불린다", () => {
  const onClear = vi.fn();
  render(<FormField label="이름" value="코코" onChange={() => {}} onClear={onClear} />);

  fireEvent.click(screen.getByRole("button", { name: "입력 지우기" }));
  expect(onClear).toHaveBeenCalledOnce();
});

test("비활성 상태에서는 클리어 버튼을 그리지 않는다", () => {
  render(<FormField label="이름" value="코코" onChange={() => {}} onClear={() => {}} disabled />);

  // 값을 고칠 수 없는 필드에서 지우기만 되면 안 된다
  expect(screen.queryByRole("button", { name: "입력 지우기" })).toBeNull();
});

// 몸무게 "4kg"처럼 단위를 곁에 그린다(#524). 값에 섞으면 칠 때마다 단위를 떼고 붙여야 한다
test("suffix는 값이 있을 때만 값 뒤에 보이고 입력값에는 들어가지 않는다", () => {
  const { rerender } = render(
    <FormField label="몸무게" value="" onChange={() => {}} suffix="kg" />,
  );
  expect(screen.queryByText("kg")).toBeNull();

  rerender(<FormField label="몸무게" value="4.5" onChange={() => {}} suffix="kg" />);

  expect((screen.getByLabelText("몸무게") as HTMLInputElement).value).toBe("4.5");
  // 입력값을 두 번 읽지 않게 화면 낭독기에서는 가린다
  expect(screen.getByText("kg").closest("[aria-hidden]")).not.toBeNull();
});
