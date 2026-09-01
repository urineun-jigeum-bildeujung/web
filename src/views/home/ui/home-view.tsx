// 홈 화면. 디자인 확정 전까지 만들어 둔 화면으로 들어가는 입구 역할을 한다.
// 실제 메인 화면(시안의 메인)이 만들어지면 이 화면은 교체된다.

import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";

import { ThemeToggle } from "@/features/toggle-theme";

/** 만들어 둔 화면 목록. 새 화면을 만들면 여기에 추가한다 */
const SCREEN_GROUPS = [
  {
    title: "온보딩",
    note: "단계는 주소창의 step 값으로 바로 열 수 있다",
    items: [
      { href: "/onboarding", label: "도입부", hint: "onbo_001" },
      { href: "/onboarding?step=basic", label: "이름·성별·중성화", hint: "onbo_002" },
      { href: "/onboarding?step=detail", label: "품종·나이·체구", hint: "onbo_003" },
      { href: "/onboarding?step=breed", label: "품종 선택", hint: "onbo_013" },
      { href: "/onboarding?step=health", label: "염려질환·알러지", hint: "onbo_004" },
      { href: "/onboarding?step=done", label: "완료", hint: "onbo_005" },
    ],
  },
  {
    title: "마이페이지",
    items: [
      { href: "/mypage", label: "마이페이지 홈", hint: "mypa_001" },
      { href: "/mypage/info", label: "내 정보", hint: "mypa_011" },
      { href: "/mypage/info/nickname", label: "닉네임 변경", hint: "mypa_111" },
      { href: "/mypage/info/phone", label: "휴대폰 인증", hint: "mypa_212" },
      { href: "/mypage/address/new", label: "배송지 추가", hint: "mypa_311" },
      { href: "/mypage/address/search", label: "주소 검색", hint: "mypa_312" },
      { href: "/mypage/restock", label: "재입고 알림", hint: "mypa_031" },
      { href: "/mypage/reviews", label: "나의 상품 후기", hint: "mypa_041" },
      { href: "/mypage/payment", label: "결제 수단 관리", hint: "mypa_051" },
      { href: "/mypage/orders", label: "주문·배송 확인", hint: "mypa_061" },
      { href: "/mypage/support", label: "고객지원", hint: "mypa_071" },
      { href: "/mypage/settings", label: "설정", hint: "mypa_081" },
    ],
  },
  {
    title: "상품 비교",
    items: [
      { href: "/compare", label: "상품 비교", hint: "comp_001" },
      { href: "/compare/select", label: "비교할 상품 고르기", hint: "comp_011" },
    ],
  },
  {
    title: "개발용",
    items: [{ href: "/dev", label: "공용 컴포넌트 갤러리", hint: "프로덕션에서는 열리지 않음" }],
  },
];

export function HomeView() {
  return (
    <main className="flex flex-1 flex-col px-4 pb-12">
      <div className="flex items-start justify-between gap-2 pt-6">
        <div className="flex flex-col gap-1">
          <p className="text-sm text-muted-foreground">소비량 예측형 스마트 구독 커머스</p>
          <h1 className="text-3xl font-bold tracking-tight">골라주개냥</h1>
          <p className="text-sm text-muted-foreground">
            고민은 줄이고, 우리 애한테 맞게 골라주개냥
          </p>
        </div>
        <ThemeToggle />
      </div>

      <p className="mt-4 rounded-lg border border-border px-3 py-2 text-xs text-muted-foreground">
        디자인 확정 전이라 이 화면이 임시 입구입니다. 아래에서 만들어 둔 화면으로 들어갑니다.
      </p>

      <div className="mt-6 flex flex-col gap-6">
        {SCREEN_GROUPS.map((group) => (
          <section key={group.title} className="flex flex-col gap-2">
            <h2 className="text-sm font-semibold text-foreground">{group.title}</h2>
            {group.note && <p className="text-xs text-muted-foreground">{group.note}</p>}

            <ul className="overflow-hidden rounded-xl border border-border [&>*+*]:border-t [&>*+*]:border-border">
              {group.items.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="flex min-h-12 items-center gap-2 px-3 py-2 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
                  >
                    <span className="flex-1 text-sm text-foreground">{item.label}</span>
                    <span className="text-xs text-muted-foreground">{item.hint}</span>
                    <IoChevronForward aria-hidden className="size-4 text-muted-foreground" />
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </main>
  );
}
