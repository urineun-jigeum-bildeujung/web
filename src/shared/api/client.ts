// 백엔드 REST API 공통 fetch 래퍼. base URL·헤더 조립·401 재발급 처리를 한 곳으로 모은다.
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./token-store";

// 실패 응답 규격: Spring 표준 ProblemDetail(RFC 9457). timestamp·traceId는 응답에 포함되지 않는다.
export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
}

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly problem?: ProblemDetail,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

// 변수를 빈 값으로 두는 경우까지 포함해 "비우면 /api/v1" 규칙을 지키기 위해 ??가 아니라 ||를 쓴다.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api/v1";

const REFRESH_PATH = "/auths/token/refresh";

// 모든 요청의 헤더는 여기서만 조립한다.
function buildHeaders(headers: HeadersInit | undefined, hasBody: boolean): Headers {
  const built = new Headers(headers);
  if (hasBody && !built.has("Content-Type")) {
    built.set("Content-Type", "application/json");
  }
  const accessToken = getAccessToken();
  if (accessToken && !built.has("Authorization")) {
    built.set("Authorization", `Bearer ${accessToken}`);
  }
  return built;
}

// 게이트웨이 오류 등 ProblemDetail이 아닌 본문이 올 수 있어 파싱 실패는 undefined로 삼킨다.
async function parseProblemDetail(response: Response): Promise<ProblemDetail | undefined> {
  try {
    return (await response.json()) as ProblemDetail;
  } catch {
    return undefined;
  }
}

function requestOnce(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, headers, ...rest } = options;
  const hasBody = body !== undefined;

  return fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(headers, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });
}

async function parseResponse<TResponse>(response: Response, path: string): Promise<TResponse> {
  if (!response.ok) {
    const problem = await parseProblemDetail(response);
    throw new ApiError(
      response.status,
      problem?.detail ?? problem?.title ?? `API 요청 실패 (${response.status} ${path})`,
      problem,
    );
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}

let refreshPromise: Promise<boolean> | null = null;

// 백엔드가 재발급에 rotation을 적용하므로, 같은 refreshToken으로 두 번 재발급하면
// 탈취로 간주돼 전 세션이 로그아웃된다. 동시 401은 반드시 하나의 재발급 호출을 공유한다.
function refreshTokens(): Promise<boolean> {
  refreshPromise ??= (async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) {
      return false;
    }
    try {
      const response = await requestOnce(REFRESH_PATH, {
        method: "POST",
        body: { refreshToken },
      });
      saveTokens(await parseResponse<TokenPair>(response, REFRESH_PATH));
      return true;
    } catch {
      clearTokens();
      return false;
    } finally {
      refreshPromise = null;
    }
  })();
  return refreshPromise;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const response = await requestOnce(path, options);

  if (response.status === 401 && path !== REFRESH_PATH && (await refreshTokens())) {
    return parseResponse<TResponse>(await requestOnce(path, options), path);
  }

  return parseResponse<TResponse>(response, path);
}
