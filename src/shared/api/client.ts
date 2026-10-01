// 백엔드 REST API 공통 fetch 래퍼. base URL·헤더·쿼리 조립과 401 재발급 처리를 한 곳으로 모은다.
import { clearTokens, getAccessToken, getRefreshToken, saveTokens } from "./token-store";

// 실패 응답 규격: Spring 표준 ProblemDetail(RFC 9457, 구 RFC 7807). timestamp·traceId는 응답에 포함되지 않는다.
// errorCode·fieldErrors는 백엔드 common-core GlobalExceptionHandler가 붙이는 확장 필드다.
export interface ProblemFieldError {
  field: string;
  reason: string;
}

export interface ProblemDetail {
  type?: string;
  title?: string;
  status?: number;
  detail?: string;
  instance?: string;
  errorCode?: string;
  fieldErrors?: ProblemFieldError[];
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

// Bean Validation 실패(COMMON_400)만 fieldErrors를 갖는다. 폼이 필드별 문구를 붙일 때 쓴다.
export function isValidationError(
  error: unknown,
): error is ApiError & { problem: ProblemDetail & { fieldErrors: ProblemFieldError[] } } {
  return (
    error instanceof ApiError &&
    error.status === 400 &&
    Array.isArray(error.problem?.fieldErrors) &&
    error.problem.fieldErrors.length > 0
  );
}

// 한 요청이 기다리는 최대 시간. 서버가 응답을 붙잡고 있으면 조회 화면이 스켈레톤에서 넘어가지 못한다 (#511).
export const REQUEST_TIMEOUT_MS = 10_000;

// REQUEST_TIMEOUT_MS가 지나 fetch가 끊긴 경우다. `AbortSignal.timeout`은 이 이름의 DOMException으로 끊는다.
export function isTimeoutError(error: unknown): boolean {
  return error instanceof DOMException && error.name === "TimeoutError";
}

// TanStack Query 기본 retry에 넘기는 판단. 4xx는 다시 보내도 같은 답이 오므로 재시도하지 않는다.
// 시간 초과도 재시도하지 않는다. 10초 동안 답이 없던 서버는 다시 보내도 막혀 있기 쉽고, 그만큼 스켈레톤이 두 배로 남는다.
// 5xx와 네트워크 오류(ApiError가 아닌 TypeError 등)만 1회 더 시도한다.
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1 || isTimeoutError(error)) {
    return false;
  }
  return !(error instanceof ApiError && error.status < 500);
}

type QueryPrimitive = string | number | boolean;
type QueryValue = QueryPrimitive | QueryPrimitive[] | null | undefined;
export type QueryParams = Record<string, QueryValue>;

interface ApiRequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  // 쿼리 스트링. undefined·null은 빼고, 배열은 같은 키를 반복한다 (Spring 기본 바인딩과 동일).
  query?: QueryParams;
  // false면 Authorization을 붙이지 않는다. 권한 매트릭스의 PUBLIC 엔드포인트용.
  auth?: boolean;
}

interface TokenPair {
  accessToken: string;
  refreshToken: string;
}

const REFRESH_PATH = "/auths/token/refresh";

/**
 * base URL을 요청 시점에 해석한다. standalone 서버는 런타임에 주입된 환경변수를 읽어야 하므로
 * 모듈 로드 시점에 한 번만 계산해 두면 안 된다.
 *
 * **서버에서는 브라우저용 same-origin(`/api/v1`)으로 되돌아가지 않는다.** 서버의 `fetch`는
 * 현재 페이지 origin이라는 개념이 없어 상대 경로를 그대로 받으면 곧장 TypeError가 난다 —
 * 설정이 빠졌으면 알아보기 쉬운 오류로 바로 드러나야 조용히 실패하지 않는다.
 */
function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    // 변수를 빈 값으로 두는 경우까지 포함해 "비우면 /api/v1" 규칙을 지키기 위해 ??가 아니라 ||를 쓴다.
    return process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api/v1";
  }

  const serverBaseUrl = process.env.API_BASE_URL_INTERNAL?.trim();
  if (!serverBaseUrl || !isAbsoluteHttpUrl(serverBaseUrl)) {
    throw new Error(
      "서버 API 주소가 없거나 절대 URL이 아닙니다. API_BASE_URL_INTERNAL 환경변수를 확인하세요.",
    );
  }
  return serverBaseUrl;
}

// `/api/v1` 같은 상대 경로가 실수로 들어와도 여기서 걸러진다. 서버의 fetch는 상대 경로를
// 못 풀어 이 검증 없이 넘기면 나중에 훨씬 알아보기 어려운 TypeError로 터진다.
function isAbsoluteHttpUrl(value: string): boolean {
  try {
    const { protocol } = new URL(value);
    return protocol === "http:" || protocol === "https:";
  } catch {
    return false;
  }
}

