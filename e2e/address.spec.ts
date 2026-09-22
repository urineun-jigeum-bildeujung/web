// 배송지 등록. 세 화면을 건너가며 값이 살아남는지, 저장하면 어디로 돌아가는지 본다.
//
// **단위 테스트로는 이 구간을 볼 수 없다.** 등록은 배송지 관리 → 폼 → 주소 검색 → 폼으로
// 라우트를 건너가는데, 오늘 고친 버그 둘이 정확히 그 틈에서 났다 (#382).
//
// - 저장하면 들어온 화면이 아니라 방금 떠난 주소 검색 화면으로 돌아갔다 (#369)
// - 검색을 다녀오면 먼저 적어 둔 이름·연락처가 사라졌다 (#370)
//
// 둘 다 새 배송지 등록은 전부 해당했는데 몇 달 동안 아무도 보지 못했다.

import { expect, test } from "@playwright/test";

import { stubAddressFlow } from "./fixtures/address";
import { stubMemberProfile } from "./fixtures/member-profile";

test("배송지를 등록하면 들어온 화면으로 돌아오고 적던 값이 살아남는다", async ({ page }) => {
  const saved: unknown[] = [];
  await stubMemberProfile(page);
  // 등록(POST)을 받으려면 프로필 스텁보다 나중에 걸어야 한다
  await stubAddressFlow(page, { saved });

  await page.goto("/mypage/address");
  await page.getByRole("link", { name: /장소 추가하기/ }).click();

  // **주소보다 이름을 먼저 적는다.** 이 순서가 #370이 났던 순서다
  await page.getByLabel("배송지 이름").fill("본가");
  await page.getByLabel("받는 분 이름").fill("전지호");
  await page.getByLabel("연락처").fill("01087654321");

  await page.getByRole("link", { name: /주소/ }).click();
  await expect(page).toHaveURL(/\/mypage\/address\/search/);

  await page.getByLabel("주소 검색어").fill("테헤란로 123");
  await page.getByRole("button", { name: "검색" }).click();
  await page.getByText("서울특별시 강남구 테헤란로 123 (역삼동)").click();
  await page.getByRole("button", { name: "입력 완료" }).click();

  // 돌아온 폼에 고른 주소가 차고, 먼저 적어 둔 값도 그대로다 (#370)
  await expect(page).toHaveURL(/\/mypage\/address\/new/);
  await expect(page.getByText("서울특별시 강남구 테헤란로 123 (역삼동)")).toBeVisible();
  await expect(page.getByLabel("배송지 이름")).toHaveValue("본가");
  await expect(page.getByLabel("받는 분 이름")).toHaveValue("전지호");
  await expect(page.getByLabel("연락처")).toHaveValue("01087654321");

  await page.getByLabel("상세 주소").fill("3층 301호");
  await page.getByRole("button", { name: "입력 완료" }).click();

  // 우편번호는 화면에 칸이 없지만 등록에 필수라 검색이 실어 보낸 값이 함께 나가야 한다
  await expect
    .poll(() => saved)
    .toEqual([
      {
        addressName: "본가",
        receiver: "전지호",
        phone: "01087654321",
        addressDetail: "3층 301호",
        deliveryNote: null,
        isDefault: false,
        zipCode: "06133",
        address: "서울특별시 강남구 테헤란로 123 (역삼동)",
      },
    ]);

  // 방금 떠난 주소 검색 화면이 아니라 들어온 화면으로 돌아온다 (#369)
  await expect(page).toHaveURL(/\/mypage\/address$/);
});
