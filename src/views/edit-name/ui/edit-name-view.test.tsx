// 이름 변경 테스트. 이름만 보내는지 본다.
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

import { EditNameView } from "./edit-name-view";

function renderView() {
  return render(<EditNameView />, { wrapper: createQueryWrapper() });
}

afterEach(() => {
  vi.unstubAllGlobals();
  back.mockClear();
});

test("비어 있으면 저장할 수 없다", () => {
  renderView();

  expect((screen.getByRole("button", { name: "입력 완료" }) as HTMLButtonElement).disabled).toBe(
    true,
  );
});

// 닉네임·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
test("이름만 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.change(screen.getByLabelText("이름"), { target: { value: " 권도형 " } });
  fireEvent.click(screen.getByRole("button", { name: "입력 완료" }));

  await waitFor(() => expect(back).toHaveBeenCalled());
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  // 앞뒤 공백은 떼고 보낸다
  expect(JSON.parse(String(init.body))).toEqual({ name: "권도형" });
});
