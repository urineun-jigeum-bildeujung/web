// 휴대폰 인증 발송·확인을 가로채 정해진 답을 준다.
//
// **문자는 양쪽 다 보내지 않지만 요청은 실제로 나간다(#247).** 세우지 않으면 로그인이
// 없어 401이고, 백엔드가 떠 있느냐에 따라 같은 테스트가 로컬과 CI에서 달라진다.
// 무엇을 보내는지는 단위 테스트(`verify-phone-view.test.tsx`)가 본다.

import type { Page } from "@playwright/test";

/** 서버에 고정된 인증번호. 화면이 받은 것처럼 채워 넣는 값과 같다 */
const FIXED_CODE = 584937;

export async function stubPhoneVerification(page: Page) {
  await page.route("**/auths/phone/verify-request", (route) =>
    route.fulfill({ json: { expiresInSeconds: 180 } }),
  );

  await page.route("**/auths/phone/verify-confirm", async (route) => {
    const body = route.request().postDataJSON() as { code: number };
    await route.fulfill({ json: { verified: body.code === FIXED_CODE } });
  });
}
