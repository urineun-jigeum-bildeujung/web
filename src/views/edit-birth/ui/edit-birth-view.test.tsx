// 생년월일 변경 테스트. 치는 대로 다듬는지와 달력에 없는 날을 막는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ back, push: vi.fn() }) }));

vi.mock("@/entities/member", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/member")>()),
  useQueryMyProfile: () => ({
    profile: {
      nickname: "보리맘",
      name: null,
      birth: null,
      phone: null,
      image: null,
      email: "a@b",
    },
    isLoading: false,
    error: null,
  }),
}));

import { EditBirthView } from "./edit-birth-view";

function renderView() {
  return render(<EditBirthView />, { wrapper: createQueryWrapper() });
}

function submitButton() {
  return screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement;
}

afterEach(() => {
  vi.unstubAllGlobals();
  back.mockClear();
});

test("치는 대로 0000. 00. 00 꼴로 맞춘다", () => {
  renderView();

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "20001213" } });

  expect((screen.getByLabelText("생년월일") as HTMLInputElement).value).toBe("2000. 12. 13");
});

// 그대로 보내면 서버가 LocalDate로 읽지 못해 본문을 통째로 거절한다
test("달력에 없는 날은 알리고 저장을 막는다", () => {
  renderView();

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "20031092" } });

  expect(screen.getByText("달력에 없는 날이에요")).toBeDefined();
  expect(submitButton().disabled).toBe(true);
});

test("다 적기 전에는 저장할 수 없다", () => {
  renderView();

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "2000" } });

  expect(submitButton().disabled).toBe(true);
});

// 다른 값까지 실으면 이 화면이 고치지도 않은 것을 덮어쓴다
test("생년월일만 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.change(screen.getByLabelText("생년월일"), { target: { value: "20001213" } });
  fireEvent.click(submitButton());

  await waitFor(() => expect(back).toHaveBeenCalled());
  const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  expect(url).toContain("/members/me");
  expect(JSON.parse(String(init.body))).toEqual({ birth: "2000-12-13" });
});
