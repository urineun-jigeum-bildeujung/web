// 전체 동의가 하위를 켜는지, 필수를 채워야 넘어가는지, 가입 요청과 토큰 교체가 맞는지 본다.
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NuqsTestingAdapter } from "nuqs/adapters/testing";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const replace = vi.fn();
let query = new URLSearchParams();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace, back: vi.fn() }),
  useSearchParams: () => query,
}));

const toastAppError = vi.fn();
vi.mock("@/shared/lib/app-toast", () => ({
  toastAppError: (...args: unknown[]) => toastAppError(...args),
}));

import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "@/shared/api/token-store";

import { SignupView } from "./signup-view";

function renderWith(search = "") {
  query = new URLSearchParams(search);
  return render(
    <NuqsTestingAdapter searchParams={search}>
      <SignupView />
    </NuqsTestingAdapter>,
  );
}

/** 약관을 다 채우고 닉네임 단계로 넘어간다 */
function goToNicknameStep() {
  fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));
  fireEvent.click(screen.getByRole("button", { name: "다음으로" }));
}

beforeEach(() => {
  replace.mockClear();
  toastAppError.mockClear();
  // 이 화면은 소셜 인증을 마친 사람만 닿는다. 토큰이 없으면 로그인으로 돌려보내므로
  // 나머지 테스트는 교환을 마친 상태에서 시작한다
  saveTokens({ accessToken: "a-1", refreshToken: "r-1" });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("SignupView", () => {
  // /login의 회원가입 링크로 바로 들어오면 토큰이 없다. 그대로 두면 약관과 닉네임을
  // 다 채운 뒤 가입 요청이 401로 막힌다
  it("토큰 없이 들어오면 로그인으로 돌려보낸다", () => {
    clearTokens();
    renderWith();

    expect(replace).toHaveBeenCalledWith("/login");
  });

  it("처음에는 다음으로 갈 수 없다", () => {
    renderWith();

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);
  });

  it("필수 전체 동의를 누르면 하위가 한꺼번에 체크된다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));

    expect(screen.getByLabelText("만 14세 이상입니다.").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByLabelText("서비스 이용약관 동의").getAttribute("aria-checked")).toBe("true");
    expect(screen.getByLabelText("개인정보 수집 및 이용 동의").getAttribute("aria-checked")).toBe(
      "true",
    );
    // 선택 항목까지 켜지지는 않는다
    expect(
      screen.getByLabelText("맞춤 혜택 및 이벤트 알림 수신 동의").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("필수를 다 채우면 다음으로 갈 수 있다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(false);
  });

  it("선택만 채우면 다음으로 갈 수 없다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[선택] 서비스 이용약관 전체 동의"));

    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);
  });

  it("하나를 풀면 전체 동의도 함께 풀린다", () => {
    renderWith();

    fireEvent.click(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의"));
    fireEvent.click(screen.getByLabelText("만 14세 이상입니다."));

    expect(
      screen.getByLabelText("[필수] 서비스 이용약관 전체 동의").getAttribute("aria-checked"),
    ).toBe("false");
  });

  it("설명 문구를 눌러도 체크가 바뀌지 않는다", () => {
    renderWith();

    // 시안이 "체크에 영향 없는 터치 영역"으로 표시해 둔 자리다
    fireEvent.click(screen.getByText(/아이의 건강 데이터 활용을 위해 꼭 필요해요/));

    expect(screen.getByLabelText("개인정보 수집 및 이용 동의").getAttribute("aria-checked")).toBe(
      "false",
    );
  });

  it("약관 항목에서 본문으로 갈 수 있다", () => {
    renderWith();

    expect(
      screen.getByRole("link", { name: "서비스 이용약관 동의 본문 보기" }).getAttribute("href"),
    ).toBe("/mypage/service/terms");
  });

  it("약관을 채우지 않고 주소로 닉네임 단계에 들어올 수 없다", () => {
    renderWith("?step=nickname");

    // 그대로 두면 동의 없이 가입이 끝난다. 약관부터 다시 보여준다
    expect(screen.getByLabelText("[필수] 서비스 이용약관 전체 동의")).toBeDefined();
    expect(screen.queryByText("닉네임을 적어주세요")).toBeNull();
  });

  it("추천 닉네임이 없으면 비어 있고 두 자 미만이면 넘어갈 수 없다", () => {
    renderWith();
    goToNicknameStep();

    const input = screen.getByLabelText("닉네임") as HTMLInputElement;
    expect(input.value).toBe("");
    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(true);

    fireEvent.change(input, { target: { value: "보리" } });
    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(false);
  });

  // 콜백 화면이 교환 응답의 추천 닉네임을 쿼리에 실어 넘긴다
  it("추천 닉네임을 받으면 미리 채워 둔다", () => {
    renderWith("?nickname=졸린고양이 17");
    goToNicknameStep();

    expect((screen.getByLabelText("닉네임") as HTMLInputElement).value).toBe("졸린고양이 17");
  });

  it("고르지 않은 약관도 agreed false로 함께 보낸다", async () => {
    const fetchMock = vi
      .fn()
      .mockResolvedValue(Response.json({ accessToken: "a-2", refreshToken: "r-2" }));
    vi.stubGlobal("fetch", fetchMock);

    renderWith();
    goToNicknameStep();
    fireEvent.change(screen.getByLabelText("닉네임"), { target: { value: "보리" } });
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));

    await waitFor(() => expect(fetchMock).toHaveBeenCalled());
    const [url, init] = fetchMock.mock.calls[0] as [string, RequestInit];
    expect(url).toContain("/members/signup");
    expect(JSON.parse(String(init.body))).toEqual({
      nickname: "보리",
      agreements: [
        { type: "AGE_OVER_14", agreed: true },
        { type: "SERVICE_TERMS", agreed: true },
        { type: "PRIVACY_COLLECTION", agreed: true },
        { type: "MARKETING_BENEFIT", agreed: false },
        { type: "THIRD_PARTY_PROVIDE", agreed: false },
      ],
    });
  });

  // memberId는 가입을 끝내야 생기는 값이라 로그인 직후 토큰에는 없다
  it("가입 응답의 새 토큰으로 갈아끼우고 온보딩으로 보낸다", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(Response.json({ accessToken: "a-2", refreshToken: "r-2" })),
    );

    renderWith();
    goToNicknameStep();
    fireEvent.change(screen.getByLabelText("닉네임"), { target: { value: "보리" } });
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));

    await waitFor(() => expect(getAccessToken()).toBe("a-2"));
    expect(getRefreshToken()).toBe("r-2");
    // 뒤로가기로 가입 화면에 되돌아오지 않게 replace다
    expect(replace).toHaveBeenCalledWith("/onboarding");
  });

  it("가입이 실패하면 알리고 그 자리에 남는다", async () => {
    vi.stubGlobal(
      "fetch",
      vi
        .fn()
        .mockResolvedValue(
          Response.json({ errorCode: "MEMBER_409_ALREADY_HAVE_NICKNAME" }, { status: 409 }),
        ),
    );

    renderWith();
    goToNicknameStep();
    fireEvent.change(screen.getByLabelText("닉네임"), { target: { value: "보리" } });
    fireEvent.click(screen.getByRole("button", { name: "다음으로" }));

    await waitFor(() => expect(toastAppError).toHaveBeenCalled());
    expect(toastAppError.mock.calls[0]?.[0]).toBe("member.nicknameTaken");
    expect(replace).not.toHaveBeenCalled();
    // 다시 시도할 수 있어야 한다
    expect(screen.getByRole("button", { name: "다음으로" }).hasAttribute("disabled")).toBe(false);
  });
});

// `disabled`는 "안 눌린다"만 말한다. 가입은 토큰 교체까지 도는 왕복이라, 왜 안 눌리는지
// 보이지 않으면 다시 누르게 된다
it("가입 요청이 도는 동안 처리 중임을 알린다", async () => {
  vi.stubGlobal("fetch", vi.fn().mockReturnValue(new Promise(() => {})));
  renderWith();
  goToNicknameStep();
  fireEvent.change(screen.getByLabelText("닉네임"), { target: { value: "보리" } });

  fireEvent.click(screen.getByRole("button", { name: "다음으로" }));

  await waitFor(() => expect(screen.getByRole("status", { name: "처리 중" })).toBeDefined());
  // 자리를 지켜야 버튼 폭이 흔들리지 않는다
  expect(screen.getByText("다음으로").className).toContain("invisible");
});
