// 소셜 로그인 시작 주소를 만든다.
//
// **이 주소만 `/api/v1`이 아니다.** 게이트웨이가 일반 API(`/api/v1/**`)와 따로
// `/api/auth/oauth2/authorization/**`를 Spring Security OAuth2 클라이언트로 보낸다.
// 그래서 `NEXT_PUBLIC_API_BASE_URL`에서 파생할 수 없고 값을 따로 받는다.

/** 인증 정책상 카카오·구글 둘이다. SNS별로 완전히 별개 계정이다 */
export const SOCIAL_PROVIDERS = ["kakao", "google"] as const;

export type SocialProvider = (typeof SOCIAL_PROVIDERS)[number];

// 변수를 빈 값으로 두는 경우까지 포함해 "비우면 /api/auth" 규칙을 지키기 위해 ??가 아니라 ||를 쓴다.
const OAUTH_BASE_URL = process.env.NEXT_PUBLIC_OAUTH_BASE_URL?.trim() || "/api/auth";

/**
 * 소셜 로그인을 시작할 주소.
 *
 * fetch로 부르지 않고 브라우저를 통째로 보낸다. 인증 제공자 화면으로 리다이렉트되는
 * 흐름이라 XHR로는 따라갈 수 없다.
 */
export function socialLoginUrl(provider: SocialProvider): string {
  return `${OAUTH_BASE_URL}/oauth2/authorization/${provider}`;
}
