// /mypage/recently-viewed 라우트. 최근 본 상품은 좋아요의 "최근에 봤어요" 탭이 그려 그리로 보낸다 (#509).
// 확정 시안의 마이페이지에서 이 화면으로 가는 줄이 빠졌고, 목록을 두 곳에서 따로 그리지 않는다.

import { redirect } from "next/navigation";

export default function RecentlyViewedPage() {
  redirect("/likes?tab=recent");
}
