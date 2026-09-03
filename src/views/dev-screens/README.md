# views/dev-screens

만들어 둔 화면으로 들어가는 개발용 입구. **서비스 화면이 아니다.**

| 파일 | 설명 |
| --- | --- |
| `ui/dev-screens-view.tsx` | 화면 목록 |
| `ui/dev-screens-view.test.tsx` | 묶음과 링크가 그려지는지 본다 |
| `index.ts` | 공개 API |

## 라우트

`/dev/screens` — 프로덕션 빌드에서는 `notFound()`로 막힌다.

원래 `/`였는데 시안의 메인이 그 자리를 차지하면서 옮겼다. 자리 표시 화면이 남아 있는 동안은 이 목록으로 확인하는 편이 빠르다. 화면이 다 만들어지면 이 슬라이스를 지울지 판단한다.

공용 컴포넌트를 눈으로 확인하는 곳은 `/dev`(`views/dev-gallery`)다.
