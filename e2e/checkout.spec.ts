// 결제: 필수 동의 전에는 결제할 수 없는지, 직접 입력 칸이 골랐을 때만 열리는지 본다.
import { expect, test } from "@playwright/test";

const REQUIRED = [
  "[필수] 주문 상품 정보 동의",
  "[필수] 개인정보 제3자 제공 동의",
  "[필수] 결제 대행 서비스(PG) 이용 약관 동의",
];

// 결제는 되돌릴 수 없다. 동의 없이 눌리면 무엇에 동의했는지 모르는 채로 돈이 나간다.
test("필수 약관에 동의하면 결제하고 완료 화면으로 넘어간다", async ({ page }) => {
  await page.goto("/payment");

  const pay = page.getByRole("button", { name: "결제하기" });
  await expect(pay).toBeDisabled();

  for (const label of REQUIRED) {
    await page.getByLabel(label).click();
  }

  // 선택 항목은 켜지 않아도 결제로 넘어간다
  await expect(pay).toBeEnabled();

  // 버튼이 켜지는 데서 멈추면 결제 뒤에 어디로 가는지가 검증에서 빠진다
  await pay.click();
  await expect(page).toHaveURL(/\/payment\/done$/);
  await expect(page.getByRole("heading", { name: "주문을 무사히 마쳤어요" })).toBeVisible();
});

test("전체 동의 한 번으로 네 줄이 켜진다", async ({ page }) => {
  await page.goto("/payment");

  await page.getByLabel("전체 동의").click();

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
