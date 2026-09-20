# views/settings

설정 화면. UI 시안 `mypa_081`에 대응한다.

| 파일 | 설명 |
| --- | --- |
| `ui/settings-view.tsx` | 설정. 알림설정 스위치와 테마·로그아웃·회원탈퇴 줄 |
| `api/logout.ts` | 로그아웃 요청 |
| `api/use-mutate-logout.ts` | 서버 세션을 끊고 기기의 토큰·캐시를 비우는 훅 |
| `ui/settings-view.test.tsx` | 스위치가 있는지, 나머지 줄이 눌리지 않는지 본다 |
| `index.ts` | 공개 API |

## 라우트

`/mypage/settings` — `src/app/mypage/settings/page.tsx`

## 화살표를 달지 않은 이유

시안(#199)은 네 줄 다 화살표인데 갈 곳이 있는 줄이 없다. 내 정보(#194)의 선례대로 갈 곳이 없는 줄은 화살표 없는 정적 줄로 두고, 알림설정은 하위 화면 시안이 없어 줄 오른쪽에 스위치를 둔다. 줄 규격(40 · 아이콘 24 · `label/bold_14`)은 `ListRow`의 `size="sm"`이다.

## 아직 없는 것

- 테마설정 다음 화면. 테마 도구 결정이 보류 항목이다
- 알림 스위치 값 저장. API 계약이 정해지면 붙인다

## 로그아웃

`POST /auths/logout`이 accessToken을 블랙리스트에 올리고 서버에 저장된 refreshToken을 지운다(#247). **기기에서 토큰만 지우면 모자라다** — 서버의 refreshToken이 살아 있어 그것을 쥔 쪽은 계속 재발급을 받는다.

**요청이 실패해도 기기의 토큰은 지운다.** 서버 정리에 실패했다고 로그아웃을 막으면 남의 기기에서 빠져나올 방법이 없어진다. 캐시도 함께 비운다 — 남겨 두면 다음 사람이 앞 사람의 아이 목록을 잠깐 보게 된다.

**로그인 화면으로 이 화면이 보내지 않는다.** `clearTokens()`가 `subscribeTokensCleared`를 울리고 `SessionExpiryRedirect`가 이미 보낸다(#230). 여기서 또 보내면 이동이 겹친다.

## 회원탈퇴

`DELETE /members/me`가 계정을 지우고 accessToken을 블랙리스트에 올린다(#266). **되돌릴 수 없어 `AlertDialog`로 한 번 묻는다.**

**실패하면 기기의 토큰을 지우지 않는다.** 로그아웃과 다른 점이다 — 계정이 살아 있는데 토큰만 비우면 쫓겨난 채로 탈퇴됐는지도 알 수 없다.
