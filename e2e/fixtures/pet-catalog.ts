// 반려동물 선택지 조회를 가로채 정해진 답을 준다.
//
// **품종·건강 옵션이 서버에서 온다(#226).** 그대로 두면 백엔드가 떠 있느냐에 따라 같은
// 테스트가 로컬에서는 켜지고 CI에서는 빈 목록이 된다. 무엇을 보내는지와 응답을 어떻게 옮기는지는
// 단위 테스트(`entities/pet/api/health-options.test.ts`)가 보므로, 여기서는 화면 동작만 본다.
//
// 값은 실제 응답에서 옮겼다 — 로컬 백엔드로 받아 갈래 이름과 코드를 그대로 썼다.

import type { Page } from "@playwright/test";

const DOG_BREEDS = [
  { id: 1, breedName: "말티즈" },
  { id: 2, breedName: "말티푸" },
  { id: 3, breedName: "토이 푸들" },
  { id: 22, breedName: "비글" },
  { id: 35, breedName: "기타" },
];

const CAT_BREEDS = [
  { id: 36, breedName: "코리안 숏헤어" },
  { id: 50, breedName: "랙돌" },
  { id: 58, breedName: "기타" },
];

/** 갈래 이름이 종마다 다르다. 강아지에게 헤어볼을, 고양이에게 십자인대를 보이면 안 된다 */
const DOG_CONCERNS = [
  { category: "관절·뼈", items: ["슬개골 탈구", "관절염", "고관절 이형성증"] },
  { category: "체중·대사", items: ["과체중·비만", "체중 관리"] },
  { category: "구강 관리", items: ["치석·플라그", "잇몸 건강"] },
];

const CAT_CONCERNS = [
  { category: "신장", items: ["신장 건강", "만성 신장질환"] },
  { category: "스트레스 행동", items: ["과도한 그루밍", "배뇨 실수"] },
];

/** 서버가 묶음 없이 평평하게 준다 */
const ALLERGIES = [
  { code: "CHICKEN", displayName: "닭고기" },
  { code: "BEEF", displayName: "소고기" },
  { code: "DAIRY", displayName: "유제품" },
];

/**
 * 품종·건강 옵션 조회를 세운다. 조회를 쓰는 화면을 여는 테스트는 `goto` 전에 부른다.
 *
 * 등록(`POST /members/me/pets`)은 세우지 않는다. 그 화면까지 가는 테스트가 없고,
 * 무엇을 보내는지는 `to-register-request.test.ts`가 본다.
 */
export async function stubPetCatalog(page: Page) {
  await page.route("**/pets/breeds*", (route) =>
    route.fulfill({
      json: route.request().url().includes("CAT") ? CAT_BREEDS : DOG_BREEDS,
    }),
  );

  await page.route("**/pets/health-options*", (route) =>
    route.fulfill({
      json: {
        categories: route.request().url().includes("CAT") ? CAT_CONCERNS : DOG_CONCERNS,
        allergies: ALLERGIES,
      },
    }),
  );
}
