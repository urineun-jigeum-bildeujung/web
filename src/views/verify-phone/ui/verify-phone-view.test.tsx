// 휴대폰 인증 테스트. 단계별 노출과 완료 조건, 실제 요청이 무엇을 보내는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

vi.mock("next/navigation", () => ({ useRouter: () => ({ back: vi.fn() }) }));

const toastAppError = vi.fn();
const toastAppSuccess = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
  toastAppSuccess: (...args: unknown[]) => toastAppSuccess(...args),
}));

import { VerifyPhoneView } from "./verify-phone-view";

function renderView() {
  return render(<VerifyPhoneView />, { wrapper: createQueryWrapper() });
}

/** 통신사와 번호를 채워 "인증 번호 받기"를 누를 수 있게 만든다 */
function fillPhone() {
  fireEvent.click(screen.getByLabelText("통신사"));
  fireEvent.click(screen.getByRole("option", { name: "SKT" }));
  fireEvent.change(screen.getByLabelText("휴대폰 번호"), { target: { value: "010-1234-5678" } });
}

afterEach(() => {
  vi.unstubAllGlobals();
  toastAppError.mockClear();
  toastAppSuccess.mockClear();
});

test("처음에는 인증번호 입력란이 없다", () => {
  renderView();
  expect(screen.queryByText("인증 번호를 입력해주세요")).toBeNull();
});

test("통신사와 번호가 있어야 인증 요청을 할 수 있다", () => {
  renderView();

  const request = screen.getByRole("button", { name: "인증 번호 받기" });
  expect((request as HTMLButtonElement).disabled).toBe(true);

  // 번호만 채우면 아직 통신사가 없어 눌리지 않는다
  fireEvent.change(screen.getByLabelText("휴대폰 번호"), { target: { value: "01012345678" } });
  expect((request as HTMLButtonElement).disabled).toBe(true);
});

test("인증을 마쳐야 입력 완료가 켜진다", () => {
  renderView();
  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});

// 서버가 Redis 키를 번호로 잡는다. 하이픈이 섞이면 발송과 확인이 서로 다른 키를 본다
test("번호에서 하이픈을 빼고 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ expiresInSeconds: 180 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));

  await waitFor(() => expect(fetchMock).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/auths/phone/verify-request");
  expect(JSON.parse(String(init.body))).toEqual({ phone: "01012345678" });
});

// 백엔드가 `code`를 int로 받는다. 문자열을 주면 본문을 통째로 거절한다
test("인증번호를 숫자로 보낸다", async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      url.includes("verify-confirm")
        ? Promise.resolve(Response.json({ verified: true }))
        : Promise.resolve(Response.json({ expiresInSeconds: 180 })),
    );
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));
  await waitFor(() => expect(screen.getByText("인증 번호를 입력해주세요")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "인증 번호 확인" }));

  await waitFor(() =>
    expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
      false,
    ),
  );
  const confirmCall = fetchMock.mock.calls.find(([url]) =>
    String(url).includes("verify-confirm"),
  ) as [string, RequestInit];
  expect(JSON.parse(String(confirmCall[1].body))).toEqual({ phone: "01012345678", code: 584937 });
});

// 서버가 200에 `verified: false`로 답한다. 틀렸다고 알리지 않으면 왜 안 넘어가는지 모른다
test("인증번호가 맞지 않으면 알린다", async () => {
  const fetchMock = vi
    .fn()
    .mockImplementation((url: string) =>
      url.includes("verify-confirm")
        ? Promise.resolve(Response.json({ verified: false }))
        : Promise.resolve(Response.json({ expiresInSeconds: 180 })),
    );
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));
  await waitFor(() => expect(screen.getByText("인증 번호를 입력해주세요")).toBeDefined());
  fireEvent.change(screen.getByLabelText("인증 번호"), { target: { value: "000000" } });
  fireEvent.click(screen.getByRole("button", { name: "인증 번호 확인" }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});

// 발송은 1시간에 5회, 확인은 5분에 5회다. 넘으면 까닭을 알려야 다시 누르지 않는다
test("요청이 너무 잦으면 까닭을 알린다", async () => {
  vi.stubGlobal(
    "fetch",
    vi
      .fn()
      .mockResolvedValue(
        Response.json({ errorCode: "AUTH_429_TOO_MANY_REQUESTS" }, { status: 429 }),
      ),
  );
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(screen.queryByText("인증 번호를 입력해주세요")).toBeNull();
});
