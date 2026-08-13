# shared 레이어

**비즈니스 로직이 없는** 재사용 코드다. 이 서비스가 아닌 다른 프로젝트에 옮겨도 말이 되는 것들이다.

다른 레이어와 달리 슬라이스가 없고 세그먼트가 바로 온다.

## 세그먼트

| 세그먼트 | 담는 것 |
|---|---|
| `ui/` | shadcn 컴포넌트와 공용 프리미티브 |
| `lib/` | 순수 유틸리티 (`cn` 등), 외부 라이브러리 설정 |
| `api/` | API 클라이언트, 공통 요청·에러 처리 |
| `config/` | 상수, Query Key, 환경 설정 |
| `providers/` | 앱 전역 Provider (`AppProviders`) |

## 담지 않는 것

- 특정 도메인을 아는 코드. "반려동물"·"구독"을 아는 순간 `entities` 이상으로 올라가야 한다.
- 한 곳에서만 쓰는 유틸. 그 슬라이스의 `lib/`에 둔다.

## 의존 방향

**어떤 레이어도 import하지 않는다.** 모든 상위 레이어가 이곳을 import한다.

## 주의

`ui/`와 `lib/utils.ts`는 shadcn CLI가 생성하고 덮어쓴다.

- `components.json`의 alias가 `@/shared/ui`를 가리키므로 `npx shadcn add`가 자동으로 여기에 넣는다.
- `.prettierignore` 대상이라 포맷을 손으로 맞추지 않는다.
- 파일을 임의 수정하면 내장 접근성이 조용히 깨질 수 있다. 자세한 내용은 [design-convention](../../docs/conventions/design-convention.md)을 본다.
