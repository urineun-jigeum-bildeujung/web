# views/mypage

마이페이지 홈. 프로필 카드와 메뉴 묶음을 보여준다.

- **라우트**: `/mypage` — `src/app/mypage/page.tsx`
- **조립**: `shared/ui`의 `page-header` · `setting-group` · `list-row` · `icon`, `widgets/bottom-nav`
- **상태**: 없음. 값은 확인용 목 데이터
- **참고**: UI 시안 기준(`mypa_001`, `1474-23129`)

| 파일 | 설명 |
| --- | --- |
| `ui/mypage-view.tsx` | 마이페이지 홈 |
| `ui/mypage-view.test.tsx` | 메뉴 묶음과 이동 경로 |
| `index.ts` | 공개 API |

## 짚어둘 것

**"최근 본 상품" 메뉴는 시안에서 빠졌다.** 화면(`/mypage/recently-viewed`)은 남기고 진입점만 뺐다. 의도인지 PD 확인 대상이다(#194).

**머리말 로고 자리는 서비스 이름 글자다.** 시안이 "로고" 자리 표시라 로고 자산이 오면 바꾼다.

**하단 내비는 아직 와이어프레임 기준이다.** 메인 화면(#185)에서 시안으로 옮긴다.

## 아직 없는 것

API 연동. 닉네임·이메일·아이 목록은 확인용 목 데이터이며 백엔드 계약이 정해지면 교체한다.
