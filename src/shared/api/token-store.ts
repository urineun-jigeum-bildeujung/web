// 인증 토큰 보관소. accessToken은 메모리, refreshToken은 localStorage에 둔다.

// refreshToken은 새로고침에도 남아야 해 localStorage를 쓴다. httpOnly 쿠키는 백엔드가
// WebView 구글 로그인 차단 정책으로 리다이렉트 쿼리 방식을 확정하면서 제외됐다.
// 웹뷰에서도 토큰은 웹이 보관하고 재발급도 웹만 한다. 네이티브는 딥링크를 웹뷰 URL로 넘기기만 한다.
const REFRESH_TOKEN_KEY = "gollaju.refreshToken";

let accessToken: string | null = null;

type TokensClearedListener = () => void;
const clearedListeners = new Set<TokensClearedListener>();

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

// 로그인 여부. accessToken은 새로고침하면 사라지므로 refreshToken 유무로 판단한다.
export function hasSession(): boolean {
  return getAccessToken() !== null || getRefreshToken() !== null;
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
  const hadSession = hasSession();
  accessToken = null;
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(REFRESH_TOKEN_KEY);
    } catch {
      // 제거 실패는 무시한다. 다음 재발급 시도에서 무효 토큰으로 걸러진다.
    }
  }
  // 재발급 실패(탈취 감지 포함)로 세션이 끝났을 때 로그인 이동·캐시 비우기 같은 앱 정책이 반응할 자리다.
  // 이미 비어 있던 경우까지 알리면 로그아웃 뒤 매 요청마다 리스너가 울린다.
  if (hadSession) {
    for (const listener of clearedListeners) {
      listener();
    }
  }
}

// 토큰이 지워질 때 알림을 받는다. 반환값을 부르면 구독을 끊는다.
export function subscribeTokensCleared(listener: TokensClearedListener): () => void {
  clearedListeners.add(listener);
  return () => {
    clearedListeners.delete(listener);
  };
}
