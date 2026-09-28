// 공지사항 화면.
// 시안이 아직 없고(#209) 기능정의서 ver0.5에도 항목이 없다(IA에만 있다). 공지 상세를 따로 둘지
// 정해지지 않아, 고객지원(mypa_071)의 많이 찾는 질문처럼 제목을 눌러 그 자리에서 펼친다 (#502).
// 최신 공지가 위로 온다.

import { formatDisplayDate } from "@/shared/lib/date/display-date";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/shared/ui/accordion";
import { PageHeader } from "@/shared/ui/page-header/page-header";

import { NOTICES } from "../config/notices";

export function SupportNoticesView() {
  const notices = [...NOTICES].sort((a, b) => b.postedAt.localeCompare(a.postedAt));

  return (
    <div className="flex min-h-dvh flex-col">
      <PageHeader title="공지사항" />

      <main className="flex flex-1 flex-col px-5 pt-2 pb-8">
        {/* shadcn 아코디언의 접근성·키보드 조작은 그대로 쓰고 모양만 덮는다(고객지원과 같다) */}
        <Accordion type="single" collapsible>
          {notices.map((notice) => (
            <AccordionItem key={notice.id} value={notice.id} className="border-border">
              <AccordionTrigger className="items-center gap-2 rounded-none py-4 hover:no-underline **:data-[slot=accordion-trigger-icon]:size-6 **:data-[slot=accordion-trigger-icon]:text-icon-fill-default">
                <span className="flex flex-1 flex-col gap-1">
                  <span className="text-title-bold-16 text-foreground">{notice.title}</span>
                  <span className="text-caption-regular-13 text-text-body-tertiary">
                    {formatDisplayDate(notice.postedAt)}
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="flex flex-col gap-2 pb-4">
                {notice.body.map((paragraph) => (
                  <p
                    key={paragraph}
                    className="text-body-regular-14 break-keep text-text-body-secondary"
                  >
                    {paragraph}
                  </p>
                ))}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </main>
    </div>
  );
}
