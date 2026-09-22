// 리뷰 작성·내 후기가 부르는 요청을 가로채 정해진 답을 준다.
//
// 작성 화면은 상품 요약·아이 목록·내 정보를 받고 등록·사진 발급을 보낸다(#291). 세우지 않으면
// 백엔드가 떠 있느냐에 따라 같은 테스트가 로컬과 CI에서 달라진다. 아이 목록은
// `stubPetCatalog`, 내 정보는 `stubMemberProfile`이 맡고 여기서는 상품·리뷰만 세운다.
// 무엇을 보내는지는 단위 테스트(`entities/review/api/reviews.test.ts`)가 본다.
//
// `**/api/v1/...`로 좁힌다. `**/products/*`로 두면 상품 상세 페이지 이동까지 가로챈다.

import type { Page } from "@playwright/test";

const PRODUCT = {
  productId: 7,
  timeDealItemId: null,
  summary: {
    images: [],
    productName: "오메가3 피쉬오일 60캡슐",
    price: 21000,
    originalPrice: 24000,
    discountRate: 13,
    avgRating: 0,
    reviewCount: 0,
    soldOut: false,
  },
  detailInfo: {},
};

/** 같은 오리진의 가짜 S3 주소. 브라우저 PUT을 여기서 받아 200으로 답한다 */
const UPLOAD_PATH = "/e2e-s3-stub/reviews/member-1/uuid.jpg";

export async function stubReviewApi(page: Page) {
  await page.route("**/api/v1/products/*", (route) => route.fulfill({ json: PRODUCT }));
  // 아이 제품 관리 탭이 반응을 남길 수 있는 항목을 받는다(#345)
  await page.route("**/api/v1/reviews/feedbacks/pending", (route) =>
    route.fulfill({ json: { content: [] } }),
  );
  // 나의 상품 후기의 작성 가능 탭이 구매확정했는데 안 쓴 상품을 받는다(#349)
  await page.route("**/api/v1/reviews/writable", (route) =>
    route.fulfill({ json: { content: [] } }),
  );
  // 작성한 리뷰 상세가 한 건을 받는다(#363). 스모크 목록의 `/mypage/reviews/1`
  await page.route("**/api/v1/reviews/1", (route) =>
    route.fulfill({
      json: {
        reviewId: 1,
        isMine: true,
        product: { productId: 1, name: PRODUCT.summary.productName, image: null },
        petId: 3,
        rating: 4,
        usagePeriod: 16,
        answerValues: [],
        goodPoints: ["기호성 좋음"],
        badPoints: null,
        matchScore: null,
        text: "확실히 잘 먹어요",
        images: null,
        createdAt: "2026-09-21",
      },
    }),
  );
  await page.route("**/api/v1/reviews/me*", (route) =>
    route.fulfill({ json: { content: [], hasNext: false } }),
  );
  await page.route("**/api/v1/reviews/images/presigned-url", (route) =>
    route.fulfill({
      json: {
        uploadUrl: new URL(UPLOAD_PATH, route.request().url()).toString(),
        fileUrl: "https://image.leechs.shop/reviews/member-1/uuid.jpg",
      },
    }),
  );
  await page.route(`**${UPLOAD_PATH}`, (route) => route.fulfill({ status: 200, body: "" }));
  await page.route("**/api/v1/reviews", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 201, json: { reviewId: 1 } })
      : route.fallback(),
  );
}
