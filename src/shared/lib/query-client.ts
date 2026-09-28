// 앱과 테스트가 같은 QueryClient를 만든다. 변경 실패를 알리는 자리가 한 곳이어야 한다.
//
// **변경 실패 토스트는 여기 MutationCache 하나가 띄운다.** 화면이 `mutateAsync(...).catch`에서 또
// 띄우면 같은 토스트가 두 장 겹친다(#359). 이 처리를 `defaultOptions.mutations.onError`가 아니라
// MutationCache에 두는 이유가 있다. defaultOptions 쪽은 호출부가 onError를 주면 통째로 덮여 알림이
// 조용히 사라진다. 캐시 단위는 호출부 핸들러와 함께 항상 실행된다.
//
// 조회(QueryCache) 실패는 여기서 다루지 않는다. 목록이 비면 빈 상태를, 화면이 깨지면 ErrorBoundary를
// 보여주는 편이 낫고, 배경 refetch까지 토스트를 띄우면 사용자가 하지도 않은 일로 알림이 뜬다.
//
// 테스트 wrapper가 같은 함수를 쓰는 이유도 같다 — 캐시가 빠진 클라이언트로 그리면 화면 테스트가
// 중복 토스트를 잡지 못한다.

import { MutationCache, QueryClient } from "@tanstack/react-query";

import { shouldRetryQuery } from "@/shared/api/client";
import { toAppMessageCode } from "@/shared/api/error-message";
import { toastAppError } from "@/shared/lib/app-toast";

type CreateQueryClientOptions = {
  /** 테스트가 끈다. 켜 두면 5xx·네트워크 실패에서 한 번 더 기다렸다가 에러가 나와 테스트가 흔들린다 */
  retry?: boolean;
  /** 테스트가 0으로 둔다. 앱의 60초를 그대로 쓰면 창 포커스 재조회가 일어나지 않아 그것을 검증하는 테스트가 깨진다 */
  staleTime?: number;
};

export function createQueryClient({ retry, staleTime = 60 * 1000 }: CreateQueryClientOptions = {}) {
  return new QueryClient({
    mutationCache: new MutationCache({
      onError: (error) => toastAppError(toAppMessageCode(error), error),
    }),
    defaultOptions: {
      queries: {
        // SSR에서 서버가 이미 받아온 데이터를 클라이언트가 즉시 다시 요청하지 않도록 한다.
        staleTime,
        // 4xx는 다시 보내도 같은 답이라 재시도하지 않는다. 5xx·네트워크 오류만 1회.
        retry: retry === false ? false : shouldRetryQuery,
      },
    },
  });
}
