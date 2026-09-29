// 배송지 연락처를 치는 대로 숫자만 남기고 하이픈을 넣는다 (QA No.165, #526).
//
// **하이픈을 넣은 채로 보낸다.** 서버(`AddressRegisterRequest.phone`)는 형식을 보지 않고 받은
// 그대로 저장하고, 결제 화면과 주문 상세가 그 값을 그대로 보인다. 명세 예시도 `010-1234-5678`이다.

/** 가장 긴 번호의 숫자 수. `010-1234-5678` */
const MAX_DIGITS = 11;

/**
 * 치는 대로 `010-1234-5678` 꼴로 맞춘다. 숫자가 아닌 글자는 버린다.
 *
 * **받는 분 연락처라 집 전화일 수 있다.** 서울(`02`)은 지역번호가 두 자리라 따로 끊는다.
 * 010은 늘 열한 자리라 칠 때부터 3-4-4로 끊고, 그 밖의 번호는 열 자리까지 3-3-4였다가
 * 열한 자리가 되면 3-4-4로 바뀐다(`031-123-4567`, `031-1234-5678`).
 */
export function formatPhoneInput(text: string): string {
  const digits = text.replace(/\D/g, "").slice(0, MAX_DIGITS);

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
