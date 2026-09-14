// 오류 원인을 바깥으로 알리는 유일한 통로. 관측 도구를 붙이면 이 함수 안이 그 자리가 된다.
//
// ESLint `no-console`이 막는 것을 여기 한 곳에서만 연다. 규칙의 근거는 시큐어 코딩 가이드
// SC-G-02이고, 그 주석이 우려하는 상황이 정확히 이것이다 — "console.error(err)에 응답 객체가
// 통째로 들어가면 토큰이 찍히는데, 예외 경로라 오히려 눈에 덜 띈다".
//
// 그래서 원본을 그대로 넘기지 않고 **원인을 찾는 데 필요한 것만 뽑아** 남긴다.
// 응답 본문·헤더·요청 객체는 어느 경로로도 여기를 지나가지 못한다.
//
// `app-message-convention.md`는 "원본 에러를 console.error로만 남긴다"고 적고 있는데,
// 그 문서는 ESLint 규칙보다 먼저 쓰였고 아직 "도입 예정" 상태다. 규칙 쪽이 맞다고 보고
// 이 파일을 두었다. 문서는 #173에서 함께 정리한다.

import { ApiError } from "@/shared/api/client";

/** 사람이 원인을 좁히는 데 필요한 만큼만. 값이 아니라 성격을 남긴다 */
function summarize(error: unknown): string {
  if (error instanceof ApiError) {
    // problem.detail은 넣지 않는다. 백엔드가 무엇을 담을지 우리가 통제하지 못한다
    return `ApiError status=${error.status} code=${error.problem?.errorCode ?? "none"}`;
  }
  if (error instanceof Error) {
    // message는 남기지 않는다. 무엇이 담길지 우리가 정하지 못해서다 —
    // 라이브러리가 요청 URL을 넣기도 하고, JSON 파싱 실패는 본문 조각을 그대로 실어 보낸다.
    // 원인을 좁힐 때는 브라우저가 이미 스택과 함께 원본을 보여준다.
    return error.name;
  }
  return `Unknown: ${typeof error}`;
}

/**
 * @param context 어디서 났는지 (`"cart.remove"`, `"route error"` 등)
 */
export function reportError(context: string, error: unknown) {
  // eslint-disable-next-line no-console -- 민감정보를 걸러낸 요약만 나간다. 위 주석 참고
  console.error(`[${context}]`, summarize(error));
}
