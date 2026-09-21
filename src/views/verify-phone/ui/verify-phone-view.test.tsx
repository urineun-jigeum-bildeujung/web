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

// A로 인증한 뒤 B로 고치면 인증하지 않은 번호로 완료할 수 있었다
test("인증한 뒤 번호를 고치면 완료가 다시 잠긴다", async () => {
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

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  await waitFor(() => expect(submit().disabled).toBe(false));

  fireEvent.change(screen.getByLabelText("휴대폰 번호"), { target: { value: "010-9999-8888" } });
  expect(submit().disabled).toBe(true);
});

// 하이픈만 달라진 같은 번호까지 잠그면 사용자가 까닭을 알 수 없다
test("표기만 달라진 같은 번호는 인증이 유지된다", async () => {
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

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  await waitFor(() => expect(submit().disabled).toBe(false));

  fireEvent.change(screen.getByLabelText("휴대폰 번호"), { target: { value: "01012345678" } });
  expect(submit().disabled).toBe(false);
});

// inputMode는 붙여넣기를 막지 않는다. Number("12ab")가 NaN이 되고 JSON이 null로 적어
// 서버의 int 계약이 깨진다 — 본문이 통째로 거절된다
test("숫자가 아닌 인증번호는 보내지 않는다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(Response.json({ expiresInSeconds: 180 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));
  await waitFor(() => expect(screen.getByText("인증 번호를 입력해주세요")).toBeDefined());
  fireEvent.change(screen.getByLabelText("인증 번호"), { target: { value: "12ab" } });
  fireEvent.click(screen.getByRole("button", { name: "인증 번호 확인" }));

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
  expect(
    fetchMock.mock.calls.find(([url]) => String(url).includes("verify-confirm")),
  ).toBeUndefined();
});

// 인증만 하고 저장하지 않으면 내 정보의 휴대폰 번호가 `등록 전이에요`로 남는다
test("완료를 누르면 인증한 번호를 통신사·인증번호와 함께 저장한다", async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes("verify-confirm")) return Promise.resolve(Response.json({ verified: true }));
    if (url.includes("members/me/phone"))
      return Promise.resolve(new Response(null, { status: 204 }));
    return Promise.resolve(Response.json({ expiresInSeconds: 180 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));
  await waitFor(() => expect(screen.getByText("인증 번호를 입력해주세요")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "인증 번호 확인" }));

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  await waitFor(() => expect(submit().disabled).toBe(false));
  fireEvent.click(submit());

  const saveCall = () =>
    fetchMock.mock.calls.find(([url]) => String(url).includes("members/me/phone"));
  await waitFor(() => expect(saveCall()).toBeDefined());

  const [, init] = saveCall() as [string, RequestInit];
  expect(init.method).toBe("PATCH");
  // 통신사는 화면 문구가 아니라 백엔드 enum 값으로 나간다
  expect(JSON.parse(String(init.body))).toEqual({
    phone: "01012345678",
    carrier: "SKT",
    code: 584937,
  });
});

// 조용히 돌아가면 저장된 줄 안다
test("저장에 실패하면 까닭을 알린다", async () => {
  const fetchMock = vi.fn().mockImplementation((url: string) => {
    if (url.includes("verify-confirm")) return Promise.resolve(Response.json({ verified: true }));
    if (url.includes("members/me/phone"))
      return Promise.resolve(Response.json({}, { status: 500 }));
    return Promise.resolve(Response.json({ expiresInSeconds: 180 }));
  });
  vi.stubGlobal("fetch", fetchMock);
  renderView();
  fillPhone();

  fireEvent.click(screen.getByRole("button", { name: "인증 번호 받기" }));
  await waitFor(() => expect(screen.getByText("인증 번호를 입력해주세요")).toBeDefined());
  fireEvent.click(screen.getByRole("button", { name: "인증 번호 확인" }));

  const submit = () => screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
  await waitFor(() => expect(submit().disabled).toBe(false));
  toastAppError.mockClear();
  fireEvent.click(submit());

  await waitFor(() => expect(toastAppError).toHaveBeenCalled());
});
