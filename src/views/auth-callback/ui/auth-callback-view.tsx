// 소셜 인증 복귀 화면. 백엔드가 넘긴 일회용 code를 토큰으로 바꾸고 다음 화면으로 보낸다.
//
// 보여줄 것이 거의 없는 화면이다. 성공하면 곧바로 떠나고, 남는 경우는 실패뿐이다.
// 그래도 화면을 두는 이유는 교환에 왕복이 한 번 들어가서 그 사이가 비면 고장으로 읽히기 때문이다.

"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { toAppMessageCode } from "@/shared/api/error-message";
import { saveTokens } from "@/shared/api/token-store";
import {
  APP_MESSAGE,
  APP_MESSAGE_CODE,
  type AppMessage,
  type AppMessageCode,
} from "@/shared/config/app-message";
import { Button } from "@/shared/ui/button";

import { exchangeToken } from "../api/exchange-token";

export function AuthCallbackView() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const code = searchParams.get("code");
  // 백엔드 실패 핸들러가 붙이는 값. 지금은 `login_failed` 하나다
  const hasError = searchParams.get("error") !== null;

  const [exchangeFailure, setExchangeFailure] = useState<AppMessageCode | null>(null);
  // 교환할 것이 없는 경우는 렌더 중에 알 수 있다. 효과로 상태를 만들면 렌더가 한 번 더 돈다
  const failure = hasError || !code ? APP_MESSAGE_CODE.auth.signInFailed : exchangeFailure;

  // code는 일회용이고 60초 만료다. StrictMode가 효과를 두 번 부르면 두 번째가 400을 받아
  // 성공한 로그인이 실패로 보인다. 새로고침으로 다시 부르는 것은 막지 않는다 — 그때는
  // 실제로 쓸 수 없는 code라 실패 화면이 맞다.
  const exchanged = useRef(false);

  useEffect(() => {
    if (!code || hasError || exchanged.current) {
      return;
    }
    exchanged.current = true;

    void exchangeToken(code)
      .then((result) => {
        saveTokens(result);
        // 뒤로가기로 이 화면에 되돌아오면 이미 쓴 code로 다시 교환을 시도하게 된다.
        // 기록에서 치워 그 경로를 없앤다.
        router.replace(
          result.needsSignup ? `/signup?nickname=${encodeURIComponent(result.nickname)}` : "/",
        );
      })
      .catch((error: unknown) => setExchangeFailure(toAppMessageCode(error)));
  }, [code, hasError, router]);

  // 코드마다 description이 있기도 없기도 해서 좁은 리터럴 타입으로 잡힌다. 넓혀 읽는다
  const message: AppMessage = APP_MESSAGE[failure ?? APP_MESSAGE_CODE.auth.signInFailed];

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-6 px-5">
      {failure ? (
        <>
          <div className="flex flex-col items-center gap-2 text-center">
            <h1 className="text-title-bold-16 text-foreground">{message.title}</h1>
            {message.description && (
              <p className="text-body-medium-14 text-text-body-secondary">{message.description}</p>
            )}
          </div>
          <Button className="w-full" onClick={() => router.replace("/login")}>
            로그인으로 돌아가기
          </Button>
        </>
      ) : (
        // 스피너 대신 문장을 둔다. 읽는 사이에 대개 끝난다
        <p role="status" className="text-body-medium-14 text-text-body-secondary">
          로그인하는 중이에요
        </p>
      )}
    </div>
  );
}
