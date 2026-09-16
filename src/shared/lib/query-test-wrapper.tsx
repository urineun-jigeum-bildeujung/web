// 테스트에서 서버 상태를 쓰는 화면을 감싸는 Provider를 만든다.
//
// **테스트용이다.** 화면 코드가 부를 일은 없다 — 앱은 `AppProviders`가 감싼다.
// `@testing-library`를 들여오지 않는 이유가 있다. 여기서 들이면 `src` 안에 개발 의존성이 섞여
// 누가 화면에서 import했을 때 빌드가 그것까지 담으려 든다. 감쌀 것만 주고 렌더는 테스트가 한다.
//
// ESLint가 `@tanstack/react-query` import를 슬라이스 `api` 세그먼트와 `shared`로 묶어 두어
// (code-convention "훅") 화면 테스트가 직접 `QueryClient`를 만들 수 없다. 그 자리가 여기다.

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

/**
 * 테스트용 Provider를 만든다. `render(ui, { wrapper: createQueryWrapper() })`로 쓴다.
 *
 * **테스트마다 새로 부른다.** 캐시를 나눠 쓰면 앞 테스트가 담아 둔 응답이 다음 테스트에 남는다.
 *
 * 재시도를 끄는 이유는 실패를 검증할 때다. 켜 두면 4xx가 아닌 실패에서 한 번 더 기다렸다가
 * 그제야 에러가 나와 테스트가 느려지고 타임아웃 언저리에서 흔들린다.
 */
export function createQueryWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });

  return function QueryWrapper({ children }: { children: React.ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}
