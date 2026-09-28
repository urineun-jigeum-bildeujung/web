// 약관·방침 같은 긴 문서. 시행일·목차·조항 본문을 한 모양으로 그린다.
//
// 시안이 아직 없다(#209). 기능정의서(마이페이지 ver0.5 "서비스 안내")가 적은 항목 — 시행일,
// 목차, 전문 — 만 따른다. 서비스 이용약관과 개인정보 처리방침이 쓴다 (#502).
// 목차는 같은 문서 안의 조항으로 가는 앵커라 스크롤 위치가 주소에 남고, 뒤로가기로 목차에 돌아온다.

export type PolicySection = {
  /** 목차가 가리키는 앵커. 한 문서 안에서 겹치지 않아야 한다 */
  id: string;
  /** 조항 제목. 목차에도 이대로 적힌다 */
  title: string;
  /** 조항 본문 문단 */
  paragraphs?: string[];
  /** 번호를 매겨 늘어놓을 항목. 문단 뒤에 붙는다 */
  items?: string[];
};

type PolicyDocumentProps = {
  /** 시행일. 읽는 모양 그대로 적는다 (예: 2026년 9월 1일) */
  effectiveDate: string;
  sections: PolicySection[];
};

export function PolicyDocument({ effectiveDate, sections }: PolicyDocumentProps) {
  return (
    <article className="flex flex-col gap-6">
      <p className="text-caption-regular-13 text-text-body-secondary">시행일 {effectiveDate}</p>

      <nav aria-label="목차" className="flex flex-col gap-1 rounded-xl bg-bg-secondary px-4 py-3">
        <p className="text-label-bold-14 text-foreground">목차</p>
        <ol className="flex flex-col">
          {sections.map((section) => (
            <li key={section.id}>
              {/* 누르는 자리를 44px로 잡는다 */}
              <a
                href={`#${section.id}`}
                className="flex min-h-11 items-center text-body-regular-14 text-text-body-default underline-offset-4 hover:underline focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
              >
                {section.title}
              </a>
            </li>
          ))}
        </ol>
      </nav>

      {sections.map((section) => (
        <section
          key={section.id}
          id={section.id}
          aria-labelledby={`${section.id}-title`}
          className="flex flex-col gap-2"
        >
          <h2 id={`${section.id}-title`} className="text-title-bold-16 text-foreground">
            {section.title}
          </h2>
          {section.paragraphs?.map((paragraph) => (
            <p key={paragraph} className="text-body-regular-14 break-keep text-text-body-secondary">
              {paragraph}
            </p>
          ))}
          {section.items && (
            <ol className="flex list-decimal flex-col gap-1 pl-5 text-body-regular-14 break-keep text-text-body-secondary">
              {section.items.map((item) => (
                <li key={item}>{item}</li>
              ))}
            </ol>
          )}
        </section>
      ))}
    </article>
  );
}
