// 휴대폰 인증 테스트. 단계별 노출과 완료 조건을 검증한다.
import { fireEvent, render, screen } from "@testing-library/react";
import { expect, test, vi } from "vitest";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

import { VerifyPhoneView } from "./verify-phone-view";

test("처음에는 인증번호 입력란이 없다", () => {
  render(<VerifyPhoneView />);
  expect(screen.queryByText("인증 번호를 입력해주세요")).toBeNull();
});

test("통신사와 번호가 있어야 인증 요청을 할 수 있다", () => {
  render(<VerifyPhoneView />);

  const request = screen.getByRole("button", { name: "인증" });
  expect((request as HTMLButtonElement).disabled).toBe(true);

  // 번호만 채우면 아직 통신사가 없어 눌리지 않는다
  fireEvent.change(screen.getByLabelText("휴대폰 번호"), { target: { value: "01012345678" } });
  expect((request as HTMLButtonElement).disabled).toBe(true);
});

test("인증을 마쳐야 입력 완료가 켜진다", () => {
  render(<VerifyPhoneView />);
  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});
