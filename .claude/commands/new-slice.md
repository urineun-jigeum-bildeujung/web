---
description: FSD 슬라이스 뼈대 생성
argument-hint: <layer> <name> [segments]
---

`$ARGUMENTS`로 FSD 슬라이스를 스캐폴드한다. 형식: `<layer> <name> [세그먼트]`.

- **layer**: views | widgets | features | entities | shared
- **name**: kebab-case (예: `write-review`)
- **세그먼트** 미지정 시 레이어 관례대로 — features/entities → `ui,model,api`, widgets/views → `ui,model`

만들 것:

1. `src/<layer>/<name>/index.ts` — 공개 API(re-export). 첫 줄에 한국어 역할 주석.
2. 요청한 세그먼트별 최소 파일(예: `ui/<name>.tsx`, `model/types.ts`)을 필요한 만큼 생성하되, 첫 줄 한국어 역할 주석과 kebab 파일명·PascalCase 컴포넌트를 지킨다.
3. 바깥에서는 `index.ts`만 import하도록 공개 API를 구성한다.
4. **layer가 `views`면 `README.md`도 함께 만든다.** 템플릿은 `src/views/README.md`의 "페이지 README" 절을 따른다.

의존 방향은 `app → views → widgets → features → entities → shared` 단방향이다. 같은 레이어끼리도 참조하지 않는다.

`docs/conventions/srp-convention.md`·`code-convention.md`와 해당 레이어의 `src/<layer>/README.md`를 따른다. 만든 경로를 보고한다.

`shared`는 슬라이스가 없고 세그먼트가 바로 온다. `shared`를 대상으로 부르면 슬라이스를 만들지 말고 어느 세그먼트에 둘지부터 확인한다.