export function buildQueryString(query: QueryParams | undefined): string {
  if (!query) {
    return "";
  }
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(query)) {
    if (value === undefined || value === null) {
      continue;
    }
    for (const item of Array.isArray(value) ? value : [value]) {
      params.append(key, String(item));
    }
  }
  const built = params.toString();
  return built ? `?${built}` : "";
}

// 모든 요청의 헤더는 여기서만 조립한다.
// FormData는 브라우저가 boundary를 포함한 Content-Type을 스스로 붙이므로 손대지 않는다.
function buildHeaders(headers: HeadersInit | undefined, body: unknown, auth: boolean): Headers {
  const built = new Headers(headers);
  const hasJsonBody = body !== undefined && !(body instanceof FormData);
  if (hasJsonBody && !built.has("Content-Type")) {
    built.set("Content-Type", "application/json");
  }
  const accessToken = auth ? getAccessToken() : null;
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

// 부른 쪽이 준 signal이 있으면 시간 제한과 함께 건다. 덮어쓰면 부른 쪽의 취소가 조용히 사라진다.
function withTimeout(signal: AbortSignal | null | undefined): AbortSignal {
  const timeout = AbortSignal.timeout(REQUEST_TIMEOUT_MS);
  return signal ? AbortSignal.any([signal, timeout]) : timeout;
}

function requestOnce(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, headers, query, auth = true, signal, ...rest } = options;

  return fetch(`${getApiBaseUrl()}${path}${buildQueryString(query)}`, {
    ...rest,
    signal: withTimeout(signal),
    headers: buildHeaders(headers, body, auth),
    body: body === undefined ? undefined : body instanceof FormData ? body : JSON.stringify(body),
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

  // 204만 걸러서는 모자란다. **본문 없이 200으로 끝내는 엔드포인트가 있다** — 장바구니 수량
  // 변경 명세가 약속하는 것이 `200 OK`뿐이다. 바로 `json()`을 부르면 빈 본문에서 던져
  // 성공한 요청이 실패로 뒤집히고, 낙관적으로 그려 둔 것이 되돌아간다.
  const body = await response.text();
  if (body.length === 0) {
    return undefined as TResponse;
  }

  return JSON.parse(body) as TResponse;
}

let refreshPromise: Promise<boolean> | null = null;

// 백엔드가 재발급에 rotation을 적용하므로, 같은 refreshToken으로 두 번 재발급하면
// 탈취로 간주돼 전 세션이 로그아웃된다. 동시 401은 반드시 하나의 재발급 호출을 공유한다.
// 게이트웨이가 JWT를 먼저 검증하므로 만료된 accessToken을 재발급 요청에 붙이지 않는다(auth: false).
// refreshToken이 없으면 await 없이 동기로 끝나므로, 안쪽 finally로 초기화하면 대입보다 먼저 실행돼
// 끝난 Promise가 refreshPromise에 남는다. 그러면 나중에 로그인해도 다음 401이 재발급을 건너뛴다.
// 대입 뒤에 같은 Promise인지 확인하고 비운다.
async function performRefresh(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) {
    return false;
  }
  try {
    const response = await requestOnce(REFRESH_PATH, {
      method: "POST",
      body: { refreshToken },
      auth: false,
    });
    saveTokens(await parseResponse<TokenPair>(response, REFRESH_PATH));
    return true;
  } catch {
    clearTokens();
    return false;
  }
}

function refreshTokens(): Promise<boolean> {
  if (refreshPromise) {
    return refreshPromise;
  }
  const pending = performRefresh();
  refreshPromise = pending;
  void pending.finally(() => {
    if (refreshPromise === pending) {
      refreshPromise = null;
    }
  });
  return pending;
}

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const needsAuth = options.auth !== false && path !== REFRESH_PATH;

  // 새로고침하면 메모리의 accessToken만 사라지고 refreshToken은 남는다. 그대로 보내면 첫 화면 요청이
  // 전부 401을 받은 뒤에야 재발급하므로, 재발급을 먼저 받고 보낸다 (#642). 동시 요청은 같은 재발급을
  // 기다린다. 재발급이 실패하면 토큰 없이 보내 지금처럼 401로 끝난다.
  if (needsAuth && !getAccessToken() && getRefreshToken()) {
    await refreshTokens();
  }

  const response = await requestOnce(path, options);

  const shouldRefresh = response.status === 401 && needsAuth;
  if (shouldRefresh && (await refreshTokens())) {
    return parseResponse<TResponse>(await requestOnce(path, options), path);
  }

  return parseResponse<TResponse>(response, path);
}
