# auth-callback

소셜 인증을 마친 사용자가 돌아오는 화면. 백엔드가 넘긴 일회용 code를 토큰으로 바꾸고 다음 화면으로 보낸다.

- **라우트**: `/auth/callback?code=` · `?error=` — `src/app/auth/callback/page.tsx`
- **조립**: `shared/ui`의 `button`, `shared/api`의 `token-store` · `error-message`
- **상태**: 없음. `code`·`error`는 쿼리에서 한 번 읽고, 실패 문구만 화면 안 상태
- **참고**: 시안 없음. 왕복 한 번을 채우는 중간 화면이다

| 파일 | 설명 |
| --- | --- |
| `ui/auth-callback-view.tsx` | 교환·분기·실패 안내 |
| `ui/auth-callback-view.test.tsx` | 성공 이동, `needsSignup` 분기, 실패 네 갈래, 이중 호출 가드 |
| `api/exchange-token.ts` | code를 토큰 쌍으로 바꾸는 요청 함수와 응답 타입 |
| `index.ts` | 공개 API |

## 짚어둘 것

**토큰이 아니라 code가 온다.** 리다이렉트 쿼리로 토큰을 직접 받으면 주소창·리퍼러·브라우저 기록에 남는다. 백엔드는 60초짜리 일회용 code만 넘기고, 프론트가 `POST /auths/token/exchange`에 본문으로 보내 교환한다. 아직 토큰이 없는 상태라 `auth: false`다.

**`isNewUser`가 아니라 `needsSignup`을 본다.** 첫 로그인에서 닉네임·약관을 끝내지 않고 이탈한 사람은 다시 로그인해도 더 이상 신규가 아니다. 신규 여부로 가르면 그 사람은 가입 화면에 영영 닿지 못한다. 백엔드가 그래서 응답에서 `isNewUser`를 빼고 `needsSignup`을 넣었다.

**교환은 한 번만 부른다.** code는 일회용이라 두 번째 호출은 400이다. StrictMode가 effect를 두 번 부르면 성공한 로그인이 실패로 보이므로 `useRef`로 막는다. 새로고침으로 다시 부르는 것은 막지 않는다 — 그때는 실제로 쓸 수 없는 code라 실패 화면이 맞다.

**성공 이동은 `replace`다.** `push`로 두면 뒤로가기가 이 화면으로 돌아와 이미 쓴 code로 교환을 다시 시도한다.

**닉네임은 쿼리로 넘긴다.** 교환 응답의 추천 닉네임을 가입 화면 초기값으로 써야 하는데, `GET /members/me`가 아직 없어 가입 화면이 스스로 조회할 수 없다.
