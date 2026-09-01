// 백엔드 REST API 공통 fetch 래퍼. base URL과 헤더 조립을 한 곳으로 모은다.

// 백엔드 공통 에러 규격 확정 전의 최소 형태. 규격이 정해지면 응답 본문 파싱을 여기에 붙인다.
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
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
    throw new ApiError(response.status, `API 요청 실패 (${response.status} ${path})`);
  }

  if (response.status === 204) {
    return undefined as TResponse;
  }

  return (await response.json()) as TResponse;
}
