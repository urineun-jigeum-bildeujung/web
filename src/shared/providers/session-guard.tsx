"use client";
// 로그인한 사람만 여는 화면을 감싼다. 세션이 없으면 로그인으로 보내고 안쪽을 그리지 않는다.
//
// `SessionExpiryRedirect`는 있던 세션이 끊길 때만 반응한다. 처음부터 토큰이 없으면 요청이 401로
// 막혀도 아무도 로그인으로 보내지 않아, 화면이 오류나 빈 상태로 남는다(#447). 토큰은 메모리와
// localStorage에 있어 서버(proxy)가 볼 수 없으므로 여기서 막는다.

import { useRouter } from "next/navigation";
import { useEffect } from "react";

import { hasSession } from "@/shared/api/token-store";
import { useHasSession } from "@/shared/api/use-has-session";

export function SessionGuard({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  // 확인하기 전에 안쪽을 그리면 세션 없이 요청이 먼저 나간다
  const signedIn = useHasSession();

  useEffect(() => {
    // `useHasSession`은 하이드레이션 첫 렌더에 서버 값(false)을 준다. 그 값으로 보내면 로그인한
    // 사람도 쫓겨나므로 보관소를 바로 읽는다. 뒤로가기로 막힌 화면에 되돌아오지 않게 replace로 둔다
    if (!hasSession()) {
      router.replace("/login");
    }
  }, [router]);

  return signedIn ? children : null;
}
