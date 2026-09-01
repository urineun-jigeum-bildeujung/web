// 배송지 설정. 저장해 둔 곳 중에서 고르거나 새로 넣는다.
// 와이어프레임 기준(paym_011)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";
import { IoAdd, IoBusinessOutline, IoChevronForward, IoHomeOutline } from "react-icons/io5";

import { PageHeader } from "@/shared/ui/page-header/page-header";

/** API 연동 전까지 화면 확인용 값 */
const MOCK_PLACES = [
  {
    id: "home",
    label: "집",
    icon: <IoHomeOutline />,
    isDefault: true,
    address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
  },
  {
    id: "office",
    label: "회사",
    icon: <IoBusinessOutline />,
    isDefault: false,
    address: "",
  },
];

export function CheckoutAddressView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="배송지 설정" />

      <main className="flex flex-1 flex-col px-4 pb-8">
        {MOCK_PLACES.map((place) => (
          <Link
            key={place.id}
            href={`/mypage/address/new?place=${place.id}`}
            className="flex min-h-14 items-start gap-3 border-b border-border py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            <span aria-hidden className="mt-0.5 text-muted-foreground [&>svg]:size-5">
              {place.icon}
            </span>
            <span className="flex min-w-0 flex-1 flex-col gap-1">
              <span className="flex items-center gap-2">
                <span className="text-sm font-medium text-foreground">{place.label}</span>
                {place.isDefault && (
                  <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                    기본 배송지
                  </span>
                )}
              </span>
              <span
                className={
                  place.address ? "text-sm text-foreground" : "text-sm text-muted-foreground"
                }
              >
                {place.address || "상품을 배송받을 주소를 입력해 주세요."}
              </span>
            </span>
            <IoChevronForward aria-hidden className="mt-1 size-4 shrink-0 text-muted-foreground" />
          </Link>
        ))}

        <Link
          href="/mypage/address/new"
          className="flex min-h-11 items-center justify-center gap-1 py-3 text-sm text-muted-foreground transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
        >
          장소 추가하기
          <IoAdd aria-hidden className="size-4" />
        </Link>
      </main>
    </div>
  );
}
