// 상품 상세 Nutrition 실제 응답 연결의 상태 처리를 합성 API로 검증한다.
import { expect, test } from "@playwright/test";
import { signIn } from "./fixtures/session";
import { stubPetCatalog } from "./fixtures/pet-catalog";

test.beforeEach(async ({ page }) => {
  await signIn(page);
  await stubPetCatalog(page);
});

test("아이·상품 ID로 받은 값만 영양 막대에 표시한다", async ({ page }, testInfo) => {
  const requests: unknown[] = [];
  await page.route("**/nutrition/analyze/by-service-id", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({
      json: {
        nutrition_items: [
          {
            nutrient_code: "CRUDE_PROTEIN",
            value: 31,
            unit: "PERCENT",
            nias_min: 18,
            nias_max: 50,
          },
        ],
      },
    });
  });
  await page.goto("/products/1");
  const panel = page.getByRole("region", { name: "영양 성분 분석" });
  await expect(panel.getByText("31%")).toBeVisible();
  await expect(panel.getByText("28%")).toHaveCount(0);
  expect(requests).toEqual([{ pet_id: 3, product_id: 1 }]);
  await testInfo.attach("nutrition-desktop", {
    body: await panel.screenshot(),
    contentType: "image/png",
  });
  await page.setViewportSize({ width: 393, height: 852 });
  await expect(panel.getByText("31%")).toBeVisible();
  await testInfo.attach("nutrition-mobile", {
    body: await panel.screenshot(),
    contentType: "image/png",
  });
  await page.getByRole("combobox", { name: "적합도 기준이 되는 아이" }).click();
  await page.getByRole("option", { name: "보리 기준으로 보기" }).click();
  await expect(panel.getByText("31%")).toHaveCount(0);
  await expect(panel.getByText("보리 기준으로는 아직 분석하지 못했어요.")).toBeVisible();
  expect(requests).toHaveLength(1);
});

test("실패와 빈 결과를 구분하고 다시 시도한다", async ({ page }) => {
  let fail = true;
  await page.route("**/nutrition/analyze/by-service-id", (route) =>
    route.fulfill(
      fail
        ? { status: 422, json: { detail: "SERVICE_SOURCE_INVALID" } }
        : { json: { nutrition_items: [] } },
    ),
  );
  await page.goto("/products/1");
  const panel = page.getByRole("region", { name: "영양 성분 분석" });
  await expect(panel.getByRole("alert")).toBeVisible();
  await expect(panel.getByText("28%")).toHaveCount(0);
  fail = false;
  await panel.getByRole("button", { name: "다시 시도" }).click();
  await expect(panel.getByRole("alert")).toHaveCount(0);
  await expect(panel.getByText("코코 기준으로는 아직 분석하지 못했어요.")).toBeVisible();
});

test("같은 종의 아이를 바꾸면 대기 중 이전 값 없이 새 기준으로 받는다", async ({ page }) => {
  await page.route("**/members/me/pets/7", (route) =>
    route.fulfill({
      json: {
        petId: 7,
        name: "보리",
        species: "DOG",
        breedId: 1,
        breedName: "말티즈",
        age: 2,
        birthDate: "2024-03-15",
        sex: "MALE",
        isNeutered: false,
        size: "SMALL",
        weight: 4,
        bcs: 3,
        healthConcerns: [],
        allergies: [],
        allergyProfileStatus: "KNOWN_NONE",
        isDefault: false,
      },
    }),
  );
  let release: () => void = () => {};
  const held = new Promise<void>((resolve) => {
    release = resolve;
  });
  await page.route("**/nutrition/analyze/by-service-id", async (route) => {
    const { pet_id } = route.request().postDataJSON();
    if (pet_id === 7) await held;
    await route.fulfill({
      json: {
        nutrition_items: [
          {
            nutrient_code: "CRUDE_PROTEIN",
            value: pet_id === 7 ? 40 : 30,
            unit: "PERCENT",
            nias_min: 18,
            nias_max: 50,
          },
        ],
      },
    });
  });
  await page.goto("/products/1");
  const panel = page.getByRole("region", { name: "영양 성분 분석" });
  await expect(panel.getByText("30%")).toBeVisible();
  await page.getByRole("combobox", { name: "적합도 기준이 되는 아이" }).click();
  await page.getByRole("option", { name: "보리 기준으로 보기" }).click();
  try {
    await expect(panel.getByRole("status", { name: "영양 분석을 불러오는 중" })).toBeVisible();
    await expect(panel.getByText("30%")).toHaveCount(0);
  } finally {
    release();
  }
  await expect(panel.getByText("40%")).toBeVisible();
});

test("로그인 전에는 영양 API를 부르지 않는다", async ({ browser }) => {
  const context = await browser.newContext();
  const page = await context.newPage();
  const requests: unknown[] = [];
  await page.route("**/nutrition/analyze/by-service-id", (route) => {
    requests.push(route.request().postDataJSON());
    return route.fulfill({ json: { nutrition_items: [] } });
  });
  try {
    await page.goto("http://localhost:3100/products/1");
    await expect(
      page.getByRole("region", { name: "영양 성분 분석" }).getByText("28%"),
    ).toBeVisible();
    expect(requests).toHaveLength(0);
  } finally {
    await context.close();
  }
});
