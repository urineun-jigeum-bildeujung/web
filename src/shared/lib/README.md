# shared/lib

순수 유틸리티와 외부 라이브러리 설정. 비즈니스 로직을 담지 않는다.

| 파일 | 설명 |
| --- | --- |
| `josa/josa.ts` | 이름 뒤 조사를 받침에 맞춰 고른다 |
| `josa/josa.test.ts` | 받침 유무와 ㄹ 예외, 한글이 아닌 이름을 본다 |
| `typo/typo-tokens.ts` | `globals.css` 타이포 토큰 이름 목록. tailwind-merge가 `text-title-bold-20`을 글자색으로 오인하지 않게 `cn`에 알려 준다 |
| `utils.ts` | `cn` — clsx와 tailwind-merge로 className을 병합한다. 타이포 토큰을 글자 크기 그룹으로 등록한 설정이 얹혀 있다 (#176) |
| `utils.test.ts` | `cn` 단위 테스트. 타이포 토큰이 색과 겹쳐도 남는지, 목록이 `globals.css`와 같은지 본다 |
| `app-toast.ts` | 토스트를 띄우는 유일한 통로(`toastAppSuccess`·`toastAppError`) — 호출부는 메시지 코드만 넘긴다 |
| `report-error.ts` | 오류를 바깥으로 알리는 유일한 통로(`reportError`) — 민감정보를 걸러낸 요약만 남긴다. 관측 도구 접점 |
| `report-error.test.ts` | 무엇이 남고 무엇이 남지 않는지 단위 테스트 |
| `query-test-wrapper.tsx` | 테스트에서 서버 상태를 쓰는 화면을 감쌀 Provider를 만든다(`createQueryWrapper`) |

- **`utils.ts`는 예외 파일이다.** shadcn CLI가 `components.json`의 alias(`@/shared/lib/utils`)로 직접 참조하고 덮어쓴다. 위치와 이름을 바꾸지 말고 `cn` 외의 유틸을 이 파일에 추가하지 않는다. tailwind-merge 설정(#176)은 예외로 얹었고, CLI가 덮어쓰면 그 설정을 되살려야 한다 — `utils.test.ts`가 그 회귀를 잡는다.
- **`query-test-wrapper.tsx`는 테스트만 쓴다.** 앱은 `shared/providers`의 `AppProviders`가 감싼다. ESLint가 `@tanstack/react-query` import를 슬라이스 `api` 세그먼트와 `shared`로 묶어 두어 화면 테스트가 직접 `QueryClient`를 만들 수 없고, 그 자리를 여기서 연다. `@testing-library`는 들이지 않는다 — `src` 안에 개발 의존성이 섞이면 누가 화면에서 import했을 때 빌드가 그것까지 담으려 든다.
- 새 유틸리티는 라이브러리·주제별 폴더로 만든다 (`lib/motion/`, `lib/date/`). 상세는 [code-convention](../../../docs/conventions/code-convention.md)의 "shared/lib 폴더 구조" 절을 본다.
