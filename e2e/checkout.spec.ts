// 결제: 필수 동의 전에는 결제할 수 없는지, 직접 입력 칸이 골랐을 때만 열리는지 본다.
import { expect, test, type Page } from "@playwright/test";

/**
 * 토스 결제위젯을 막는다.
 *
 * **결제창은 토스가 띄우는 외부 창이라 E2E가 끝까지 따라갈 수 없다.** 게다가 위젯이 뜨는지는
 * 키(`NEXT_PUBLIC_TOSS_CLIENT_KEY`)와 토스 서버 상태에 달려 있어, 그대로 두면 같은 테스트가
 * 로컬에서는 켜지고 CI에서는 잠긴다. 막아서 어디서 돌려도 같은 결과가 나오게 한다.
 *
 * 결제 버튼이 켜지는 데까지는 위젯을 목으로 바꾼 단위 테스트(`checkout-view.test.tsx`)가,
 * 위젯이 실제로 결제창을 띄우는지는 `toss-payment-widget.test.tsx`가 본다.
 */
async function blockTossPayments(page: Page) {
  await page.route("**/*.tosspayments.com/**", (route) => route.abort());
}

const REQUIRED = [
  "[필수] 주문 상품 정보 동의",
  "[필수] 개인정보 제3자 제공 동의",
  "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
];

// 결제는 되돌릴 수 없다. 동의 없이 눌리면 무엇에 동의했는지 모르는 채로 돈이 나간다.
test("필수 약관에 동의하기 전에는 결제할 수 없다", async ({ page }) => {
  await blockTossPayments(page);
  await page.goto("/payment");

  const pay = page.getByRole("button", { name: "결제하기" });
  await expect(pay).toBeDisabled();

  for (const label of REQUIRED) {
    await page.getByLabel(label).click();
  }

  await expect(page.getByLabel(REQUIRED[0])).toHaveAttribute("data-state", "checked");
});

// 위젯을 못 띄우면 결제할 방법이 없다. 버튼이 켜져 있으면 눌러도 아무 일이 없어 고장으로 읽힌다.
test("결제 수단을 못 불러오면 동의를 다 해도 결제 버튼이 잠긴 채다", async ({ page }) => {
  await blockTossPayments(page);
  await page.goto("/payment");

  for (const label of REQUIRED) {
    await page.getByLabel(label).click();
  }

  // Next의 라우트 안내자도 role="alert"를 달고 있어 문구로 좁힌다
  await expect(
    page.getByRole("alert").filter({ hasText: "결제 수단을 불러오지 못했어요" }),
  ).toBeVisible();
  await expect(page.getByRole("button", { name: "결제하기" })).toBeDisabled();
});

test("전체 동의 한 번으로 네 줄이 켜진다", async ({ page }) => {
  await page.goto("/payment");

  await page.getByLabel("[전체 동의]").click();

  for (const label of [...REQUIRED, "[선택] 다음 주문을 위해 이 결제 수단 저장"]) {
    await expect(page.getByLabel(label)).toHaveAttribute("data-state", "checked");
  }
});

// 시안(paym_001_직접입력)은 고른 뒤에만 칸을 연다
test("직접 입력을 고르면 100자 제한 칸이 열린다", async ({ page }) => {
  await page.goto("/payment");

  const field = page.getByLabel("배송 요청사항 직접 입력");
  await expect(field).toBeHidden();

  await page.getByRole("combobox", { name: "배송 요청사항" }).click();
  await page.getByRole("option", { name: "직접 입력" }).click();

  await expect(field).toBeVisible();
  await expect(field).toHaveAttribute("maxlength", "100");
  await expect(page.getByText("0/100자")).toBeVisible();
});

// 주문번호는 문의할 때 사용자가 대는 유일한 식별자다.
test("주문 완료에 주문번호와 주문 상세로 가는 길이 있다", async ({ page }) => {
  await page.goto("/payment/done");

  await expect(page.getByText("20260829-1234567")).toBeVisible();
  await expect(page.getByRole("link", { name: "주문 상세 보기" })).toBeVisible();
  await expect(page.getByRole("link", { name: "홈으로 가기" })).toBeVisible();
});
