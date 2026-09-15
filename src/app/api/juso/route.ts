// 행정안전부 도로명주소 검색을 대신 불러 준다. 승인키를 브라우저로 내보내지 않기 위한 통로다.
//
// 행안부는 CORS를 열어 두어 브라우저에서 직접 불러도 되지만, 그러면 `confmKey`가 클라이언트 번들에 박힌다.
// 여기서만 읽고 결과만 넘긴다.
//
// **행안부는 실패도 HTTP 200으로 준다.** `results.common.errorCode`를 보고 갈라야 한다.
// 실패는 우리 `ProblemDetail`(RFC 9457) 규격으로 옮겨, 화면이 `toAppMessageCode`를 그대로 쓰게 한다.

import type { ProblemDetail } from "@/shared/api/client";

const JUSO_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

/** 행안부 응답 중 우리가 쓰는 것만. 필드는 24개지만 화면에 그리는 것은 넷이다 */
type JusoResponse = {
  results: {
    common: {
      errorCode: string;
      errorMessage: string;
      totalCount: string;
      currentPage: string | number;
    };
    juso:
      | {
          zipNo: string;
          roadAddr: string;
          jibunAddr: string;
          bdNm: string;
        }[]
      | null;
  };
};

/**
 * 행안부 오류를 우리 규격으로 옮긴다.
 *
 * `errorCode`에 `JUSO_` 접두사를 붙이는 이유는 `MESSAGE_BY_ERROR_CODE`가 백엔드 코드를 담는 표라서다.
 * `E0006`을 그대로 넣으면 어느 서버의 코드인지 읽는 사람이 알 수 없다.
 */
const PROBLEM_BY_JUSO_CODE: Record<string, { status: number; errorCode: string }> = {
  // 승인키가 잘못됐다. 사용자가 할 수 있는 일이 없는 우리 설정 문제다
  E0001: { status: 500, errorCode: "JUSO_500_INVALID_KEY" },
  // 검색어가 너무 넓다 (`서울` 등)
  E0006: { status: 400, errorCode: "JUSO_400_KEYWORD_TOO_BROAD" },
  // 두 글자 미만. 화면이 이미 막고 있어 사용자가 볼 일은 없다
  E0008: { status: 400, errorCode: "JUSO_400_KEYWORD_TOO_SHORT" },
  // 문자와 숫자를 같이 넣어야 한다 (`123` 등)
  E0009: { status: 400, errorCode: "JUSO_400_KEYWORD_INVALID" },
};

function problemResponse(status: number, errorCode: string, detail: string) {
  const problem: ProblemDetail = { status, errorCode, detail, title: errorCode };
  return Response.json(problem, { status });
}

export async function GET(request: Request) {
  const confmKey = process.env.JUSO_CONFM_KEY;

  if (!confmKey) {
    // 키 값 자체는 응답에 담지 않는다. 없다는 사실만 알린다
    return problemResponse(500, "JUSO_500_INVALID_KEY", "주소 검색 승인키가 설정되지 않았습니다.");
  }

  const requested = new URL(request.url).searchParams;

  const query = new URLSearchParams({
    confmKey,
    keyword: requested.get("keyword") ?? "",
    currentPage: requested.get("currentPage") ?? "1",
    countPerPage: requested.get("countPerPage") ?? "10",
    resultType: "json",
  });

  let response: Response;
  try {
    response = await fetch(`${JUSO_ENDPOINT}?${query}`);
  } catch {
    // 행안부에 닿지도 못했다. 원인 문자열은 남기지 않는다 — 요청 URL에 키가 들어 있다
    return problemResponse(502, "JUSO_502_UPSTREAM", "주소 검색 서버에 연결하지 못했습니다.");
  }

  if (!response.ok) {
    return problemResponse(502, "JUSO_502_UPSTREAM", "주소 검색 서버가 응답하지 않았습니다.");
  }

  const body = (await response.json()) as JusoResponse;
  const { common, juso } = body.results;

  if (common.errorCode !== "0") {
    const mapped = PROBLEM_BY_JUSO_CODE[common.errorCode] ?? {
      status: 502,
      errorCode: "JUSO_502_UPSTREAM",
    };
    return problemResponse(mapped.status, mapped.errorCode, common.errorMessage);
  }

  return Response.json({
    // 행안부는 필드를 24개 준다. 화면이 그리는 넷만 추려 보낸다 — 나머지는 브라우저로 보낼 이유가 없다.
    // 필요해지면(상세주소 API의 `admCd` 등) 그때 여기에 더한다
    items: (juso ?? []).map(({ zipNo, roadAddr, jibunAddr, bdNm }) => ({
      zipNo,
      roadAddr,
      jibunAddr,
      // 건물명이 없으면 빈 문자열로 온다. 우리 타입은 없을 수 있는 값이라 undefined로 맞춘다
      bdNm: bdNm || undefined,
    })),
    totalCount: Number(common.totalCount),
    currentPage: Number(common.currentPage),
  });
}
