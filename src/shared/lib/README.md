# shared/lib

순수 유틸리티와 외부 라이브러리 설정. 비즈니스 로직을 담지 않는다.

| 파일 | 설명 |
| --- | --- |
| `utils.ts` | `cn` — clsx와 tailwind-merge로 className을 병합한다 |
| `utils.test.ts` | `cn` 단위 테스트 |

- **`utils.ts`는 예외 파일이다.** shadcn CLI가 `components.json`의 alias(`@/shared/lib/utils`)로 직접 참조하고 덮어쓴다. 위치와 이름을 바꾸지 말고 `cn` 외의 유틸을 이 파일에 추가하지 않는다.
- 새 유틸리티는 라이브러리·주제별 폴더로 만든다 (`lib/motion/`, `lib/date/`). 상세는 [code-convention](../../../docs/conventions/code-convention.md)의 "shared/lib 폴더 구조" 절을 본다.
