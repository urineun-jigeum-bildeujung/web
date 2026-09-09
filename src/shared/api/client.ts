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

// TanStack Query 기본 retry에 넘기는 판단. 4xx는 다시 보내도 같은 답이 오므로 재시도하지 않는다.
// 5xx와 네트워크 오류(ApiError가 아닌 TypeError 등)만 1회 더 시도한다.
export function shouldRetryQuery(failureCount: number, error: unknown): boolean {
  if (failureCount >= 1) {
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

// 변수를 빈 값으로 두는 경우까지 포함해 "비우면 /api/v1" 규칙을 지키기 위해 ??가 아니라 ||를 쓴다.
const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL?.trim() || "/api/v1";

const REFRESH_PATH = "/auths/token/refresh";

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

function requestOnce(path: string, options: ApiRequestOptions): Promise<Response> {
  const { body, headers, query, auth = true, ...rest } = options;

  return fetch(`${API_BASE_URL}${path}${buildQueryString(query)}`, {
    ...rest,
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

  return (await response.json()) as TResponse;
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
  const response = await requestOnce(path, options);

  const shouldRefresh = response.status === 401 && options.auth !== false && path !== REFRESH_PATH;
  if (shouldRefresh && (await refreshTokens())) {
    return parseResponse<TResponse>(await requestOnce(path, options), path);
  }

  return parseResponse<TResponse>(response, path);
}
