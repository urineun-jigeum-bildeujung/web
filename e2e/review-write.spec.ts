// 리뷰 작성: 두 단계를 거쳐 등록되는지, 사진을 붙였다 뺄 수 있는지 본다.
import { expect, test } from "@playwright/test";

import { stubMemberProfile } from "./fixtures/member-profile";
import { stubPetCatalog } from "./fixtures/pet-catalog";
import { stubReviewApi } from "./fixtures/review";

const PATH = "/mypage/reviews/write?productId=7";

// 1×1 투명 PNG. 실제 파일 없이 첨부를 시험한다
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==",
  "base64",
);

type Page = import("@playwright/test").Page;

// 아이 목록·내 정보·상품 요약을 서버에서 받고 등록을 보낸다(#291). 백엔드에 흔들리지 않게 세운다
test.beforeEach(async ({ page }) => {
  await stubPetCatalog(page);
  await stubMemberProfile(page);
  await stubReviewApi(page);
});

/** 같은 이름의 보기가 여러 묶음에 있어 묶음을 먼저 좁힌다 */
async function pickResponse(page: Page, group: string, option: string) {
  await page.getByRole("radiogroup", { name: group }).getByText(option, { exact: true }).click();
}

/** 1단계 필수를 채우고 다음으로 넘어간다 */
async function goToDetail(page: Page) {
  await page.getByRole("radio", { name: "5점 만점에 4.5점" }).click();
  await page.getByLabel("사용 기간").fill("16");
  // 반응은 선택이지만 서버가 하나 이상을 요구해 하나는 답한다. 요약 카드에 실리는지도 본다
  await pickResponse(page, "잘 먹었나요?", "잘 먹어요");
  await page.getByRole("button", { name: "다음" }).click();
}

test("별점·사용 기간·아이·후기를 채워야 등록되고, 단계는 뒤로가기로 돌아온다", async ({ page }) => {
  await page.goto(PATH);

  const next = page.getByRole("button", { name: "다음" });
  await expect(next).toBeDisabled();
  await goToDetail(page);
  await expect(page).toHaveURL(/step=detail/);

  // 1단계에서 답한 것이 요약 카드에 보인다
  await expect(page.getByText("16일째 사용 중")).toBeVisible();
  await expect(page.getByText("잘 먹어요")).toBeVisible();

  const submit = page.getByRole("button", { name: "등록하기" });
  await expect(submit).toBeDisabled();
  // 아이 목록은 `stubPetCatalog`의 것이다
  await page.getByRole("radio", { name: "코코" }).click();
  await page.getByLabel("후기").fill("확실히 예전보다 계단 오를 때 덜 힘들어해요");
  await expect(submit).toBeEnabled();

  // 기기 뒤로가기로 1단계에 돌아온다
  await page.goBack();
  await expect(page.getByRole("radiogroup", { name: "상품 만족도" })).toBeVisible();
  await page.goForward();

  // 등록 요청이 실제로 나가는지 함께 본다
  const posted = page.waitForRequest(
    (request) => request.url().endsWith("/api/v1/reviews") && request.method() === "POST",
  );
  await submit.click();
  const body = (await posted).postDataJSON() as { productId: number; petId: number };
  expect(body).toMatchObject({ productId: 7, petId: 3 });
  await expect(page.getByText("소중한 리뷰 감사해요!")).toBeVisible();
  await page.getByRole("link", { name: "확인" }).click();
  await expect(page).toHaveURL(/\/mypage\/reviews\?tab=written/);
});

test("사진은 세 장까지 붙이고 뺄 수 있다", async ({ page }) => {
  await page.goto(`${PATH}&step=detail`);

  // 더하는 칸은 사진첩·카메라를 고르는 시트를 연다(#296). 확인은 닫기만 한다
  await page.getByRole("button", { name: "사진 추가 (0/3)" }).click();
  const sheet = page.getByRole("dialog", { name: "사진 첨부하기" });
  await expect(sheet).toBeVisible();
  await expect(sheet.getByRole("button", { name: "카메라" })).toBeEnabled();
  await sheet.getByRole("button", { name: "확인" }).click();
  await expect(sheet).toBeHidden();

  // CSS 셀렉터 대신 접근성 이름으로 찾는다. DOM이 바뀌어도 이름은 남는다.
  // 파일창은 자동화로 못 열어 사진첩 입력에 바로 넣는다
  const input = page.getByLabel("사진첩에서 고르기");
  await input.setInputFiles([
    { name: "a.png", mimeType: "image/png", buffer: PNG },
    { name: "b.png", mimeType: "image/png", buffer: PNG },
    { name: "c.png", mimeType: "image/png", buffer: PNG },
  ]);

  await expect(page.getByRole("button", { name: /사진 빼기/ })).toHaveCount(3);
  // 다 채우면 더할 자리가 사라진다
  await expect(page.getByRole("button", { name: /사진 추가/ })).toHaveCount(0);

  await page.getByRole("button", { name: "1번째 사진 빼기" }).click();
  await expect(page.getByRole("button", { name: /사진 빼기/ })).toHaveCount(2);
  await expect(page.getByRole("button", { name: "사진 추가 (2/3)" })).toBeAttached();
});
