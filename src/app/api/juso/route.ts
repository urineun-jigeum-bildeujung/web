// 행정안전부 도로명주소 검색을 대신 불러 준다. 승인키를 브라우저로 내보내지 않기 위한 통로다.
//
// 행안부는 CORS를 열어 두어 브라우저에서 직접 불러도 되지만, 그러면 `confmKey`가 클라이언트 번들에 박힌다.
// 여기서만 읽고 결과만 넘긴다.
//
// **행안부는 실패도 HTTP 200으로 준다.** `results.common.errorCode`를 보고 갈라야 한다.
// 실패는 우리 `ProblemDetail`(RFC 9457) 규격으로 옮겨, 화면이 `toAppMessageCode`를 그대로 쓰게 한다.

import type { ProblemDetail } from "@/shared/api/client";

const JUSO_ENDPOINT = "https://business.juso.go.kr/addrlink/addrLinkApi.do";

/** 외부 서버를 기다리는 한계. 넘으면 fetch가 스스로 끊는다 */
const FETCH_TIMEOUT_MS = 5_000;

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
  // **아래 넷도 입력이 잘못된 것이다.** 옮기지 않으면 502가 되어, 결과가 뻔한 요청을 한 번 더
  // 보내고 "일시적인 오류"를 띄운다 (#423).
  // 특수문자와 숫자만 (`42-18` 등). 위와 같은 안내("숫자만으로는 찾을 수 없어요")가 맞다
  E0012: { status: 400, errorCode: "JUSO_400_KEYWORD_INVALID" },
  // 한글 40자·숫자 10자를 넘었거나 `%`·`=`·`<>`·`[]`·SQL 예약어가 들었다. 따로 문구를 두지 않아
  // 400 기본 문구("입력한 내용을 다시 확인해 주세요")로 떨어진다
  E0010: { status: 400, errorCode: "JUSO_400_KEYWORD_TOO_LONG" },
  E0011: { status: 400, errorCode: "JUSO_400_KEYWORD_TOO_LONG" },
  E0013: { status: 400, errorCode: "JUSO_400_KEYWORD_FORBIDDEN_CHAR" },
};

/**
 * 행안부 응답이 우리가 아는 모양인지 본다.
 *
 * 2xx라고 해서 JSON이라는 보장도, `results.common`이 있다는 보장도 없다.
 * 점검 안내 페이지나 프록시가 끼어든 HTML이 200으로 올 수 있다.
 */
function isJusoResponse(body: unknown): body is JusoResponse {
  if (typeof body !== "object" || body === null) {
    return false;
  }
  const results = (body as { results?: unknown }).results;
  if (typeof results !== "object" || results === null) {
    return false;
  }
  const { common, juso } = results as { common?: unknown; juso?: unknown };
  if (typeof common !== "object" || common === null) {
    return false;
  }
  const { errorCode, totalCount, currentPage } = common as Record<string, unknown>;

  return (
    typeof errorCode === "string" &&
    // 실패 응답은 juso가 null이다. 그것도 계약에 맞는 값이라 받는다
    (juso === null || Array.isArray(juso)) &&
    // 숫자로 오지 않으면 뒤에서 NaN이 되어 쪽 계산이 통째로 무너진다
    Number.isFinite(Number(totalCount)) &&
    Number.isFinite(Number(currentPage))
  );
}

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

  let body: unknown;
  try {
    // 시간 제한이 없으면 행안부가 연결만 해 두고 답하지 않을 때 이 핸들러가 런타임 기본 제한까지 붙잡힌다.
    // 그런 요청이 쌓이면 주소 검색 전체가 느려진다
    const response = await fetch(`${JUSO_ENDPOINT}?${query}`, {
      signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
    });

    if (!response.ok) {
      return problemResponse(502, "JUSO_502_UPSTREAM", "주소 검색 서버가 응답하지 않았습니다.");
    }

    // 파싱도 이 안에 둔다. 2xx로 JSON이 아닌 것이 오면 여기서 던지는데,
    // 밖에 두면 핸들러가 그대로 터져 500이 나간다
    body = await response.json();
  } catch {
    // 행안부에 닿지 못했거나, 답이 우리가 읽을 수 없는 것이었다.
    // 원인 문자열은 남기지 않는다 — 요청 URL에 승인키가 들어 있다
    return problemResponse(502, "JUSO_502_UPSTREAM", "주소 검색 서버에 연결하지 못했습니다.");
  }

  if (!isJusoResponse(body)) {
    return problemResponse(502, "JUSO_502_UPSTREAM", "주소 검색 서버가 뜻밖의 답을 보냈습니다.");
  }

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
