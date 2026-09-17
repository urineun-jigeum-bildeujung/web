// 로그인·회원가입: 전체 동의가 하위를 켜는지, 필수를 채워야 넘어가는지 본다.
import { expect, test, type Page } from "@playwright/test";

/**
 * 회원가입 화면을 연다.
 *
 * **소셜 인증을 마친 사람만 닿는 곳이다(#215).** 가입 요청이 토큰의 `authId`로 누구의
 * 가입인지 알기 때문에, 토큰이 없으면 화면이 로그인으로 돌려보낸다. 교환을 마친 상태를 만든다.
 */
async function gotoSignup(page: Page, search = "") {
  await page.addInitScript(() => {
    window.localStorage.setItem("gollaju.refreshToken", "e2e-refresh-token");
  });
  await page.goto(`/signup${search}`);
}

test("아이디와 비밀번호를 채워야 로그인 버튼이 켜진다", async ({ page }) => {
  await page.goto("/login");

  const submit = page.getByRole("button", { name: "로그인" });
  await expect(submit).toBeDisabled();

  await page.getByLabel("아이디").fill("gollaju");
  await page.getByLabel("비밀번호").fill("pw123456");
  await expect(submit).toBeEnabled();
});

// 인증 제공자 화면으로 리다이렉트되는 흐름이라 버튼이 아니라 링크다
test("소셜은 카카오와 구글 둘만 두고 인가 시작 주소로 나간다", async ({ page }) => {
  await page.goto("/login");

  // 주소의 앞부분은 `NEXT_PUBLIC_OAUTH_BASE_URL`에 따라 달라진다. 비우면 same-origin이고
  // 로컬 백엔드를 보게 두면 절대 주소가 된다. 환경에 흔들리지 않게 끝부분만 본다
  await expect(page.getByRole("link", { name: "카카오로 시작하기" })).toHaveAttribute(
    "href",
    /\/api\/auth\/oauth2\/authorization\/kakao$/,
  );
  await expect(page.getByRole("link", { name: "구글로 시작하기" })).toHaveAttribute(
    "href",
    /\/api\/auth\/oauth2\/authorization\/google$/,
  );
  // 시안에는 넷이 그려져 있으나 카카오·구글로 확정됐다
  await expect(page.getByRole("link", { name: /네이버|애플/ })).toHaveCount(0);
});

test("전체 동의를 누르면 하위가 한꺼번에 체크된다", async ({ page }) => {
  await gotoSignup(page);

  const next = page.getByRole("button", { name: "다음으로" });
  await expect(next).toBeDisabled();

  await page.getByRole("checkbox", { name: "[필수] 서비스 이용약관 전체 동의" }).click();

  await expect(page.getByRole("checkbox", { name: "만 14세 이상입니다." })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "서비스 이용약관 동의" })).toBeChecked();
  await expect(page.getByRole("checkbox", { name: "개인정보 수집 및 이용 동의" })).toBeChecked();
  // 선택 항목까지 켜지지는 않는다
  await expect(
    page.getByRole("checkbox", { name: "맞춤 혜택 및 이벤트 알림 수신 동의" }),
  ).not.toBeChecked();

  await expect(next).toBeEnabled();
});

test("설명 문구를 눌러도 체크가 바뀌지 않는다", async ({ page }) => {
  await gotoSignup(page);

  // 시안이 "체크에 영향 없는 터치 영역"으로 표시해 둔 자리다
  await page.getByText("아이의 건강 데이터 활용을 위해 꼭 필요해요").click();

  await expect(
    page.getByRole("checkbox", { name: "개인정보 수집 및 이용 동의" }),
  ).not.toBeChecked();
});

test("약관 단계를 지나 닉네임으로 갔다가 뒤로가기로 돌아온다", async ({ page }) => {
  await gotoSignup(page);

  await page.getByRole("checkbox", { name: "[필수] 서비스 이용약관 전체 동의" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await expect(page).toHaveURL(/step=nickname/);

  await page.goBack();
  // 회원가입을 떠나지 않고 약관 단계로 돌아온다
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByText("안전하게 약관에 동의해 주세요.")).toBeVisible();
});

test("약관 없이 주소로 닉네임 단계에 들어갈 수 없다", async ({ page }) => {
  await gotoSignup(page, "?step=nickname");

  // 그대로 두면 동의 없이 가입이 끝난다
  await expect(
    page.getByRole("checkbox", { name: "[필수] 서비스 이용약관 전체 동의" }),
  ).toBeVisible();
  await expect(page.getByText("닉네임을 적어주세요")).toBeHidden();
});

test("닉네임은 비어 있는 채로 시작한다", async ({ page }) => {
  await gotoSignup(page);

  await page.getByRole("checkbox", { name: "[필수] 서비스 이용약관 전체 동의" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();

  await expect(page.getByLabel("닉네임")).toHaveValue("");
  await expect(page.getByRole("button", { name: "다음으로" })).toBeDisabled();
});
