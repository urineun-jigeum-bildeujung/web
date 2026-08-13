# 앱 메시지 컨벤션

> **상태: 도입 예정 (현재 미적용)**
>
> 이 문서가 말하는 `APP_MESSAGE`·`FORM_MESSAGE`·`app-toast` 파일은 아직 저장소에 없다. 공통 Error 핸들러와 Toast를 붙이는 시점에 이 규칙대로 만든다. 그전까지는 **참고용**이며, 이 문서를 근거로 지금 파일을 미리 만들지 않는다.
>
> Toast 라이브러리는 확정 전이다. shadcn 생태계 기준으로 sonner가 유력하나 도입 시점에 정한다.

사용자에게 노출되는 문구는 상수로 중앙 관리한다. 백엔드에서 온 원본 에러 메시지는 사용자에게 직접 노출하지 않는다.

- `APP_MESSAGE` (toast·alert·error UI) → `shared/config/app-message.ts`
- `FORM_MESSAGE` (필드 검증 메시지) → `shared/config/form-message.ts`
- `APP_MESSAGE_CODE` (메시지 코드) → `shared/config/app-message.ts`

## title

- 짧은 명사형·상태형. 문장형·마침표·이모지·서술형(`~합니다`, `~했습니다`) 금지.
- 성공은 `완료`, 실패는 `실패`, 권한·상태는 `없음`·`불가`·`필요`처럼 결과가 분명한 단어로 끝낸다.

| 좋은 예 | 나쁜 예 |
|---|---|
| 리뷰 등록 완료 | 리뷰가 등록되었습니다. |
| 구독 변경 실패 | 구독 변경에 실패했습니다. |
| 알림 권한 없음 | 알림 권한이 없습니다. |
| 로그인 필요 | 로그인이 필요합니다. |

## description

- title만으로 부족한 안내를 문장형으로 작성한다. 다음에 할 행동이 있으면 여기 쓴다.
- 동적 값(닉네임·반려동물 이름 등)을 호출부에서 직접 넘기는 경우 생략할 수 있다.
- 개발자 디버깅용 원본 에러는 넣지 않는다. **백엔드 API 응답의 에러 메시지·스택·상태 코드는 `console.error`로만 남기고** 사용자에겐 고정 메시지만 보인다.

## Field Error (FORM_MESSAGE)

- Zod·RHF의 `FieldError`로 필드 아래에 표시하는 검증 메시지는 `FORM_MESSAGE`에서 관리하고, 사용자가 입력을 고칠 수 있게 문장형으로 쓴다.
- 필드 오류는 `setError`+`FieldError`로, 화면 전체에 알려야 하는 제출·서버 실패만 toast로. **필드 메시지를 toast로 중복 노출하지 않는다.**

## code

- `APP_MESSAGE`의 키 자체가 `"도메인.이름"` 형태의 메시지 코드다. 중첩 객체가 아니라 코드를 키로 두는 이유는 **코드 하나로 문구를 찾을 수 있어야** 헬퍼가 `as` 단언 없이 조회하기 때문이다.
- 호출부는 코드 문자열을 직접 쓰지 않고 `APP_MESSAGE_CODE.auth.signInFailed`처럼 상수를 쓴다.
- `APP_MESSAGE`와 `APP_MESSAGE_CODE`의 도메인·key는 반드시 일치시킨다. `satisfies`가 "값이 실재하는 코드인가"를 본다. 경로 불일치와 한쪽 누락을 잡는 테스트는 테스트 도구 도입 후에 붙인다.
- toast는 `shared/lib/app-toast.ts`의 `toastAppSuccess(code)` / `toastAppError(code, cause)`로 띄운다. **호출부가 title·description을 조립하지 않는다.** 원본 에러는 `cause`로 넘기면 `console.error`로만 나가고 사용자 화면에는 닿지 않는다.

## 도입할 때 함께 정할 것

- 공통 Error 핸들러의 위치와 TanStack Query `QueryCache`/`MutationCache` 전역 에러 처리 연결 방식
- HTTP 상태 코드별 기본 메시지 매핑 (401 로그인 필요, 403 권한 없음, 5xx 일시 오류 등)
- 백엔드 공통 에러 응답 포맷과의 대응 관계 (백엔드 팀이 정의하는 "공통 에러 응답 형식"과 맞춘다)
