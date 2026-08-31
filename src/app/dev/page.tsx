// 개발용 컴포넌트 갤러리 라우트. 프로덕션 빌드에서는 열리지 않는다.
import { notFound } from "next/navigation";

import { DevGalleryView } from "@/views/dev-gallery";

export default function DevPage() {
  if (process.env.NODE_ENV === "production") notFound();
  return <DevGalleryView />;
}
