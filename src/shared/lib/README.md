# shared/lib

순수 유틸리티와 외부 라이브러리 설정. 비즈니스 로직을 담지 않는다.

| 파일 | 설명 |
| --- | --- |
| `josa/josa.ts` | 이름 뒤 조사를 받침에 맞춰 고른다 |
| `josa/josa.test.ts` | 받침 유무와 ㄹ 예외, 한글이 아닌 이름을 본다 |
| `typo/typo-tokens.ts` | `globals.css` 타이포 토큰 이름 목록. tailwind-merge가 `text-title-bold-20`을 글자색으로 오인하지 않게 `cn`에 알려 준다 |
| `utils.ts` | `cn` — clsx와 tailwind-merge로 className을 병합한다. 타이포 토큰을 글자 크기 그룹으로 등록한 설정이 얹혀 있다 (#176) |
| `utils.test.ts` | `cn` 단위 테스트. 타이포 토큰이 색과 겹쳐도 남는지, 목록이 `globals.css`와 같은지 본다 |

- **`utils.ts`는 예외 파일이다.** shadcn CLI가 `components.json`의 alias(`@/shared/lib/utils`)로 직접 참조하고 덮어쓴다. 위치와 이름을 바꾸지 말고 `cn` 외의 유틸을 이 파일에 추가하지 않는다. tailwind-merge 설정(#176)은 예외로 얹었고, CLI가 덮어쓰면 그 설정을 되살려야 한다 — `utils.test.ts`가 그 회귀를 잡는다.
- 새 유틸리티는 라이브러리·주제별 폴더로 만든다 (`lib/motion/`, `lib/date/`). 상세는 [code-convention](../../../docs/conventions/code-convention.md)의 "shared/lib 폴더 구조" 절을 본다.
