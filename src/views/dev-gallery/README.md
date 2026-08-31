# views/dev-gallery

공용 컴포넌트를 한 화면에 늘어놓고 눈으로 확인하는 개발용 화면이다. **서비스 화면이 아니다.**

| 파일 | 설명 |
| --- | --- |
| `ui/dev-gallery-view.tsx` | 컴포넌트를 종류별로 배치한 화면 |
| `index.ts` | 공개 API |

## 라우트

`/dev` — `src/app/dev/page.tsx`

**프로덕션 빌드에서는 `notFound()`로 막힌다.** 디자인이 확정되고 실제 화면이 생기면 이 슬라이스를 지울지 판단한다.

Storybook을 두지 않기로 한 대신 두는 최소한의 확인 수단이다. 근거는 [library-convention](../../../docs/conventions/library-convention.md)의 "겪은 사례"를 본다.
