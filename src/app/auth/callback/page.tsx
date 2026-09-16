// 소셜 인증 복귀 라우트. 백엔드가 `?code=`(성공) 또는 `?error=`(실패)를 붙여 여기로 보낸다.
//
// 교환은 화면에서 한다. 결제 승인(#212)처럼 서버 컴포넌트에서 부르지 않는 이유는, 받은 토큰을
// 브라우저의 보관소(accessToken 메모리·refreshToken localStorage)에 넣어야 하기 때문이다.
import { Suspense } from "react";

import { AuthCallbackView } from "@/views/auth-callback";

export default function AuthCallbackPage() {
  // useSearchParams를 쓰는 화면은 경계가 있어야 한다. 없으면 빌드가 막는다
  return (
    <Suspense>
      <AuthCallbackView />
    </Suspense>
  );
}
