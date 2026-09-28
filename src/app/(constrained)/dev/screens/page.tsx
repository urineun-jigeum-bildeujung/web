// 만들어 둔 화면 목록 라우트. 프로덕션 빌드에서는 열리지 않는다.
import { notFound } from "next/navigation";

import { DevScreensView } from "@/views/dev-screens";

export default function DevScreensPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevScreensView />;
}
