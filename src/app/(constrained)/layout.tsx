// 아직 태블릿·웹 시안이 없는 화면을 모바일 폭(420px) 기둥에 담는다(#491).
// 시안이 온 화면은 이 그룹 밖으로 나가 제 폭을 스스로 정한다.
//
// 높이를 min-h-dvh로 잡는 이유가 있다. 위쪽 사슬이 html(h-full) → body(min-h-full)라
// 여기서 또 백분율 min-height를 쓰면 min-height만 가진 부모를 연속으로 참조하게 된다.
// 뷰포트를 직접 기준으로 잡아야 안에서 flex-1을 쓰는 화면이 확실히 늘어난다.
export default function ConstrainedLayout({ children }: LayoutProps<"/">) {
  return <div className="mx-auto flex min-h-dvh w-full max-w-105 flex-col">{children}</div>;
}
