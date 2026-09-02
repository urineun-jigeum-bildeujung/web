// 홈 화면. 디자인 확정 전까지 만들어 둔 화면으로 들어가는 입구 역할을 한다.
// 실제 메인 화면(시안의 메인)이 만들어지면 이 화면은 교체된다.

import Link from "next/link";
import { IoChevronForward } from "react-icons/io5";

import { ThemeToggle } from "@/features/toggle-theme";
import { BottomNav } from "@/widgets/bottom-nav";

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
      { href: "/mypage/address", label: "배송지 관리", hint: "IA_v0.6" },
      { href: "/mypage/address/new", label: "배송지 추가", hint: "mypa_311" },
      { href: "/mypage/address/search", label: "주소 검색", hint: "mypa_312" },
      { href: "/mypage/pets", label: "반려동물 프로필", hint: "mypa_021" },
      { href: "/mypage/pets/basic", label: "아이 정보 수정", hint: "mypa_121" },
      { href: "/mypage/pets/body", label: "아이 체형 수정", hint: "mypa_221" },
      { href: "/mypage/pets/health", label: "아이 건강 수정", hint: "mypa_321" },
      { href: "/mypage/pets/new", label: "새 아이 등록", hint: "mypa_021_등록" },
      { href: "/mypage/pets/breed", label: "품종 고르기", hint: "onbo_013" },
      { href: "/mypage/restock", label: "재입고 알림", hint: "mypa_031" },
      { href: "/mypage/recently-viewed", label: "최근 본 상품", hint: "IA_v0.6" },
      { href: "/mypage/reviews", label: "나의 상품 후기", hint: "mypa_041" },
      { href: "/mypage/reviews/write", label: "리뷰 작성", hint: "IA_v0.6" },
      { href: "/mypage/reviews/1", label: "리뷰 상세", hint: "IA_v0.6" },
      { href: "/mypage/payment", label: "결제 수단 관리", hint: "mypa_051" },
      { href: "/mypage/orders", label: "주문·배송 확인", hint: "mypa_061" },
      { href: "/mypage/orders/1", label: "주문 상세", hint: "mypa_161" },
      { href: "/mypage/orders/1/claim?type=cancel", label: "취소·반품·교환", hint: "IA_v0.6" },
      { href: "/mypage/support", label: "고객지원", hint: "mypa_071" },
      { href: "/mypage/support/inquiries", label: "1:1 문의", hint: "IA_v0.6" },
      { href: "/mypage/support/notices", label: "공지사항", hint: "IA_v0.6" },
      { href: "/mypage/service", label: "서비스 안내", hint: "IA_v0.6" },
      { href: "/mypage/service/terms", label: "서비스 이용약관", hint: "IA_v0.6" },
      { href: "/mypage/service/privacy", label: "개인정보 처리방침", hint: "IA_v0.6" },
      { href: "/mypage/settings", label: "설정", hint: "mypa_081" },
      { href: "/mypage/notifications", label: "알림", hint: "noti_001" },
    ],
  },
  {
    title: "쇼핑",
    note: "IA 기준으로 만든 자리 표시. 아직 와이어프레임이 없다",
    items: [
      { href: "/login", label: "로그인", hint: "LOGN_001" },
      { href: "/signup", label: "회원가입", hint: "SNIN_001" },
      { href: "/likes", label: "좋아요", hint: "IA_v0.6" },
      { href: "/deals", label: "타임딜", hint: "MAIN_011" },
      { href: "/search", label: "검색", hint: "SRCH_001" },
      { href: "/recommendations", label: "추천", hint: "RCMD_001" },
      { href: "/products/1", label: "상품 상세", hint: "SRCH_111" },
      { href: "/products/1/reviews", label: "상품 리뷰", hint: "IA_v0.6" },
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
    title: "장바구니",
    // 옵션 변경과 삭제 확인은 같은 화면의 상태라 라우트를 나누지 않았다
    items: [{ href: "/cart", label: "장바구니", hint: "cart_001" }],
  },
  {
    title: "결제",
    items: [
      { href: "/payment", label: "결제하기", hint: "paym_001" },
      { href: "/payment/address", label: "배송지 설정", hint: "paym_011" },
      { href: "/payment/done", label: "주문 완료", hint: "paym_002" },
    ],
  },
  {
    title: "개발용",
    items: [{ href: "/dev", label: "공용 컴포넌트 갤러리", hint: "프로덕션에서는 열리지 않음" }],
  },
];

export function HomeView() {
  return (
    <div className="flex min-h-dvh flex-col">
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

      <BottomNav />
    </div>
  );
}
