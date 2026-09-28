// 마이페이지와 하위 화면 전체를 로그인한 사람에게만 연다(#447).
import { SessionGuard } from "@/shared/providers/session-guard";

export default function MypageLayout({ children }: LayoutProps<"/mypage">) {
  return <SessionGuard>{children}</SessionGuard>;
}
