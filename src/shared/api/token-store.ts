// 인증 토큰 보관소. accessToken은 메모리, refreshToken은 localStorage에 둔다.

// refreshToken은 새로고침에도 남아야 해 localStorage를 쓴다. httpOnly 쿠키는 백엔드가
// WebView 구글 로그인 차단 정책으로 리다이렉트 쿼리 방식을 확정하면서 제외됐다.
const REFRESH_TOKEN_KEY = "gollaju.refreshToken";

let accessToken: string | null = null;

export function getAccessToken(): string | null {
  return accessToken;
}

export function getRefreshToken(): string | null {
  if (typeof window === "undefined") {
    return null;
  }
  try {
    return window.localStorage.getItem(REFRESH_TOKEN_KEY);
  } catch {
    return null;
  }
}

export function saveTokens(tokens: { accessToken: string; refreshToken: string }): void {
  accessToken = tokens.accessToken;
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.setItem(REFRESH_TOKEN_KEY, tokens.refreshToken);
  } catch {
    // 시크릿 모드 등 저장 불가 환경에서는 세션 동안 메모리 토큰으로만 동작한다.
  }
}

export function clearTokens(): void {
  accessToken = null;
  if (typeof window === "undefined") {
    return;
  }
  try {
    window.localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch {
    // 제거 실패는 무시한다. 다음 재발급 시도에서 무효 토큰으로 걸러진다.
  }
}
