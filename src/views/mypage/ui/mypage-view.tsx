// 마이페이지 홈. 프로필과 메뉴 묶음을 보여준다.
// 와이어프레임 기준(mypa_001)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";
import {
  IoAdd,
  IoCartOutline,
  IoChevronForward,
  IoHeadsetOutline,
  IoInformationCircleOutline,
  IoNotificationsOutline,
  IoPricetagOutline,
  IoReceiptOutline,
  IoSettingsOutline,
  IoWalletOutline,
} from "react-icons/io5";

import { ListRowLink, ListRowStatic } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";
import { SettingGroup } from "@/shared/ui/setting-group/setting-group";

const MENU_GROUPS = [
  {
    title: "나의 쇼핑",
    items: [
      {
        href: "/mypage/restock",
        title: "재입고 알림",
        description: "품절 상품 재입고 알림",
        icon: <IoPricetagOutline />,
      },
      {
        href: "/mypage/reviews",
        title: "나의 상품 후기",
        description: "작성 가능한 리뷰 · 나의 후기",
        icon: <IoReceiptOutline />,
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
        icon: <IoWalletOutline />,
      },
      {
        href: "/mypage/orders",
        title: "주문·배송 확인",
        description: "주문 · 배송 현황",
        icon: <IoCartOutline />,
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
        icon: <IoHeadsetOutline />,
      },
      {
        title: "서비스 안내",
        description: "서비스 안내",
        icon: <IoInformationCircleOutline />,
      },
      {
        href: "/mypage/settings",
        title: "설정",
        description: "서비스 설정",
        icon: <IoSettingsOutline />,
      },
    ],
  },
];

/** API 연동 전까지 화면 확인용 값 */
const MOCK_USER = { nickname: "청주 불주먹", email: "cjsrudwls12@naver.com", petCount: 3 };

export function MypageView() {
  return (
    <div className="flex min-h-dvh flex-col bg-muted/40">
      <PageHeader
        leading="none"
        right={
          <>
            {/* 장바구니·알림 화면이 아직 없어 아이콘만 둔다 */}
            <span aria-hidden className="flex size-11 items-center justify-center">
              <IoCartOutline className="size-6" />
            </span>
            <span aria-hidden className="flex size-11 items-center justify-center">
              <IoNotificationsOutline className="size-6" />
            </span>
          </>
        }
      />

      <main className="flex flex-1 flex-col gap-4 px-4 pb-8">
        <section className="overflow-hidden rounded-xl border border-border bg-card">
          <Link
            href="/mypage/info"
            className="flex min-h-16 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span aria-hidden className="size-10 shrink-0 rounded-full bg-muted" />
            <span className="flex min-w-0 flex-1 flex-col">
              <span className="truncate text-sm font-semibold text-foreground">
                {MOCK_USER.nickname}
              </span>
              <span className="truncate text-xs text-muted-foreground">{MOCK_USER.email}</span>
            </span>
            <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Link>

          {/* 반려동물 프로필 영역 */}
          <Link
            href="/mypage/pets"
            aria-label="반려동물 프로필 관리"
            className="flex min-h-14 items-center gap-3 border-t border-border px-4 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span aria-hidden className="flex flex-1 items-center -space-x-2">
              {Array.from({ length: MOCK_USER.petCount }, (_, index) => (
                <span key={index} className="size-9 rounded-full border-2 border-card bg-muted" />
              ))}
              {/* 시안의 아이 추가 자리. 점선 원으로 아직 비어 있음을 보인다 */}
              <span className="flex size-9 items-center justify-center rounded-full border-2 border-dashed border-border bg-card text-muted-foreground">
                <IoAdd className="size-4" />
              </span>
            </span>
            <IoChevronForward aria-hidden className="size-4 shrink-0 text-muted-foreground" />
          </Link>
        </section>

        {MENU_GROUPS.map((group) => (
          <SettingGroup key={group.title} title={group.title}>
            {group.items.map((item) =>
              item.href ? (
                <ListRowLink key={item.title} {...item} href={item.href} />
              ) : (
                <ListRowStatic key={item.title} {...item} />
              ),
            )}
          </SettingGroup>
        ))}
      </main>
    </div>
  );
}
