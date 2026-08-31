// 내 정보. 회원 정보와 배송지를 모아 보여주고 각 항목을 수정 화면으로 잇는다.
// 와이어프레임 기준(mypa_011)이라 디자인 확정 시 바뀔 수 있다.

import Link from "next/link";
import { IoAdd, IoBusinessOutline, IoChevronForward, IoHomeOutline } from "react-icons/io5";

import { ListRowLink, ListRowStatic } from "@/shared/ui/list-row/list-row";
import { PageHeader } from "@/shared/ui/page-header/page-header";

/** API 연동 전까지 화면 확인용 값 */
const MOCK = {
  nickname: "청주 불주먹",
  name: "전경진",
  birthday: "2000년 12월 13일",
  phone: "010-1234-5678",
  petCount: 3,
  addresses: [
    {
      id: "home",
      label: "집",
      isDefault: true,
      address: "서울특별시 강남구 테헤란로 123, UI타워 4층 404호",
      icon: <IoHomeOutline />,
    },
    {
      id: "office",
      label: "회사",
      isDefault: false,
      address: "",
      icon: <IoBusinessOutline />,
    },
  ],
};

export function MyInfoView() {
  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title={`${MOCK.nickname}님의 정보`} />

      <main className="flex flex-1 flex-col gap-6 px-4 pb-8">
        <div className="flex justify-center pt-2">
          {/* 시안에 사진 등록 화면이 아직 없어 자리만 잡는다 */}
          <div className="relative flex size-20 items-center justify-center rounded-full bg-muted">
            <span
              aria-hidden
              className="absolute right-0 bottom-0 flex size-6 items-center justify-center rounded-full border border-border bg-background"
            >
              <IoAdd className="size-4" />
            </span>
          </div>
        </div>

        {/* 각 행이 수정 화면으로 가는 입구라 값은 오른쪽에 붙인다 */}
        <section className="[&>*+*]:border-t [&>*+*]:border-border">
          <ListRowLink
            href="/mypage/info/nickname"
            title="닉네임"
            trailing={<span className="text-sm text-muted-foreground">{MOCK.nickname}</span>}
          />
          <ListRowStatic
            title="이름"
            trailing={<span className="text-sm text-muted-foreground">{MOCK.name}</span>}
          />
          <ListRowStatic
            title="생년월일"
            trailing={<span className="text-sm text-muted-foreground">{MOCK.birthday}</span>}
          />
          <ListRowLink
            href="/mypage/info/phone"
            title="휴대폰 번호"
            trailing={<span className="text-sm text-muted-foreground">{MOCK.phone}</span>}
          />
          <ListRowStatic
            title="내 아이들"
            trailing={
              <span aria-hidden className="flex -space-x-2">
                {Array.from({ length: MOCK.petCount }, (_, index) => (
                  <span
                    key={index}
                    className="size-7 rounded-full border-2 border-background bg-muted"
                  />
                ))}
              </span>
            }
          />
        </section>

        <section className="flex flex-col gap-2">
          <h2 className="text-base font-semibold text-foreground">배송 받을 곳</h2>

          {MOCK.addresses.map((item) => (
            <Link
              key={item.id}
              // 같은 화면이 새 배송지와 수정 두 가지를 맡는다. 어느 곳인지는 쿼리로 넘긴다.
              href={`/mypage/address/new?place=${item.id}`}
              className="flex min-h-14 items-start gap-3 rounded-lg px-2 py-3 transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
            >
              <span aria-hidden className="mt-0.5 text-muted-foreground [&>svg]:size-5">
                {item.icon}
              </span>
              <span className="flex min-w-0 flex-1 flex-col gap-1">
                <span className="flex items-center gap-2">
                  <span className="text-sm font-medium text-foreground">{item.label}</span>
                  {item.isDefault && (
                    <span className="rounded bg-muted px-1.5 py-0.5 text-xs text-muted-foreground">
                      기본 배송지
                    </span>
                  )}
                </span>
                <span
                  className={
                    item.address ? "text-sm text-foreground" : "text-sm text-muted-foreground"
                  }
                >
                  {item.address || "상품을 배송받을 주소를 입력해 주세요."}
                </span>
              </span>
              <IoChevronForward
                aria-hidden
                className="mt-1 size-4 shrink-0 text-muted-foreground"
              />
            </Link>
          ))}

          <Link
            href="/mypage/address/new"
            className="flex min-h-11 items-center justify-center gap-1 text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
          >
            장소 추가하기
            <IoAdd aria-hidden className="size-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
