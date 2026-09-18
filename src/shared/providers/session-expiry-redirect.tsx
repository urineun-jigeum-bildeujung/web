// 세션이 끝나면 로그인으로 보낸다. 화면이 각자 처리하지 않도록 한곳에 둔다.
//
// `apiRequest`는 401을 만나면 재발급을 시도하고, 그마저 실패하면 토큰을 지우고 401을 그대로
// 던진다. **그 뒤를 누가 책임질지는 정해 두지 않으면 아무도 하지 않는다** — 목록 하나가
// 조용히 비어 보이고 보호자는 왜 안 되는지 알지 못한다. `shared/api/README.md`가 그 자리를
// `subscribeTokensCleared`로 정해 두었고 여기가 그 구독이다.

"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect } from "react";

import { subscribeTokensCleared } from "@/shared/api/token-store";

/** 세션이 없어도 되는 길. 여기서 로그인으로 보내면 제자리를 맴돈다 */
const PUBLIC_PATHS = ["/login", "/auth/callback"];

export function SessionExpiryRedirect() {
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    return subscribeTokensCleared(() => {
      if (PUBLIC_PATHS.some((path) => pathname.startsWith(path))) {
        return;
      }
      // 뒤로가기로 세션이 끝난 화면에 되돌아오지 않게 replace로 둔다
      router.replace("/login");
    });
  }, [pathname, router]);

  return null;
}
