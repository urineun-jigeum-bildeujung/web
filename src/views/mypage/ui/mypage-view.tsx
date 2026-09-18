// 마이페이지 홈. 프로필 카드와 메뉴 묶음을 보여준다.
// UI 시안 기준(mypa_001, 1474-23129)이다.
//
// 시안에서 "최근 본 상품" 메뉴가 빠졌다. 화면(/mypage/recently-viewed)은 남기고 진입점만 뺀다.
// 머리말의 로고 자리는 시안이 "로고" 자리 표시라 서비스 이름을 글자로 둔다.
// 메뉴 아이콘은 항목마다 색이 다르다(시안 자산의 채움색을 icon/fill 토큰으로 옮겼다).

import Link from "next/link";

import { Icon } from "@/shared/ui/icon/icon";
import { ListRowLink } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { SettingGroup } from "@/shared/ui/setting-group/setting-group";
import { BottomNav } from "@/widgets/bottom-nav";

import { PetAvatars } from "./pet-avatars";

const MENU_GROUPS = [
  {
    title: "나의 쇼핑",
    items: [
      {
        href: "/mypage/restock",
        title: "재입고 알림",
        description: "품절 상품 재입고 알림",
        icon: <Icon name="tag" className="text-icon-fill-red" />,
      },
      {
        href: "/mypage/reviews",
        title: "나의 상품 후기",
        description: "작성 가능한 리뷰 · 나의 후기",
        icon: <Icon name="review" className="text-icon-fill-accent" />,
      },
    ],
  },
  {
    title: "혜택과 결제",
    items: [
      {
        href: "/mypage/payment",
        title: "결제 수단 관리",
        description: "간편결제 등록 · 관리",
        icon: <Icon name="card" className="text-icon-fill-blue" />,
      },
      {
        href: "/mypage/orders",
        title: "주문·배송 확인",
        description: "주문 · 배송 현황",
        icon: <Icon name="delivery" className="text-icon-fill-blue" />,
      },
    ],
  },
  {
    title: "고객지원",
    items: [
      {
        href: "/mypage/support",
        title: "고객센터",
        description: "1:1 문의 · 고객지원",
        icon: <Icon name="customer" className="text-icon-fill-green" />,
      },
      {
        href: "/mypage/service",
        title: "서비스 안내",
        description: "서비스 안내",
        icon: <Icon name="info" className="text-icon-fill-green" />,
      },
      {
        href: "/mypage/settings",
        title: "설정",
        description: "서비스 설정",
        icon: <Icon name="setting" className="text-icon-fill-green" />,
      },
    ],
  },
];

/** API 연동 전까지 화면 확인용 값 */
/** 닉네임·이메일은 아직 목이다. `GET /members/me`가 없다 */
const MOCK_USER = {
  nickname: "졸린고양이 17",
  email: "cjsrudwls12@naver.com",
};

const HEADER_ICON =
  "flex size-11 items-center justify-center rounded-md text-icon-stroke-tertiary transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none";

export function MypageView() {
  return (
    <div className="flex min-h-dvh flex-col bg-bg-secondary">
      <PageHeader
        left={<span className="px-2 text-title-bold-18 text-foreground">골라주개냥</span>}
        right={
          <>
            <Link href="/mypage/notifications" aria-label="알림" className={HEADER_ICON}>
              <Icon name="bell" className="size-7" />
            </Link>
            <Link href="/cart" aria-label="장바구니" className={HEADER_ICON}>
              <Icon name="cart" className="size-7" />
            </Link>
          </>
        }
        className="bg-transparent"
      />

      <main className="flex flex-1 flex-col gap-3 px-5 pt-3 pb-8">
        {/* 프로필 카드. 윗줄 전체가 내 정보로, 아래 아이 줄이 아이 관리로 간다.
            좌우 여백은 줄이 가져야 호버 배경이 카드 끝까지 닿는다 */}
        <section className="flex flex-col gap-3 overflow-hidden rounded-xl bg-card py-4 text-card-foreground">
          <Link
            href="/mypage/info"
            className="flex items-center justify-between gap-2 px-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span className="flex min-w-0 flex-1 flex-col gap-0.5">
              <span className="truncate text-title-bold-16 text-foreground">
                {MOCK_USER.nickname}
              </span>
              <span className="truncate text-body-regular-13 text-text-body-tertiary">
                {MOCK_USER.email}
              </span>
            </span>
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center text-icon-fill-default"
            >
              <Icon name="right" className="size-8" />
            </span>
          </Link>

          <span aria-hidden className="mx-3 h-px bg-border-default" />

          <Link
            href="/mypage/pets"
            aria-label="반려동물 프로필 관리"
            className="flex h-10.5 items-center gap-3 px-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <PetAvatars />
            {/* 아이를 더 들이는 자리. 점선 원으로 비어 있음을 보인다 */}
            <span
              aria-hidden
              className="flex size-10.5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-icon-fill-tertiary text-icon-fill-tertiary"
            >
              <Icon name="plus" className="size-6" />
            </span>
          </Link>
        </section>

        {MENU_GROUPS.map((group) => (
          <SettingGroup key={group.title} title={group.title}>
            {group.items.map((item) => (
              <ListRowLink key={item.title} {...item} />
            ))}
          </SettingGroup>
        ))}
      </main>

      <BottomNav />
    </div>
  );
}
