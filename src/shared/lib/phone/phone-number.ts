// 전화번호를 치는 대로 숫자만 남기고 하이픈을 넣는다. 휴대폰 번호 모양인지도 여기서 본다.
// 배송지 연락처(QA No.165, #526)와 휴대폰 인증(QA No.150·151, #594)이 함께 쓴다.
//
// **서버에 무엇을 보낼지는 부르는 쪽이 정한다.** 배송지는 하이픈을 넣은 채로 보내고
// (서버가 받은 그대로 저장해 결제·주문 상세가 그대로 보인다), 휴대폰 인증은 숫자만 보낸다
// (서버가 번호를 Redis 키로 쓴다). 이 파일은 화면에 보일 모양만 맡는다.

/** 가장 긴 번호의 숫자 수. `010-1234-5678` */
const MAX_DIGITS = 11;

/** 050으로 시작하는 평생·안심번호는 앞자리가 네 자리라 한 자리 더 길다. `0504-1234-5678` */
const MAX_DIGITS_050 = 12;

/**
 * 치는 대로 `010-1234-5678` 꼴로 맞춘다. 숫자가 아닌 글자는 버린다.
 *
 * **받는 분 연락처라 집 전화일 수 있다.** 서울(`02`)은 지역번호가 두 자리라 따로 끊는다.
 * 010은 늘 열한 자리라 칠 때부터 3-4-4로 끊고, 그 밖의 번호는 열 자리까지 3-3-4였다가
 * 열한 자리가 되면 3-4-4로 바뀐다(`031-123-4567`, `031-1234-5678`).
 *
 * **050 번호는 앞자리가 네 자리다.** 열한 자리까지 4-3-4였다가 열두 자리면 4-4-4다
 * (`0505-123-4567`, `0504-1234-5678`). 열한 자리로 자르면 마지막 숫자가 사라진다 (#526 리뷰).
 */
export function formatPhoneInput(text: string): string {
  const allDigits = text.replace(/\D/g, "");

  if (allDigits.startsWith("050")) {
    const safe = allDigits.slice(0, MAX_DIGITS_050);
    const safeMiddleEnd = safe.length === MAX_DIGITS_050 ? 8 : 7;
    if (safe.length <= 4) {
      return safe;
    }
    if (safe.length <= safeMiddleEnd) {
      return `${safe.slice(0, 4)}-${safe.slice(4)}`;
    }
    return `${safe.slice(0, 4)}-${safe.slice(4, safeMiddleEnd)}-${safe.slice(safeMiddleEnd)}`;
  }

  const digits = allDigits.slice(0, MAX_DIGITS);

  if (digits.startsWith("02")) {
    const seoul = digits.slice(0, 10);
    if (seoul.length <= 5) {
      return seoul.length <= 2 ? seoul : `${seoul.slice(0, 2)}-${seoul.slice(2)}`;
    }
    const middleEnd = seoul.length === 10 ? 6 : 5;
    return `${seoul.slice(0, 2)}-${seoul.slice(2, middleEnd)}-${seoul.slice(middleEnd)}`;
  }

  const middleEnd = digits.startsWith("010") || digits.length === MAX_DIGITS ? 7 : 6;
  if (digits.length <= 3) {
    return digits;
  }
  if (digits.length <= middleEnd) {
    return `${digits.slice(0, 3)}-${digits.slice(3)}`;
  }
  return `${digits.slice(0, 3)}-${digits.slice(3, middleEnd)}-${digits.slice(middleEnd)}`;
}

/**
 * 휴대폰 번호 모양인지 본다. 하이픈은 떼고 숫자로만 견준다.
 *
 * `01`로 시작하고 셋째 자리가 이동통신 식별번호(0·1·6·7·8·9)이며, 뒤로 일곱이나 여덟 자리가
 * 붙는다. 010은 열한 자리, 옛 011·016 등은 열 자리도 있다 (QA No.151, #594).
 */
export function isMobilePhoneNumber(text: string): boolean {
  return /^01[016789]\d{7,8}$/.test(text.replace(/-/g, ""));
}
