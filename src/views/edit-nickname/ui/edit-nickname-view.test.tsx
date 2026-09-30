// 닉네임 변경 테스트. 지금 닉네임을 채운 채로 여는지와 닉네임만 보내는지 본다 (QA No.143).
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { afterEach, beforeEach, expect, test, vi } from "vitest";

import { createQueryWrapper } from "@/shared/lib/query-test-wrapper";

const back = vi.fn();
vi.mock("next/navigation", () => ({ useRouter: () => ({ back, push: vi.fn() }) }));

const PROFILE = {
  nickname: "보리맘",
  name: null,
  birth: null,
  phone: null,
  image: null,
  email: "a@b",
};

/** 조회가 화면보다 늦게 도착하는 경우를 흉내 낸다 */
const query: { profile: typeof PROFILE | undefined } = { profile: PROFILE };

vi.mock("@/entities/member", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/entities/member")>()),
  useQueryMyProfile: () => ({ profile: query.profile, isLoading: !query.profile, error: null }),
}));

import { EditNicknameView } from "./edit-nickname-view";

function renderView() {
  return render(<EditNicknameView />, { wrapper: createQueryWrapper() });
}

const input = () => screen.getByLabelText<HTMLInputElement>("닉네임");
const submitButton = () => screen.getByRole<HTMLButtonElement>("button", { name: "입력 완료" });

beforeEach(() => {
  query.profile = PROFILE;
});

afterEach(() => {
  vi.unstubAllGlobals();
  back.mockClear();
});

// 빈 칸에 자리 표시만 두면 비활성처럼 보이고, 한 글자를 고치려 해도 전부 다시 쳐야 했다
test("지금 닉네임을 채운 채로 커서를 두고 연다", () => {
  renderView();

  expect(input().value).toBe("보리맘");
  expect(document.activeElement).toBe(input());
  expect(input().inputMode).toBe("text");
});

test("닉네임이 늦게 도착해도 도착한 값으로 채운다", () => {
  query.profile = undefined;
  const { rerender } = renderView();
  expect(input().value).toBe("");

  query.profile = PROFILE;
  rerender(<EditNicknameView />);

  expect(input().value).toBe("보리맘");
});

test("받기 전에 친 값은 도착한 닉네임에 덮이지 않는다", () => {
  query.profile = undefined;
  const { rerender } = renderView();
  fireEvent.change(input(), { target: { value: "코코맘" } });

  query.profile = PROFILE;
  rerender(<EditNicknameView />);

  expect(input().value).toBe("코코맘");
});

// 고칠 것 없는 요청이고, 서버가 자기 닉네임을 "사용 중"으로 거절할 수도 있다
test("손대지 않았거나 비웠으면 저장할 수 없다", () => {
  renderView();
  expect(submitButton().disabled).toBe(true);

  fireEvent.change(input(), { target: { value: "  " } });
  expect(submitButton().disabled).toBe(true);

  fireEvent.change(input(), { target: { value: "코코맘" } });
  expect(submitButton().disabled).toBe(false);
});

// 이름·생년월일까지 실으면 이 화면이 고치지도 않은 값을 덮어쓴다
test("닉네임만 보낸다", async () => {
  const fetchMock = vi.fn().mockResolvedValue(new Response(null, { status: 204 }));
  vi.stubGlobal("fetch", fetchMock);
  renderView();

  fireEvent.change(input(), { target: { value: " 코코맘 " } });
  fireEvent.click(submitButton());

  await waitFor(() => expect(back).toHaveBeenCalled());
  const [, init] = fetchMock.mock.calls[0] as [string, RequestInit];
  // 앞뒤 공백은 떼고 보낸다
  expect(JSON.parse(String(init.body))).toEqual({ nickname: "코코맘" });
});
