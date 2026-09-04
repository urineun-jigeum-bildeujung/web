// 로그인·회원가입: 전체 동의가 하위를 켜는지, 필수를 채워야 넘어가는지 본다.
import { expect, test } from "@playwright/test";

test("아이디와 비밀번호를 채워야 로그인 버튼이 켜진다", async ({ page }) => {
  await page.goto("/login");

  const submit = page.getByRole("button", { name: "로그인" });
  await expect(submit).toBeDisabled();

  await page.getByLabel("아이디").fill("gollaju");
  await page.getByLabel("비밀번호").fill("pw123456");
  await expect(submit).toBeEnabled();
});

test("소셜은 카카오와 구글 둘만 둔다", async ({ page }) => {
  await page.goto("/login");

  await expect(page.getByRole("button", { name: "카카오로 시작하기" })).toBeVisible();
  await expect(page.getByRole("button", { name: "구글로 시작하기" })).toBeVisible();
  // 시안에는 넷이 그려져 있으나 카카오·구글로 확정됐다
  await expect(page.getByRole("button", { name: /네이버|애플/ })).toHaveCount(0);
});

test("전체 동의를 누르면 하위가 한꺼번에 체크된다", async ({ page }) => {
  await page.goto("/signup");

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
  await page.goto("/signup");

  // 시안이 "체크에 영향 없는 터치 영역"으로 표시해 둔 자리다
  await page.getByText("아이의 건강 데이터 활용을 위해 꼭 필요해요").click();

  await expect(
    page.getByRole("checkbox", { name: "개인정보 수집 및 이용 동의" }),
  ).not.toBeChecked();
});

test("약관 단계를 지나 닉네임으로 갔다가 뒤로가기로 돌아온다", async ({ page }) => {
  await page.goto("/signup");

  await page.getByRole("checkbox", { name: "[필수] 서비스 이용약관 전체 동의" }).click();
  await page.getByRole("button", { name: "다음으로" }).click();
  await expect(page).toHaveURL(/step=nickname/);

  await page.goBack();
  // 회원가입을 떠나지 않고 약관 단계로 돌아온다
  await expect(page).toHaveURL(/\/signup/);
  await expect(page.getByText("안전하게 약관에 동의해 주세요.")).toBeVisible();
});
