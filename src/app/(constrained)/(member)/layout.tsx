// 로그인한 사람만 여는 화면을 한데 담는다. 비로그인이면 로그인으로 보낸다(#447, #542).
//
// 비로그인은 메인·상품 상세·검색만 볼 수 있다(PM·PD, 2026-09-29). 그 밖의 화면은 전부 이 그룹 안에 둔다.
// 가드를 화면마다 두면 새 화면을 만들 때 빠뜨린다 — 폴더 자리가 곧 보호 여부가 되게 한다.
import { SessionGuard } from "@/shared/providers/session-guard";

export default function MemberLayout({ children }: LayoutProps<"/">) {
  return <SessionGuard>{children}</SessionGuard>;
}
