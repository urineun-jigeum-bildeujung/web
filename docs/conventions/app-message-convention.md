# 앱 메시지 컨벤션

> **상태: 적용 중 (#173)**
>
> `APP_MESSAGE`·`app-toast`는 저장소에 있다. Toast는 **sonner**로 확정했다.
> `FORM_MESSAGE`는 아직 없다 — 폼을 API에 붙이는 시점에 이 규칙대로 만든다.

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

## 어디서 무엇이 실패를 다루는가

네 층이 각자 다른 실패를 맡는다. 겹치면 같은 오류로 토스트와 화면이 동시에 뜬다.

| 층 | 맡는 것 | 어디 |
| --- | --- | --- |
| `MutationCache.onError` | 변경 실패. 토스트로 알린다 | `shared/providers/app-providers.tsx` |
| `ErrorBoundary` | 섹션 단위 렌더 오류. 그 자리만 대체 | `shared/ui/error-boundary` |
| `error.tsx` | 화면 하나가 통째로 실패 | `src/app/error.tsx` |
| `global-error.tsx` | 루트 레이아웃까지 깨짐 | `src/app/global-error.tsx` |

**조회(`useQuery`) 실패는 전역에서 토스트를 띄우지 않는다.** 목록이 비면 빈 상태를, 화면이 깨지면 `ErrorBoundary`를 보여주는 편이 낫고, 배경 refetch까지 알리면 사용자가 하지도 않은 일로 토스트가 뜬다. 알림이 필요한 조회는 호출부가 정한다.

**전역 처리를 `defaultOptions.mutations.onError`가 아니라 `MutationCache`에 두는 이유가 있다.** `defaultOptions` 쪽은 호출부가 `onError`를 주면 통째로 덮여 알림이 조용히 사라진다. 캐시 단위는 호출부 핸들러와 함께 항상 실행된다.

## 백엔드 실패 응답과의 대응

백엔드는 RFC 9457을 쓰고 **모든 실패 응답에 `errorCode`가 있다.** 명시적으로 정의하지 않은 예외도 `GlobalExceptionHandler`가 `COMMON_{상태코드}`를 붙인다.

문구는 `shared/api/error-message.ts`의 `toAppMessageCode`가 고른다.

```
errorCode가 매핑에 있으면  → 우리 문구
없으면                    → 상태 코드 기준 기본 문구
ApiError가 아니면          → 연결 실패 (서버에 닿지도 못한 경우)
```

**`detail`과 `title`은 쓰지 않는다.** `detail`은 대체로 한국어지만 Spring이 직접 처리하는 예외(405·415 등)에서는 기본 영어가 내려온다. `title`은 `AppException` 경로에서만 `errorCode`와 값이 같고 다른 경로는 보장되지 않는다. 항상 있는 `errorCode`만 키로 쓴다.

**매핑을 다 채우지 않아도 화면은 돈다.** 백엔드가 새 코드를 추가하면 우리는 나중에 알게 되므로, 모르는 코드는 상태 코드 기준으로 떨어진다.

## 원본 에러를 남기는 법

**`console`을 직접 부르지 않는다.** `shared/lib/report-error.ts`의 `reportError(context, error)`만 쓴다.

ESLint `no-console`이 이것을 강제하고, 근거는 시큐어 코딩 가이드 SC-G-02다 — 응답 객체를 통째로 찍으면 토큰이 로그에 남는데 예외 경로라 눈에 덜 띈다. `reportError`는 **상태 코드와 errorCode만 뽑아** 남기고 응답 본문·헤더는 버린다.

관측 도구를 붙이면 이 함수 안이 보고 지점이 된다.
