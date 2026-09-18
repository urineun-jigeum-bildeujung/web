// 없는 주소로 들어오면 Next.js가 이 파일을 그린다. 화면 조립은 views/not-found가 맡는다.
import { NotFoundView } from "@/views/not-found";

export default function NotFound() {
  return <NotFoundView />;
}
