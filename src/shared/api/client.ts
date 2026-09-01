// 백엔드 REST API 공통 fetch 래퍼. base URL과 헤더 조립을 한 곳으로 모은다.

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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? "/api/v1";

// 모든 요청의 헤더는 여기서만 조립한다. 인증(JWT) 방식이 확정되면 이 함수에만 추가한다.
function buildHeaders(headers: HeadersInit | undefined, hasBody: boolean): Headers {
  const built = new Headers(headers);
  if (hasBody && !built.has("Content-Type")) {
    built.set("Content-Type", "application/json");
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

export async function apiRequest<TResponse>(
  path: string,
  options: ApiRequestOptions = {},
): Promise<TResponse> {
  const { body, headers, ...rest } = options;
  const hasBody = body !== undefined;

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    headers: buildHeaders(headers, hasBody),
    body: hasBody ? JSON.stringify(body) : undefined,
  });

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
