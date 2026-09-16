# views/support

고객지원 화면. UI 시안 `mypa_071`(기본 · 질문 펼침)에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/support-view.tsx` | 고객지원. 문의·공지 입구 줄과 많이 찾는 질문 아코디언 |
| `ui/support-view.test.tsx` | 입구 링크와 아코디언 펼침 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/support` — `src/app/mypage/support/page.tsx`

## 아코디언을 그대로 쓴 이유

시안의 질문 줄(물음표 · 굵은 16 · 화살표)과 답(느낌표 · 13 회색)은 shadcn `Accordion`의 버튼·영역 구조와 같다. 접근성(`aria-expanded`, 영역 연결)과 키보드 조작을 다시 만들 이유가 없어 기본 밑줄·테두리·chevron 크기만 덮는다. 화살표는 아코디언이 그리는 lucide chevron을 24px 기본색으로 키워 쓴다(shadcn 내부 아이콘은 lucide 허용).

입구 줄은 `ListRowLink`(md)에 좌우 여백과 제목 크기만 덮었다. 1:1 문의 아이콘은 시안이 두 색인데 `Icon`은 단색이라 초록으로 둔다(#194 선례).

## 아직 없는 것

- API 연동. 질문·답은 확인용 값이고 시안에는 첫 문항의 답만 있다
- 1:1 문의·공지사항 하위 화면 시안
